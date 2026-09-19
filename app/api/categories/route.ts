import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    const serialized = categories.map((c: Record<string, unknown>) => ({
      ...c,
      _id: String(c._id),
      createdAt: String(c.createdAt),
      updatedAt: String(c.updatedAt),
    }));
    return NextResponse.json({ categories: serialized });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const category = await Category.create({
      name: String(body.name || "").trim(),
      isActive: body.isActive !== false,
    });
    return NextResponse.json(
      { category: { ...category.toObject(), _id: String(category._id) } },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create category";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
