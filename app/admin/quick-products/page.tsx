import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import { serializeProductFromLean } from "@/lib/serializeProduct";
import Product from "@/models/Product";
import QuickProductTable from "../_components/QuickProductTable";

export const metadata: Metadata = { title: "Quick Add — Admin" };
export const dynamic = "force-dynamic";

export default async function QuickProductsPage() {
  await connectDB();
  const raw = await Product.find({ productType: "quick" }).sort({ createdAt: -1 }).lean();
  const products = (raw as Record<string, unknown>[]).map((p) => serializeProductFromLean(p));

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">Quick Add</h1>
          <p className="text-slate-400 text-sm mt-1">
            {products.length} quick product{products.length === 1 ? "" : "s"} · fast listings with just a title, category, image, and price.
          </p>
        </div>
        <Link
          href="/admin/quick-products/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Product
        </Link>
      </div>

      <QuickProductTable products={products} />
    </div>
  );
}
