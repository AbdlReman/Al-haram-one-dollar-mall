export type CouponLean = {
  _id: unknown;
  code: string;
  discountPercent: number;
  isActive: boolean;
  validFrom?: Date | string | null;
  validUntil?: Date | string | null;
  maxUses?: number | null;
  usedCount?: number;
};

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Inclusive calendar-day window in UTC. */
export function isCouponUsable(coupon: CouponLean, now = new Date()): boolean {
  if (!coupon.isActive) return false;
  const today = utcDayKey(now);

  if (coupon.validFrom) {
    const from = utcDayKey(new Date(coupon.validFrom));
    if (today < from) return false;
  }
  if (coupon.validUntil) {
    const until = utcDayKey(new Date(coupon.validUntil));
    if (today > until) return false;
  }
  const max = coupon.maxUses;
  const used = Number(coupon.usedCount || 0);
  if (max != null && Number.isFinite(max) && used >= max) return false;
  return true;
}

export function computeSubtotalFromOrderItems(
  items: { price: unknown; quantity: unknown }[]
): number {
  return items.reduce((sum, item) => {
    const price = Number(item.price || 0);
    const qty = Math.max(1, Math.floor(Number(item.quantity || 1)));
    return sum + price * qty;
  }, 0);
}

export function discountFromPercent(subtotal: number, percent: number): number {
  const p = Math.min(100, Math.max(0, Number(percent) || 0));
  return Math.round(subtotal * (p / 100) * 100) / 100;
}
