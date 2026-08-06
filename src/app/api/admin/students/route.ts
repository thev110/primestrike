import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/videoAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// PATCH /api/admin/students  body: { id, batch? }
// Admin can update a student's batch (and optionally name). Used from the
// Registered Students tab to move students between batches.
export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id, batch, name } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (batch !== undefined) {
      if (batch !== null && !/^Batch \d+$/.test(String(batch).trim())) {
        return NextResponse.json(
          { error: "batch must be e.g. \"Batch 3\" or null." },
          { status: 400 }
        );
      }
      update.batch = batch === null ? null : String(batch).trim();
    }
    if (name !== undefined && typeof name === "string") {
      update.name = name;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(update)
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
