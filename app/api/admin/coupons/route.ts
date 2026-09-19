import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { isAdmin } from "@/lib/isAdmin";

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

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const list = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ coupons: list.map((x) => serialize(x as Record<string, unknown>)) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load coupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Coupon code is required (max 40 characters)." }, { status: 400 });
    }
    if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 100) {
      return NextResponse.json({ error: "Discount must be between 1 and 100 percent." }, { status: 400 });
    }
    if (validFrom && Number.isNaN(validFrom.getTime())) {
      return NextResponse.json({ error: "Invalid valid-from date." }, { status: 400 });
    }
    if (validUntil && Number.isNaN(validUntil.getTime())) {
      return NextResponse.json({ error: "Invalid valid-until date." }, { status: 400 });
    }

    await connectDB();
    const created = await Coupon.create({
      code,
      discountPercent,
      description,
      isActive,
      validFrom: validFrom && !Number.isNaN(validFrom.getTime()) ? validFrom : null,
      validUntil: validUntil && !Number.isNaN(validUntil.getTime()) ? validUntil : null,
      maxUses,
    });
    const o = created.toObject() as Record<string, unknown>;
    return NextResponse.json({ coupon: serialize(o) }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create coupon";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
