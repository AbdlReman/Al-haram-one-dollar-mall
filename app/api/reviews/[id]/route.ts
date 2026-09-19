import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Review from "@/models/Review";
import { isAdmin } from "@/lib/isAdmin";

type Params = { params: Promise<{ id: string }> };

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

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid review" }, { status: 400 });
    }
    const body = await req.json();
    const authorName = String(body.authorName ?? "").trim();
    const rating = Number(body.rating);
    const reviewBody = String(body.body ?? "").trim();
    const editToken = typeof body.editToken === "string" ? body.editToken.trim() : "";

    if (!authorName || authorName.length > 80) {
      return NextResponse.json({ error: "Name is required (max 80 characters)." }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }
    if (!reviewBody || reviewBody.length > 2000) {
      return NextResponse.json({ error: "Review text is required (max 2000 characters)." }, { status: 400 });
    }

    await connectDB();
    const admin = await isAdmin();
    const review = await Review.findById(id).select("+editToken").lean();
    if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const r = review as { editToken?: string | null };
    if (!admin) {
      if (!r.editToken || editToken !== r.editToken) {
        return NextResponse.json({ error: "You can only edit your own review from this device." }, { status: 403 });
      }
    }

    const updated = await Review.findByIdAndUpdate(
      id,
      { $set: { authorName, rating, body: reviewBody } },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ review: serializeReview(updated as Record<string, unknown>) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid review" }, { status: 400 });
    }
    const editToken = req.nextUrl.searchParams.get("editToken")?.trim() || "";

    await connectDB();
    const admin = await isAdmin();
    const review = await Review.findById(id).select("+editToken").lean();
    if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const r = review as { editToken?: string | null };
    if (!admin) {
      if (!r.editToken || editToken !== r.editToken) {
        return NextResponse.json({ error: "You can only delete your own review from this device." }, { status: 403 });
      }
    }

    await Review.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
