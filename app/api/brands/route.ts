import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import Brand from "@/models/Brand";

export async function GET() {
  try {
    await connectDB();
    const brands = await Brand.find({}).sort({ name: 1 }).lean();
    const serialized = brands.map((b: Record<string, unknown>) => ({
      ...b,
      _id: String(b._id),
      createdAt: String(b.createdAt),
      updatedAt: String(b.updatedAt),
    }));
    return NextResponse.json({ brands: serialized });
  } catch (error) {
    console.error("GET /api/brands error:", error);
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const brand = await Brand.create({
      name: String(body.name || "").trim(),
      isActive: body.isActive !== false,
    });
    revalidatePath("/admin/products/new");
    return NextResponse.json(
      { brand: { ...brand.toObject(), _id: String(brand._id) } },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create brand";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
