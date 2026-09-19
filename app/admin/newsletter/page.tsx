import type { Metadata } from "next";
import NewsletterClient from "./NewsletterClient";

export const metadata: Metadata = { title: "Newsletter — Admin" };

export default function AdminNewsletterPage() {
  return <NewsletterClient />;
}
