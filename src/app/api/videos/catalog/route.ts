import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedUser } from "@/lib/videoAuth";
import { syncBunnyVideosToCatalog } from "@/lib/bunnyStream";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/videos/catalog
// Returns the active video catalog joined with THIS student's request status
// for each video. Never exposes the storage_path to the client.
export async function GET(request: Request) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Ensure any videos uploaded directly on Bunny.net are synced into catalog
    await syncBunnyVideosToCatalog().catch((err) => {
      console.error("Catalog auto sync Bunny videos error:", err);
    });

    const { data: videos, error: vErr } = await supabaseAdmin
      .from("videos")
      .select("id, title, description, active, created_at")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (vErr) {
      return NextResponse.json({ error: vErr.message }, { status: 500 });
    }

    const { data: reqs, error: rErr } = await supabaseAdmin
      .from("video_requests")
      .select("video_id, status, granted_at, expires_at, request_count, grant_count, view_count")
      .eq("user_id", user.id);

    if (rErr) {
      return NextResponse.json({ error: rErr.message }, { status: 500 });
    }

    const byVideo = new Map((reqs || []).map((r) => [r.video_id, r]));
    const now = Date.now();

    const items = (videos || []).map((v) => {
      const r = byVideo.get(v.id);
      let access: "none" | "pending" | "granted" | "expired" | "denied" = "none";
      let expiresAt: string | null = null;

      if (r) {
        if (r.status === "pending") access = "pending";
        else if (r.status === "denied") access = "denied";
        else if (r.status === "granted") {
          expiresAt = r.expires_at;
          access =
            r.expires_at && new Date(r.expires_at).getTime() > now
              ? "granted"
              : "expired";
        }
      }

      return {
        id: v.id,
        title: v.title,
        description: v.description,
        access,
        expiresAt,
        requestCount: r?.request_count ?? 0,
        grantCount: r?.grant_count ?? 0,
        viewCount: r?.view_count ?? 0,
      };
    });

    return NextResponse.json({ videos: items }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
