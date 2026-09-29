"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Breadcrumbs from "@/components/shop/Breadcrumbs";
import ProductCard from "@/components/shop/ProductCard";
import type { IProduct } from "@/types/product";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SORTS = [
  { value: "latest", label: "Newest" },
  { value: "priceLow", label: "Price: Low to high" },
  { value: "priceHigh", label: "Price: High to low" },
  { value: "popular", label: "Popular" },
];


const filterInputClass =
  "w-full border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-black outline-none " +
  "placeholder:text-neutral-400 focus:border-neutral-500";

const labelClass = "mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500";
const dropdownButtonClass =
  "flex w-full items-center justify-between gap-2 border border-neutral-200 bg-white px-3 py-2 text-left text-xs font-medium text-black outline-none transition-colors hover:border-neutral-400 focus:border-black";

function categoriesOf(product: IProduct): string[] {
  if (Array.isArray(product.categories) && product.categories.length > 0) {
    return product.categories.map(String).map((v) => v.trim()).filter(Boolean);
  }
  return product.category ? [product.category] : [];
}

/** Category names come from several sources (hardcoded links, free-text admin entry, DB
 * aggregation) so matching is done case/whitespace-insensitively to avoid silently dropping
 * the filter when casing differs. */
function normalizeCategoryKey(value: string): string {
  return value.trim().toLowerCase();
}

type DropdownOption = {
  value: string;
  label: string;
};

