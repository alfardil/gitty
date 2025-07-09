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
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const emailHtml = await render(WaitlistNotificationEmail({ email }));

    await transporter.sendMail({
      from: `"Gitty Waitlist" <${process.env.GMAIL_USER}>`,
      to: process.env.NOTIFY_EMAIL ?? process.env.GMAIL_USER,
      subject: "New Waitlist Signup",
      html: emailHtml,
    });

    await addWaitlistEmail(email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
