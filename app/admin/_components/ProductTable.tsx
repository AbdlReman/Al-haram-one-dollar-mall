"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { IProduct } from "@/types/product";
import { formatPkr } from "@/lib/formatCurrency";

interface ProductTableProps {
  products: IProduct[];
}

export default function ProductTable({ products }: ProductTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingAll, setPublishingAll] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "outOfStock" | "draft" | "sale">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublishAllDrafts = async () => {
    if (!confirm("Publish all draft products?")) return;
    setPublishingAll(true);
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publishAllDrafts" }),
      });
      if (!res.ok) throw new Error("Failed to publish drafts");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Unable to publish all drafts right now.");
    } finally {
      setPublishingAll(false);
    }
  };

  const draftCount = useMemo(
    () => products.filter((product) => product.status !== "Published").length,
    [products]
  );

  const filteredProducts = useMemo(() => {
    if (filter === "active") return products.filter((product) => product.status === "Published");
    if (filter === "outOfStock") return products.filter((product) => product.stockQuantity <= 0);
    if (filter === "draft") return products.filter((product) => product.status !== "Published");
    if (filter === "sale") return products.filter((product) => Number(product.discount || 0) > 0);
    return products;
  }, [products, filter]);

  const searchedProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return filteredProducts;
    return filteredProducts.filter((product) =>
      [
        product.name,
        product.brand,
        product.category,
        ...(Array.isArray(product.categories) ? product.categories : []),
        product.slug,
      ]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(term))
    );
  }, [filteredProducts, search]);

  const totalPages = Math.max(1, Math.ceil(searchedProducts.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = searchedProducts.slice((currentPage - 1) * perPage, currentPage * perPage);

  if (products.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-16 text-center">
        <p className="text-5xl mb-4">📦</p>
        <p className="text-slate-400 font-medium mb-2">No products yet</p>
        <p className="text-slate-500 text-sm mb-6">Add your first product to get started.</p>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          Add Product
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "outOfStock", label: "Out of Stock" },
            { key: "draft", label: "Draft" },
            { key: "sale", label: "Sale" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setFilter(item.key as "all" | "active" | "outOfStock" | "draft" | "sale");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
                filter === item.key
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {draftCount > 0 && (
          <button
            type="button"
            onClick={handlePublishAllDrafts}
            disabled={publishingAll}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {publishingAll ? "Publishing..." : `Publish All (${draftCount})`}
          </button>
        )}
      </div>
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search products by name, brand, category..."
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-700/60 text-slate-400 text-xs uppercase tracking-widest">
              <th className="text-left px-4 py-3">Image</th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Brand</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Price</th>
              <th className="text-left px-4 py-3">Stock</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {paginatedProducts.map((product) => (
              <tr key={product._id} className="hover:bg-slate-700/30 transition-colors">
                {/* Image */}
                <td className="px-4 py-3">
                  {product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg border border-slate-600"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center text-lg">
                      👟
                    </div>
                  )}
                </td>

                {/* Name */}
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-100 max-w-[180px] truncate">{product.name}</p>
                  <p className="text-slate-500 text-xs">{product.colors.join(", ")}</p>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      product.status === "Published"
                        ? "bg-emerald-900/60 text-emerald-300"
                        : "bg-amber-900/60 text-amber-300"
                    }`}
                  >
                    {product.status === "Published" ? "Published" : "Draft"}
                  </span>
                </td>

                {/* Brand */}
                <td className="px-4 py-3">
                  <span className="bg-slate-700 text-slate-300 text-xs font-bold px-2 py-1 rounded">
                    {product.brand}
                  </span>
                </td>

                {/* Category */}
                <td className="px-4 py-3 text-slate-400">
                  {Array.isArray(product.categories) && product.categories.length > 0
                    ? product.categories.join(", ")
                    : product.category}
                </td>

                {/* Price */}
                <td className="px-4 py-3">
                  <p className="font-bold text-white">{formatPkr(product.price)}</p>
                  <p className="text-slate-500 text-xs">Discount {product.discount}%</p>
                </td>

                {/* Stock */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.stockQuantity > 0
                        ? "bg-green-900/60 text-green-300"
                        : "bg-red-900/60 text-red-300"
                    }`}
                  >
                    {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of Stock"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/products/${product._id}/edit`}
                      className="text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/products/${product._id}/preview`}
                      target="_blank"
                      className="text-slate-300 hover:text-slate-100 text-xs font-medium transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id, product.name)}
                      disabled={deletingId === product._id}
                      className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {deletingId === product._id ? "…" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-xs text-slate-400">
        <p>
          Showing {searchedProducts.length === 0 ? 0 : (currentPage - 1) * perPage + 1}-
          {Math.min(currentPage * perPage, searchedProducts.length)} of {searchedProducts.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            className="rounded-md border border-slate-600 px-3 py-1.5 text-slate-200 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-slate-300">
            Page {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-slate-600 px-3 py-1.5 text-slate-200 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
