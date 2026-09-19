import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { isCouponUsable } from "@/lib/couponValidation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const raw = String(body.code || "").trim().toUpperCase();
    if (!raw) {
      return NextResponse.json({ valid: false, error: "Enter a coupon code." });
    }
    await connectDB();
    const coupon = await Coupon.findOne({ code: raw }).lean();
    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Coupon not found." });
    }
    const c = coupon as Record<string, unknown>;
    const lean: Parameters<typeof isCouponUsable>[0] = {
      _id: c._id,
      code: String(c.code || ""),
      discountPercent: Number(c.discountPercent || 0),
      isActive: Boolean(c.isActive !== false),
      validFrom: c.validFrom as Date | null,
      validUntil: c.validUntil as Date | null,
      maxUses: c.maxUses == null ? null : Number(c.maxUses),
      usedCount: Number(c.usedCount || 0),
    };
    if (!isCouponUsable(lean)) {
      return NextResponse.json({ valid: false, error: "This coupon is inactive, expired, or no longer available." });
    }
    return NextResponse.json({
      valid: true,
      code: lean.code,
      discountPercent: lean.discountPercent,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ valid: false, error: "Could not validate coupon." }, { status: 500 });
  }
}
