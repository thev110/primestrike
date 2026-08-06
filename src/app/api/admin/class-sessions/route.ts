import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/videoAuth";
import { createRegisteredMeeting, isZoomConfigured } from "@/lib/zoom";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/admin/class-sessions
// Lists all live class sessions with the number of registered students.
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: sessions, error } = await supabaseAdmin
      .from("class_sessions")
      .select("*")
      .order("starts_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count registered students per session.
    const ids = (sessions || []).map((s) => s.id);
    const counts = new Map<string, number>();
    if (ids.length > 0) {
      const { data } = await supabaseAdmin
        .from("class_session_registrants")
        .select("session_id");
      for (const r of data || []) {
        counts.set(r.session_id, (counts.get(r.session_id) || 0) + 1);
      }
    }

    return NextResponse.json({
      zoomConfigured: isZoomConfigured(),
      sessions: (sessions || []).map((s) => ({
        ...s,
        registeredCount: counts.get(s.id) || 0,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/class-sessions
// Creates a live class session. When Zoom is configured, a Zoom meeting with
// registration + waiting room is created automatically and linked to it.
// body: { title, description?, date: "YYYY-MM-DD", time: "HH:mm" (IST),
//         duration?, batch? ("Batch 3") } — batch limits registration to
//         students in that batch.
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { title, description, date, time, duration, batch } = await request.json();
    if (!title || !date || !time) {
      return NextResponse.json(
        { error: "title, date and time are required." },
        { status: 400 }
      );
    }

    // Interpret the entered date/time as IST and store as UTC.
    const startMs = Date.parse(`${date}T${time}:00+05:30`);
    if (isNaN(startMs)) {
      return NextResponse.json({ error: "Invalid date or time." }, { status: 400 });
    }
    const startsAt = new Date(startMs).toISOString();
    const durationMinutes = Math.max(15, Math.min(600, Number(duration) || 120));

    // Create the Zoom meeting (registration + waiting room) if configured.
    let zoomMeeting = null;
    let zoomError: string | null = null;
    if (isZoomConfigured()) {
      try {
        zoomMeeting = await createRegisteredMeeting({
          topic: `Prime Strike Live Class — ${title}`,
          startTimeIso: startsAt,
          durationMinutes,
        });
      } catch (err) {
        zoomError = err instanceof Error ? err.message : "Zoom meeting creation failed.";
        console.error("createRegisteredMeeting error:", zoomError);
      }
    }

    const { data: row, error } = await supabaseAdmin
      .from("class_sessions")
      .insert({
        title,
        description: description || null,
        starts_at: startsAt,
        duration_minutes: durationMinutes,
        zoom_meeting_id: zoomMeeting?.meetingId || null,
        zoom_start_url: zoomMeeting?.startUrl || null,
        zoom_join_url: zoomMeeting?.joinUrl || null,
        batch: batch && /^Batch \d+$/.test(String(batch).trim()) ? String(batch).trim() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { session: row, zoomCreated: !!zoomMeeting, zoomError },
      { status: 200 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
