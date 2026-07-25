import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/videoAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ACCESS_WINDOW_HOURS = 48;

// POST /api/admin/video-requests/decide  body: { requestId, decision: "grant"|"deny" }
// Admin grants or denies a student's request. Granting starts the 48h clock.
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { requestId, decision } = await request.json();
    if (!requestId || (decision !== "grant" && decision !== "deny")) {
      return NextResponse.json(
        { error: "requestId and decision ('grant'|'deny') are required." },
        { status: 400 }
      );
    }

    const { data: req, error: rErr } = await supabaseAdmin
      .from("video_requests")
      .select("id, email, video_id, status, grant_count")
      .eq("id", requestId)
      .single();

    if (rErr || !req) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    let update: Record<string, unknown>;
    if (decision === "grant") {
      const grantedAt = new Date();
      const expiresAt = new Date(
        grantedAt.getTime() + ACCESS_WINDOW_HOURS * 3600 * 1000
      );
      update = {
        status: "granted",
        granted_at: grantedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        grant_count: (req.grant_count ?? 0) + 1,
      };
    } else {
      update = { status: "denied", granted_at: null, expires_at: null };
    }

    const { error: upErr } = await supabaseAdmin
      .from("video_requests")
      .update(update)
      .eq("id", requestId);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    // Best-effort notification email. A broken SMTP password must NOT block the
    // grant itself — access is enforced in-app regardless of email delivery.
    if (decision === "grant") {
      const { data: video } = await supabaseAdmin
        .from("videos")
        .select("title")
        .eq("id", req.video_id)
        .single();
      const origin = new URL(request.url).origin;
      notifyGranted({
        toEmail: req.email,
        videoTitle: video?.title || "your requested video",
        loginUrl: `${origin}/login`,
        hours: ACCESS_WINDOW_HOURS,
      }).catch((e) => console.error("grant email failed:", e));
    }

    return NextResponse.json({ success: true, decision }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function notifyGranted(opts: {
  toEmail: string;
  videoTitle: string;
  loginUrl: string;
  hours: number;
}) {
  const port = parseInt(process.env.SMTP_PORT || "465");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER || "contact@primestrike.co.in",
      pass: process.env.SMTP_PASS || "",
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  const smtpUser = process.env.SMTP_USER || "contact@primestrike.co.in";
  await transporter.sendMail({
    from: `"Prime Strike Trading Academy" <${smtpUser}>`,
    to: opts.toEmail,
    subject: "Video access approved",
    html: `
      <div style="font-family:Helvetica,Arial,sans-serif;background:#000;color:#fff;padding:32px;">
        <div style="max-width:560px;margin:0 auto;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:12px;padding:32px;">
          <h2 style="color:#fff;margin-top:0;">Access approved</h2>
          <p style="color:#ccc;line-height:1.6;">
            Your request for <strong style="color:#d4af37;">${opts.videoTitle}</strong> was approved.
            Log in to the student portal to watch it. Access is available for
            <strong style="color:#d4af37;">${opts.hours} hours</strong>.
          </p>
          <p style="text-align:center;margin:28px 0;">
            <a href="${opts.loginUrl}"
               style="display:inline-block;background:#d4af37;color:#000;font-weight:bold;
                      text-decoration:none;padding:14px 34px;border-radius:60px;">
              Log In to Watch
            </a>
          </p>
          <p style="color:#888;font-size:12px;">
            The video plays inside the portal only. It cannot be downloaded or shared.
          </p>
        </div>
      </div>
    `,
  });
}
