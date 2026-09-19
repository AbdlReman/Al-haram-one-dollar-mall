import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import Brand from "@/models/Brand";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const brand = await Brand.findByIdAndUpdate(
      id,
      {
        name: String(body.name || "").trim(),
        isActive: body.isActive !== false,
      },
      { new: true, runValidators: true }
    ).lean();
    if (!brand) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidatePath("/admin/products/new");
    const b = brand as Record<string, unknown>;
    return NextResponse.json({ brand: { ...b, _id: String(b._id) } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update brand";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    await Brand.findByIdAndDelete(id);
    revalidatePath("/admin/products/new");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/brands/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete brand" }, { status: 500 });
  }
}
