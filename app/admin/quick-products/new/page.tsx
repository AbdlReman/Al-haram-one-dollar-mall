import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import QuickProductForm from "../../_components/QuickProductForm";

export const metadata: Metadata = { title: "Add Quick Product — Admin" };
export const dynamic = "force-dynamic";

export default async function NewQuickProductPage() {
  await connectDB();
  const categoriesRaw = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  const categoryOptions = (categoriesRaw as Record<string, unknown>[])
    .map((c) => String(c.name || ""))
    .filter(Boolean);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-widest mb-3">
          <Link href="/admin/quick-products" className="hover:text-slate-300 transition-colors">
            Quick Add
          </Link>
          <span>/</span>
          <span className="text-slate-400">Add New</span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Add Quick Product</h1>
        <p className="text-slate-400 text-sm mt-1">Title, category, one image, and a price — that&apos;s it.</p>
      </div>

      <QuickProductForm mode="create" categoryOptions={categoryOptions} />
    </div>
  );
}
