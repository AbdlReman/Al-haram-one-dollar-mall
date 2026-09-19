"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/shop/Breadcrumbs";
import ProductRatingSummary from "@/components/shop/ProductRatingSummary";
import { RelatedProductsSection, RecentlyViewedSection } from "@/components/shop/ProductSections";
import type { CartItem, IProduct } from "@/types/product";
import { formatPkr } from "@/lib/formatCurrency";
import { pushRecentlyViewed, readRecentlyViewed, writeRecentlyViewed } from "@/lib/recentlyViewed";
import ProductReviewsPanel from "./ProductReviewsPanel";

function addToCart(
  product: IProduct,
  selectedColor: string,
  selectedImage: string,
  selectedSize: string,
  quantity: number,
  effectivePrice: number
) {
  const availableStock = Math.max(0, Math.floor(Number(product.stockQuantity || 0)));
  if (availableStock <= 0) return 0;

  const requestedQty = Math.max(1, Math.floor(quantity || 1));
  const existing = JSON.parse(localStorage.getItem("cart_items") || "[]") as CartItem[];
  const sizeKey = selectedSize || "";
  const cartProductQty = existing.reduce(
    (sum, item) => sum + (item.productId === product._id ? Math.max(1, Number(item.quantity || 1)) : 0),
    0
  );
  const qty = Math.min(requestedQty, Math.max(0, availableStock - cartProductQty));
  if (qty <= 0) return 0;

  const index = existing.findIndex(
    (item) =>
      item.productId === product._id &&
      (item.color || "") === (selectedColor || "") &&
      (item.size || "") === sizeKey
  );
  if (index >= 0) {
    existing[index] = {
      ...existing[index],
      quantity: Math.max(1, Number(existing[index].quantity || 1)) + qty,
      stockQuantity: availableStock,
    };
  } else {
    existing.push({
      productId: product._id,
      name: product.name,
      price: effectivePrice,
      image: selectedImage,
      quantity: qty,
      color: selectedColor,
      size: sizeKey,
      stockQuantity: availableStock,
    });
  }
  localStorage.setItem("cart_items", JSON.stringify(existing));
  window.dispatchEvent(new Event("cart_updated"));
  return qty;
}

function setCartToSingleItem(item: CartItem) {
  localStorage.setItem("cart_items", JSON.stringify([item]));
  window.dispatchEvent(new Event("cart_updated"));
}

function isCloudinary(url: string) {
  return url.startsWith("https://res.cloudinary.com/");
}

