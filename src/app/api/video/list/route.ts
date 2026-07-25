import { NextResponse } from "next/server";
import { supabaseAdmin, VIDEO_BUCKET } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/video/list  (admin only, Bearer token)
// Returns the list of video object paths in the bucket for the picker.
async function isAdmin(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : "";
  if (!bearer) return false;
  const { data, error } = await supabaseAdmin.auth.getUser(bearer);
  if (error || !data?.user) return false;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();
  return profile?.role === "admin";
}

export async function GET(request: Request) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .list("", { limit: 200, sortBy: { column: "name", order: "asc" } });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Only real files (skip folder placeholders).
    const files = (data || [])
      .filter((f) => f.id !== null && f.name && !f.name.endsWith("/"))
      .map((f) => f.name);

    return NextResponse.json({ files }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