function FilterDropdown({
  id,
  label,
  value,
  options,
  onChange,
  className = "",
  labelClassName = labelClass,
}: {
  id: string;
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  className?: string;
  labelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <label id={`${id}-label`} className={labelClassName}>
        {label}
      </label>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}`}
        className={dropdownButtonClass}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <span className="truncate">{selected?.label || "Select"}</span>
        <svg
          className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-labelledby={`${id}-label`}
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-y-auto border border-neutral-300 bg-white py-1 shadow-xl"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs font-semibold transition-colors ${
                  active ? "bg-black text-white" : "text-neutral-800 hover:bg-neutral-100"
                }`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="truncate">{option.label}</span>
                {active ? <span className="text-[10px]">Selected</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function ShopClient({ products }: { products: IProduct[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const requestedCategory = searchParams.get("category");
  const saleOnly = searchParams.get("sale") === "true";
  const qParam = searchParams.get("q") || "";

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) {
      for (const c of categoriesOf(p)) {
        const key = normalizeCategoryKey(c);
        if (key && !seen.has(key)) seen.set(key, c);
      }
    }
    const rest = Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
    return ["All", ...rest];
  }, [products]);
  const sizes = useMemo(() => {
    const rest = Array.from(new Set(products.flatMap((p) => p.sizes).map(String))).sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb) && a === String(na) && b === String(nb)) return na - nb;
      return a.localeCompare(b, undefined, { numeric: true });
    });
    return ["All", ...rest];
  }, [products]);
  const colors = useMemo(() => {
    const rest = Array.from(new Set(products.flatMap((p) => p.colors).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
    return ["All", ...rest];
  }, [products]);

  const category = useMemo(() => {
    if (!requestedCategory) return "All";
    const key = normalizeCategoryKey(requestedCategory);
    const match = categories.find((c) => c !== "All" && normalizeCategoryKey(c) === key);
    return match || "All";
  }, [requestedCategory, categories]);

  const [size, setSize] = useState("All");
  const [color, setColor] = useState("All");
  const [search, setSearch] = useState(qParam);
  const [sort, setSort] = useState("latest");
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => { setSearch(qParam); }, [qParam]);

  const setCategory = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "All") params.delete("category");
    else params.set("category", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const setSizeFilter = (v: string) => { setSize(v); };
  const setColorFilter = (v: string) => { setColor(v); };
  const setSearchFilter = (v: string) => { setSearch(v); };
  const setSortFilter = (v: string) => { setSort(v); };

  const filtered = useMemo(() => {
    const categoryKey = normalizeCategoryKey(category);
    return products
      .filter((p) => category === "All" || categoriesOf(p).some((c) => normalizeCategoryKey(c) === categoryKey))
      .filter((p) => !saleOnly || Number(p.discount || 0) > 0)
      .filter((p) => size === "All" || p.sizes.includes(size))
      .filter((p) => color === "All" || p.colors.includes(color))
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sort === "priceLow" || sort === "priceHigh") {
          const fa = a.price * (1 - Number(a.discount || 0) / 100);
          const fb = b.price * (1 - Number(b.discount || 0) / 100);
          return sort === "priceLow" ? fa - fb : fb - fa;
        }
        if (sort === "popular") return b.popularityScore - a.popularityScore;
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      });
  }, [products, category, saleOnly, size, color, search, sort]);

  const resetFilters = () => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
      setSize("All");
      setColor("All");
      setSearch("");
      setSort("latest");
    });
  };

  const activeFilters =
    (category !== "All" ? 1 : 0) +
    (saleOnly ? 1 : 0) +
    (size !== "All" ? 1 : 0) +
    (color !== "All" ? 1 : 0) +
    (search.trim() !== "" ? 1 : 0);

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-neutral-200 bg-black text-white">
        <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs
            className="text-neutral-400 [&_a]:text-white [&_a:hover]:underline [&_span]:text-neutral-500"
            items={[
              { label: "Home", href: "/" },
              { label: "Shop" },
            ]}
          />
          <h1 className="mt-6 max-w-4xl text-2xl font-black uppercase tracking-tight sm:text-5xl lg:text-6xl">
            EVERYTHING YOU NEED, ONE DOLLAR MALL
          </h1>
          <p className="mt-2 text-sm text-neutral-400">{filtered.length} products</p>
        </div>
      </header>

      <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">

        {/* ── Mobile: filter button + sort dropdown in one row ── */}
        <div className="mb-4 flex items-center gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex shrink-0 items-center gap-1.5 border border-neutral-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-black"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filters
            {activeFilters > 0 && (
              <span className="flex h-4 w-4 items-center justify-center bg-black text-[10px] font-black text-white">
                {activeFilters}
              </span>
            )}
          </button>
          <FilterDropdown
            id="mob-sort"
            label="Sort"
            value={sort}
            options={SORTS}
            onChange={(v) => startTransition(() => setSortFilter(v))}
            className="flex-1"
            labelClassName="sr-only"
          />
        </div>

        {/* ── Mobile filter popup ── */}
        {mobileFiltersOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 sm:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white px-4 pb-8 pt-4 shadow-2xl sm:hidden">
              <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
                <h2 className="text-sm font-black uppercase tracking-wide">Filters</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="text-neutral-500"
                  aria-label="Close filters"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label htmlFor="filter-search-mob" className={labelClass}>Search</label>
                  <input
                    id="filter-search-mob"
                    value={search}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search"
                    className={filterInputClass}
                  />
                </div>
                <FilterDropdown id="filter-category-mob" label="Category" value={category} options={categories.map((v) => ({ value: v, label: v }))} onChange={setCategory} />
                <FilterDropdown id="filter-size-mob" label="Size" value={size} options={sizes.map((v) => ({ value: v, label: v }))} onChange={setSizeFilter} />
                <FilterDropdown id="filter-color-mob" label="Color" value={color} options={colors.map((v) => ({ value: v, label: v }))} onChange={setColorFilter} />
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => { resetFilters(); setMobileFiltersOpen(false); }}
                  className="flex-1 border border-black px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 bg-black px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white"
                >
                  Show results
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Desktop: full inline filter bar ── */}
        <div className="mb-8 hidden border border-neutral-200 bg-white p-4 sm:block">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-neutral-100 pb-2.5">
            <h2 className="text-sm font-black uppercase tracking-wide">Filters</h2>
            {activeFilters > 0 ? (
              <button
                type="button"
                onClick={resetFilters}
                className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 underline"
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-end gap-2.5">
            <div className="min-w-[11rem] flex-1 sm:flex-none sm:w-[14rem]">
              <label htmlFor="filter-search" className={labelClass}>Search</label>
              <input
                id="filter-search"
                value={search}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search"
                className={filterInputClass}
              />
            </div>
            <FilterDropdown
              id="filter-category"
              label="Category"
              value={category}
              options={categories.map((v) => ({ value: v, label: v }))}
              onChange={setCategory}
              className="min-w-[9rem] flex-1 sm:flex-none sm:w-[10rem]"
            />
            <FilterDropdown
              id="filter-size"
              label="Size"
              value={size}
              options={sizes.map((v) => ({ value: v, label: v }))}
              onChange={setSizeFilter}
              className="min-w-[7rem] flex-1 sm:flex-none sm:w-[8rem]"
            />
            <FilterDropdown
              id="filter-color"
              label="Color"
              value={color}
              options={colors.map((v) => ({ value: v, label: v }))}
              onChange={setColorFilter}
              className="min-w-[8rem] flex-1 sm:flex-none sm:w-[9rem]"
            />
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-600" aria-live="polite">
              {filtered.length} products
              {category !== "All" ? ` · ${category}` : ""}
              {saleOnly ? " · Sale" : ""}
            </p>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <FilterDropdown
                id="shop-sort-main"
                label="Sort"
                value={sort}
                options={SORTS}
                onChange={(value) =>
                  startTransition(() => {
                    setSortFilter(value);
                  })
                }
                className="hidden sm:block sm:min-w-[12rem]"
                labelClassName="sr-only"
              />
              <Link
                href="/cart"
                className="inline-flex items-center justify-center border border-black bg-black px-4 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 sm:min-w-[7rem]"
              >
                Cart
              </Link>
            </div>
          </div>

          <div>
            {filtered.length === 0 ? (
              <div className="border border-dashed border-neutral-300 px-6 py-16 text-center">
                <p className="text-sm font-bold uppercase tracking-wide text-black">No products found</p>
                <p className="mt-2 text-sm text-neutral-600">Try changing filters or search.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 border border-black bg-black px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map((product, idx) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onOpenImage={(src, alt) => setPreviewImage({ src, alt })}
                    priority={idx < 4}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewImage ? (
        <button
          type="button"
          className="fixed inset-0 z-[90] flex cursor-zoom-out items-center justify-center bg-black/85 p-4"
          onClick={() => setPreviewImage(null)}
          aria-label="Close preview"
        >
          <span
            className="absolute right-4 top-4 border border-white px-3 py-1 text-sm font-bold uppercase tracking-wider text-white"
            onClick={(e) => e.stopPropagation()}
          >
            Close
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage.src}
            alt={previewImage.alt}
            className="max-h-[90vh] max-w-[92vw] bg-white object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </button>
      ) : null}
    </div>
  );
}
