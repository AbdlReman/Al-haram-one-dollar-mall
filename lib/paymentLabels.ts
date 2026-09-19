/** Labels for stored payment method codes (orders, emails, admin). */
export function paymentMethodLabel(code: string): string {
  switch ((code || "").toLowerCase()) {
    case "easypaisa":
      return "EasyPaisa";
    case "sadapay":
      return "Sada Pay";
    case "meezan":
      return "Meezan Bank";
    default:
      return (code || "").trim() || "—";
  }
}
