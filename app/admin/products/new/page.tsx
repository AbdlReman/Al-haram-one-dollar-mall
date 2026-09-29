import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import ProductForm from "../../_components/ProductForm";

export const metadata: Metadata = { title: "Add Product — Admin" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await connectDB();
  const categoriesRaw = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  const categoryOptions = (categoriesRaw as Record<string, unknown>[]).map((c) => String(c.name || "")).filter(Boolean);
  const finalCategoryOptions = Array.from(
    new Set(
      categoryOptions.length > 0
        ? categoryOptions
        : ["Kitchen Accessories", "Electronics", "Skin Care", "Makeup", "Hair Care", "Jewelry"]
    )
  );

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-widest mb-3">
          <Link href="/admin/products" className="hover:text-slate-300 transition-colors">
            Products
          </Link>
          <span>/</span>
          <span className="text-slate-400">Add New</span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Add Product</h1>
        <p className="text-slate-400 text-sm mt-1">Fill in the details to add a new product to the store.</p>
      </div>

      <ProductForm mode="create" categoryOptions={finalCategoryOptions} />
    </div>
  );
}
