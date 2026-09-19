export interface ColorVariant {
  color: string;
  images: string[];
}

export interface IProduct {
  _id: string;
  name: string;
  brand: string;
  category: string;
  categories?: string[];
  price: number;
  description: string;
  detail: string;
  sizes: string[];
  colors: string[];
  colorVariants: ColorVariant[];
  stockQuantity: number;
  images: string[];
  discount: number;
  inStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  status: "Draft" | "Published";
  popularityScore: number;
  soldCount: number;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
  stockQuantity?: number;
}
