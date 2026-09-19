import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Brand from "@/models/Brand";
import Category from "@/models/Category";
import ProductForm from "../../../_components/ProductForm";
import type { IProduct } from "@/types/product";

export const metadata: Metadata = { title: "Edit Product — Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectDB();
  const [raw, brandsRaw, categoriesRaw] = await Promise.all([
    Product.findById(id).lean(),
    Brand.find({ isActive: true }).sort({ name: 1 }).lean(),
    Category.find({ isActive: true }).sort({ name: 1 }).lean(),
  ]);
  if (!raw) notFound();
  const brandOptions = Array.from(
    new Set(
      (brandsRaw as Record<string, unknown>[])
        .map((b) => String(b.name || ""))
        .filter(Boolean)
        .concat(String((raw as Record<string, unknown>).brand || ""))
    )
  );
  const categoryOptions = Array.from(
    new Set(
      (categoriesRaw as Record<string, unknown>[])
        .map((c) => String(c.name || ""))
        .filter(Boolean)
        .concat(String((raw as Record<string, unknown>).category || ""))
    )
  );
  const finalBrandOptions = brandOptions.length > 0 ? brandOptions : ["Generic"];
  const finalCategoryOptions = Array.from(
    new Set(
      categoryOptions.length > 0
        ? categoryOptions
        : ["Kitchen Accessories", "Electronics", "Skin Care", "Makeup", "Hair Care", "Jewelry"]
    )
  );

  const p = raw as Record<string, unknown>;
  const categories = Array.isArray(p.categories)
    ? (p.categories as unknown[]).map(String).map((v) => v.trim()).filter(Boolean)
    : [];
  const mergedCategories = categories.length > 0 ? categories : [String(p.category || "").trim()].filter(Boolean);
  const product: IProduct = {
    _id: String(p._id),
    name: String(p.name),
    brand: String(p.brand || ""),
    category: String(p.category || ""),
    categories: mergedCategories,
    price: Number(p.price),
    description: String(p.description || ""),
    detail: String(p.detail || ""),
    sizes: Array.isArray(p.sizes) ? (p.sizes as string[]) : [],
    colors: Array.isArray(p.colors) ? (p.colors as string[]) : [],
    colorVariants: Array.isArray(p.colorVariants)
      ? (p.colorVariants as Record<string, unknown>[]).map((v) => ({
          color: String(v.color ?? "").trim(),
          images: Array.isArray(v.images) ? (v.images as unknown[]).map((u) => String(u)).filter(Boolean) : [],
        }))
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
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-widest mb-3">
          <Link href="/admin/products" className="hover:text-slate-300 transition-colors">
            Products
          </Link>
          <span>/</span>
          <span className="text-slate-400 truncate max-w-[200px]">{product.name}</span>
          <span>/</span>
          <span className="text-slate-400">Edit</span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Edit Product</h1>
        <p className="text-slate-400 text-sm mt-1 truncate">{product.name}</p>
      </div>

      <ProductForm
        mode="edit"
        initialData={product}
        brandOptions={finalBrandOptions}
        categoryOptions={finalCategoryOptions}
      />
    </div>
  );
}
