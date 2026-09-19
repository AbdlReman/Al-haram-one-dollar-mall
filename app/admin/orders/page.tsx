import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import OrdersAdminClient, { type AdminOrderItem, type AdminOrderRow } from "./OrdersAdminClient";

export const metadata: Metadata = { title: "Orders — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await connectDB();
  const raw = await Order.find({}).sort({ createdAt: -1 }).lean();
  const orders: AdminOrderRow[] = (raw as Record<string, unknown>[]).map((o) => ({
    _id: String(o._id),
    orderNumber: String(o.orderNumber),
    customer: o.customer as AdminOrderRow["customer"],
    items: (Array.isArray(o.items) ? o.items : []) as AdminOrderItem[],
    subtotal: Number(o.subtotal ?? 0),
    discountAmount: Number(o.discountAmount ?? 0),
    totalAmount: Number(o.totalAmount || 0),
    couponCode: String(o.couponCode || ""),
    paymentMethod: String(o.paymentMethod || ""),
    paymentTransactionId: String(o.paymentTransactionId || ""),
    paymentScreenshotUrl: String(o.paymentScreenshotUrl || ""),
    paymentStatus: String(o.paymentStatus || "pending"),
    orderStatus: String(o.orderStatus || "pending"),
    createdAt: String(o.createdAt),
  }));

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-6">Orders</h1>
      {orders.length === 0 ? (
        <p className="text-slate-400 text-sm">No orders yet.</p>
      ) : (
        <OrdersAdminClient orders={orders} />
      )}
    </div>
  );
}
