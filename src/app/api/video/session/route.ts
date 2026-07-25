import { NextResponse } from "next/server";
import { supabaseAdmin, VIDEO_BUCKET } from "@/lib/supabaseAdmin";
import { getAuthedUser } from "@/lib/videoAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/video/session  body: { videoId }
// The logged-in student opens a playback session. We verify they hold a LIVE
// (granted, non-expired) request for this video, sign a short-lived URL for the
// private object, and store it in an httpOnly cookie. The real Supabase URL is
// never exposed to client JS or the DOM — the <video> streams via the proxy.
export async function POST(request: Request) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { videoId } = await request.json();
    if (!videoId) {
      return NextResponse.json({ error: "videoId required" }, { status: 400 });
    }

    // Verify a live grant for this exact user + video.
    const { data: grant, error: gErr } = await supabaseAdmin
      .from("video_requests")
      .select("id, status, expires_at, view_count")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .maybeSingle();

    if (gErr) {
      return NextResponse.json({ error: "server" }, { status: 500 });
    }
    if (!grant || grant.status !== "granted") {
      return NextResponse.json({ error: "no_access" }, { status: 403 });
    }
    if (!grant.expires_at || new Date(grant.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "expired" }, { status: 403 });
    }

    // Increment view count for this student request
    supabaseAdmin
      .from("video_requests")
      .update({ view_count: (grant.view_count ?? 0) + 1 })
      .eq("id", grant.id)
      .then(({ error: vUpErr }) => {
        if (vUpErr) console.error("Failed to increment view_count:", vUpErr);
      });

    // Resolve the storage path (kept server-side only).
    const { data: video, error: vErr } = await supabaseAdmin
      .from("videos")
      .select("storage_path, title")
      .eq("id", videoId)
      .single();

    if (vErr || !video) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .createSignedUrl(video.storage_path, 600);

    if (signErr || !signed?.signedUrl) {
      console.error("createSignedUrl failed:", signErr);
      return NextResponse.json({ error: "sign" }, { status: 500 });
    }

    const res = NextResponse.json(
      { ok: true, title: video.title, watermark: user.email, expiresAt: grant.expires_at },
      { status: 200 }
    );
    // httpOnly so client JS can never read/copy the signed URL. Short max-age.
    res.cookies.set("vid_src", signed.signedUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "server";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
