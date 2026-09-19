"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatPkr } from "@/lib/formatCurrency";
import { paymentMethodLabel } from "@/lib/paymentLabels";

export type AdminOrderItem = {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  size?: string;
  color?: string;
};

export type AdminOrderRow = {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state?: string;
    postalCode?: string;
    notes?: string;
  };
  items: AdminOrderItem[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  couponCode: string;
  paymentMethod: string;
  paymentTransactionId: string;
  paymentScreenshotUrl: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
};

export default function OrdersAdminClient({ orders }: { orders: AdminOrderRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "completed" | "cancelled">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingTo, setUpdatingTo] = useState<"completed" | "cancelled" | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const selected = openId ? orders.find((o) => o._id === openId) : null;

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    },
    []
  );

  useEffect(() => {
    if (!openId) return;
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openId, onKeyDown]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (order.orderStatus !== statusFilter) return false;
      if (!query) return true;

      const searchableText = [
        order.orderNumber,
        order.customer.name,
        order.customer.phone,
        order.customer.email,
        order.customer.address,
        order.customer.city,
        order.customer.state,
        order.customer.postalCode,
        order.customer.notes,
        order.couponCode,
        order.paymentMethod,
        order.paymentTransactionId,
        order.paymentStatus,
        order.orderStatus,
        ...order.items.flatMap((item) => [item.name, item.color, item.size]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [orders, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const changeStatus = async (orderId: string, nextStatus: "completed" | "cancelled") => {
    if (!orderId) return;
    setUpdatingId(orderId);
    setUpdatingTo(nextStatus);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: nextStatus }),
      });
      if (!res.ok) {
        alert("Failed to update order status.");
        return;
      }
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Failed to update order status.");
    } finally {
      setUpdatingId(null);
      setUpdatingTo(null);
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900/60 p-1">
          {[
            { key: "pending", label: "Pending" },
            { key: "completed", label: "Completed" },
            { key: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key as "pending" | "completed" | "cancelled");
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-widest rounded-md ${
                statusFilter === tab.key
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex min-w-[220px] flex-1 justify-end">
          <label className="sr-only" htmlFor="order-search">
            Search orders
          </label>
          <input
            id="order-search"
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search orders..."
            className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <p className="text-xs text-slate-400">
          Showing {filteredOrders.length} {statusFilter} order
          {filteredOrders.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/50">
        <table className="w-full text-sm text-left text-slate-300 min-w-[720px]">
          <thead className="bg-slate-900/80 text-[10px] uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-4 py-3 font-bold">Order</th>
              <th className="px-4 py-3 font-bold">Customer</th>
              <th className="px-4 py-3 font-bold text-right">Total</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Date</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {paginatedOrders.map((order) => (
              <tr key={order._id} className="hover:bg-slate-800/80 align-middle">
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className="text-white font-semibold tabular-nums">{order.orderNumber}</span>
                </td>
                <td className="px-4 py-2.5 max-w-[280px]">
                  <p className="text-white font-medium truncate">{order.customer.name}</p>
                  <p className="text-slate-500 text-xs truncate">{order.customer.email}</p>
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-white tabular-nums whitespace-nowrap">
                  {formatPkr(order.totalAmount)}
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap tabular-nums">
                  {new Date(order.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-xs">
                  <span className="inline-flex items-center rounded-full bg-slate-700/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-200">
                    {order.paymentStatus}
                  </span>
                  <span className="mx-1 text-slate-600">·</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                      order.orderStatus === "completed"
                        ? "bg-emerald-900/70 text-emerald-200"
                        : order.orderStatus === "cancelled"
                        ? "bg-red-900/70 text-red-200"
                        : "bg-amber-900/70 text-amber-200"
                    }`}
                  >
                    {order.orderStatus}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setOpenId(order._id)}
                      className="cursor-pointer text-xs font-bold uppercase tracking-wide text-cyan-400 hover:text-cyan-300"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      disabled={
                        order.orderStatus === "completed" ||
                        updatingId === order._id
                      }
                      onClick={() => changeStatus(order._id, "completed")}
                      className="cursor-pointer rounded-md border border-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-300 hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingId === order._id && updatingTo === "completed"
                        ? "Saving..."
                        : "Complete"}
                    </button>
                    <button
                      type="button"
                      disabled={
                        order.orderStatus === "cancelled" ||
                        updatingId === order._id
                      }
                      onClick={() => changeStatus(order._id, "cancelled")}
                      className="cursor-pointer rounded-md border border-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-red-300 hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingId === order._id && updatingTo === "cancelled"
                        ? "Saving..."
                        : "Cancel"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  No orders found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-xs text-slate-300">
        <p>
          Showing{" "}
          {filteredOrders.length === 0
            ? 0
            : (currentPage - 1) * perPage + 1}
          -
          {Math.min(currentPage * perPage, filteredOrders.length)} of{" "}
          {filteredOrders.length} {statusFilter} order
          {filteredOrders.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-md border border-slate-600 px-3 py-1 text-slate-200 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-slate-600 px-3 py-1 text-slate-200 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-modal-title"
          onClick={() => setOpenId(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-700 bg-slate-900/95 px-5 py-4 backdrop-blur">
              <div>
                <p id="order-modal-title" className="text-lg font-black uppercase tracking-tight text-white">
                  {selected.orderNumber}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-bold uppercase text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-6">
              <section>
                <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Customer</h3>
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-sm text-slate-300 space-y-1">
                  <p className="text-white font-semibold">{selected.customer.name}</p>
                  <p>
                    <span className="text-slate-500">Email:</span> {selected.customer.email}
                  </p>
                  <p>
                    <span className="text-slate-500">Phone:</span> {selected.customer.phone}
                  </p>
                  <p>
                    <span className="text-slate-500">Address:</span> {selected.customer.address}, {selected.customer.city}
                  </p>
                  {(selected.customer.state || "").trim() ? (
                    <p>
                      <span className="text-slate-500">State / Province:</span> {selected.customer.state}
                    </p>
                  ) : null}
                  {(selected.customer.postalCode || "").trim() ? (
                    <p>
                      <span className="text-slate-500">Postal code:</span> {selected.customer.postalCode}
                    </p>
                  ) : null}
                  {selected.customer.notes ? (
                    <p className="text-slate-400 pt-2 border-t border-slate-700 mt-2">
                      <span className="text-slate-500">Notes:</span> {selected.customer.notes}
                    </p>
                  ) : null}
                </div>
              </section>

              <section>
                <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Payment</h3>
                <div className="rounded-lg border border-blue-900/50 bg-blue-950/30 p-4 text-sm text-slate-200 space-y-2">
                  <p>
                    <span className="text-slate-500">Method:</span>{" "}
                    <span className="text-white font-medium">{paymentMethodLabel(selected.paymentMethod)}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">Transaction ID / TRX ID:</span>{" "}
                    {selected.paymentTransactionId?.trim() ? (
                      <span className="text-white font-mono text-xs break-all">{selected.paymentTransactionId}</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </p>
                  {selected.paymentScreenshotUrl?.trim().startsWith("https://") ? (
                    <div className="pt-2">
                      <p className="text-slate-500 text-xs mb-2">Payment screenshot</p>
                      <a
                        href={selected.paymentScreenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 text-xs underline"
                      >
                        Open full image
                      </a>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selected.paymentScreenshotUrl}
                        alt="Payment proof"
                        className="mt-2 max-h-64 w-auto max-w-full rounded-lg border border-slate-600 object-contain"
                      />
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs">No screenshot uploaded.</p>
                  )}
                  <p className="text-xs text-slate-500 pt-2 border-t border-slate-700">
                    Payment status: {selected.paymentStatus} · Order status: {selected.orderStatus}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Items</h3>
                <div className="overflow-x-auto rounded-lg border border-slate-700">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="bg-slate-900/80 text-[10px] uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="px-3 py-2 w-12" />
                        <th className="px-3 py-2">Product</th>
                        <th className="px-3 py-2 whitespace-nowrap">Color</th>
                        <th className="px-3 py-2 whitespace-nowrap">Size</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                        <th className="px-3 py-2 text-right">Per Item Price</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {selected.items.map((item, idx) => {
                        const qty = Math.max(1, Number(item.quantity || 1));
                        const line = Number(item.price || 0) * qty;
                        const color = (item.color || "").trim() || "—";
                        const size = (item.size || "").trim() || "—";
                        const img = (item.image || "").trim();
                        return (
                          <tr key={`${selected._id}-${idx}`} className="align-middle">
                            <td className="px-3 py-2">
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={img}
                                  alt=""
                                  className="h-10 w-10 object-cover rounded border border-slate-600"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-slate-700 border border-slate-600" />
                              )}
                            </td>
                            <td className="px-3 py-2 font-medium text-white max-w-[200px]">{item.name}</td>
                            <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{color}</td>
                            <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{size}</td>
                            <td className="px-3 py-2 text-center tabular-nums">{qty}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{formatPkr(Number(item.price || 0))}</td>
                            <td className="px-3 py-2 text-right font-semibold text-white tabular-nums">
                              {formatPkr(line)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-900/50 text-xs border-t border-slate-700">
                      <tr>
                        <td colSpan={6} className="px-3 py-2 text-right text-slate-500 uppercase tracking-widest">
                          Subtotal
                        </td>
                        <td className="px-3 py-2 text-right text-slate-200">{formatPkr(selected.subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={6} className="px-3 py-2 text-right text-slate-500 uppercase tracking-widest">
                          Discount{selected.couponCode ? ` (${selected.couponCode})` : ""}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-200">-{formatPkr(selected.discountAmount)}</td>
                      </tr>
                      <tr>
                        <td colSpan={6} className="px-3 py-2 text-right font-bold text-slate-300 uppercase tracking-widest">
                          Total
                        </td>
                        <td className="px-3 py-2 text-right font-black text-white">{formatPkr(selected.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
