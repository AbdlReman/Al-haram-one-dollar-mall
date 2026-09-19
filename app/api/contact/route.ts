import { NextRequest, NextResponse } from "next/server";
import {
  getContactNotifyEmail,
  sendContactNotification,
  smtpCredentialsReady,
} from "@/lib/mailer";

const LIMITS = { name: 200, email: 320, subject: 200, message: 8000 } as const;

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function trimField(v: unknown, max: number): string {
  return String(v ?? "")
    .trim()
    .slice(0, max);
}

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function buildContactHtml(body: { name: string; email: string; subject: string; message: string }) {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;">
  <h1 style="font-size:20px;margin:0 0 16px;">New contact form message</h1>
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;">
    <tr><td style="padding:8px 0;color:#6b7280;width:100px;vertical-align:top;">Name</td><td style="padding:8px 0;">${esc(body.name)}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;vertical-align:top;">Email</td><td style="padding:8px 0;"><a href="mailto:${esc(body.email)}">${esc(body.email)}</a></td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;vertical-align:top;">Subject</td><td style="padding:8px 0;">${esc(body.subject)}</td></tr>
  </table>
  <p style="margin:16px 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Message</p>
  <div style="white-space:pre-wrap;border:1px solid #e5e7eb;border-radius:8px;padding:16px;background:#f9fafb;">${esc(body.message)}</div>
</div>`;
}

export async function POST(req: NextRequest) {
  const notifyTo = getContactNotifyEmail();
  if (!smtpCredentialsReady() || !notifyTo) {
    console.error(
      "POST /api/contact: set RECIPIENT_EMAIL, EMAIL_USER, and EMAIL_PASS (or SMTP_*). Optional: CONTACT_NOTIFY_EMAIL for a different contact inbox."
    );
    return NextResponse.json(
      { error: "Contact form is not configured. Please try again later." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const name = trimField(b.name, LIMITS.name);
  const email = trimField(b.email, LIMITS.email).toLowerCase();
  const subject = trimField(b.subject, LIMITS.subject);
  const message = trimField(b.message, LIMITS.message);

  if (!name || !emailOk(email) || !subject || !message) {
    return NextResponse.json(
      { error: "Please fill in all fields with a valid email address." },
      { status: 400 }
    );
  }

  const safeSubject = subject.replace(/[\r\n]+/g, " ").slice(0, 120);
  const mailSubject = `[Contact] ${safeSubject}`;

  try {
    await sendContactNotification({
      to: notifyTo,
      subject: mailSubject,
      html: buildContactHtml({ name, email, subject, message }),
      replyTo: email,
    });
  } catch (err) {
    console.error("POST /api/contact sendMail error:", err);
    return NextResponse.json(
      { error: "Could not send your message. Please try again in a few minutes." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
