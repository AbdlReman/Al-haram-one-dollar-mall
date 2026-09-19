import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Review from "@/models/Review";
import Product from "@/models/Product";
import { generateEditToken } from "@/lib/reviewToken";

function serializeReview(doc: Record<string, unknown>) {
  return {
    _id: String(doc._id),
    productId: String(doc.productId),
    authorName: String(doc.authorName || ""),
    rating: Number(doc.rating),
    body: String(doc.body || ""),
    createdAt: doc.createdAt ? String(doc.createdAt) : "",
    updatedAt: doc.updatedAt ? String(doc.updatedAt) : "",
  };
}

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get("productId");
    if (!productId || !mongoose.isValidObjectId(productId)) {
      return NextResponse.json({ error: "Valid productId is required" }, { status: 400 });
    }
    await connectDB();
    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({
      reviews: reviews.map((r) => serializeReview(r as Record<string, unknown>)),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productId = String(body.productId || "");
    const authorName = String(body.authorName || "").trim();
    const rating = Number(body.rating);
    const reviewBody = String(body.body || "").trim();

    if (!mongoose.isValidObjectId(productId)) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }
    if (!authorName || authorName.length > 80) {
      return NextResponse.json({ error: "Please enter your name (max 80 characters)." }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }
    if (!reviewBody || reviewBody.length > 2000) {
      return NextResponse.json({ error: "Please write a review (max 2000 characters)." }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findById(productId).select("_id").lean();
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const editToken = generateEditToken();
    const created = await Review.create({
      productId,
      authorName,
      rating,
      body: reviewBody,
      editToken,
    });

    const plain = created.toObject() as Record<string, unknown>;
    return NextResponse.json({
      review: serializeReview(plain),
      editToken,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
