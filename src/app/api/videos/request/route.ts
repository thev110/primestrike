import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedUser } from "@/lib/videoAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/videos/request  body: { videoId }
// A logged-in student requests access to a catalog video. Creates a pending
// request, or re-opens a previously denied/expired one as pending again.
export async function POST(request: Request) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { videoId } = await request.json();
    if (!videoId) {
      return NextResponse.json({ error: "videoId is required." }, { status: 400 });
    }

    // Video must exist and be active.
    const { data: video, error: vErr } = await supabaseAdmin
      .from("videos")
      .select("id, active")
      .eq("id", videoId)
      .single();

    if (vErr || !video || !video.active) {
      return NextResponse.json({ error: "Video not available." }, { status: 404 });
    }

    // Already have a live grant? Don't downgrade it.
    const { data: existing } = await supabaseAdmin
      .from("video_requests")
      .select("id, status, expires_at, request_count")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .maybeSingle();

    if (
      existing?.status === "granted" &&
      existing.expires_at &&
      new Date(existing.expires_at).getTime() > Date.now()
    ) {
      return NextResponse.json(
        { status: "granted", message: "You already have access." },
        { status: 200 }
      );
    }

    if (existing?.status === "pending") {
      return NextResponse.json(
        { status: "pending", message: "Request already pending." },
        { status: 200 }
      );
    }

    const nextRequestCount = (existing?.request_count ?? 0) + 1;

    // Upsert to pending (covers new, denied, and expired cases). The unique
    // (user_id, video_id) constraint makes this idempotent.
    const { error: upErr } = await supabaseAdmin.from("video_requests").upsert(
      {
        user_id: user.id,
        email: user.email,
        video_id: videoId,
        status: "pending",
        granted_at: null,
        expires_at: null,
        request_count: nextRequestCount,
      },
      { onConflict: "user_id,video_id" }
    );

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ status: "pending" }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
