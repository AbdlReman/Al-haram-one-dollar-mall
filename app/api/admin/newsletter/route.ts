import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import { isAdmin } from "@/lib/isAdmin";

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function serialize(x: Record<string, unknown>) {
  return {
    _id: String(x._id),
    email: String(x.email || ""),
    name: String(x.name || ""),
    status: String(x.status || "subscribed"),
    source: String(x.source || "website"),
    notes: String(x.notes || ""),
    subscribedAt: x.subscribedAt ? String(x.subscribedAt) : "",
    unsubscribedAt: x.unsubscribedAt ? String(x.unsubscribedAt) : "",
    createdAt: x.createdAt ? String(x.createdAt) : "",
    updatedAt: x.updatedAt ? String(x.updatedAt) : "",
  };
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const rows = await NewsletterSubscriber.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ subscribers: rows.map((r) => serialize(r as Record<string, unknown>)) });
  } catch (error) {
    console.error("GET /api/admin/newsletter error:", error);
    return NextResponse.json({ error: "Failed to load subscribers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim().slice(0, 120);
    const source = String(body.source || "admin").trim().slice(0, 80) || "admin";
    const notes = String(body.notes || "").trim().slice(0, 500);
    const status = body.status === "unsubscribed" ? "unsubscribed" : "subscribed";

    if (!emailOk(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    await connectDB();
    const now = new Date();
    const doc = await NewsletterSubscriber.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          name,
          source,
          notes,
          status,
          unsubscribedAt: status === "unsubscribed" ? now : null,
        },
        $setOnInsert: { subscribedAt: now },
      },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    return NextResponse.json({ subscriber: serialize(doc as Record<string, unknown>) }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create subscriber";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
