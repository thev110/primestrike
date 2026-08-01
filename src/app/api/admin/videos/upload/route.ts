import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/admin/videos/upload — retired.
//
// This route used to accept the video file and forward it to Bunny. That can
// never work on Vercel: a function request body is capped at 4.5MB, so any
// real lecture returns 413 before our code runs. Uploads now go straight from
// the browser to Bunny via presigned TUS credentials from
// /api/admin/videos/presign, which also keeps the bytes off Vercel bandwidth.
export async function POST() {
  return NextResponse.json(
    {
      error:
        "This upload endpoint has been replaced. Use /api/admin/videos/presign and upload directly to Bunny.",
    },
    { status: 410 }
  );
}
