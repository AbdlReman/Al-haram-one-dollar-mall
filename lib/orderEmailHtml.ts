import { formatPkr } from "@/lib/formatCurrency";
import { getRecipientInboxEmail, smtpCredentialsReady } from "@/lib/mailer";
import { paymentMethodLabel } from "@/lib/paymentLabels";

export type OrderItemInput = {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
  image?: string;
};

export type CustomerInput = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  notes?: string;
};

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function buildOrderItemsTableRows(items: OrderItemInput[]): string {
  return items
    .map((item) => {
      const line = Number(item.price || 0) * Number(item.quantity || 1);
      const color = (item.color || "").trim() || "—";
      const size = (item.size || "").trim() || "—";
      return `<tr>
  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;vertical-align:middle;">${esc(item.name)}</td>
  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${esc(color)}</td>
  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${esc(size)}</td>
  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${Number(item.quantity || 1)}</td>
  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatPkr(Number(item.price || 0))}</td>
  <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatPkr(line)}</td>
</tr>`;
    })
    .join("");
}

function itemsTable(items: OrderItemInput[]): string {
  const rows = buildOrderItemsTableRows(items);
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;color:#111827;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th align="left" style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Product</th>
      <th align="left" style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Color</th>
      <th align="left" style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Size</th>
      <th align="center" style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Qty</th>
      <th align="right" style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Per Item Price</th>
      <th align="right" style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Total</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
}

function totalsBlock(opts: {
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  couponCode: string;
}): string {
  const coupon = (opts.couponCode || "").trim();
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:320px;margin-left:auto;font-size:14px;">
  <tr><td style="padding:4px 0;color:#6b7280;">Subtotal</td><td align="right" style="padding:4px 0;">${formatPkr(opts.subtotal)}</td></tr>
  <tr><td style="padding:4px 0;color:#6b7280;">Discount${coupon ? ` (${esc(coupon)})` : ""}</td><td align="right" style="padding:4px 0;">-${formatPkr(opts.discountAmount)}</td></tr>
  <tr><td style="padding:10px 0 4px;font-weight:700;font-size:16px;">Total</td><td align="right" style="padding:10px 0 4px;font-weight:700;font-size:16px;">${formatPkr(opts.totalAmount)}</td></tr>
</table>`;
}

function customerBlock(c: CustomerInput): string {
  const notes = (c.notes || "").trim();
  const state = (c.state || "").trim();
  const postal = (c.postalCode || "").trim();
  return `<div style="margin:20px 0;padding:16px;background:#f9fafb;border-radius:8px;font-size:14px;line-height:1.6;color:#374151;">
  <p style="margin:0 0 8px;font-weight:700;color:#111827;">${esc(c.name)}</p>
  <p style="margin:0;"><strong>Email:</strong> ${esc(c.email)}</p>
  <p style="margin:0;"><strong>Phone:</strong> ${esc(c.phone)}</p>
  <p style="margin:0;"><strong>Address:</strong> ${esc(c.address)}, ${esc(c.city)}</p>
  ${state ? `<p style="margin:4px 0 0;"><strong>State / Province:</strong> ${esc(state)}</p>` : ""}
  ${postal ? `<p style="margin:0;"><strong>Postal code:</strong> ${esc(postal)}</p>` : ""}
  ${notes ? `<p style="margin:8px 0 0;"><strong>Notes:</strong> ${esc(notes)}</p>` : ""}
</div>`;
}

export type OrderEmailPayment = {
  methodCode: string;
  transactionId: string;
  screenshotUrl: string;
};

function safeHttpsUrl(u: string): string {
  const t = u.trim();
  return t.startsWith("https://") ? t : "";
}

function paymentBlock(p: { methodLabel: string; transactionId: string; screenshotUrl: string }): string {
  const trx = (p.transactionId || "").trim();
  const imgUrl = safeHttpsUrl(p.screenshotUrl);
  const trxLine = trx
    ? `<p style="margin:0 0 6px;"><strong>Transaction ID / TRX ID:</strong> ${esc(trx)}</p>`
    : `<p style="margin:0 0 6px;color:#6b7280;"><strong>Transaction ID / TRX ID:</strong> —</p>`;
  const imgBlock = imgUrl
    ? `<p style="margin:12px 0 6px;font-weight:600;">Payment screenshot</p>
  <p style="margin:0;"><a href="${esc(imgUrl)}" target="_blank" rel="noopener noreferrer">Open screenshot</a></p>
  <p style="margin:8px 0 0;"><img src="${esc(imgUrl)}" alt="Payment" width="360" style="max-width:100%;height:auto;border-radius:8px;border:1px solid #e5e7eb;" /></p>`
    : `<p style="margin:12px 0 0;color:#6b7280;font-size:13px;">No payment screenshot was uploaded.</p>`;
  return `<div style="margin:20px 0;padding:16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:14px;line-height:1.6;color:#1e3a8a;">
  <p style="margin:0 0 8px;font-weight:700;">Payment</p>
  <p style="margin:0 0 6px;"><strong>Method:</strong> ${esc(p.methodLabel)}</p>
  ${trxLine}
  ${imgBlock}
</div>`;
}

function paymentSection(payment?: OrderEmailPayment): string {
  const code = (payment?.methodCode || "").trim().toLowerCase();
  if (!code) return "";
  return paymentBlock({
    methodLabel: paymentMethodLabel(code),
    transactionId: payment?.transactionId || "",
    screenshotUrl: payment?.screenshotUrl || "",
  });
}

export function buildCustomerOrderEmailHtml(opts: {
  orderNumber: string;
  customer: CustomerInput;
  items: OrderItemInput[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  couponCode: string;
  payment?: OrderEmailPayment;
}): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;">
  <h1 style="font-size:20px;margin:0 0 8px;">Order ${esc(opts.orderNumber)}</h1>
  <p style="margin:0 0 16px;color:#6b7280;">Hi ${esc(opts.customer.name)}, thank you for your order. Here are your order details.</p>
  ${customerBlock(opts.customer)}
  ${paymentSection(opts.payment)}
  ${itemsTable(opts.items)}
  ${totalsBlock(opts)}
  <p style="margin-top:24px;font-size:13px;color:#6b7280;">We will contact you if we need anything else.</p>
</div>`;
}

export function buildAdminOrderEmailHtml(opts: {
  orderNumber: string;
  customer: CustomerInput;
  items: OrderItemInput[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  couponCode: string;
  payment?: OrderEmailPayment;
}): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;">
  <h1 style="font-size:20px;margin:0 0 8px;">New order ${esc(opts.orderNumber)}</h1>
  ${customerBlock(opts.customer)}
  ${paymentSection(opts.payment)}
  ${itemsTable(opts.items)}
  ${totalsBlock(opts)}
</div>`;
}

export function getOrderNotificationEmail(): string | undefined {
  return getRecipientInboxEmail();
}

export function smtpConfigured(): boolean {
  return Boolean(smtpCredentialsReady() && getOrderNotificationEmail());
}
