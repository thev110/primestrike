import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/videoAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/admin/form-links/[id]/submissions
// Returns every response received for a form link, newest first.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { id } = await params;

    const { data: form, error: fErr } = await supabaseAdmin
      .from("form_links")
      .select("id, name, fields")
      .eq("id", id)
      .single();

    if (fErr || !form) {
      return NextResponse.json({ error: "Form not found." }, { status: 404 });
    }

    const { data: subs, error } = await supabaseAdmin
      .from("form_submissions")
      .select("*")
      .eq("form_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      form: { id: form.id, name: form.name, fields: form.fields },
      submissions: subs || [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
