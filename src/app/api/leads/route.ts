import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      phone, 
      batchName, 
      joinedCourse, 
      experience, 
      firstClassDate, 
      totalFee, 
      paidAmount, 
      balanceAmount, 
      paymentMode, 
      notes 
    } = body;

    const courseSelected = joinedCourse || "Basic to Advance";
    const batch = batchName || "Batch 3";
    const fee = totalFee ? `₹${totalFee}` : (courseSelected === "Basic to Advance" ? "₹25,000" : "₹15,000");
    const paid = paidAmount !== undefined && paidAmount !== null && paidAmount !== "" ? `₹${paidAmount}` : "₹0";
    const balance = balanceAmount !== undefined && balanceAmount !== null && balanceAmount !== "" ? `₹${balanceAmount}` : "₹0";
    const pMode = paymentMode ? paymentMode.toUpperCase() : "CUSTOM";

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone are required." },
        { status: 400 }
      );
    }

    const formattedNotes = `[Batch: ${batch} | Course: ${courseSelected} | Fee: ${fee} | Paid: ${paid} | Balance: ${balance} | Mode: ${pMode} | Date: ${firstClassDate || "Not set"}]${notes ? ` — Remarks: ${notes}` : ""}`;

    // 1. Try inserting with new columns first
    const fullPayload = {
      name,
      email,
      phone,
      experience: "beginner",
      joined_course: courseSelected,
      first_class_date: firstClassDate || "",
      paid_amount: paidAmount || "",
      notes: formattedNotes,
      status: "joined",
    };

    let insertOk = false;
    const { error: dbError } = await supabase.from("leads").insert([fullPayload]);

    if (!dbError) {
      insertOk = true;
    } else {
      // 2. Fallback insert (table may not have new columns yet)
      console.warn("Primary insert failed, trying fallback:", dbError.message);
      const fallbackPayload = {
        name,
        email,
        phone,
        experience: "beginner",
        notes: formattedNotes,
        status: "new",
      };
      const { error: fallbackError } = await supabase.from("leads").insert([fallbackPayload]);
      if (!fallbackError) {
        insertOk = true;
      } else {
        console.error("Fallback insert also failed:", fallbackError);
        return NextResponse.json(
          { error: "Failed to save your registration. Please try again." },
          { status: 500 }
        );
      }
    }

    // 3. Send email in background — don't let SMTP failures block the user response
    const smtpHost = process.env.SMTP_HOST || "smtp.hostinger.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "465");
    const smtpUser = process.env.SMTP_USER || "contact@primestrike.co.in";
    const smtpPass = process.env.SMTP_PASS || "LAms@12345";

    const portalUrl = new URL(request.url).origin;

    sendConfirmationEmail({
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      toEmail: email,
      studentName: name,
      batchName: batch,
      courseSelected,
      firstClassDate: firstClassDate || "To be scheduled",
      paidAmount: paid,
      balanceAmount: balance,
      phone,
      portalUrl,
    }).catch((err) => {
      console.error("Background email send failed:", err);
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("Server API error in POST /api/leads:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Separate async function for email — runs independently so SMTP timeouts don't block the response
async function sendConfirmationEmail(opts: {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  toEmail: string;
  studentName: string;
  batchName: string;
  courseSelected: string;
  firstClassDate: string;
  paidAmount: string;
  balanceAmount: string;
  phone: string;
  portalUrl: string;
}) {
  const transporter = nodemailer.createTransport({
    host: opts.smtpHost,
    port: opts.smtpPort,
    secure: opts.smtpPort === 465,
    auth: {
      user: opts.smtpUser,
      pass: opts.smtpPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  const mailOptions = {
    from: `"Prime Strike Trading Academy" <${opts.smtpUser}>`,
    to: opts.toEmail,
    subject: `Welcome to Prime Strike — Enrollment Confirmed (${opts.courseSelected})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 12px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; }
          .header { background-color: #000000; text-align: center; padding: 30px 20px; border-bottom: 1px solid #1c1c1c; }
          .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
          .header h1 span { color: #d4af37; }
          .content { padding: 40px 30px; line-height: 1.6; color: #cccccc; }
          .content h2 { color: #ffffff; font-size: 20px; font-weight: 600; margin-top: 0; }
          .badge { display: inline-block; background-color: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); color: #d4af37; font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; margin-bottom: 15px; }
          .details-box { background-color: #111111; border: 1px solid #222222; border-radius: 8px; padding: 18px; margin: 20px 0; }
          .details-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .details-label { color: #888888; }
          .details-val { color: #ffffff; font-weight: 600; }
          .highlight { color: #d4af37; font-weight: 600; }
          .cta-box { background-color: #121212; border: 1px solid #1c1c1c; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center; }
          .button { display: inline-block; background-color: #d4af37; color: #000000; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 30px; border-radius: 60px; margin-top: 10px; }
          .social-links { text-align: center; margin-top: 20px; }
          .social-btn { display: inline-block; border: 1px solid #1c1c1c; border-radius: 6px; padding: 8px 15px; text-decoration: none; font-size: 12px; color: #ffffff; background-color: #161616; margin: 0 5px; }
          .footer { background-color: #000000; text-align: center; padding: 20px; font-size: 12px; color: #555555; border-top: 1px solid #1a1a1a; }
          .footer a { color: #d4af37; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Prime<span>Strike</span></h1>
          </div>
          <div class="content">
            <h2>Thank you for registering, ${opts.studentName}!</h2>
            <div class="badge">Course Registration Received</div>
            <p>We have received your enrollment details for Prime Strike Academy. Our founder, <span class="highlight">Saranya</span>, and our team are excited to have you on board!</p>
            <div class="details-box">
              <div class="details-row"><span class="details-label">Student Batch:</span> <span class="details-val">${opts.batchName}</span></div>
              <div class="details-row"><span class="details-label">Joined Course:</span> <span class="details-val">${opts.courseSelected}</span></div>
              <div class="details-row"><span class="details-label">First Class Date:</span> <span class="details-val">${opts.firstClassDate}</span></div>
              <div class="details-row"><span class="details-label">Paid Amount:</span> <span class="details-val" style="color: #34d399;">${opts.paidAmount}</span></div>
              <div class="details-row"><span class="details-label">Balance Due:</span> <span class="details-val" style="color: #fbbf24;">${opts.balanceAmount}</span></div>
              <div class="details-row"><span class="details-label">Phone Number:</span> <span class="details-val">${opts.phone}</span></div>
            </div>
            <div class="cta-box">
              <p style="margin-top:0; color:#ffffff; font-weight:600;">Access your Student Portal</p>
              <p style="font-size:13px; color:#888888; margin-bottom:15px;">Create or log into your student account on our website to access live session links and study resources.</p>
              <a href="${opts.portalUrl}/signup" class="button">Create Student Account</a>
            </div>
            <h3 style="color:#ffffff; font-size:15px; font-weight:600; margin-top:30px; margin-bottom:10px;">Connect With Us:</h3>
            <p style="font-size:13px; margin-top:0;">Follow us to receive daily charts, analysis, and trade setup alerts:</p>
            <div class="social-links">
              <a href="https://www.instagram.com/prime__strike?igsh=MTBvZTkzdzFjNXA2cw%3D%3D&utm_source=qr" class="social-btn">📸 Instagram</a>
              <a href="https://t.me/prime_strik" class="social-btn">✈️ Telegram Channel</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Prime Strike Academy. All Rights Reserved.</p>
            <p>Email: <a href="mailto:contact@primestrike.co.in">contact@primestrike.co.in</a> | Phone: +91 95002 98631</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}
