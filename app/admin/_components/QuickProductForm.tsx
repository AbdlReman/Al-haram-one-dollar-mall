"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "./ImageUploader";
import { usdToPkr } from "@/lib/formatCurrency";
import type { IProduct } from "@/types/product";

interface QuickProductFormProps {
  initialData?: IProduct;
  mode: "create" | "edit";
  categoryOptions: string[];
}

export default function QuickProductForm({ initialData, mode, categoryOptions }: QuickProductFormProps) {
  const router = useRouter();
  const fallbackCategory = categoryOptions[0] || "";
  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState(initialData?.category || fallbackCategory);
  const [price, setPrice] = useState<number>(initialData?.price ?? usdToPkr(1));
  const [discount, setDiscount] = useState<number>(initialData?.discount || 0);
  const [images, setImages] = useState<string[]>(initialData?.images?.slice(0, 1) || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-500";
  const labelClass = "block text-slate-300 text-xs font-semibold uppercase tracking-widest mb-1.5";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category || !price || images.length === 0) {
      setError("Title, category, price, and an image are all required.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const url = mode === "create" ? "/api/products" : `/api/products/${initialData!._id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const payload = {
        productType: "quick",
        name: name.trim(),
        category,
        price: Number(price),
        discount: Number(discount || 0),
        image: images[0],
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product");

      router.push("/admin/quick-products");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-5">
        <div>
          <label className={labelClass}>Title *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Stainless Steel Peeler"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
            required
          >
            {categoryOptions.length === 0 ? <option value="">No categories yet</option> : null}
            {categoryOptions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Price (PKR) *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Discount % (optional)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value || 0))}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Image *</label>
          <ImageUploader initialUrls={images} onChange={setImages} max={1} />
        </div>
      </div>

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
          {loading ? "Saving…" : mode === "create" ? "Add Product" : "Save Changes"}
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
