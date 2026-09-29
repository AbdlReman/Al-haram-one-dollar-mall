import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatPkr } from "@/lib/formatCurrency";
import { connectDB } from "@/lib/mongodb";
import { serializeProductFromLean } from "@/lib/serializeProduct";
import Product from "@/models/Product";
import type { IProduct } from "@/types/product";
import ProductCard from "@/components/shop/ProductCard";

export const metadata: Metadata = {
  title: "Al Haram One Dollar Mall | Skin Care, Makeup, Electronics & Kitchen Accessories",
  description:
    "Al Haram One Dollar Mall — shop Skin Care, Makeup, Hair Care, Electronics, Kitchen Accessories & Jewelry at unbeatable prices. Visit Bangla Chowk, Mamu Kanjan near Bab-e-Arqam School, or order online.",
  keywords: [
    "Al Haram One Dollar Mall",
    "one dollar shop",
    "Bangla Chowk Mamu Kanjan",
    "skin care products",
    "makeup online",
    "hair care products",
    "electronics accessories",
    "kitchen accessories",
    "jewelry shop",
  ],
  alternates: { canonical: "https://onedollar.alharamstore.com" },
  openGraph: {
    title: "Al Haram One Dollar Mall | Skin Care, Makeup, Electronics & Kitchen Accessories",
    description:
      "Skin Care, Makeup, Hair Care, Electronics, Kitchen Accessories & Jewelry — all at unbeatable prices.",
    url: "https://onedollar.alharamstore.com",
    images: [{ url: "/images/hero.jpg", width: 1200, height: 630, alt: "Al Haram One Dollar Mall" }],
  },
};

const categories = [
  { name: "Kitchen Accessories", desc: "Our most popular department", bg: "bg-black", text: "text-white" },
  { name: "Electronics", desc: "Handy gadgets & accessories", bg: "bg-gray-100", text: "text-black" },
  { name: "Skin Care", desc: "Everyday beauty essentials", bg: "bg-gray-900", text: "text-white" },
  { name: "Makeup", desc: "Look good for less", bg: "bg-gray-100", text: "text-black" },
  { name: "Hair Care", desc: "For healthy, happy hair", bg: "bg-black", text: "text-white" },
  { name: "Jewelry", desc: "Affordable everyday sparkle", bg: "bg-gray-100", text: "text-black" },
];

export const dynamic = "force-dynamic";

const cardBgClasses = ["bg-gray-100", "bg-red-50", "bg-blue-50", "bg-orange-50"];

function featuredCardData(product: IProduct, index: number) {
  const discount = Number(product.discount || 0);
  const hasDiscount = discount > 0;
  const salePrice = hasDiscount ? product.price * (1 - discount / 100) : product.price;
  const originalPrice = hasDiscount ? product.price : product.price;
  return {
    id: product._id,
    name: product.name,
    price: salePrice,
    originalPrice,
    color: product.colors?.[0] || "",
    bg: cardBgClasses[index % cardBgClasses.length],
    image: product.images?.[0] || "/images/1.webp",
    slug: product.slug,
    hasDiscount,
  };
}

