import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/videoAuth";
import { addRegistrant, zoomNameParts } from "@/lib/zoom";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/admin/class-sessions/[id]/register
// Lists the registrants (with personal links) for a session.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("class_session_registrants")
      .select("id, email, name, status, join_url, created_at")
      .eq("session_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ registrants: data || [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/class-sessions/[id]/register
// Registers EVERY active student profile for the session on Zoom, storing each
// student's personal join link. Idempotent — students already registered are
// reported as "already" and skipped.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { id } = await params;

    const { data: session, error: sErr } = await supabaseAdmin
      .from("class_sessions")
      .select("id, title, zoom_meeting_id, batch")
      .eq("id", id)
      .single();

    if (sErr || !session) {
      return NextResponse.json({ error: "Class session not found." }, { status: 404 });
    }
    if (!session.zoom_meeting_id) {
      return NextResponse.json(
        { error: "No Zoom meeting is linked to this session yet." },
        { status: 400 }
      );
    }

    // When the session is for a specific batch, only register students of that
    // batch. Sessions without a batch register every active student.
    let studentQuery = supabaseAdmin
      .from("profiles")
      .select("id, email, name")
      .eq("role", "student");
    if (session.batch) {
      studentQuery = studentQuery.eq("batch", session.batch);
    }
    const { data: students, error: pErr } = await studentQuery;

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    const { data: existingRows } = await supabaseAdmin
      .from("class_session_registrants")
      .select("user_id, join_url")
      .eq("session_id", id);
    const existingByUser = new Map(
      (existingRows || []).map((r) => [r.user_id, r.join_url])
    );

    const registered: string[] = [];
    const already: string[] = [];
    const failed: { email: string; error: string }[] = [];

    for (const student of students || []) {
      try {
        if (existingByUser.get(student.id)) {
          already.push(student.email);
          continue;
        }

        const { firstName, lastName } = zoomNameParts(student.name, student.email);
        const zoom = await addRegistrant(session.zoom_meeting_id, {
          email: student.email,
          firstName,
          lastName,
        });

        const { error: iErr } = await supabaseAdmin
          .from("class_session_registrants")
          .insert({
            session_id: id,
            user_id: student.id,
            email: student.email,
            name: student.name,
            registrant_id: zoom.registrantId,
            join_url: zoom.joinUrl,
            status: zoom.status,
          });

        if (iErr) throw new Error(iErr.message);
        registered.push(student.email);
      } catch (err) {
        failed.push({
          email: student.email,
          error: err instanceof Error ? err.message : "Zoom error",
        });
      }
    }

    return NextResponse.json({
      registered,
      already,
      failed,
      total: (students || []).length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
