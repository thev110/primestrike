import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/videoAuth";
import { createVideo, tusCredentials } from "@/lib/bunnyStream";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/admin/videos/presign  body: { title, description? }
// Creates the Bunny video record and returns presigned TUS credentials so the
// browser can upload the file straight to Bunny.
//
// Why not just POST the file to us? Vercel caps a function request body at
// 4.5MB, so routing a lecture through our own route returns 413 no matter how
// we stream it. Direct-to-Bunny also keeps the bytes off Vercel's bandwidth
// bill entirely. The API key stays server-side — only the derived signature,
// scoped to this one video GUID and a fixed expiry, reaches the client.
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { title, description } = await request.json();
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const bunnyVideoId = await createVideo(title);

    // Publish the catalog row up front so the upload has somewhere to land.
    // It stays inactive until the bytes finish and Bunny transcodes.
    const { data, error } = await supabaseAdmin
      .from("videos")
      .insert({
        title,
        description: description || null,
        storage_path: "",
        bunny_video_id: bunnyVideoId,
        active: false,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Catalog publish failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, id: data.id, ...tusCredentials(bunnyVideoId) },
      { status: 200 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
