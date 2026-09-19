import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import { isAdmin } from "@/lib/isAdmin";

type Params = { params: Promise<{ id: string }> };
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

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
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
    const updated = await NewsletterSubscriber.findByIdAndUpdate(
      id,
      {
        email,
        name,
        source,
        notes,
        status,
        unsubscribedAt: status === "unsubscribed" ? new Date() : null,
      },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ subscriber: serialize(updated as Record<string, unknown>) });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update subscriber";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const deleted = await NewsletterSubscriber.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/newsletter/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 500 });
  }
}
