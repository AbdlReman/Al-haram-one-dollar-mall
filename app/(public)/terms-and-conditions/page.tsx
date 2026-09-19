import type { Metadata } from "next";
import LegalPage, { type PolicySection } from "../_components/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions | Al Haram One Dollar Mall",
  description: "Read Al Haram One Dollar Mall's terms for orders, pricing, delivery, exchanges, and website use.",
};

const sections: PolicySection[] = [
  {
    title: "1. About Al Haram One Dollar Mall",
    paragraphs: [
      "Al Haram One Dollar Mall is a retail store based at Bangla Chowk, Mamu Kanjan, near Bab-e-Arqam School, offering Skin Care, Makeup, Hair Care, Electronics, Kitchen Accessories and Jewelry at affordable prices.",
      "Customers can shop in-store or place orders online and by phone.",
      "All trademarks, logos, and brand names of third-party products displayed on our platform belong to their respective owners.",
    ],
  },
  {
    title: "2. Product Information",
    paragraphs: [
      "We aim to provide accurate product descriptions, images, and pricing for every item listed.",
      "Product packaging, color, and design may vary slightly from images shown due to supplier changes, lighting, or screen settings.",
    ],
  },
  {
    title: "3. Orders & Acceptance",
    paragraphs: [
      "Once an order is placed and confirmed, it is considered final.",
      "In certain situations, we may contact customers regarding product availability, order verification, or unexpected circumstances affecting the order.",
      "We reserve the right to cancel or refuse orders when necessary.",
    ],
  },
  {
    title: "4. Pricing",
    paragraphs: ["All prices displayed on the website are listed in PKR.", "Al Haram One Dollar Mall reserves the right to:"],
    items: [
      "Update product prices at any time",
      "Correct pricing errors",
      "Cancel orders affected by incorrect pricing or technical issues",
    ],
  },
  {
    title: "5. Orders & Delivery",
    paragraphs: [
      "Orders can be placed by visiting our store at Bangla Chowk, Mamu Kanjan, or by calling/WhatsApp at 0334-2743554.",
      "Delivery availability, timelines, and any applicable charges will be confirmed at the time of order and may vary by location.",
      "Delivery times may be affected by courier delays, weather conditions, public holidays, or operational issues beyond our control.",
    ],
  },
  {
    title: "6. Customer Responsibility",
    paragraphs: ["Customers are responsible for carefully reviewing:"],
    items: [
      "Product descriptions and photos before placing an order",
      "Selected quantity and product options before confirming purchase",
      "Actual product colors and packaging may vary slightly due to lighting, photography, or screen settings",
    ],
  },
  {
    title: "7. Exchange Policy",
    paragraphs: [
      "Al Haram One Dollar Mall follows an exchange-only policy for eligible items.",
      "We do not offer full cash refunds unless required by applicable law.",
      "Please refer to our Exchange Policy page for detailed information regarding exchanges and eligibility.",
    ],
  },
  {
    title: "8. Intellectual Property",
    paragraphs: [
      "All website content including images, text, graphics, branding, and layouts is the property of Al Haram One Dollar Mall unless otherwise stated.",
      "Users may not copy website content, reuse product photos, reproduce branding materials, or misuse the website or its content without permission.",
    ],
  },
  {
    title: "9. Limitation of Liability",
    paragraphs: ["Al Haram One Dollar Mall is not responsible for:"],
    items: [
      "Indirect or incidental damages",
      "Delays caused by courier services",
      "Customer errors made when placing an order",
      "Minor packaging or condition differences already disclosed in listings",
    ],
  },
  {
    title: "10. Changes to Terms",
    paragraphs: [
      "We reserve the right to update or modify these Terms of Service at any time without prior notice.",
      "Continued use of the website after changes indicates acceptance of updated terms.",
    ],
  },
  {
    title: "11. Governing Law",
    paragraphs: ["These Terms of Service shall be governed and interpreted under the laws of Pakistan."],
  },
  {
    title: "12. Contact Us",
    paragraphs: [
      "For any questions regarding these Terms of Service, contact us at support@alharamstore.com or WhatsApp 0334-2743554.",
    ],
  },
];

export default function TermsAndConditionsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      eyebrow="Terms & Conditions"
      lastUpdated="May 2026"
      intro={[
        "Welcome to Al Haram One Dollar Mall. By accessing or using our website, you agree to comply with and be bound by the following Terms of Service.",
        "Please read these terms carefully before placing an order.",
      ]}
      sections={sections}
    />
  );
}
