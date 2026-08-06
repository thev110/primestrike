import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedUser } from "@/lib/videoAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKET = "agreements";

// GET /api/agreement
// Returns whether the logged-in student has signed the agreement.
export async function GET(request: Request) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("agreements")
      .select("id, name, address, phone, agreed_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ signed: !!data, agreement: data || null }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/agreement  body: { name, address, phone, selfie, signature, agreementText? }
// The logged-in student signs the digital agreement. `selfie` and `signature`
// are data-URL images (from the webcam and the on-screen signature pad). They
// are stored in the private 'agreements' bucket, and the record is upserted
// (one agreement per student — re-signing updates it).
export async function POST(request: Request) {
  try {
    const user = await getAuthedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { name, address, phone, selfie, signature, agreementText } = await request.json();
    if (!name || !address || !phone) {
      return NextResponse.json(
        { error: "Name, address and phone are required." },
        { status: 400 }
      );
    }
    if (!selfie || !signature) {
      return NextResponse.json(
        { error: "A webcam photo and signature are required." },
        { status: 400 }
      );
    }

    // Guard against oversized payloads (bucket also caps at 5MB per object).
    const sizeOf = (dataUrl: string) => {
      const m = /^data:[^;]+;base64,(.+)$/.exec(dataUrl);
      return m ? Buffer.from(m[1], "base64").length : 0;
    };
    if (sizeOf(selfie) > 4 * 1024 * 1024 || sizeOf(signature) > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image is too large. Please capture again." },
        { status: 400 }
      );
    }

    // Upload the two images (data URLs) to the private bucket.
    const selfiePath = `${user.id}/selfie-${Date.now()}.jpg`;
    const signaturePath = `${user.id}/signature-${Date.now()}.jpg`;

    const upload = async (dataUrl: string, path: string) => {
      const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
      if (!m) throw new Error("Invalid image data.");
      const contentType = m[1];
      const buffer = Buffer.from(m[2], "base64");
      const { error } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType, upsert: true });
      if (error) throw new Error(`Image upload failed: ${error.message}`);
    };

    let selfieUploaded = false;
    let signatureUploaded = false;
    try {
      await upload(selfie, selfiePath);
      selfieUploaded = true;
      await upload(signature, signaturePath);
      signatureUploaded = true;
    } catch (err) {
      // Clean up any half-uploaded images so we don't leave orphans behind.
      if (selfieUploaded) {
        await supabaseAdmin.storage.from(BUCKET).remove([selfiePath]).catch(() => null);
      }
      if (signatureUploaded) {
        await supabaseAdmin.storage.from(BUCKET).remove([signaturePath]).catch(() => null);
      }
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Image upload failed." },
        { status: 500 }
      );
    }

    const { error } = await supabaseAdmin.from("agreements").upsert(
      {
        user_id: user.id,
        email: user.email,
        name: String(name).trim(),
        address: String(address).trim(),
        phone: String(phone).trim(),
        signature_path: signaturePath,
        selfie_path: selfiePath,
        agreement_text: agreementText || null,
        agreed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      // DB write failed — remove the just-uploaded images.
      await supabaseAdmin.storage
        .from(BUCKET)
        .remove([selfiePath, signaturePath])
        .catch(() => null);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
