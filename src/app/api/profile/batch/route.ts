import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedUser } from "@/lib/videoAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/profile/batch  body: { batch }
// Sets the logged-in student's batch. This powers the "update my batch" link
// students receive: they log in with their email, pick their batch, and it is
// stored on their profile. Allowed values come from STUDENT_BATCHES.
export async function POST(request: Request) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // One-time setup: a student picks their batch once. After that it is
    // locked — corrections go through the admin panel (Registered Students).
    if (user.batch && user.role !== "admin") {
      return NextResponse.json(
        {
          error: `Your batch is already set to ${user.batch}. To change it, message Prime Strike and an admin will update it for you.`,
        },
        { status: 409 }
      );
    }

    const { batch } = await request.json();
    if (!batch || typeof batch !== "string" || !/^Batch \d+$/.test(batch.trim())) {
      return NextResponse.json(
        { error: "batch must be e.g. \"Batch 3\"." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ batch: batch.trim() })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, batch: batch.trim() }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