export default function ProductDetailClient({
  product,
  relatedProducts = [],
  siteUrl = "",
}: {
  product: IProduct;
  relatedProducts?: IProduct[];
  siteUrl?: string;
}) {
  const router = useRouter();
  const availableStock = Math.max(0, Number(product.stockQuantity || 0));
  const isOutOfStock = availableStock <= 0;
  const variants = useMemo(() => {
    if (product.colorVariants.length > 0) return product.colorVariants;
    if (product.colors.length > 0) {
      return product.colors.map((color) => ({ color, images: product.images }));
    }
    return [{ color: "Default", images: product.images }];
  }, [product.colorVariants, product.colors, product.images]);

  const [selectedColor, setSelectedColor] = useState(variants[0]?.color || "Default");
  const sizes = useMemo(
    () => (Array.isArray(product.sizes) ? product.sizes.map((s) => String(s).trim()).filter(Boolean) : []),
    [product.sizes]
  );
  const [selectedSize, setSelectedSize] = useState(() => sizes[0] || "");
  const maxSelectableQty = useMemo(() => {
    if (availableStock > 0) return Math.min(99, availableStock);
    return 1;
  }, [availableStock]);
  const [quantity, setQuantity] = useState(1);
  const hasDiscount = Number(product.discount || 0) > 0;
  const finalPrice = hasDiscount ? product.price * (1 - product.discount / 100) : product.price;

  const bumpQty = (delta: number) => {
    setQuantity((q) => {
      const next = q + delta;
      return Math.min(maxSelectableQty, Math.max(1, next));
    });
  };

  const lineQty = isOutOfStock ? 1 : Math.min(Math.max(1, quantity), maxSelectableQty);

  const allImages = useMemo(() => {
    const fromVariants = variants.flatMap((variant) => variant.images || []);
    const merged = [...fromVariants, ...product.images].filter(Boolean);
    return Array.from(new Set(merged));
  }, [variants, product.images]);

  const activeVariant = useMemo(
    () => variants.find((variant) => variant.color === selectedColor) || variants[0],
    [variants, selectedColor]
  );
  const colorImages = activeVariant?.images?.length ? activeVariant.images : product.images;
  const thumbImages = useMemo(() => {
    const primary = (colorImages.length ? colorImages : product.images).filter(Boolean);
    const rest = allImages.filter((u) => !primary.includes(u));
    return [...primary, ...rest];
  }, [colorImages, product.images, allImages]);

  const [selectedImage, setSelectedImage] = useState(colorImages[0] || allImages[0] || "");
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [recentEntries, setRecentEntries] = useState<
    { slug: string; name: string; image: string; brand: string; price: number; discount: number }[]
  >([]);

  const mainImage = selectedImage || colorImages[0] || allImages[0] || "";
  const imageIndex = Math.max(0, thumbImages.indexOf(mainImage));

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const nextVariant = variants.find((variant) => variant.color === color) || variants[0];
    const nextImages = nextVariant?.images?.length ? nextVariant.images : product.images;
    setSelectedImage(nextImages[0] || allImages[0] || "");
  };

  useEffect(() => {
    let cancelled = false;
    const previewImg = variants[0]?.images?.[0] || product.images[0] || "";
    pushRecentlyViewed(
      {
        slug: product.slug,
        name: product.name,
        image: previewImg,
        brand: product.brand,
        price: product.price,
        discount: product.discount,
      },
      product.slug
    );

    const syncRecentlyViewed = async () => {
      const storedEntries = readRecentlyViewed();
      const entries = storedEntries.filter((e) => e.slug !== product.slug);
      if (entries.length === 0) {
        if (!cancelled) setRecentEntries([]);
        return;
      }

      try {
        const params = new URLSearchParams({ slugs: entries.map((e) => e.slug).join(",") });
        const res = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to validate recently viewed products");
        const data = (await res.json()) as { products?: { slug?: string }[] };
        const activeSlugs = new Set((data.products || []).map((p) => String(p.slug || "")).filter(Boolean));
        const nextStoredEntries = storedEntries.filter((e) => e.slug === product.slug || activeSlugs.has(e.slug));
        const nextRecentEntries = nextStoredEntries.filter((e) => e.slug !== product.slug);

        writeRecentlyViewed(nextStoredEntries);
        if (!cancelled) setRecentEntries(nextRecentEntries);
      } catch {
        if (!cancelled) setRecentEntries(entries);
      }
    };

    void syncRecentlyViewed();

    return () => {
      cancelled = true;
    };
  }, [product._id, product.slug, product.name, product.brand, product.price, product.discount, product.images, variants]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showImagePreview) return;
      if (e.key === "ArrowLeft") {
        setSelectedImage((cur) => {
          const i = thumbImages.indexOf(cur);
          const next = i <= 0 ? thumbImages.length - 1 : i - 1;
          return thumbImages[next] || cur;
        });
      }
      if (e.key === "ArrowRight") {
        setSelectedImage((cur) => {
          const i = thumbImages.indexOf(cur);
          const next = i < 0 || i >= thumbImages.length - 1 ? 0 : i + 1;
          return thumbImages[next] || cur;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [thumbImages, showImagePreview]);

  const jsonLd = useMemo(() => {
    const images = thumbImages.filter(Boolean).slice(0, 8);
    const offerUrl = siteUrl ? `${siteUrl}/shop/${product.slug}` : `/shop/${product.slug}`;
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description || product.metaDescription,
      image: images,
      sku: product._id,
      brand: {
        "@type": "Brand",
        name: product.brand || "Store",
      },
      offers: {
        "@type": "Offer",
        url: offerUrl,
        priceCurrency: "PKR",
        price: Number(finalPrice.toFixed(2)),
        availability: `https://schema.org/${isOutOfStock ? "OutOfStock" : "InStock"}`,
      },
    };
  }, [product, thumbImages, siteUrl, finalPrice, isOutOfStock]);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...(product.category ? [{ label: product.category, href: `/shop?category=${encodeURIComponent(product.category)}` }] : []),
    { label: product.name },
  ];

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-[90rem] px-4 py-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={breadcrumbItems} className="text-neutral-600 [&_a]:text-black [&_a:hover]:underline" />
        </div>
      </header>

      <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Gallery */}
          <div className="flex flex-col gap-4 xl:flex-row xl:gap-5">
            <div className="order-2 flex gap-1 overflow-x-auto pb-1 xl:order-1 xl:w-16 xl:flex-col xl:overflow-y-auto xl:pb-0">
              {thumbImages.map((image, idx) => {
                const active = mainImage === image;
                return (
                  <button
                    key={`${image}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden border-2 xl:h-16 xl:w-full ${
                      active ? "border-black" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`View image ${idx + 1}`}
                    aria-current={active ? "true" : undefined}
                  >
                    {isCloudinary(image) ? (
                      <Image src={image} alt="" fill className="object-cover object-bottom" sizes="80px" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover object-bottom" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative order-1 min-w-0 flex-1 xl:order-2">
              <div
                className="relative aspect-[1/1.15] overflow-hidden bg-neutral-100"
                tabIndex={0}
                role="region"
                aria-label="Product gallery"
              >
                {hasDiscount ? (
                  <div className="absolute right-0 top-0 z-10 bg-[#e4002b] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    Sale −{Math.round(product.discount)}%
                  </div>
                ) : null}
                <div className="absolute left-0 top-0 z-10 flex flex-wrap gap-1">
                  <span className="bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    {isOutOfStock ? "Out of stock" : "In stock"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowImagePreview(true)}
                  className="relative block h-full w-full cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  aria-label={`Open ${product.name} fullscreen`}
                >
                  {mainImage ? (
                    // Width-fitted, bottom-anchored: never crops left/right; only the top is clipped when taller.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="absolute inset-x-0 bottom-0 block w-full h-auto"
                      fetchPriority="high"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-400">No image</div>
                  )}
                </button>

                {thumbImages.length > 1 ? (
                  <div className="pointer-events-none absolute bottom-2 right-2 bg-black px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
                    {imageIndex + 1}/{thumbImages.length}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Buy column */}
          <div className="flex flex-col">
            {product.brand ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600">{product.brand}</p>
            ) : null}
            <h1 className="mt-2 text-2xl font-black uppercase leading-tight tracking-tight text-black sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-6">
              <ProductRatingSummary productId={product._id} />
            </div>

            <div className="mt-6 flex flex-wrap items-baseline gap-3 border-b border-neutral-200 pb-6">
              {hasDiscount ? (
                <>
                  <span className="text-2xl font-black tabular-nums text-black sm:text-3xl">{formatPkr(finalPrice)}</span>
                  <span className="text-base text-neutral-400 line-through tabular-nums">{formatPkr(product.price)}</span>
                </>
              ) : (
                <span className="text-2xl font-black tabular-nums text-black sm:text-3xl">{formatPkr(product.price)}</span>
              )}
            </div>

            <p className="mt-6 text-sm leading-relaxed text-neutral-700">
              {product.description || "Quality construction and comfort for everyday wear."}
            </p>

            <div className="mt-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Color</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <button
                    key={`${product._id}-${variant.color}`}
                    type="button"
                    onClick={() => handleColorChange(variant.color)}
                    className={`min-h-10 border px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                      selectedColor === variant.color
                        ? "border-black bg-black text-white"
                        : "border-neutral-300 bg-white text-black hover:border-black"
                    }`}
                  >
                    {variant.color}
                  </button>
                ))}
              </div>
            </div>

            {sizes.length > 0 ? (
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Size</p>
                  <button
                    type="button"
                    onClick={() => setShowSizeChart(true)}
                    className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 underline hover:text-black"
                  >
                    Size chart
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={`${product._id}-size-${size}`}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`flex min-h-10 min-w-[2.75rem] items-center justify-center border text-xs font-bold ${
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-neutral-300 bg-white text-black hover:border-black"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Qty</p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center border border-neutral-300 bg-white">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => bumpQty(-1)}
                    disabled={quantity <= 1}
                    className="flex h-10 w-10 items-center justify-center text-lg font-bold text-black hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    −
                  </button>
                  <span className="min-w-[2.5rem] text-center text-sm font-bold tabular-nums">{lineQty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => bumpQty(1)}
                    disabled={isOutOfStock || quantity >= maxSelectableQty}
                    className="flex h-10 w-10 items-center justify-center text-lg font-bold text-black hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    +
                  </button>
                </div>
                {!isOutOfStock ? (
                  <span className="text-xs text-neutral-600">{availableStock} available</span>
                ) : null}
              </div>
            </div>

            <div className="mt-8 hidden flex-col gap-2 sm:flex-row lg:flex">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => {
                  if (isOutOfStock) return;
                  const qty = Math.max(1, Math.floor(lineQty || 1));
                  const addedQty = addToCart(product, selectedColor || "Default", mainImage, selectedSize, qty, finalPrice);
                  if (addedQty <= 0) {
                    toast.error("Stock limit reached", { description: `${availableStock} available` });
                    return;
                  }
                  setQuantity(1);
                  toast.success("Added to cart", {
                    description: `${product.name} · Qty ${addedQty}${selectedSize ? ` · Size ${selectedSize}` : ""}`,
                  });
                }}
                className="inline-flex min-h-12 flex-1 items-center justify-center bg-black px-6 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {isOutOfStock ? "Sold out" : "Add to cart"}
              </button>
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => {
                  if (isOutOfStock) return;
                  const qty = Math.max(1, Math.floor(lineQty || 1));
                  const line: CartItem = {
                    productId: product._id,
                    name: product.name,
                    price: finalPrice,
                    image: mainImage,
                    quantity: qty,
                    color: selectedColor || "Default",
                    size: selectedSize || "",
                    stockQuantity: availableStock,
                  };
                  setCartToSingleItem(line);
                  toast.success("Checkout", {
                    description: `${product.name} × ${qty}`,
                  });
                  router.push("/checkout");
                }}
                className="inline-flex min-h-12 flex-1 items-center justify-center border-2 border-black bg-white px-6 text-xs font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400"
              >
                {isOutOfStock ? "Sold out" : "Buy now"}
              </button>
            </div>
          </div>
        </div>

        {/* <section className="mt-14 grid gap-4 border-t border-neutral-200 pt-10 text-sm md:grid-cols-3">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-black">Shipping</h2>
            <p className="mt-2 leading-relaxed text-neutral-600">Standard and express options at checkout.</p>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-black">Returns</h2>
            <p className="mt-2 leading-relaxed text-neutral-600">Easy returns within policy. See terms at checkout.</p>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-black">Authentic</h2>
            <p className="mt-2 leading-relaxed text-neutral-600">Products sourced with quality you can trust.</p>
          </div>
        </section> */}

        <div className="mt-20">
          <TabbedProductSections productId={product._id} detailHtml={product.detail} productName={product.name} />
        </div>

        <RelatedProductsSection title="You may also like" products={relatedProducts} />

        <RecentlyViewedSection entries={recentEntries} />
      </div>

      {/* Mobile sticky purchase bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white p-3 lg:hidden">
        <div className="mx-auto flex max-w-[90rem] gap-2">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => {
              if (isOutOfStock) return;
              const qty = Math.max(1, Math.floor(lineQty || 1));
              const addedQty = addToCart(product, selectedColor || "Default", mainImage, selectedSize, qty, finalPrice);
              if (addedQty <= 0) {
                toast.error("Stock limit reached", { description: `${availableStock} available` });
                return;
              }
              setQuantity(1);
              toast.success("Added to cart", { description: `${product.name} · Qty ${addedQty}` });
            }}
            className="flex min-h-11 flex-1 items-center justify-center bg-black text-xs font-bold uppercase tracking-widest text-white disabled:bg-neutral-300"
          >
            {isOutOfStock ? "Sold out" : "Add to cart"}
          </button>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => {
              if (isOutOfStock) return;
              const qty = Math.max(1, Math.floor(lineQty || 1));
              setCartToSingleItem({
                productId: product._id,
                name: product.name,
                price: finalPrice,
                image: mainImage,
                quantity: qty,
                color: selectedColor || "Default",
                size: selectedSize || "",
                stockQuantity: availableStock,
              });
              router.push("/checkout");
            }}
            className="flex min-h-11 flex-1 items-center justify-center border-2 border-black bg-white text-xs font-bold uppercase tracking-widest text-black disabled:border-neutral-300 disabled:text-neutral-400"
          >
            Buy now
          </button>
        </div>
      </div>

      {showSizeChart && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/60" onClick={() => setShowSizeChart(false)} />
          <div className="fixed inset-0 z-[81] flex items-center justify-center p-4">
            <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
                <h2 className="text-sm font-black uppercase tracking-widest">Size Chart</h2>
                <button
                  type="button"
                  onClick={() => setShowSizeChart(false)}
                  className="text-neutral-500 hover:text-black"
                  aria-label="Close size chart"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col gap-8 p-5 sm:flex-row sm:gap-6">
                <SizeTable title="Men" rows={MEN_SIZES} />
                <SizeTable title="Women" rows={WOMEN_SIZES} />
              </div>
            </div>
          </div>
        </>
      )}

      {showImagePreview ? (
        <button
          type="button"
          className="fixed inset-0 z-[90] flex cursor-zoom-out items-center justify-center bg-black/90 p-4"
          onClick={() => setShowImagePreview(false)}
          aria-label="Close fullscreen image"
        >
          <span className="absolute right-4 top-4 border border-white px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
            Close
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mainImage}
            alt={product.name}
            className="max-h-[90vh] max-w-[92vw] bg-white object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </button>
      ) : null}
    </div>
  );
}

const MEN_SIZES = [
  ["38","5.5","6"],["39","6","6.5"],["40","6.5","7"],["40-41","7","7.5"],
  ["41","7","8"],["41-42","7.5","8.5"],["42","8","9"],["42-43","8.5","9.5"],
  ["43","9","10"],["43-44","10","10.5"],["44","10","11"],["44-45","10.5","11.5"],
  ["45","11","12"],["46","12","13"],["47","12.5","14"],["48","13.5","15"],["49","14","16"],
];

const WOMEN_SIZES = [
  ["35","2","4"],["35","2.5","4.5"],["35-36","3","5"],["36","3.5","5.5"],
  ["36-37","4","6"],["37","4.5","6.5"],["37-38","5","7"],["38","5.5","7.5"],
  ["38-39","6","8"],["39","6.5","8.5"],["39-40","7","9"],["40","7.5","9.5"],
  ["40-41","8","10"],["41","8.5","10.5"],["41-42","9","11"],["42","9.5","11.5"],["42-43","10","12"],
];

function SizeTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="flex-1">
      <p className="mb-2 text-xs font-black uppercase tracking-widest text-black">{title}</p>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b-2 border-black">
            {["Euro Size", "UK/PAK Size", "US Size"].map((h) => (
              <th key={h} className="py-2 px-2 text-left text-[10px] font-black uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-neutral-100 even:bg-neutral-50">
              {row.map((cell, j) => (
                <td key={j} className="py-2 px-2 tabular-nums">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabbedProductSections({
  productId,
  detailHtml,
  productName,
}: {
  productId: string;
  detailHtml: string;
  productName: string;
}) {
  const [tab, setTab] = useState<"details" | "reviews">("details");
  const tabBtn = (active: boolean) =>
    `border-b-2 pb-3 text-xs font-black uppercase tracking-widest ${
      active ? "border-black text-black" : "border-transparent text-neutral-500 hover:text-black"
    }`;
  return (
    <div className="border border-neutral-300 bg-white p-5 sm:p-8">
      <div className="flex gap-8 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setTab("details")}
          className={tabBtn(tab === "details")}
          aria-selected={tab === "details"}
          role="tab"
        >
          Description
        </button>
        <button
          type="button"
          onClick={() => setTab("reviews")}
          className={tabBtn(tab === "reviews")}
          aria-selected={tab === "reviews"}
          role="tab"
        >
          Reviews
        </button>
      </div>

      <div className="mt-6" role="tabpanel">
        {tab === "details" ? (
          detailHtml ? (
            <div
              className="prose prose-neutral prose-sm max-w-none prose-headings:font-semibold prose-p:text-neutral-600"
              dangerouslySetInnerHTML={{ __html: detailHtml }}
            />
          ) : (
            <p className="text-neutral-600 leading-relaxed">
              Detailed specifications for {productName} will appear here when provided.
            </p>
          )
        ) : (
          <ProductReviewsPanel productId={productId} />
        )}
      </div>
    </div>
  );
}
