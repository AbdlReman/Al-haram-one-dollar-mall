import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import ReviewsAdminClient from "./ReviewsAdminClient";

export const metadata: Metadata = { title: "Reviews — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await connectDB();
  const raw = await Product.find({
    isActive: true,
    $or: [{ status: "Published" }, { status: { $exists: false } }],
  })
    .select("name")
    .sort({ name: 1 })
    .lean();
  const products = (raw as { _id: unknown; name?: string }[]).map((p) => ({
    _id: String(p._id),
    name: String(p.name || "").trim(),
  })).filter((p) => p._id && p.name);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-widest mb-3">
          <Link href="/admin" className="hover:text-slate-300 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-400">Reviews</span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Reviews</h1>
        <p className="text-slate-400 text-sm mt-1">Add, edit, or delete customer reviews for any product.</p>
      </div>

      <ReviewsAdminClient products={products} />
    </div>
  );
}
