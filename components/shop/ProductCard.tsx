"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import type { IProduct } from "@/types/product";
import { formatPkr } from "@/lib/formatCurrency";
import { addToCart } from "@/lib/cart";

/** Puma-style sale red */
const SALE_RED = "#e4002b";

function cardPrice(product: IProduct) {
  const hasDiscount = Number(product.discount || 0) > 0;
  const finalPrice = hasDiscount ? product.price * (1 - product.discount / 100) : product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - finalPrice / Math.max(product.price, 1)) * 100)
    : 0;
  return { hasDiscount, finalPrice, discountPercent };
}

export default function ProductCard({
  product,
  onOpenImage,
  priority,
}: {
  product: IProduct;
  onOpenImage?: (src: string, alt: string) => void;
  priority?: boolean;
}) {
  const [selectedColor] = useState(product.colorVariants[0]?.color || product.colors[0] || "");
  const activeVariant =
    product.colorVariants.find((variant) => variant.color === selectedColor) || product.colorVariants[0];
  const mainImage = activeVariant?.images?.[0] || product.images[0] || "";
  const displayColor = selectedColor || product.colors[0] || "";
  const { hasDiscount, finalPrice, discountPercent } = cardPrice(product);
  const isQuick = product.productType === "quick";
  const outOfStock = !product.inStock || Number(product.stockQuantity) <= 0;

  const handleQuickAdd = () => {
    const added = addToCart(product, displayColor || "Default", mainImage, "", 1, finalPrice);
    if (added <= 0) {
      toast.error("Out of stock", { description: product.name });
      return;
    }
    toast.success("Added to cart", { description: product.name });
  };

  const media = (
    <div className="relative aspect-[1/1.15]">
      {outOfStock ? (
        <span className="absolute left-2 top-2 z-10 bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          Out of stock
        </span>
      ) : null}
      {hasDiscount ? (
        <span
          className="absolute right-2 top-2 z-10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
          style={{ backgroundColor: SALE_RED }}
        >
          −{discountPercent}%
        </span>
      ) : null}
      {onOpenImage && mainImage ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onOpenImage(mainImage, product.name);
          }}
          className="absolute bottom-2 right-2 z-10 border border-black/10 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-black opacity-0 transition-opacity group-hover:opacity-100"
          aria-label={`Enlarge ${product.name}`}
        >
          View
        </button>
      ) : null}
      {mainImage ? (
        // Width-fitted, bottom-anchored: never crops left/right; only the top is clipped when taller.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mainImage}
          alt={product.name}
          className="absolute inset-x-0 bottom-0 block w-full h-auto"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-neutral-400">
          No image
        </div>
      )}
    </div>
  );

  const titleRow = (
    <div className="flex items-start justify-between gap-2">
      <h3 className="text-[13px] font-semibold leading-snug tracking-tight text-black line-clamp-1">
        {product.name}
      </h3>
      <span className="shrink-0 text-[13px] font-semibold tabular-nums text-black">
        {formatPkr(finalPrice)}
      </span>
    </div>
  );

  return (
    <article className="group flex h-full flex-col">
      {isQuick ? (
        <div className="relative block overflow-hidden bg-neutral-100">{media}</div>
      ) : (
        <Link
          href={`/shop/${product.slug}`}
          className="relative block overflow-hidden bg-neutral-100 outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          {media}
        </Link>
      )}

      <div className="mt-2 flex flex-1 flex-col">
        {!isQuick ? (
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">
            {Math.max(1, product.colors?.length || 1)} color{(product.colors?.length || 1) > 1 ? "s" : ""}
          </p>
        ) : null}
        {isQuick ? (
          <div className="mt-1 block">{titleRow}</div>
        ) : (
          <Link href={`/shop/${product.slug}`} className="mt-1 block">
            {titleRow}
          </Link>
        )}
        {!isQuick ? (
          <p className="mt-0.5 text-[12px] text-neutral-600 line-clamp-1">
            {displayColor || "Sneakers"}
          </p>
        ) : null}
        {hasDiscount ? (
          <p className="mt-0.5 text-[11px] text-neutral-400 line-through tabular-nums">{formatPkr(product.price)}</p>
        ) : null}
        {isQuick ? (
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={outOfStock}
            className="mt-2 w-full border border-black bg-black py-2 text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-300"
          >
            {outOfStock ? "Sold out" : "Add to cart"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
