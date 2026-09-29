"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "./ImageUploader";
import RichTextEditor from "./RichTextEditor";
import type { ColorVariant, IProduct } from "@/types/product";

function newVariantRowKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Stable React key per row; must not depend on `color` or inputs remount every keystroke. */
type ColorVariantRow = ColorVariant & { _key: string };

function withStableRowKeys(variants: ColorVariant[]): ColorVariantRow[] {
  return variants.map((v) => ({ ...v, _key: newVariantRowKey() }));
}

function normalizeVariantsFromServer(data: IProduct): ColorVariant[] {
  const raw = data.colorVariants;
  if (Array.isArray(raw) && raw.length > 0) {
    const mapped = raw
      .map((v) => ({
        color: String(v.color ?? "").trim(),
        images: Array.isArray(v.images) ? v.images.map(String).filter(Boolean) : [],
      }))
      .filter((v) => v.color);
    if (mapped.length > 0) return mapped;
  }
  const colors = Array.isArray(data.colors) ? data.colors.map((c) => String(c).trim()).filter(Boolean) : [];
  const images = Array.isArray(data.images) ? data.images.map(String).filter(Boolean) : [];
  if (colors.length === 0) return [{ color: "", images: [] }];
  if (colors.length === 1) return [{ color: colors[0], images: [...images] }];
  if (images.length === colors.length) {
    return colors.map((c, i) => ({ color: c, images: images[i] ? [images[i]] : [] }));
  }
  return colors.map((c, i) => ({
    color: c,
    images: i === 0 ? [...images] : [],
  }));
}

interface ProductFormProps {
  initialData?: IProduct;
  mode: "create" | "edit";
  categoryOptions: string[];
}

