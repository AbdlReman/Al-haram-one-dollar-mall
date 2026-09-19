import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { isAdmin } from "@/lib/isAdmin";

type Params = { params: Promise<{ id: string }> };

function serialize(c: Record<string, unknown>) {
  return {
    _id: String(c._id),
    code: String(c.code || ""),
    discountPercent: Number(c.discountPercent || 0),
    description: String(c.description || ""),
    isActive: c.isActive !== false,
    validFrom: c.validFrom ? String(c.validFrom) : "",
    validUntil: c.validUntil ? String(c.validUntil) : "",
    maxUses: c.maxUses == null ? null : Number(c.maxUses),
    usedCount: Number(c.usedCount || 0),
    createdAt: String(c.createdAt || ""),
    updatedAt: String(c.updatedAt || ""),
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
    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    const discountPercent = Number(body.discountPercent);
    const description = String(body.description || "").trim();
    const isActive = body.isActive !== false;
    const validFrom = body.validFrom ? new Date(String(body.validFrom)) : null;
    const validUntil = body.validUntil ? new Date(String(body.validUntil)) : null;
    const maxUsesRaw = body.maxUses;
    const maxUses =
      maxUsesRaw === "" || maxUsesRaw === null || maxUsesRaw === undefined
        ? null
        : Math.max(1, Math.floor(Number(maxUsesRaw)));

    if (!code || code.length > 40) {
      return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
    }
    if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 100) {
      return NextResponse.json({ error: "Discount must be 1–100 percent." }, { status: 400 });
    }

    await connectDB();
    const updated = await Coupon.findByIdAndUpdate(
      id,
      {
        code,
        discountPercent,
        description,
        isActive,
        validFrom: validFrom && !Number.isNaN(validFrom.getTime()) ? validFrom : null,
        validUntil: validUntil && !Number.isNaN(validUntil.getTime()) ? validUntil : null,
        maxUses,
      },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ coupon: serialize(updated as Record<string, unknown>) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update";
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
    const del = await Coupon.findByIdAndDelete(id);
    if (!del) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
