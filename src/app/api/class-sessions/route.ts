import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedUser } from "@/lib/videoAuth";
import { addRegistrant, isZoomConfigured } from "@/lib/zoom";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/class-sessions
// Lists upcoming live classes plus THIS student's personal join link (if they
// have registered). Personal join links are only ever served to their owner.
export async function GET(request: Request) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Include sessions that started up to 3 hours ago so late joiners can
    // still fetch their personal link (grace window past the start time).
    const graceStart = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    // zoom_meeting_id is intentionally exposed: the UI needs it to know whether
    // a session is ready for registration. It only gates the register button —
    // the actual personal join link is never revealed to anyone but its owner.
    //
    // Sessions tied to a specific batch are only shown to students of that
    // batch; sessions without a batch are visible to everyone.
    let sessionQuery = supabaseAdmin
      .from("class_sessions")
      .select("id, title, description, starts_at, duration_minutes, zoom_meeting_id, batch")
      .gte("starts_at", graceStart);
    if (user.batch) {
      sessionQuery = sessionQuery.or(`batch.is.null,batch.eq.${user.batch}`);
    } else {
      sessionQuery = sessionQuery.is("batch", null);
    }
    const { data: sessions, error } = await sessionQuery.order("starts_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ids = (sessions || []).map((s) => s.id);
    let registrants: { session_id: string; email: string; name: string | null; join_url: string | null; status: string }[] = [];
    if (ids.length > 0) {
      const { data } = await supabaseAdmin
        .from("class_session_registrants")
        .select("session_id, email, name, join_url, status")
        .in("session_id", ids)
        .eq("user_id", user.id);
      registrants = data || [];
    }

    const bySession = new Map(registrants.map((r) => [r.session_id, r]));

    return NextResponse.json({
      zoomConfigured: isZoomConfigured(),
      sessions: (sessions || []).map((s) => ({
        ...s,
        registrant: bySession.get(s.id) || null,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/class-sessions  body: { sessionId }
// Registers the logged-in student on Zoom for that session and stores their
// personal join link. Safe to call repeatedly — an existing link is returned.
export async function POST(request: Request) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    const { data: session, error: sErr } = await supabaseAdmin
      .from("class_sessions")
      .select("id, zoom_meeting_id, batch")
      .eq("id", sessionId)
      .single();

    if (sErr || !session) {
      return NextResponse.json({ error: "Class session not found." }, { status: 404 });
    }
    if (!session.zoom_meeting_id) {
      return NextResponse.json(
        { error: "This session is not ready for registration yet." },
        { status: 400 }
      );
    }
    // A class for a specific batch is only for students of that batch.
    if (session.batch && session.batch !== user.batch) {
      return NextResponse.json(
        { error: "This class is not for your batch." },
        { status: 403 }
      );
    }

    // Already registered → return the stored personal link.
    const { data: existing } = await supabaseAdmin
      .from("class_session_registrants")
      .select("id, join_url, status")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.join_url) {
      return NextResponse.json({ registrant: existing });
    }

    const zoom = await addRegistrant(session.zoom_meeting_id, {
      email: user.email,
      firstName: user.name?.split(" ")[0] || "Student",
      lastName: user.name?.split(" ").slice(1).join(" ") || "",
    });

    const { data: row, error: iErr } = await supabaseAdmin
      .from("class_session_registrants")
      .upsert(
        {
          session_id: sessionId,
          user_id: user.id,
          email: user.email,
          name: user.name,
          registrant_id: zoom.registrantId,
          join_url: zoom.joinUrl,
          status: zoom.status,
        },
        { onConflict: "session_id,user_id" }
      )
      .select()
      .single();

    if (iErr) {
      return NextResponse.json({ error: iErr.message }, { status: 500 });
    }

    return NextResponse.json({ registrant: row });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
