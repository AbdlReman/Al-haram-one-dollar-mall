import mongoose, { Schema } from "mongoose";

const CouponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 40 },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    description: { type: String, default: "", maxlength: 200 },
    isActive: { type: Boolean, default: true },
    /** Inclusive first calendar day (UTC date) — optional */
    validFrom: { type: Date, default: null },
    /** Inclusive last calendar day (UTC date) — optional */
    validUntil: { type: Date, default: null },
    /** null = unlimited redemptions */
    maxUses: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
export default Coupon;
