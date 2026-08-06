import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/videoAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/admin/catalogue
// Lists all rows of the admin-maintained student catalogue.
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("student_catalogue")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ students: data || [] }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/catalogue
// Adds a new student to the catalogue.
// body: { name (required), phone?, group_name?, fee_amount?, amount_paid?, notes? }
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { name, phone, group_name, fee_amount, amount_paid, notes } = await request.json();
    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "name is required." }, { status: 400 });
    }

    const toNum = (v: unknown): number => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };

    const { data: row, error } = await supabaseAdmin
      .from("student_catalogue")
      .insert({
        name: String(name).trim(),
        phone: phone ? String(phone).trim() : null,
        group_name: group_name ? String(group_name).trim() : null,
        fee_amount: toNum(fee_amount),
        amount_paid: toNum(amount_paid),
        notes: notes ? String(notes).trim() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ student: row }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH /api/admin/catalogue
// Updates any editable field of a catalogue row.
// body: { id (required), name?, phone?, group_name?, fee_amount?, amount_paid?, notes? }
export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) {
      if (!String(body.name).trim()) {
        return NextResponse.json({ error: "name cannot be empty." }, { status: 400 });
      }
      update.name = String(body.name).trim();
    }
    if (body.phone !== undefined) update.phone = body.phone ? String(body.phone).trim() : null;
    if (body.group_name !== undefined) update.group_name = body.group_name ? String(body.group_name).trim() : null;
    if (body.fee_amount !== undefined) {
      const n = Number(body.fee_amount);
      update.fee_amount = Number.isFinite(n) && n >= 0 ? n : 0;
    }
    if (body.amount_paid !== undefined) {
      const n = Number(body.amount_paid);
      update.amount_paid = Number.isFinite(n) && n >= 0 ? n : 0;
    }
    if (body.notes !== undefined) update.notes = body.notes ? String(body.notes).trim() : null;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("student_catalogue")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ student: data }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/catalogue?id=...
// Removes a row from the catalogue.
export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("student_catalogue")
      .delete()
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
