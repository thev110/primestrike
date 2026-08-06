import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/videoAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/admin/form-links
// Lists every generated form link with its submission count.
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: forms, error } = await supabaseAdmin
      .from("form_links")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count submissions per form in one query.
    const ids = (forms || []).map((f) => f.id);
    const counts = new Map<string, number>();
    if (ids.length > 0) {
      const { data: subs } = await supabaseAdmin
        .from("form_submissions")
        .select("form_id");
      for (const s of subs || []) {
        counts.set(s.form_id, (counts.get(s.form_id) || 0) + 1);
      }
    }

    const origin = new URL(request.url).origin;
    return NextResponse.json({
      forms: (forms || []).map((f) => ({
        ...f,
        submissionCount: counts.get(f.id) || 0,
        url: `${origin}/f/${f.slug}`,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/form-links  body: { name, fields, slug? }
// Creates a form link. A slug is generated from the name if not provided.
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { name, fields, slug } = await request.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required." }, { status: 400 });
    }
    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: "fields must be an array." }, { status: 400 });
    }

    const fieldKeys = new Set<string>();
    for (const f of fields) {
      if (!f?.key || !f?.label || !f?.type) {
        return NextResponse.json(
          { error: "Each field needs key, label and type." },
          { status: 400 }
        );
      }
      if (fieldKeys.has(f.key)) {
        return NextResponse.json(
          { error: `Duplicate field key: ${f.key}` },
          { status: 400 }
        );
      }
      fieldKeys.add(f.key);
    }

    const genSlug = (base: string) =>
      base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "form";

    let finalSlug = (slug && String(slug)) || `${genSlug(name)}-${Date.now().toString(36)}`;
    finalSlug = genSlug(finalSlug);

    const { data, error } = await supabaseAdmin
      .from("form_links")
      .insert({ name: name.trim(), slug: finalSlug, fields })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const origin = new URL(request.url).origin;
    return NextResponse.json(
      { success: true, form: { ...data, url: `${origin}/f/${data.slug}` } },
      { status: 200 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
