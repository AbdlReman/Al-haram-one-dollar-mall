import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

type Params = { params: Promise<{ id: string }> };

function normalizeColorVariants(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .map((variant) => {
      const v = variant as { color?: unknown; images?: unknown };
      return {
        color: String(v.color || "").trim(),
        images: Array.isArray(v.images)
          ? v.images.map((img) => String(img)).filter(Boolean)
          : [],
      };
    })
    .filter((v) => v.color);
}

function normalizeCategories(input: unknown, fallbackCategory: unknown): string[] {
  if (Array.isArray(input)) {
    const fromArray = input.map(String).map((v) => v.trim()).filter(Boolean);
    if (fromArray.length > 0) return Array.from(new Set(fromArray));
  }
  const one = String(fallbackCategory || "").trim();
  return one ? [one] : [];
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await Product.findById(id).lean();
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const p = product as Record<string, unknown>;
    return NextResponse.json({
      product: { ...p, _id: String(p._id), createdAt: String(p.createdAt), updatedAt: String(p.updatedAt) },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

const UNLIMITED_STOCK = 100000;

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const productType = body.productType === "quick" ? "quick" : "detail";

    let payload: Record<string, unknown>;
    if (productType === "quick") {
      const name = String(body.name || "").trim();
      const category = String(body.category || "").trim();
      const price = Number(body.price || 0);
      const image = String(body.image || "").trim();
      if (!name || !category || !price || !image) {
        return NextResponse.json(
          { error: "Title, category, price, and image are required" },
          { status: 400 }
        );
      }
      payload = {
        productType: "quick",
        name,
        price,
        description: "",
        detail: "",
        category,
        categories: [category],
        sizes: [],
        colors: ["Default"],
        colorVariants: [{ color: "Default", images: [image] }],
        stockQuantity: UNLIMITED_STOCK,
        images: [image],
        discount: Number(body.discount || 0),
        inStock: true,
        isActive: true,
        isFeatured: false,
        status: "Published",
      };
    } else {
      const colorVariants = normalizeColorVariants(body.colorVariants);
      const colors =
        colorVariants.length > 0
          ? colorVariants.map((v) => v.color)
          : Array.isArray(body.colors)
          ? body.colors
          : [];
      const images =
        colorVariants.flatMap((v) => v.images).filter(Boolean).length > 0
          ? colorVariants.flatMap((v) => v.images).filter(Boolean)
          : Array.isArray(body.images)
          ? body.images
          : [];
      if (!String(body.description || "").trim()) {
        return NextResponse.json({ error: "Description is required" }, { status: 400 });
      }
      const publish = body.publish === true || body.status === "Published" || body.isActive === true;
      const nextStatus = publish ? "Published" : "Draft";
      const categories = normalizeCategories(body.categories, body.category);
      const primaryCategory = categories[0] || "";
      const isFeatured = body.isFeatured === true;
      payload = {
        productType: "detail",
        name: body.name,
        price: Number(body.price || 0),
        description: body.description || "",
        detail: body.detail || "",
        category: primaryCategory,
        categories,
        sizes: Array.isArray(body.sizes) ? body.sizes : [],
        colors,
        colorVariants,
        stockQuantity: Number(body.stockQuantity || 0),
        images,
        discount: Number(body.discount || 0),
        metaTitle: body.metaTitle || "",
        metaDescription: body.metaDescription || "",
        inStock: Number(body.stockQuantity || 0) > 0,
        isActive: publish,
        isFeatured,
        status: nextStatus,
      };
    }
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: payload },
      {
        new: true,
        runValidators: true,
      }
    ).lean();
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const p = product as Record<string, unknown>;
    return NextResponse.json({
      product: { ...p, _id: String(p._id), createdAt: String(p.createdAt), updatedAt: String(p.updatedAt) },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
