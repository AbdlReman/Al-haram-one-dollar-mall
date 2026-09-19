import type { Metadata } from "next";
import LegalPage, { type PolicySection } from "../_components/LegalPage";

export const metadata: Metadata = {
  title: "Exchange Policy | Al Haram One Dollar Mall",
  description: "Review Al Haram One Dollar Mall's exchange eligibility, shipping costs, and product availability terms.",
};

const sections: PolicySection[] = [
  {
    title: "1. Exchange Eligibility",
    paragraphs: ["Customers may request an exchange within 3 days after delivery or purchase if:"],
    items: [
      "The item received is significantly different from the product description",
      "The wrong item was delivered",
      "The product has a manufacturing defect or undisclosed issue",
    ],
  },
  {
    title: "2. No Refund Policy",
    paragraphs: ["Al Haram One Dollar Mall does not offer cash refunds or full payment returns."],
    items: [
      "Approved requests will only be processed as a product exchange",
      "Store credit may be available, subject to availability",
    ],
  },
  {
    title: "3. Shipping Costs",
    paragraphs: ["For exchange requests where the item was delivered:"],
    items: [
      "Customers are responsible for returning the product to our store",
      "Return shipping costs must be covered by the customer",
      "We are not responsible for items lost during return shipping",
      "We recommend using a reliable courier service with tracking",
    ],
  },
  {
    title: "4. Product Availability",
    paragraphs: [
      "Some items are available in limited quantities.",
      "If the same product is unavailable during exchange, you may wait until new stock arrives or select another available item from our collection.",
      "We cannot guarantee restocks of specific products.",
    ],
  },
  {
    title: "5. Condition for Exchange",
    paragraphs: ["To qualify for an exchange:"],
    items: [
      "The item must be returned unused and in its original condition",
      "The product must not be damaged or altered after delivery",
      "Original packaging, if provided, should be included",
    ],
  },
  {
    title: "6. Non-Exchangeable Situations",
    paragraphs: ["We may refuse exchanges if:"],
    items: [
      "The issue was already clearly shown or mentioned before purchase",
      "The product was damaged after delivery",
      "The customer simply changes their mind after purchase",
    ],
  },
  {
    title: "7. Contact Us",
    paragraphs: [
      "For exchange-related inquiries, contact us at support@alharamstore.com or WhatsApp 0334-2743554.",
    ],
  },
];

export default function ExchangePolicyPage() {
  return (
    <LegalPage
      title="Exchange Policy"
      eyebrow="Exchange Policy"
      lastUpdated="May 2026"
      intro={[
        "At Al Haram One Dollar Mall, we want you to be happy with every purchase. Since our items are sold at affordable everyday prices, we currently offer an exchange-only policy and do not provide full refunds.",
        "By placing an order, you agree to the terms below.",
      ]}
      sections={sections}
    />
  );
}
