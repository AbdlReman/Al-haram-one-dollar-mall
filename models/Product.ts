import mongoose, { Schema } from "mongoose";

const ProductSchema = new Schema(
  {
    productType: { type: String, enum: ["quick", "detail"], default: "detail" },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    categories: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: "", maxlength: 1000 },
    detail: { type: String, default: "" },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    colorVariants: {
      type: [
        {
          color: { type: String, required: true, trim: true },
          images: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    images: { type: [String], default: [] },
    discount: { type: Number, min: 0, max: 100, default: 0 },
    metaTitle: { type: String, trim: true, maxlength: 70, default: "" },
    metaDescription: { type: String, trim: true, maxlength: 170, default: "" },
    popularityScore: { type: Number, min: 0, default: 0 },
    soldCount: { type: Number, min: 0, default: 0 },
    inStock: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ["Draft", "Published"], default: "Draft" },
    slug: { type: String, unique: true },
  },
  { timestamps: true }
);

ProductSchema.pre("save", async function () {
  if (this.isModified("name") || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
});

const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
export default Product;
