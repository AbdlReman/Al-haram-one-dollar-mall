import type { Metadata } from "next";
import CouponsClient from "./CouponsClient";

export const metadata: Metadata = { title: "Coupons — Admin" };

export default function AdminCouponsPage() {
  return <CouponsClient />;
}
