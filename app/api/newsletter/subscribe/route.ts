import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const email = String(b.email || "").trim().toLowerCase();
  const name = String(b.name || "").trim().slice(0, 120);
  const source = String(b.source || "website").trim().slice(0, 80) || "website";

  if (!emailOk(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    await connectDB();
    const now = new Date();
    await NewsletterSubscriber.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          name,
          source,
          status: "subscribed",
          unsubscribedAt: null,
        },
        $setOnInsert: { subscribedAt: now },
      },
      { upsert: true, new: true, runValidators: true }
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/newsletter/subscribe error:", error);
    return NextResponse.json({ error: "Could not subscribe right now." }, { status: 500 });
  }
}
