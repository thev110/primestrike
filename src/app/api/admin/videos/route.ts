import { NextResponse } from "next/server";
import { supabaseAdmin, VIDEO_BUCKET } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/videoAuth";
import { syncBunnyVideosToCatalog } from "@/lib/bunnyStream";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/admin/videos
// Syncs videos from Bunny Stream library, then returns the catalog and bucket files.
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Auto-sync any new videos uploaded directly on Bunny.net Stream
    await syncBunnyVideosToCatalog().catch((err) => {
      console.error("Auto sync Bunny videos error:", err);
    });

    const { data: catalog, error: cErr } = await supabaseAdmin
      .from("videos")
      .select("id, title, description, storage_path, bunny_video_id, active, created_at")
      .order("created_at", { ascending: false });

    if (cErr) {
      return NextResponse.json({ error: cErr.message }, { status: 500 });
    }

    let objects = null;
    const { data: listData, error: oErr } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .list("", { limit: 200, sortBy: { column: "name", order: "asc" } });

    if (oErr) {
      // Auto-create bucket if missing
      await supabaseAdmin.storage.createBucket(VIDEO_BUCKET, { public: false }).catch(() => null);
    } else {
      objects = listData;
    }

    const used = new Set((catalog || []).map((v) => v.storage_path));
    const unlinkedFiles = (objects || [])
      .filter((f) => f.id !== null && f.name && !f.name.endsWith("/"))
      .map((f) => f.name)
      .filter((name) => !used.has(name));

    return NextResponse.json(
      { catalog: catalog || [], unlinkedFiles },
      { status: 200 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/videos  body: { title, description?, storagePath }
// Publishes a bucket file into the catalog so students can request it.
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { title, description, storagePath } = await request.json();
    if (!title || !storagePath) {
      return NextResponse.json(
        { error: "title and storagePath are required." },
        { status: 400 }
      );
    }

    // Confirm the object exists in the bucket.
    const { data: listed } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .list("", { search: storagePath });
    if (!listed?.some((f) => f.name === storagePath)) {
      return NextResponse.json(
        { error: `File not found in bucket: ${storagePath}` },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("videos")
      .insert({ title, description: description || null, storage_path: storagePath })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH /api/admin/videos  body: { id, active }
// Toggle a catalog video active/inactive (hide without deleting).
export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id, active } = await request.json();
    if (!id || typeof active !== "boolean") {
      return NextResponse.json(
        { error: "id and active(boolean) are required." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("videos")
      .update({ active })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
