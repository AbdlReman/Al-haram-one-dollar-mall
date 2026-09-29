import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

/** Distinct category names that have at least one active, published product. */
export async function GET() {
  try {
    await connectDB();
    const distinct = await Product.distinct("categories", {
      isActive: true,
      $or: [{ status: "Published" }, { status: { $exists: false } }],
    });
    const categories = Array.from(
      new Set((distinct as unknown[]).map((c) => String(c || "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET /api/categories/with-products error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
