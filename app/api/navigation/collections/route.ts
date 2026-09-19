import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET() {
  try {
    await connectDB();

    const raw = await Product.find({
      isActive: true,
      $or: [{ status: "Published" }, { status: { $exists: false } }],
    })
      .select("category categories")
      .lean();

    const set = new Set<string>();
    for (const p of raw as Array<Record<string, unknown>>) {
      const category = String(p.category || "").trim();
      if (category) set.add(category);

      if (Array.isArray(p.categories)) {
        for (const c of p.categories) {
          const v = String(c || "").trim();
          if (v) set.add(v);
        }
      }
    }

    const excluded = new Set(["men", "women"]);
    const categories = Array.from(set)
      .filter((c) => !excluded.has(c.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET /api/navigation/collections error:", error);
    return NextResponse.json({ categories: [] }, { status: 200 });
  }
}
