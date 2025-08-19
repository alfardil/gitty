import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import WaitlistNotificationEmail from "./WaitlistNotificationEmail";
import { addWaitlistEmail } from "@/server/src/db/actions";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    // Try to save to database first
    try {
      await addWaitlistEmail(email);
    } catch (dbError: any) {
      // If it's a duplicate email error, that's fine - they're already on the list
      if (dbError?.code === '23505' || dbError?.message?.includes('duplicate key')) {
        console.log("Email already exists in waitlist - returning success");
        return NextResponse.json({ success: true });
      }
      // If it's a different database error, continue to send email anyway
      console.warn("Database error (non-duplicate):", dbError);
    }

    // Send notification email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const emailHtml = await render(WaitlistNotificationEmail({ email }));

    await transporter.sendMail({
      from: `"Thestral Waitlist" <${process.env.GMAIL_USER}>`,
      to: process.env.NOTIFY_EMAIL ?? process.env.GMAIL_USER,
      subject: "New Waitlist Signup",
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist API error:", error);
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}
