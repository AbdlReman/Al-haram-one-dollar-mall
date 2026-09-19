import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

const BASE_URL = "https://onedollar.alharamstore.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();
  const products = await Product.find(
    { isActive: true, $or: [{ status: "Published" }, { status: { $exists: false } }] },
    { slug: 1, updatedAt: 1 }
  ).lean();

  const productUrls: MetadataRoute.Sitemap = (products as { slug: string; updatedAt?: Date }[]).map((p) => ({
    url: `${BASE_URL}/shop/${p.slug}`,
    lastModified: p.updatedAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/shop`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...productUrls,
  ];
}
