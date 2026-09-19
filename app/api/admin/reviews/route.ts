import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Review from "@/models/Review";
import Product from "@/models/Product";
import { isAdmin } from "@/lib/isAdmin";

function serializeReview(doc: Record<string, unknown>, productName?: string) {
  return {
    _id: String(doc._id),
    productId: String(doc.productId),
    productName: productName ?? "",
    authorName: String(doc.authorName || ""),
    rating: Number(doc.rating),
    body: String(doc.body || ""),
    createdAt: doc.createdAt ? String(doc.createdAt) : "",
    updatedAt: doc.updatedAt ? String(doc.updatedAt) : "",
  };
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const reviews = await Review.find({})
      .sort({ createdAt: -1 })
      .populate("productId", "name")
      .lean();

    const out = reviews.map((raw) => {
      const doc = raw as Record<string, unknown>;
      const pop = doc.productId as { _id?: unknown; name?: string } | null;
      const productId =
        pop && typeof pop === "object" && "_id" in pop ? String(pop._id) : String(doc.productId ?? "");
      const name =
        pop && typeof pop === "object" && "name" in pop ? String((pop as { name?: string }).name || "") : "";
      return serializeReview({ ...doc, productId }, name);
    });

    return NextResponse.json({ reviews: out });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const productId = String(body.productId || "");
    const authorName = String(body.authorName || "").trim();
    const rating = Number(body.rating);
    const reviewBody = String(body.body || "").trim();

    if (!mongoose.isValidObjectId(productId)) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }
    if (!authorName) {
      return NextResponse.json({ error: "Author name is required." }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1–5." }, { status: 400 });
    }
    if (!reviewBody) {
      return NextResponse.json({ error: "Review text is required." }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findOne({
      _id: productId,
      isActive: true,
      $or: [{ status: "Published" }, { status: { $exists: false } }],
    })
      .select("_id name")
      .lean();
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const created = await Review.create({
      productId,
      authorName,
      rating,
      body: reviewBody,
    });

    const plain = created.toObject() as Record<string, unknown>;
    return NextResponse.json({
      review: serializeReview(plain, String((product as { name?: string }).name || "")),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
