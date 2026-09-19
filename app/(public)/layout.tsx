import type { Metadata } from "next";
import Script from "next/script";
import "../globals.css";
import PublicChrome from "@/components/PublicChrome";

export const metadata: Metadata = {
  metadataBase: new URL("https://onedollar.alharamstore.com"),
  title: {
    default: "Al Haram One Dollar Mall | Skin Care, Makeup, Electronics & More",
    template: "%s | Al Haram One Dollar Mall",
  },
  description:
    "Al Haram One Dollar Mall — your one dollar shop for Skin Care, Makeup, Hair Care, Electronics, Kitchen Accessories & Jewelry. Visit us at Bangla Chowk, Mamu Kanjan near Bab-e-Arqam School, or order online.",
  keywords: [
    "Al Haram One Dollar Mall",
    "one dollar shop",
    "one dollar mall",
    "Bangla Chowk Mamu Kanjan",
    "skin care products",
    "makeup online",
    "hair care products",
    "electronics accessories",
    "kitchen accessories",
    "jewelry shop",
    "dollar store Pakistan",
  ],
  authors: [{ name: "Al Haram One Dollar Mall", url: "https://onedollar.alharamstore.com" }],
  creator: "Al Haram One Dollar Mall",
  publisher: "Al Haram One Dollar Mall",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "https://onedollar.alharamstore.com",
    siteName: "Al Haram One Dollar Mall",
    title: "Al Haram One Dollar Mall | Skin Care, Makeup, Electronics & More",
    description:
      "Skin Care, Makeup, Hair Care, Electronics, Kitchen Accessories & Jewelry — all at unbeatable prices. Visit Bangla Chowk, Mamu Kanjan near Bab-e-Arqam School, or order online.",
    images: [
      {
        url: "/images/hero.jpeg",
        width: 1200,
        height: 630,
        alt: "Al Haram One Dollar Mall",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Al Haram One Dollar Mall | Skin Care, Makeup, Electronics & More",
    description:
      "Skin Care, Makeup, Hair Care, Electronics, Kitchen Accessories & Jewelry — all at unbeatable prices.",
    images: ["/images/hero.jpeg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-PK" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Y7DEMZ1WL5"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Y7DEMZ1WL5');
          `}
        </Script>
        <PublicChrome>{children}</PublicChrome>
      </body>
    </html>
  );
}
