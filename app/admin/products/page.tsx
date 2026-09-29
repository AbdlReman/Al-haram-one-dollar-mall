import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import ProductTable from "../_components/ProductTable";
import type { IProduct } from "@/types/product";

export const metadata: Metadata = { title: "Products — Admin" };
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  await connectDB();
  const raw = await Product.find({}).sort({ createdAt: -1 }).lean();

  const products: IProduct[] = (raw as Record<string, unknown>[]).map((p) => ({
    _id: String(p._id),
    name: String(p.name),
    category: String(p.category || ""),
    categories: Array.isArray(p.categories)
      ? (p.categories as unknown[]).map(String).map((v) => v.trim()).filter(Boolean)
      : [String(p.category || "").trim()].filter(Boolean),
    price: Number(p.price),
    description: String(p.description || ""),
    detail: String(p.detail || ""),
    sizes: Array.isArray(p.sizes) ? (p.sizes as string[]) : [],
    colors: Array.isArray(p.colors) ? (p.colors as string[]) : [],
    colorVariants: Array.isArray(p.colorVariants)
      ? (p.colorVariants as { color: string; images: string[] }[])
      : [],
    stockQuantity: Number(p.stockQuantity || 0),
    images: (p.images as string[]) || [],
    discount: Number(p.discount || 0),
    inStock: Boolean(p.inStock),
    isActive: p.isActive !== false,
    isFeatured: p.isFeatured === true,
    status:
      p.status === "Published" || (p.status == null && p.isActive !== false)
        ? "Published"
        : "Draft",
    popularityScore: Number(p.popularityScore || 0),
    soldCount: Number(p.soldCount || 0),
    slug: String(p.slug || ""),
    metaTitle: String(p.metaTitle || ""),
    metaDescription: String(p.metaDescription || ""),
    createdAt: String(p.createdAt),
    updatedAt: String(p.updatedAt),
  }));

  const inStockCount = products.filter((p) => p.stockQuantity > 0).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">Products</h1>
          <p className="text-slate-400 text-sm mt-1">
            {products.length} total · {inStockCount} in stock
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Products", value: products.length, color: "text-white" },
          { label: "In Stock", value: inStockCount, color: "text-green-400" },
          { label: "Out of Stock", value: products.length - inStockCount, color: "text-red-400" },
          {
            label: "Avg. Discount",
            value:
              products.length > 0
                ? Math.round(
                    products.reduce(
                      (sum, p) => sum + p.discount,
                      0
                    ) / products.length
                  ) + "%"
                : "0%",
            color: "text-indigo-400",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-800 rounded-xl border border-slate-700 px-5 py-4">
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <ProductTable products={products} />
    </div>
  );
}
