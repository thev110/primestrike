import { NextResponse } from "next/server";
import { supabaseAdmin, VIDEO_BUCKET } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/videoAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Ensure private video storage bucket exists in Supabase.
async function ensureBucket(): Promise<string> {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const target = VIDEO_BUCKET.toLowerCase();
    const found = (buckets || []).find(
      (b) => b.name.toLowerCase() === target || b.name.toLowerCase() === "videos"
    );
    if (found) {
      return found.name;
    }
    const { error: cErr } = await supabaseAdmin.storage.createBucket(VIDEO_BUCKET, {
      public: false,
    });
    if (cErr) {
      console.error("Bucket auto-creation notice:", cErr.message);
    }
    return VIDEO_BUCKET;
  } catch (err) {
    console.error("ensureBucket exception:", err);
    return VIDEO_BUCKET;
  }
}

// POST /api/admin/videos/upload
// Accepts FormData: file (Blob/File), title (string), description (optional string)
// Uploads file using server-side service role key (bypassing client RLS/bucket issues)
// and publishes it into the catalog automatically.
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string | null) || "";
    const description = (formData.get("description") as string | null) || "";

    if (!file || !title) {
      return NextResponse.json(
        { error: "Video file and title are required." },
        { status: 400 }
      );
    }

    const bucketName = await ensureBucket();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}_${sanitizedName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: file.type || "video/mp4",
        upsert: true,
      });

    if (upErr) {
      return NextResponse.json(
        { error: `Upload error: ${upErr.message}` },
        { status: 500 }
      );
    }

    // Insert into videos catalog table
    const { data: vData, error: vErr } = await supabaseAdmin
      .from("videos")
      .insert({
        title,
        description: description || null,
        storage_path: fileName,
        active: true,
      })
      .select("id")
      .single();

    if (vErr) {
      return NextResponse.json(
        { error: `Catalog publish failed: ${vErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, id: vData.id, storagePath: fileName },
      { status: 200 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error uploading video.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
