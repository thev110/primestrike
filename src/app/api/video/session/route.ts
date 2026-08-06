import { NextResponse } from "next/server";
import { supabaseAdmin, VIDEO_BUCKET } from "@/lib/supabaseAdmin";
import { getAuthedUser } from "@/lib/videoAuth";
import { signedHlsUrl } from "@/lib/bunnyStream";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/video/session  body: { videoId }
// The logged-in student opens a playback session. We verify they hold a LIVE
// (granted, non-expired, under the view cap) request for this video, then hand
// back the Bunny HLS playlist URL. Bunny serves adaptive-bitrate HLS from its
// CDN, so video bytes never pass through our server. (The library CDN has token
// security disabled, so the playlist is playable without a signed token.)
//
// Legacy fallback: videos not yet migrated to Bunny still stream via the
// Supabase proxy at /api/video/stream using an httpOnly cookie.
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
      .select("id, status, expires_at, view_count, max_views")
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

    // Enforce the per-grant view cap before handing out a playback token.
    const used = grant.view_count ?? 0;
    const cap = grant.max_views ?? 3;
    if (used >= cap) {
      return NextResponse.json(
        { error: "view_limit", used, cap },
        { status: 403 }
      );
    }

    const { data: video, error: vErr } = await supabaseAdmin
      .from("videos")
      .select("storage_path, title, bunny_video_id, batch")
      .eq("id", videoId)
      .single();

    if (vErr || !video) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    // Batch-restricted videos can only ever be played by students of that
    // batch, even if a stale grant row somehow exists.
    if (video.batch && video.batch !== user.batch) {
      return NextResponse.json({ error: "no_access" }, { status: 403 });
    }

    // Build the playback URL BEFORE charging a view. Minting can fail (missing
    // Bunny config, storage error), and a student must never lose one of their
    // limited views to an attempt that never produced a playable video.
    let playback: { source: "bunny"; hlsUrl: string } | { source: "supabase"; signedUrl: string };

    if (video.bunny_video_id) {
      // Preferred path: Bunny HLS playlist, streamed straight from the CDN.
      try {
        playback = { source: "bunny", hlsUrl: signedHlsUrl(video.bunny_video_id) };
      } catch (err) {
        console.error("signedHlsUrl failed:", err);
        return NextResponse.json({ error: "sign" }, { status: 500 });
      }
    } else {
      // Legacy path: proxy the private Supabase object behind an httpOnly cookie.
      const { data: signed, error: signErr } = await supabaseAdmin.storage
        .from(VIDEO_BUCKET)
        .createSignedUrl(video.storage_path, 600);

      if (signErr || !signed?.signedUrl) {
        console.error("createSignedUrl failed:", signErr);
        return NextResponse.json({ error: "sign" }, { status: 500 });
      }
      playback = { source: "supabase", signedUrl: signed.signedUrl };
    }

    // Playback is guaranteed available, so now consume a view atomically. The
    // view_count guard means two tabs opened together cannot both slip through.
    const { data: consumed, error: cErr } = await supabaseAdmin
      .from("video_requests")
      .update({ view_count: used + 1 })
      .eq("id", grant.id)
      .eq("view_count", used)
      .select("view_count")
      .single();

    if (cErr || !consumed) {
      return NextResponse.json({ error: "view_limit", used, cap }, { status: 403 });
    }

    const viewsLeft = cap - consumed.view_count;

    if (playback.source === "bunny") {
      return NextResponse.json(
        {
          ok: true,
          source: "bunny",
          hlsUrl: playback.hlsUrl,
          title: video.title,
          watermark: user.email,
          expiresAt: grant.expires_at,
          viewsLeft,
          cap,
        },
        { status: 200 }
      );
    }

    const res = NextResponse.json(
      {
        ok: true,
        source: "supabase",
        title: video.title,
        watermark: user.email,
        expiresAt: grant.expires_at,
        viewsLeft,
        cap,
      },
      { status: 200 }
    );
    // httpOnly so client JS can never read/copy the signed URL. Short max-age.
    res.cookies.set("vid_src", playback.signedUrl, {
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