export default function ProductForm({
  initialData,
  mode,
  categoryOptions,
}: ProductFormProps) {
  const router = useRouter();
  const fallbackCategory = categoryOptions[0] || "Kitchen Accessories";
  const emptyForm = {
    name: "",
    categories: [fallbackCategory],
    price: "" as unknown as number,
    description: "",
    detail: "",
    sizesInput: "",
    stockQuantity: 0,
    discount: 0,
    metaTitle: "",
    metaDescription: "",
    publish: false,
    isFeatured: false,
  };
  const [form, setForm] = useState(
    initialData
      ? {
          name: initialData.name,
          categories:
            Array.isArray(initialData.categories) && initialData.categories.length > 0
              ? initialData.categories
              : [initialData.category || fallbackCategory],
          price: initialData.price,
          description: initialData.description,
          detail: initialData.detail,
          sizesInput: initialData.sizes.join(", "),
          stockQuantity: initialData.stockQuantity,
          discount: initialData.discount,
          metaTitle: initialData.metaTitle,
          metaDescription: initialData.metaDescription,
          publish: initialData.status === "Published" || initialData.isActive,
          isFeatured: initialData.isFeatured === true,
        }
      : emptyForm
  );
  const [colorVariants, setColorVariants] = useState<ColorVariantRow[]>(() =>
    initialData
      ? withStableRowKeys(normalizeVariantsFromServer(initialData))
      : [{ color: "", images: [], _key: newVariantRowKey() }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const set = (key: keyof typeof form, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addCategory = (category: string) => {
    const normalized = category.trim();
    if (!normalized) return;
    setForm((prev) => {
      if (prev.categories.includes(normalized)) return prev;
      return { ...prev, categories: [...prev.categories, normalized] };
    });
    setCategoryInput("");
    setShowCategoryDropdown(false);
  };

  const removeCategory = (category: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== category),
    }));
  };

  const availableCategoryOptions = categoryOptions
    .filter((c) => !form.categories.includes(c))
    .filter((c) => c.toLowerCase().includes(categoryInput.trim().toLowerCase()))
    .slice(0, 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = colorVariants.map(({ color, images }) => ({
      color: color.trim(),
      images: images.map(String).filter(Boolean),
    }));
    const missingImages = trimmed.filter((v) => v.color && v.images.length === 0);
    if (missingImages.length > 0) {
      setError("Each color must have at least one image. Add images or remove empty color rows.");
      return;
    }
    const normalizedColorVariants = trimmed.filter((variant) => variant.color && variant.images.length > 0);

    if (normalizedColorVariants.length === 0) {
      setError("Please add at least one color with images.");
      return;
    }
    if (form.categories.length === 0) {
      setError("Please select at least one category.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const url =
        mode === "create" ? "/api/products" : `/api/products/${initialData!._id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const payload = {
        ...form,
        category: form.categories[0] || fallbackCategory,
        status: form.publish ? "Published" : "Draft",
        isActive: form.publish,
        isFeatured: form.isFeatured,
        sizes: form.sizesInput.split(",").map((s) => s.trim()).filter(Boolean),
        colorVariants: normalizedColorVariants,
        colors: normalizedColorVariants.map((variant) => variant.color),
        images: normalizedColorVariants.flatMap((variant) => variant.images),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product");

      router.push("/admin/products");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-500";
  const labelClass = "block text-slate-300 text-xs font-semibold uppercase tracking-widest mb-1.5";
  const updateVariant = (index: number, next: Partial<ColorVariant>) => {
    setColorVariants((prev) =>
      prev.map((variant, i) => (i === index ? { ...variant, ...next, _key: variant._key } : variant))
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5">
          Basic Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className={labelClass}>Product Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Velocity Runner Pro"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Categories * (type and press Enter)</label>
            <div className="rounded-lg border border-slate-600 bg-slate-900/40 p-3">
              <div className="mb-2 flex flex-wrap gap-2">
                {form.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 rounded-md bg-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-200"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => removeCategory(cat)}
                      className="text-indigo-100/80 hover:text-white"
                      aria-label={`Remove ${cat}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div
                className="relative"
                onMouseEnter={() => setShowCategoryDropdown(true)}
                onMouseLeave={() => setShowCategoryDropdown(false)}
              >
                <input
                  value={categoryInput}
                  onFocus={() => setShowCategoryDropdown(true)}
                  onChange={(e) => {
                    setCategoryInput(e.target.value);
                    setShowCategoryDropdown(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const exact = availableCategoryOptions.find(
                      (c) => c.toLowerCase() === categoryInput.trim().toLowerCase()
                    );
                    if (exact) {
                      addCategory(exact);
                      return;
                    }
                    if (availableCategoryOptions[0]) {
                      addCategory(availableCategoryOptions[0]);
                    }
                  }}
                  placeholder="Type category and press Enter"
                  className={inputClass}
                />
                {showCategoryDropdown && availableCategoryOptions.length > 0 ? (
                  <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-600 bg-slate-800 shadow-xl">
                    {availableCategoryOptions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => addCategory(c)}
                        className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              You can select multiple categories.
            </p>
          </div>

          <div>
            <label className={labelClass}>Price (PKR) *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", parseFloat(e.target.value))}
              placeholder="99.00"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Stock Quantity *</label>
            <input
              type="number"
              required
              min="0"
              value={form.stockQuantity}
              onChange={(e) => set("stockQuantity", Number(e.target.value || 0))}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Discount (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.discount}
              onChange={(e) => set("discount", Number(e.target.value || 0))}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Sizes (optional, comma separated)</label>
            <input
              value={form.sizesInput}
              onChange={(e) => set("sizesInput", e.target.value)}
              placeholder="7, 8, 9, 10"
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="publish" className="text-slate-300 text-xs font-semibold uppercase tracking-widest">
              Publish
            </label>
            <input
              id="publish"
              type="checkbox"
              checked={form.publish}
              onChange={(e) => set("publish", e.target.checked)}
              className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
            />
            <span className={`text-xs ${form.publish ? "text-green-300" : "text-amber-300"}`}>
              {form.publish ? "Published" : "Draft"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="isFeatured" className="text-slate-300 text-xs font-semibold uppercase tracking-widest">
              Featured Product
            </label>
            <input
              id="isFeatured"
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => set("isFeatured", e.target.checked)}
              className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Descriptions */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5">
          Descriptions
        </h2>
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Description * (max 1000 chars)</label>
            <textarea
              required
              rows={5}
              maxLength={1000}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief product summary shown in listings…"
              className={`${inputClass} resize-none`}
            />
            <p className="text-slate-500 text-xs mt-1">{form.description.length}/1000</p>
          </div>

          <div>
            <label className={labelClass}>Detail (Rich Text)</label>
            <RichTextEditor
              value={form.detail}
              onChange={(content) => set("detail", content)}
            />
          </div>
        </div>
      </div>

      {/* SEO Metadata */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5">
          SEO Metadata
        </h2>
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Meta Title (optional, max 60 chars)</label>
            <input
              type="text"
              maxLength={60}
              value={form.metaTitle}
              onChange={(e) => set("metaTitle", e.target.value)}
              placeholder="e.g. Non-Stick Frying Pan - Kitchen Essential"
              className={inputClass}
            />
            <p className="text-slate-500 text-xs mt-1">{form.metaTitle.length}/60</p>
          </div>

          <div>
            <label className={labelClass}>Meta Description (optional, max 160 chars)</label>
            <textarea
              rows={3}
              maxLength={160}
              value={form.metaDescription}
              onChange={(e) => set("metaDescription", e.target.value)}
              placeholder="e.g. A durable, easy-to-clean non-stick frying pan, perfect for everyday cooking."
              className={`${inputClass} resize-none`}
            />
            <p className="text-slate-500 text-xs mt-1">{form.metaDescription.length}/160</p>
          </div>
        </div>
      </div>

      {/* Color wise images */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5">
          Color Variants & Images
        </h2>
        <div className="space-y-6">
          {colorVariants.map((variant, index) => (
            <div key={variant._key} className="rounded-lg border border-slate-700 p-4">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="text"
                  required
                  value={variant.color}
                  onChange={(e) => updateVariant(index, { color: e.target.value })}
                  placeholder="Color name (e.g. Black)"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() =>
                    setColorVariants((prev) => prev.filter((_, i) => i !== index))
                  }
                  disabled={colorVariants.length === 1}
                  className="text-red-400 text-xs font-medium disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
              <ImageUploader
                initialUrls={variant.images}
                onChange={(urls) => updateVariant(index, { images: urls })}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setColorVariants((prev) => [...prev, { color: "", images: [], _key: newVariantRowKey() }])
            }
            className="text-indigo-400 text-sm font-medium"
          >
            + Add another color
          </button>
        </div>
      </div>

      {/* Error & Submit */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading
            ? "Saving…"
            : mode === "create"
            ? "Create Product"
            : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-slate-400 hover:text-slate-100 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
