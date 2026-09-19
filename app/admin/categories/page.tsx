import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import TaxonomyManager from "../_components/TaxonomyManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await connectDB();
  const raw = await Category.find({}).sort({ name: 1 }).lean();
  const categories = (raw as Record<string, unknown>[]).map((c) => ({
    _id: String(c._id),
    name: String(c.name || ""),
    isActive: c.isActive !== false,
  }));

  return <TaxonomyManager title="Categories" apiBase="/api/categories" initialItems={categories} />;
}
