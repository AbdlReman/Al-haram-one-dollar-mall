import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { serializeProductFromLean } from "@/lib/serializeProduct";
import QuickProductForm from "../../../_components/QuickProductForm";

export const metadata: Metadata = { title: "Edit Quick Product — Admin" };
export const dynamic = "force-dynamic";

export default async function EditQuickProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const [raw, categoriesRaw] = await Promise.all([
    Product.findById(id).lean(),
    Category.find({ isActive: true }).sort({ name: 1 }).lean(),
  ]);
  if (!raw || (raw as Record<string, unknown>).productType !== "quick") notFound();

  const product = serializeProductFromLean(raw as Record<string, unknown>);
  const categoryOptions = Array.from(
    new Set(
      (categoriesRaw as Record<string, unknown>[])
        .map((c) => String(c.name || ""))
        .filter(Boolean)
        .concat(product.category)
        .filter(Boolean)
    )
  );

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-widest mb-3">
          <Link href="/admin/quick-products" className="hover:text-slate-300 transition-colors">
            Quick Add
          </Link>
          <span>/</span>
          <span className="text-slate-400 truncate max-w-[200px]">{product.name}</span>
          <span>/</span>
          <span className="text-slate-400">Edit</span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Edit Quick Product</h1>
        <p className="text-slate-400 text-sm mt-1 truncate">{product.name}</p>
      </div>

      <QuickProductForm mode="edit" initialData={product} categoryOptions={categoryOptions} />
    </div>
  );
}
