import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | Al Haram One Dollar Mall",
  description:
    "Al Haram One Dollar Mall — your one dollar shop for Skin Care, Makeup, Hair Care, Electronics, Kitchen Accessories & Jewelry. Visit us at Bangla Chowk, Mamu Kanjan near Bab-e-Arqam School.",
  alternates: { canonical: "https://onedollar.alharamstore.com/about" },
  openGraph: {
    title: "About Al Haram One Dollar Mall",
    description:
      "Learn about Al Haram One Dollar Mall — a one dollar shop for everyday essentials at Bangla Chowk, Mamu Kanjan.",
    url: "https://onedollar.alharamstore.com/about",
  },
};

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-black text-white min-h-[60vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            {" / "}About
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight leading-none mb-8">
                Our
                <br />
                <span className="text-gray-500">Story</span>
              </h1>
              <div className="space-y-4 text-gray-400 text-lg leading-relaxed max-w-lg">
                <p>Al Haram One Dollar Mall was built on a simple idea: everyday essentials shouldn&apos;t cost a fortune.</p>
                <p>
                  From Skin Care and Makeup to Hair Care, Electronics, Kitchen Accessories and Jewelry — we stock a
                  huge variety of everyday items under one roof, all at unbeatable prices.
                </p>
                <p>Visit us in-store at Bangla Chowk, Mamu Kanjan near Bab-e-Arqam School, or order online.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["6+", "PRODUCT CATEGORIES"],
                ["QUALITY", "CHECKED ITEMS"],
                ["AFFORDABLE", "EVERYDAY PRICING"],
                ["NEW STOCK", "REGULARLY"],
              ].map(([num, label]) => (
                <div key={label} className="border border-gray-800 p-6">
                  <p className="text-2xl md:text-3xl font-black mb-2">{num}</p>
                  <p className="text-gray-500 text-xs uppercase tracking-widest">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Our Mission</p>
            <h2 className="text-4xl font-black uppercase tracking-tight mb-6">
              Style For Everyone
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              We believe that everyday essentials should be affordable for everyone.
              Our mission is to bring a huge variety of Skin Care, Makeup, Hair Care,
              Electronics, Kitchen Accessories and Jewelry together in one store, at
              prices that won&apos;t break the bank.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              Every product on our shelves is checked before it&apos;s listed. We&apos;re not
              just selling items — we&apos;re building a store our community can rely on for
              quality, variety, and value.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center border-2 border-black bg-black px-8 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black"
            >
              Shop the Collection
            </Link>
          </div>

          {/* Values */}
          <div className="space-y-6">
            {[
              {
                title: "Quality Checked",
                desc: "Every product is carefully checked before it goes on our shelves.",
              },
              {
                title: "Huge Variety",
                desc: "Skin Care, Makeup, Hair Care, Electronics, Kitchen Accessories and Jewelry, all in one place.",
              },
              {
                title: "Community Focused",
                desc: "Built for our neighborhood at Bangla Chowk, Mamu Kanjan. New stock added regularly.",
              },
            ].map(({ title, desc }, i) => (
              <div key={title} className="flex gap-5">
                <div className="w-10 h-10 bg-black text-white rounded-full flex-shrink-0 flex items-center justify-center font-black text-sm">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight text-lg mb-1">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-20 text-center">
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-6">
          Ready to Shop?
        </h2>
        <p className="text-gray-400 mb-10 max-w-md mx-auto">
          Browse our latest Skin Care, Makeup, Electronics, Kitchen Accessories & more.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/shop" className="btn-primary">
            Shop Now
          </Link>
          <Link href="/contact" className="btn-outline border-white text-white hover:bg-white hover:text-black">
            Get in Touch
          </Link>
        </div>
      </section>
    </div>
  );
}
