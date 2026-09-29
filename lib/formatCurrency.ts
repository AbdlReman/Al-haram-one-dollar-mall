/** Approximate USD→PKR rate used only to prefill the Quick Add price; admin can edit it before saving. */
export const USD_TO_PKR_RATE = 280;

export function usdToPkr(usd: number): number {
  return Math.round(usd * USD_TO_PKR_RATE);
}

/** Pakistani Rupee display (PKR) — use everywhere prices are shown. */
export function formatPkr(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
