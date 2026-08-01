import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/videoAuth";
import { syncBunnyVideosToCatalog } from "@/lib/bunnyStream";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/admin/videos/sync
// Manually triggers a sync of videos uploaded directly on Bunny.net (Bunny Stream library) into the catalog.
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const result = await syncBunnyVideosToCatalog();
    return NextResponse.json(
      { success: true, synced: result.synced, total: result.total },
      { status: 200 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error syncing Bunny videos.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