export default async function HomePage() {
  await connectDB();
  const rawFeatured = await Product.find({
    isFeatured: true,
    isActive: true,
    $or: [{ status: "Published" }, { status: { $exists: false } }],
  })
    .sort({ createdAt: -1 })
    .limit(4)
    .lean();
  const featuredProducts = (rawFeatured as Record<string, unknown>[])
    .map((p) => serializeProductFromLean(p))
    .map((p, idx) => featuredCardData(p, idx));

  const rawLatest = await Product.find({
    isActive: true,
    $or: [{ status: "Published" }, { status: { $exists: false } }],
  })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();
  const latestProducts: IProduct[] = (rawLatest as Record<string, unknown>[]).map((p) =>
    serializeProductFromLean(p)
  );

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-black text-white overflow-hidden min-h-[60vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800" style={{backgroundImage: 'url(/images/hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.75}} />

        {/* Decorative circle */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-gray-800 opacity-30" />
        <div className="absolute right-20 top-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full border border-gray-700 opacity-20" />

        <div className="relative max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-white mb-4 animate-fade-in-up text-4xl md:text-6xl font-black uppercase tracking-tight">
              Al Haram One Dollar Mall
            </h1>
            <p className="text-gray-100 text-base md:text-lg mb-3 leading-relaxed">
              Everyday essentials at unbeatable prices, all under one roof.
            </p>
            <p className="text-gray-200 text-sm md:text-base max-w-2xl mx-auto mb-10">
              Skin Care, Makeup, Hair Care, Electronics, Kitchen Accessories & Jewelry.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/shop?category=Kitchen Accessories" className="btn-primary">
                SHOP KITCHEN ACCESSORIES
              </Link>
              <Link
                href="/shop"
                className="btn-outline border-white bg-white/10 !text-white shadow-white/10 hover:bg-white hover:!text-black transition duration-200"
              >
                SHOP ALL PRODUCTS
              </Link>
            </div>
          </div>
        </div>

 
      </section>

      {/* Category Strip */}
      <section className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-8">Shop by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/shop?category=${encodeURIComponent(cat.name)}`}
              className={`${cat.bg} ${cat.text} group relative overflow-hidden h-56 flex flex-col justify-end p-8 hover:opacity-90 transition-opacity`}
            >
              <span className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">
                {cat.desc}
              </span>
              <h3 className="text-3xl font-black uppercase tracking-tight">
                {cat.name}
              </h3>
              <span className="mt-4 text-xs font-bold uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Curated For You</p>
            <h2 className="text-4xl font-black uppercase tracking-tight">Featured Drops</h2>
          </div>
          <Link href="/shop" className="text-xs font-bold uppercase tracking-widest hover:opacity-60 transition-opacity flex items-center gap-2">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <Link key={product.id} href={`/shop/${product.slug}`} className="product-card group cursor-pointer">
              {/* Image placeholder */}
              <div className={`${product.bg} aspect-[1/1.15] overflow-hidden mb-4 relative`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="absolute inset-x-0 bottom-0 block w-full h-auto product-img"
                  loading="lazy"
                  decoding="async"
                />
                {product.hasDiscount ? (
                  <span className="absolute top-3 right-3 z-10 bg-red-600 text-white text-xs font-bold px-2 py-1">
                    SALE
                  </span>
                ) : null}
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wide mb-1">{product.name}</h3>
                <p className="text-gray-500 text-xs mb-2">{product.color}</p>
                <div className="flex items-center gap-3">
                  <span className="font-black text-lg">{formatPkr(product.price)}</span>
                  {product.hasDiscount ? (
                    <>
                      <span className="text-gray-400 line-through text-sm">{formatPkr(product.originalPrice)}</span>
                      <span className="text-red-600 text-xs font-bold">
                        -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Products */}
      {latestProducts.length > 0 ? (
        <section className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Fresh In</p>
              <h2 className="text-4xl font-black uppercase tracking-tight">Latest Products</h2>
            </div>
            <Link href="/shop" className="text-xs font-bold uppercase tracking-widest hover:opacity-60 transition-opacity flex items-center gap-2">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {latestProducts.map((product, idx) => (
              <ProductCard key={product._id} product={product} priority={idx < 4} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Full-width Banner */}
      <section
        className="relative text-white py-16 text-center overflow-hidden"
        style={{ backgroundImage: "url(/images/hero.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-slate-900/75" />
        <div className="relative z-10 px-4">
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-6">
          EVERYTHING YOU NEED, ONE DOLLAR MALL
        </h2>
        <p className="text-slate-200 mb-10 max-w-xl mx-auto">
          Visit us at Bangla Chowk, Mamu Kanjan near Bab-e-Arqam School, or order online at 0334-2743554.
        </p>
        <Link href="/shop" className="btn-primary">
          Shop the Sale
        </Link>
        </div>
      </section>

      {/* Why Us */}
      <section className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Why Al Haram One Dollar Mall</p>
          <h2 className="text-4xl font-black uppercase tracking-tight">The Difference</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { icon: "✓", title: "Quality Checked", desc: "Every product is checked before it reaches our shelves." },
            { icon: "🏷", title: "Unbeatable Prices", desc: "Everyday essentials at prices that keep more money in your pocket." },
            { icon: "⚡", title: "Easy Ordering", desc: "Visit our Bangla Chowk store or order online at 0334-2743554." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black">
                {icon}
              </div>
              <h3 className="font-black uppercase tracking-tight text-xl mb-3">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
              <Image
                src="/images/01.JPG"
                alt="Inside Al Haram One Dollar Mall"
                fill
                sizes="(min-width: 1024px) 22vw, 45vw"
                className="object-cover"
              />
            </div>
            <div className="mt-8 grid gap-4">
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Image
                  src="/images/03.JPG"
                  alt="Al Haram One Dollar Mall store"
                  fill
                  sizes="(min-width: 1024px) 22vw, 45vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Image
                  src="/images/05.JPG"
                  alt="Al Haram One Dollar Mall store"
                  fill
                  sizes="(min-width: 1024px) 22vw, 45vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Who We Are</p>
            <h2 className="text-4xl font-black uppercase tracking-tight mb-6">More Than Just a Store</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Al Haram One Dollar Mall brings Skin Care, Makeup, Hair Care, Electronics, Kitchen Accessories
              and Jewelry together under one roof — every item checked for quality and priced for everyday budgets.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              Visit us in-store at Bangla Chowk, Mamu Kanjan near Bab-e-Arqam School, or shop online anytime.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center justify-center border-2 border-black bg-black px-8 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black"
            >
              Our Story →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
