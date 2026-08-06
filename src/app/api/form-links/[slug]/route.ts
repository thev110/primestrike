import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/form-links/[slug]
// Public — returns the form definition for a shareable link. No auth needed.
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { data: form, error } = await supabaseAdmin
      .from("form_links")
      .select("id, name, fields, active, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!form) {
      return NextResponse.json({ error: "Form not found." }, { status: 404 });
    }
    return NextResponse.json({ form }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/form-links/[slug]  body: { data: { fieldKey: value } }
// Public — stores a submission. Values are validated against the form's field
// definitions (required fields must be present).
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { data } = await request.json();

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json({ error: "data object is required." }, { status: 400 });
    }

    const { data: form, error: fErr } = await supabaseAdmin
      .from("form_links")
      .select("id, fields, active")
      .eq("slug", slug)
      .maybeSingle();

    if (fErr) {
      return NextResponse.json({ error: fErr.message }, { status: 500 });
    }
    if (!form) {
      return NextResponse.json({ error: "Form not found." }, { status: 404 });
    }
    if (!form.active) {
      return NextResponse.json({ error: "This form is no longer accepting responses." }, { status: 410 });
    }

    // Validate required fields.
    const fields = (form.fields as { key: string; label?: string; required?: boolean }[]) || [];
    for (const f of fields) {
      if (f.required) {
        const v = data[f.key];
        if (v === undefined || v === null || String(v).trim() === "") {
          return NextResponse.json(
            { error: `Please fill in: ${f.label || f.key}` },
            { status: 400 }
          );
        }
      }
    }

    const { error: insErr } = await supabaseAdmin
      .from("form_submissions")
      .insert({ form_id: form.id, data });

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
