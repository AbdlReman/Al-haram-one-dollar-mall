"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { CartItem } from "@/types/product";
import { discountFromPercent } from "@/lib/couponValidation";
import { formatPkr } from "@/lib/formatCurrency";

type PaymentMethod = "easypaisa" | "jazzcash" | "mcbislamic" | "";

async function validateCouponCode(code: string) {
  const res = await fetch("/api/coupons/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return res.json() as Promise<{
    valid: boolean;
    code?: string;
    discountPercent?: number;
    error?: string;
  }>;
}

function ReqStar() {
  return <span className="text-red-600 font-bold">*</span>;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [items] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("cart_items") || "[]");
  });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    notes: "",
  });

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const urlCouponDone = useRef(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("");
  const [paymentTransactionId, setPaymentTransactionId] = useState("");
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState("");
  const [uploadingShot, setUploadingShot] = useState(false);

  const applyCoupon = useCallback(async (code: string) => {
    const raw = code.trim().toUpperCase();
    if (!raw) {
      setAppliedCoupon("");
      setDiscountPercent(0);
      return;
    }
    const data = await validateCouponCode(raw);
    if (!data.valid) {
      toast.error("Coupon not applied", { description: data.error || "Invalid code." });
      setAppliedCoupon("");
      setDiscountPercent(0);
      return;
    }
    setAppliedCoupon(data.code || raw);
    setDiscountPercent(Number(data.discountPercent || 0));
    toast.success("Coupon applied", { description: `${data.code} · ${data.discountPercent}% off` });
  }, []);

  useEffect(() => {
    if (urlCouponDone.current || typeof window === "undefined") return;
    const param = new URLSearchParams(window.location.search).get("coupon")?.trim();
    if (!param) return;
    urlCouponDone.current = true;
    setCouponInput(param.toUpperCase());
    void applyCoupon(param);
  }, [applyCoupon]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const discountAmount = useMemo(
    () => discountFromPercent(subtotal, discountPercent),
    [subtotal, discountPercent]
  );
  const totalAmount = useMemo(
    () => Math.round((subtotal - discountAmount) * 100) / 100,
    [subtotal, discountAmount]
  );

  const emptyWarned = useRef(false);
  useEffect(() => {
    if (items.length > 0 || emptyWarned.current) return;
    emptyWarned.current = true;
    toast.warning("Your cart is empty", {
      description: "Browse the shop and add products before checking out.",
    });
  }, [items.length]);

  const onScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingShot(true);
    try {
      const fd = new FormData();
      fd.append("images", file);
      fd.append("folder", "payment-screenshots");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { urls?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const url = data.urls?.[0];
      if (!url) throw new Error("No image URL returned");
      setPaymentScreenshotUrl(url);
      toast.success("Screenshot uploaded");
    } catch (err) {
      setPaymentScreenshotUrl("");
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setUploadingShot(false);
      e.target.value = "";
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Cannot place order", { description: "Your cart is empty." });
      return;
    }
    if (!paymentMethod) {
      toast.error("Payment method required", { description: "Choose EasyPaisa, JazzCash, or MCB Islamic Bank." });
      return;
    }
    const trx = paymentTransactionId.trim();
    const shot = paymentScreenshotUrl.trim();
    if (!trx && !shot) {
      toast.error("Payment proof required", {
        description: "Enter your Transaction ID / TRX ID or upload a payment screenshot (at least one).",
      });
      return;
    }

    setLoading(true);
    toast.loading("Placing your order…", { id: "place-order" });
    let res: Response;
    try {
      res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          items,
          couponCode: appliedCoupon,
          payment: {
            method: paymentMethod,
            transactionId: trx,
            screenshotUrl: shot,
          },
        }),
      });
    } catch {
      toast.dismiss("place-order");
      setLoading(false);
      toast.error("Network error", { description: "Could not reach the server. Try again." });
      return;
    }
    const data = await res.json();
    setLoading(false);
    toast.dismiss("place-order");
    if (!res.ok) {
      toast.error("Order failed", { description: data.error || "Please try again." });
      return;
    }
    localStorage.removeItem("cart_items");
    window.dispatchEvent(new Event("cart_updated"));
    const orderNo = data.order?.orderNumber ?? "confirmed";
    toast.success("Order placed", {
      description: `Order ${orderNo}. Thank you for your purchase.`,
      duration: 3000,
    });
    router.push("/shop");
  };

  const labelClass = "block text-xs font-bold uppercase text-gray-600 mb-1";
  const inputClass = "border px-3 py-2 w-full";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black uppercase mb-6">Checkout</h1>
      <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 border p-6 space-y-5">
          <h2 className="text-sm font-black uppercase tracking-wide text-gray-800 border-b pb-2">Shipping & contact</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Name <ReqStar />
              </label>
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Phone <ReqStar />
              </label>
              <input
                required
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>
              Email <ReqStar />
            </label>
            <input
              required
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              Address <ReqStar />
            </label>
            <input
              required
              placeholder="Street address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              City <ReqStar />
            </label>
            <input
              required
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>State / Province</label>
              <input
                placeholder="Optional"
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                className={inputClass}
                autoComplete="address-level1"
              />
            </div>
            <div>
              <label className={labelClass}>Postal code</label>
              <input
                placeholder="Optional"
                value={form.postalCode}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                className={inputClass}
                autoComplete="postal-code"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              placeholder="Delivery notes (optional)"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className={inputClass}
              rows={3}
            />
          </div>
        </div>

        <div className="border p-5 h-fit space-y-5">
          <h2 className="font-black uppercase mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm mb-4">
            <p className="flex justify-between">
              <span>Items</span>
              <span>{items.length}</span>
            </p>
            <p className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPkr(subtotal)}</span>
            </p>
            <div className="pt-2 border-t border-gray-200 space-y-2">
              <label className="block text-xs font-bold uppercase text-gray-500">Coupon code</label>
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  className="flex-1 border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void applyCoupon(couponInput)}
                  className="border border-black px-3 py-2 text-xs font-bold uppercase whitespace-nowrap"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon ? (
                <button
                  type="button"
                  className="text-xs text-gray-500 underline"
                  onClick={() => {
                    setAppliedCoupon("");
                    setDiscountPercent(0);
                    setCouponInput("");
                    toast.message("Coupon removed");
                  }}
                >
                  Remove coupon
                </button>
              ) : null}
            </div>
            <p className="flex justify-between">
              <span>Coupon</span>
              <span>{appliedCoupon || "—"}</span>
            </p>
            <p className="flex justify-between">
              <span>Discount{discountPercent ? ` (${discountPercent}%)` : ""}</span>
              <span>-{formatPkr(discountAmount)}</span>
            </p>
            <p className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>{formatPkr(totalAmount)}</span>
            </p>
          </div>
          <div className="space-y-2 text-xs text-gray-600 border-b border-gray-200 pb-4">
            {items.map((i) => (
              <p key={`${i.productId}-${i.size}-${i.color}`}>
                {i.name}
                {(i.color || i.size) && (
                  <span className="text-gray-500">
                    {" "}
                    · {i.color || "—"} / {i.size || "—"}
                  </span>
                )}{" "}
                ×{i.quantity}
              </p>
            ))}
          </div>

          <div className="space-y-4 pt-1">
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-800 border-b pb-2">
              Payment method <ReqStar />
            </h3>
            <fieldset className="space-y-2">
              <legend className="sr-only">Choose how you paid</legend>
              {(
                [
                  { value: "easypaisa" as const, label: "EasyPaisa" },
                  { value: "jazzcash" as const, label: "JazzCash" },
                  { value: "mcbislamic" as const, label: "MCB Islamic Bank" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 border px-3 py-2 cursor-pointer ${
                    paymentMethod === opt.value ? "border-black bg-gray-50" : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.value}
                    checked={paymentMethod === opt.value}
                    onChange={() => setPaymentMethod(opt.value)}
                    className="accent-black"
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </fieldset>

            {paymentMethod === "easypaisa" ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
                <p className="font-bold mb-1">EasyPaisa transfer details</p>
                <p>
                  <span className="text-blue-800">Account:</span>{" "}
                  <span className="font-mono font-semibold">03231589585</span>
                </p>
                <p>
                  <span className="text-blue-800">Account holder:</span> Waleed Ishtiaq
                </p>
                <p className="mt-2 text-blue-900">
                  Send exactly <strong>{formatPkr(totalAmount)}</strong> to this account, then enter your TRX ID and/or
                  upload a screenshot below.
                </p>
              </div>
            ) : null}

            {paymentMethod === "jazzcash" ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                <p className="font-bold mb-1">JazzCash transfer details</p>
                <p>
                  <span className="text-slate-700">Account:</span>{" "}
                  <span className="font-mono font-semibold">03231589585</span>
                </p>
                <p>
                  <span className="text-slate-700">Account holder:</span> Waleed Ishtiaq
                </p>
                <p className="mt-2">
                  Send exactly <strong>{formatPkr(totalAmount)}</strong> to this account, then enter your TRX ID and/or
                  upload a screenshot below.
                </p>
              </div>
            ) : null}

            {paymentMethod === "mcbislamic" ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                <p className="font-bold mb-1">MCB Islamic Bank transfer details</p>
                <p>
                  <span className="text-slate-700">IBAN:</span>{" "}
                  <span className="font-mono font-semibold">PK15MCIB2511007217870001</span>
                </p>
                <p>
                  <span className="text-slate-700">Account number:</span>{" "}
                  <span className="font-mono font-semibold">2511007217870001</span>
                </p>
                <p>
                  <span className="text-slate-700">Account holder:</span> Waleed Ishtiaq
                </p>
                <p>
                  Send exactly <strong>{formatPkr(totalAmount)}</strong> to this account, then enter your TRX ID and/or
                  upload a screenshot below.
                </p>
              </div>
            ) : null}

            <div>
              <label className={labelClass}>Transaction ID / TRX ID</label>
              <input
                placeholder="Enter your transaction ID"
                value={paymentTransactionId}
                onChange={(e) => setPaymentTransactionId(e.target.value)}
                className={inputClass}
                autoComplete="off"
              />
            </div>

            <div>
              <label className={labelClass}>Payment screenshot</label>
              <input
                type="file"
                accept="image/*"
                disabled={uploadingShot}
                onChange={(e) => void onScreenshotChange(e)}
                className="text-sm w-full"
              />
              {uploadingShot ? <p className="text-xs text-gray-500 mt-1">Uploading…</p> : null}
              {paymentScreenshotUrl ? (
                <p className="text-xs text-green-700 mt-2">Screenshot attached — ready to submit.</p>
              ) : null}
            </div>

            <p className="text-xs text-gray-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              <strong>Note:</strong> Please provide either your Transaction ID <strong>or</strong> a payment screenshot (at
              least one is required).
            </p>

            <button disabled={loading} className="w-full bg-black text-white px-5 py-2.5 text-sm font-bold uppercase">
              {loading ? "Placing..." : "Place Order"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
