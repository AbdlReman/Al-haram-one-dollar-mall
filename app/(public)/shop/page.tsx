import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import { serializeProductFromLean } from "@/lib/serializeProduct";
import Product from "@/models/Product";
import type { IProduct } from "@/types/product";
import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop | Skin Care, Makeup, Electronics, Kitchen Accessories & More",
  description:
    "Browse Al Haram One Dollar Mall's full collection — Skin Care, Makeup, Hair Care, Electronics, Kitchen Accessories & Jewelry. Visit Bangla Chowk, Mamu Kanjan or order online.",
  keywords: [
    "shop one dollar mall",
    "skin care products",
    "makeup online",
    "hair care products",
    "electronics accessories",
    "kitchen accessories",
    "jewelry shop",
    "Bangla Chowk Mamu Kanjan",
  ],
  alternates: { canonical: "https://onedollar.alharamstore.com/shop" },
  openGraph: {
    title: "Shop | Al Haram One Dollar Mall",
    description:
      "Skin Care, Makeup, Hair Care, Electronics, Kitchen Accessories & Jewelry — all at unbeatable prices.",
    url: "https://onedollar.alharamstore.com/shop",
  },
};

export default async function ShopPage() {
  await connectDB();
  const raw = await Product.find({
    isActive: true,
    $or: [{ status: "Published" }, { status: { $exists: false } }],
  })
    .sort({ createdAt: -1 })
    .lean();
  const products: IProduct[] = (raw as Record<string, unknown>[]).map((p) => serializeProductFromLean(p));

  return <ShopClient products={products} />;
}
