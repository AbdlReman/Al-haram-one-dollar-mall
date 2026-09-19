import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOrderEmails({
  customerEmail,
  adminEmail,
  subject,
  customerHtml,
  adminHtml,
}: {
  customerEmail: string;
  adminEmail: string;
  subject: string;
  customerHtml: string;
  adminHtml: string;
}) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@alharamstore.com";
  await Promise.all([
    transporter.sendMail({
      from,
      to: customerEmail,
      subject,
      html: customerHtml,
    }),
    transporter.sendMail({
      from,
      to: adminEmail,
      subject: `New Order Received - ${subject}`,
      html: adminHtml,
    }),
  ]);
}

/** True when Nodemailer can authenticate. */
export function smtpCredentialsReady(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Inbox for order notifications and default contact inbox. Set `RECIPIENT_EMAIL` in `.env.local`. */
export function getRecipientInboxEmail(): string | undefined {
  return process.env.RECIPIENT_EMAIL?.trim() || undefined;
}

/** Contact form “to” address: optional separate inbox, otherwise same as `getRecipientInboxEmail()`. */
export function getContactNotifyEmail(): string | undefined {
  return process.env.CONTACT_NOTIFY_EMAIL?.trim() || getRecipientInboxEmail();
}

export async function sendContactNotification(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@alharamstore.com";
  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo || undefined,
  });
}
