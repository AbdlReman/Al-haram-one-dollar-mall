"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Exchange Policy", href: "/exchange-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMsg, setSubscribeMsg] = useState("");

  useEffect(() => {
    if (!subscribeMsg) return;
    const t = window.setTimeout(() => setSubscribeMsg(""), 3000);
    return () => window.clearTimeout(t);
  }, [subscribeMsg]);

  const onSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribing(true);
    setSubscribeMsg("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Subscription failed");
      setEmail("");
      setSubscribeMsg("Subscribed successfully.");
    } catch (err) {
      setSubscribeMsg(err instanceof Error ? err.message : "Could not subscribe right now.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-black text-white">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex mb-4">
              <Image
                src="/images/logo.png"
                alt="Al Haram One Dollar Mall"
                width={260}
                height={64}
                className="h-14 w-auto max-w-[14rem] object-contain object-left"
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Skin Care, Makeup, Hair Care, Electronics, Kitchen Accessories & Jewelry — all at unbeatable dollar mall prices.
            </p>
            <div className="mt-6 space-y-1 text-gray-400 text-sm">
              <p>Bangla Chowk, Mamu Kanjan, near Bab-e-Arqam School</p>
              <p>Online orders: <a href="tel:+923342743554" className="hover:text-white transition-colors">0334-2743554</a></p>
            </div>
            <div className="flex gap-4 mt-6">
              <a
                href="https://wa.me/923342743554"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 border border-gray-700 rounded-full flex items-center justify-center hover:border-white transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
                </svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs mb-5">Shop</h4>
            <ul className="space-y-3">
              {["Kitchen Accessories", "Electronics", "Skin Care", "Makeup", "Hair Care", "Jewelry"].map((item) => (
                <li key={item}>
                  <Link href={`/shop?category=${encodeURIComponent(item)}`} className="text-gray-400 text-sm hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs mb-5">Help</h4>
            <ul className="space-y-3">
              {["Shipping & Delivery", "Contact Us", "WhatsApp Support"].map((item) => (
                <li key={item}>
                  <Link href="/contact" className="text-gray-400 text-sm hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs mb-5">Newsletter</h4>
            <p className="text-gray-400 text-sm mb-4">
              Get exclusive deals, new arrivals, and style tips delivered to your inbox.
            </p>
            <form className="flex flex-col gap-2" onSubmit={onSubscribe}>
              <input
                type="email"
                placeholder="Your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-white text-sm px-4 py-2.5 focus:outline-none focus:border-white transition-colors placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="bg-white text-black text-xs font-bold uppercase tracking-widest py-2.5 hover:bg-gray-200 transition-colors"
              >
                {subscribing ? "Subscribing..." : "Subscribe"}
              </button>
              {subscribeMsg && <p className="text-xs text-gray-400 mt-1">{subscribeMsg}</p>}
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} Al Haram One Dollar Mall. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {legalLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-gray-500 text-xs hover:text-white transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
