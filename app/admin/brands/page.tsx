import { connectDB } from "@/lib/mongodb";
import Brand from "@/models/Brand";
import TaxonomyManager from "../_components/TaxonomyManager";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  await connectDB();
  const raw = await Brand.find({}).sort({ name: 1 }).lean();
  const brands = (raw as Record<string, unknown>[]).map((b) => ({
    _id: String(b._id),
    name: String(b.name || ""),
    isActive: b.isActive !== false,
  }));

  return <TaxonomyManager title="Brands" apiBase="/api/brands" initialItems={brands} />;
}
