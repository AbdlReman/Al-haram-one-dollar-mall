"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const LINKS_BEFORE_SHOP = [
  { href: "/", label: "Home" },
  { href: "/shop?category=Kitchen Accessories", label: "Kitchen Accessories" },
];

const LINKS_AFTER_SHOP = [
  { href: "/shop?sale=true", label: "Sale" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const shopRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [cartCount, setCartCount] = useState(0);
  const [shopCategories, setShopCategories] = useState<string[]>([]);
  const activeCategory = searchParams.get("category") || "";
  const saleActive = searchParams.get("sale") === "true";

  useEffect(() => {
    const sync = () => {
      const items = JSON.parse(localStorage.getItem("cart_items") || "[]");
      const count = items.reduce((sum: number, i: { quantity: number }) => sum + Number(i.quantity || 0), 0);
      setCartCount(count);
    };
    sync();
    window.addEventListener("cart_updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cart_updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories/with-products")
      .then((res) => res.json())
      .then((data: { categories?: string[] }) => {
        if (cancelled) return;
        const categories = (data.categories || []).filter(
          (c) => c.trim().toLowerCase() !== "kitchen accessories"
        );
        setShopCategories(categories);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!shopOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!shopRef.current?.contains(event.target as Node)) setShopOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [shopOpen]);

  const isHome = pathname === "/";
  const isKitchen = pathname === "/shop" && activeCategory.toLowerCase() === "kitchen accessories";
  const isShop =
    pathname === "/shop" && !saleActive && activeCategory.toLowerCase() !== "kitchen accessories";
  const isSale = pathname === "/shop" && saleActive;

  const linkClass = (active: boolean) =>
    `nav-link text-zinc-100 hover:text-white transition-colors ${active ? "border-b-2 border-zinc-200" : ""}`;

  const isActiveLink = (label: string, href: string) => {
    if (label === "Home") return isHome;
    if (label === "Kitchen Accessories") return isKitchen;
    if (label === "Sale") return isSale;
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
      {/* Top promo bar */}
      <div className="bg-white text-zinc-900 text-center py-1.5 text-xs font-bold tracking-widest uppercase border-b border-zinc-200">
        Visit Bangla Chowk, Mamu Kanjan | Order Online: 0334-2743554
      </div>

      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/images/logo.png"
              alt="Al Haram One Dollar Mall"
              width={260}
              height={64}
              className="h-14 w-auto max-w-[min(15rem,46vw)] object-contain object-left"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {LINKS_BEFORE_SHOP.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={linkClass(isActiveLink(link.label, link.href))}
              >
                {link.label}
              </Link>
            ))}

            {/* Shop dropdown */}
            <div ref={shopRef} className="relative">
              <button
                type="button"
                onClick={() => setShopOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={shopOpen}
                className={`nav-link flex items-center gap-1 text-zinc-100 hover:text-white transition-colors ${
                  isShop ? "border-b-2 border-zinc-200" : ""
                }`}
              >
                Shop
                <svg
                  className={`w-3 h-3 transition-transform ${shopOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {shopOpen && (
                <div className="absolute left-0 top-full z-50 mt-3 w-60 bg-zinc-900 py-2 shadow-xl ring-1 ring-zinc-700">
                  <Link
                    href="/shop"
                    onClick={() => setShopOpen(false)}
                    className="block px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
                  >
                    All Products
                  </Link>
                  <div className="my-1 border-t border-zinc-800" />
                  {shopCategories.length === 0 ? (
                    <p className="px-4 py-2 text-xs text-zinc-500">No categories yet</p>
                  ) : (
                    shopCategories.map((cat) => (
                      <Link
                        key={cat}
                        href={`/shop?category=${encodeURIComponent(cat)}`}
                        onClick={() => setShopOpen(false)}
                        className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                      >
                        {cat}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {LINKS_AFTER_SHOP.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={linkClass(isActiveLink(link.label, link.href))}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-5">
            {/* Search */}
            <div className="relative flex items-center">
              <button
                aria-label="Search"
                className="hover:opacity-70 transition-opacity text-zinc-100"
                onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>

              {searchOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSearchOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-3 w-64 bg-zinc-900 shadow-xl ring-1 ring-zinc-700">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const q = searchQuery.trim();
                        setSearchOpen(false);
                        setSearchQuery("");
                        router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
                      }}
                      className="flex items-center gap-2 px-3 py-2.5"
                    >
                      <svg className="w-4 h-4 shrink-0 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                      </svg>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products..."
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
                      />
                    </form>
                  </div>
                </>
              )}
            </div>

            {/* Cart */}
            <Link href="/cart" aria-label="Cart" className="relative hover:opacity-70 transition-opacity text-zinc-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-zinc-100 text-zinc-900 text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden hover:opacity-70 transition-opacity text-zinc-100"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>


      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950">
          <nav className="flex flex-col px-4 py-4 gap-4">
            {LINKS_BEFORE_SHOP.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`nav-link text-sm py-1 text-zinc-100 hover:text-white transition-colors ${
                  isActiveLink(link.label, link.href) ? "border-b-2 border-zinc-200 w-fit" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Shop (expandable) */}
            <div>
              <button
                type="button"
                onClick={() => setMobileShopOpen((o) => !o)}
                aria-expanded={mobileShopOpen}
                className="flex w-full items-center justify-between text-left"
              >
                <span
                  className={`nav-link text-sm py-1 text-zinc-100 ${
                    isShop ? "border-b-2 border-zinc-200 w-fit" : ""
                  }`}
                >
                  Shop
                </span>
                <svg
                  className={`w-3 h-3 text-zinc-400 transition-transform ${mobileShopOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mobileShopOpen && (
                <div className="mt-3 ml-3 flex flex-col gap-3 border-l border-zinc-800 pl-3">
                  <Link
                    href="/shop"
                    onClick={() => { setMenuOpen(false); setMobileShopOpen(false); }}
                    className="text-sm text-zinc-300 hover:text-white transition-colors"
                  >
                    All Products
                  </Link>
                  {shopCategories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/shop?category=${encodeURIComponent(cat)}`}
                      onClick={() => { setMenuOpen(false); setMobileShopOpen(false); }}
                      className="text-sm text-zinc-300 hover:text-white transition-colors"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {LINKS_AFTER_SHOP.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`nav-link text-sm py-1 text-zinc-100 hover:text-white transition-colors ${
                  isActiveLink(link.label, link.href) ? "border-b-2 border-zinc-200 w-fit" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
