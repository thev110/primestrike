import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/videoAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKET = "agreements";

// GET /api/admin/agreements?search=...
// Lists every signed agreement, newest first, with short-lived signed URLs for
// the selfie and signature images so the admin panel can display them.
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const search = new URL(request.url).searchParams.get("search")?.trim().toLowerCase() || "";

    let query = supabaseAdmin
      .from("agreements")
      .select("*")
      .order("agreed_at", { ascending: false });

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Resolve signed image URLs for the rows that have images.
    const items = await Promise.all(
      (data || []).map(async (a) => {
        let selfieUrl: string | null = null;
        let signatureUrl: string | null = null;
        if (a.selfie_path) {
          const { data: s } = await supabaseAdmin.storage
            .from(BUCKET)
            .createSignedUrl(a.selfie_path, 3600);
          selfieUrl = s?.signedUrl || null;
        }
        if (a.signature_path) {
          const { data: s } = await supabaseAdmin.storage
            .from(BUCKET)
            .createSignedUrl(a.signature_path, 3600);
          signatureUrl = s?.signedUrl || null;
        }
        return {
          id: a.id,
          email: a.email,
          name: a.name,
          address: a.address,
          phone: a.phone,
          agreedAt: a.agreed_at,
          selfieUrl,
          signatureUrl,
        };
      })
    );

    return NextResponse.json({ agreements: items }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
