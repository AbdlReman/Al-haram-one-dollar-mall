"use client";

import Link from "next/link";
import type { IProduct } from "@/types/product";
import ProductCard from "./ProductCard";

export function RelatedProductsSection({
  title,
  products,
}: {
  title: string;
  products: IProduct[];
}) {
  if (!products.length) return null;

  return (
    <section className="mt-16 border-t border-neutral-200 pt-12" aria-labelledby="related-heading">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <h2 id="related-heading" className="text-lg font-black uppercase tracking-tight text-black sm:text-xl">
          {title}
        </h2>
        <Link
          href="/shop"
          className="text-xs font-bold uppercase tracking-widest text-black underline decoration-1 underline-offset-4 hover:no-underline"
        >
          Shop all
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p, idx) => (
          <ProductCard key={p._id} product={p} priority={idx < 2} />
        ))}
      </div>
    </section>
  );
}

export function RecentlyViewedSection({
  entries,
}: {
  entries: {
    slug: string;
    name: string;
    image: string;
    price: number;
    discount: number;
  }[];
}) {
  if (!entries.length) return null;

  return (
    <section className="mt-16 border-t border-neutral-200 pt-12" aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="mb-8 text-lg font-black uppercase tracking-tight text-black sm:text-xl">
        Recently viewed
      </h2>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {entries.map((e) => {
          const productLike = {
            _id: `recent-${e.slug}`,
            name: e.name,
            category: "",
            price: e.price,
            description: "",
            detail: "",
            sizes: [],
            colors: [],
            colorVariants: [{ color: "Classic", images: e.image ? [e.image] : [] }],
            stockQuantity: 0,
            images: e.image ? [e.image] : [],
            discount: e.discount,
            inStock: true,
            isActive: true,
            isFeatured: false,
            status: "Published" as const,
            popularityScore: 0,
            soldCount: 0,
            slug: e.slug,
            metaTitle: "",
            metaDescription: "",
            createdAt: "",
            updatedAt: "",
          } satisfies IProduct;

          return <ProductCard key={e.slug} product={productLike} />;
        })}
      </div>
    </section>
  );
}
