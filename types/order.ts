import type { CartItem } from "./product";

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  /** Optional — state or province */
  state?: string;
  /** Optional — ZIP / postal code */
  postalCode?: string;
  notes?: string;
}

export type PaymentMethodCode = "" | "easypaisa" | "sadapay" | "meezan";

export interface IOrder {
  _id: string;
  orderNumber: string;
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string;
  paymentMethod?: PaymentMethodCode;
  paymentTransactionId?: string;
  paymentScreenshotUrl?: string;
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "pending" | "processing" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}
