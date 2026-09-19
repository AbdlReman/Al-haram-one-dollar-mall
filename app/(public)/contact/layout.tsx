import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Al Haram One Dollar Mall",
  description:
    "Get in touch with Al Haram One Dollar Mall — visit us at Bangla Chowk, Mamu Kanjan near Bab-e-Arqam School, or order online at 0334-2743554.",
  alternates: { canonical: "https://onedollar.alharamstore.com/contact" },
  openGraph: {
    title: "Contact Al Haram One Dollar Mall",
    description:
      "Reach us on WhatsApp, phone, or by visiting our store at Bangla Chowk, Mamu Kanjan.",
    url: "https://onedollar.alharamstore.com/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
