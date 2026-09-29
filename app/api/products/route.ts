import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

function parseCsv(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function normalizeCategories(input: unknown, fallbackCategory: unknown): string[] {
  if (Array.isArray(input)) {
    const fromArray = input.map(String).map((v) => v.trim()).filter(Boolean);
    if (fromArray.length > 0) return Array.from(new Set(fromArray));
  }
  const one = String(fallbackCategory || "").trim();
  return one ? [one] : [];
}

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

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const slugs = parseCsv(searchParams.get("slugs"));
    const size = searchParams.get("size");
    const color = searchParams.get("color");
    const minPrice = Number(searchParams.get("minPrice") || 0);
    const maxPrice = Number(searchParams.get("maxPrice") || Number.MAX_SAFE_INTEGER);
    const sort = searchParams.get("sort") || "latest";

    const query: Record<string, unknown> = {
      isActive: true,
      $or: [{ status: "Published" }, { status: { $exists: false } }],
    };
    if (slugs.length > 0) query.slug = { $in: slugs };
    if (category) {
      query.$and = [
        {
          $or: [
            { category },
            { categories: category },
          ],
        },
      ];
    }
    if (size) query.sizes = size;
    if (color) query.colors = color;
    if (search) query.name = { $regex: search, $options: "i" };
    query.price = { $gte: minPrice, $lte: maxPrice };

    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "priceLow") sortQuery = { price: 1 };
    if (sort === "priceHigh") sortQuery = { price: -1 };
    if (sort === "popular") sortQuery = { popularityScore: -1, soldCount: -1 };

    const products = await Product.find(query).sort(sortQuery).lean();
    const serialized = products.map((p: Record<string, unknown>) => ({
      ...p,
      _id: String(p._id),
      createdAt: String(p.createdAt),
      updatedAt: String(p.updatedAt),
    }));
    return NextResponse.json({ products: serialized });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

const UNLIMITED_STOCK = 100000;

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const productType = body.productType === "quick" ? "quick" : "detail";

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
      const product = new Product({
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
        metaTitle: "",
        metaDescription: "",
        inStock: true,
        isActive: true,
        isFeatured: false,
        status: "Published",
      });
      await product.save();
      return NextResponse.json(
        { product: { ...product.toObject(), _id: String(product._id) } },
        { status: 201 }
      );
    }

    const colorVariants = normalizeColorVariants(body.colorVariants);
    const colors =
      colorVariants.length > 0
        ? colorVariants.map((v) => v.color)
        : Array.isArray(body.colors)
        ? body.colors
        : parseCsv(body.colors);
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
    const product = new Product({
      productType: "detail",
      name: body.name,
      price: Number(body.price || 0),
      description: body.description || "",
      detail: body.detail || "",
      category: primaryCategory,
      categories,
      sizes: Array.isArray(body.sizes) ? body.sizes : parseCsv(body.sizes),
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
    });
    await product.save();
    return NextResponse.json(
      { product: { ...product.toObject(), _id: String(product._id) } },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/products error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    if (body?.action !== "publishAllDrafts") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const result = await Product.updateMany(
      { status: "Draft" },
      { $set: { status: "Published", isActive: true } }
    );
    return NextResponse.json({ updatedCount: result.modifiedCount || 0 });
  } catch (error: unknown) {
    console.error("PATCH /api/products error:", error);
    const msg = error instanceof Error ? error.message : "Failed to publish draft products";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
