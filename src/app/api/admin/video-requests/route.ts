import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/videoAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/admin/video-requests
// Admin view of every access request: who asked for what, when, current
// status, and grant/expiry timestamps.
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: reqs, error } = await supabaseAdmin
      .from("video_requests")
      .select("id, user_id, email, video_id, status, granted_at, expires_at, created_at, request_count, grant_count, view_count")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Resolve video titles in one query.
    const videoIds = [...new Set((reqs || []).map((r) => r.video_id))];
    const titleById = new Map<string, string>();
    if (videoIds.length) {
      const { data: vids } = await supabaseAdmin
        .from("videos")
        .select("id, title")
        .in("id", videoIds);
      (vids || []).forEach((v) => titleById.set(v.id, v.title));
    }

    const now = Date.now();
    const items = (reqs || []).map((r) => ({
      id: r.id,
      email: r.email,
      videoId: r.video_id,
      videoTitle: titleById.get(r.video_id) || "(deleted video)",
      status: r.status,
      grantedAt: r.granted_at,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
      requestCount: r.request_count ?? 1,
      grantCount: r.grant_count ?? 0,
      viewCount: r.view_count ?? 0,
      live:
        r.status === "granted" &&
        !!r.expires_at &&
        new Date(r.expires_at).getTime() > now,
    }));

    return NextResponse.json({ requests: items }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
