import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const category = await Category.findByIdAndUpdate(
      id,
      {
        name: String(body.name || "").trim(),
        isActive: body.isActive !== false,
      },
      { new: true, runValidators: true }
    ).lean();
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const c = category as Record<string, unknown>;
    return NextResponse.json({ category: { ...c, _id: String(c._id) } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update category";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    await Category.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
