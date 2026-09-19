"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { CartItem } from "@/types/product";
import { discountFromPercent } from "@/lib/couponValidation";
import { formatPkr } from "@/lib/formatCurrency";

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

type ProductStockResponse = {
  product?: {
    stockQuantity?: number;
  };
};

function normalizeCartQuantity(quantity: number) {
  return Math.max(1, Math.floor(Number(quantity) || 1));
}

function getKnownStock(item: CartItem) {
  if (item.stockQuantity == null) return null;
  const stock = Math.floor(Number(item.stockQuantity));
  return Number.isFinite(stock) ? Math.max(0, stock) : null;
}

function getCartLineKey(item: CartItem) {
  return `${item.productId}:${item.color || ""}:${item.size || ""}`;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("cart_items") || "[]");
  });
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [applying, setApplying] = useState(false);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const discountAmount = useMemo(
    () => discountFromPercent(subtotal, discountPercent),
    [subtotal, discountPercent]
  );
  const total = useMemo(() => Math.round((subtotal - discountAmount) * 100) / 100, [subtotal, discountAmount]);

  const saveItems = useCallback((next: CartItem[]) => {
    setItems(next);
    localStorage.setItem("cart_items", JSON.stringify(next));
    window.dispatchEvent(new Event("cart_updated"));
  }, []);

  useEffect(() => {
    if (items.length === 0) return;

    const productIds = Array.from(new Set(items.map((item) => item.productId).filter(Boolean)));
    let cancelled = false;

    const refreshStock = async () => {
      const stockEntries = await Promise.all(
        productIds.map(async (productId) => {
          try {
            const res = await fetch(`/api/products/${productId}`, { cache: "no-store" });
            if (!res.ok) return null;
            const data = (await res.json()) as ProductStockResponse;
            const stock = Number(data.product?.stockQuantity);
            if (!Number.isFinite(stock)) return null;
            return [productId, Math.max(0, Math.floor(stock))] as const;
          } catch {
            return null;
          }
        })
      );

      if (cancelled) return;

      const stockByProductId = new Map(
        stockEntries.filter((entry): entry is readonly [string, number] => entry !== null)
      );
      if (stockByProductId.size === 0) return;

      let changed = false;
      let quantityClamped = false;
      const next = items.map((item) => {
        const stockQuantity = stockByProductId.get(item.productId);
        if (stockQuantity == null) return item;

        const quantity =
          stockQuantity > 0
            ? Math.min(normalizeCartQuantity(item.quantity), stockQuantity)
            : normalizeCartQuantity(item.quantity);
        if (item.stockQuantity !== stockQuantity || item.quantity !== quantity) changed = true;
        if (item.quantity !== quantity) quantityClamped = true;
        return { ...item, stockQuantity, quantity };
      });

      if (!changed) return;
      saveItems(next);
      if (quantityClamped) {
        toast.warning("Cart quantity adjusted", { description: "Some items have limited stock available." });
      }
    };

    void refreshStock();

    return () => {
      cancelled = true;
    };
  }, [items, saveItems]);

  const getLineMaxQuantity = (targetItem: CartItem) => {
    const stockQuantity = getKnownStock(targetItem);
    if (stockQuantity == null) return null;

    const targetKey = getCartLineKey(targetItem);
    const quantityInOtherLines = items.reduce((sum, item) => {
      if (item.productId !== targetItem.productId || getCartLineKey(item) === targetKey) return sum;
      return sum + normalizeCartQuantity(item.quantity);
    }, 0);

    return Math.max(0, stockQuantity - quantityInOtherLines);
  };

  const updateQuantity = (targetItem: CartItem, quantity: number) => {
    const requestedQuantity = normalizeCartQuantity(quantity);
    const maxQuantity = getLineMaxQuantity(targetItem);
    if (maxQuantity === 0) {
      toast.error("No stock available", { description: "Remove this item or reduce another option." });
      return;
    }

    const nextQuantity = maxQuantity == null ? requestedQuantity : Math.min(requestedQuantity, maxQuantity);
    if (maxQuantity != null && requestedQuantity > maxQuantity) {
      toast.warning("Stock limit reached", { description: `Only ${maxQuantity} available for this item.` });
    }

    const targetKey = getCartLineKey(targetItem);
    const next = items.map((item) => (getCartLineKey(item) === targetKey ? { ...item, quantity: nextQuantity } : item));
    saveItems(next);
  };

  const removeItem = (targetItem: CartItem) => {
    const targetKey = getCartLineKey(targetItem);
    const removed = items.find((item) => getCartLineKey(item) === targetKey);
    saveItems(items.filter((item) => getCartLineKey(item) !== targetKey));
    if (removed) toast.success("Removed from cart", { description: removed.name });
  };

  const handleApplyCoupon = async () => {
    setApplying(true);
    try {
      const data = await validateCouponCode(couponInput);
      if (!data.valid) {
        toast.error("Invalid coupon", { description: data.error || "Try another code." });
        setAppliedCoupon("");
        setDiscountPercent(0);
        return;
      }
      setAppliedCoupon(data.code || couponInput.trim().toUpperCase());
      setDiscountPercent(Number(data.discountPercent || 0));
      toast.success("Coupon applied", { description: `${data.code} · ${data.discountPercent}% off` });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black uppercase mb-6">Your Cart</h1>
      {items.length === 0 ? (
        <div className="text-center py-16 border">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <Link href="/shop" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const stockQuantity = getKnownStock(item);
              const maxQuantity = getLineMaxQuantity(item);
              const isOutOfStock = stockQuantity === 0 || maxQuantity === 0;

              return (
                <div key={getCartLineKey(item)} className="border p-4 flex gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.name} className="w-24 h-24 object-cover bg-gray-100" />
                  <div className="flex-1">
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      {item.color} {item.size ? `· ${item.size}` : ""}
                    </p>
                    <p className="font-semibold mt-1">{formatPkr(item.price)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        type="number"
                        min={1}
                        max={maxQuantity != null && maxQuantity > 0 ? maxQuantity : undefined}
                        disabled={isOutOfStock}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item, Number(e.target.value || 1))}
                        className="w-16 border px-2 py-1 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                      <button onClick={() => removeItem(item)} className="text-red-600 text-sm">
                        Remove
                      </button>
                    </div>
                    {stockQuantity != null ? (
                      <p className="mt-1 text-xs text-gray-500">
                        {stockQuantity > 0 ? `${stockQuantity} in stock` : "Out of stock"}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border p-5 h-fit">
            <h2 className="font-black uppercase mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPkr(subtotal)}</span>
              </p>
              <p className="flex justify-between">
                <span>Discount{discountPercent ? ` (${discountPercent}%)` : ""}</span>
                <span>-{formatPkr(discountAmount)}</span>
              </p>
              <p className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatPkr(total)}</span>
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="border px-3 py-2 w-full"
                placeholder="Coupon code"
              />
              <button
                type="button"
                disabled={applying}
                onClick={() => void handleApplyCoupon()}
                className="w-full border border-black py-2 text-sm font-bold uppercase disabled:opacity-50"
              >
                {applying ? "Checking…" : "Apply coupon"}
              </button>
              {appliedCoupon ? (
                <button
                  type="button"
                  className="text-xs text-gray-500 underline w-full text-left"
                  onClick={() => {
                    setAppliedCoupon("");
                    setDiscountPercent(0);
                    setCouponInput("");
                  }}
                >
                  Remove {appliedCoupon}
                </button>
              ) : null}
            </div>
            <Link
              href={`/checkout?coupon=${encodeURIComponent(appliedCoupon)}`}
              onClick={() =>
                toast.success("Going to checkout", {
                  description: `${items.length} item group(s) · ${formatPkr(total)}`,
                })
              }
              className="block mt-5 bg-black text-white text-center py-2 font-bold uppercase text-sm"
            >
              Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
