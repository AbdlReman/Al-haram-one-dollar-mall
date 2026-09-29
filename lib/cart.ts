import type { CartItem, IProduct } from "@/types/product";

/** Adds an item to the localStorage cart, clamped to available stock. Returns the quantity actually added (0 if none). */
export function addToCart(
  product: IProduct,
  selectedColor: string,
  selectedImage: string,
  selectedSize: string,
  quantity: number,
  effectivePrice: number
): number {
  const availableStock = Math.max(0, Math.floor(Number(product.stockQuantity || 0)));
  if (availableStock <= 0) return 0;

  const requestedQty = Math.max(1, Math.floor(quantity || 1));
  const existing = JSON.parse(localStorage.getItem("cart_items") || "[]") as CartItem[];
  const sizeKey = selectedSize || "";
  const cartProductQty = existing.reduce(
    (sum, item) => sum + (item.productId === product._id ? Math.max(1, Number(item.quantity || 1)) : 0),
    0
  );
  const qty = Math.min(requestedQty, Math.max(0, availableStock - cartProductQty));
  if (qty <= 0) return 0;

  const index = existing.findIndex(
    (item) =>
      item.productId === product._id &&
      (item.color || "") === (selectedColor || "") &&
      (item.size || "") === sizeKey
  );
  if (index >= 0) {
    existing[index] = {
      ...existing[index],
      quantity: Math.max(1, Number(existing[index].quantity || 1)) + qty,
      stockQuantity: availableStock,
    };
  } else {
    existing.push({
      productId: product._id,
      name: product.name,
      price: effectivePrice,
      image: selectedImage,
      quantity: qty,
      color: selectedColor,
      size: sizeKey,
      stockQuantity: availableStock,
    });
  }
  localStorage.setItem("cart_items", JSON.stringify(existing));
  window.dispatchEvent(new Event("cart_updated"));
  return qty;
}

export function setCartToSingleItem(item: CartItem) {
  localStorage.setItem("cart_items", JSON.stringify([item]));
  window.dispatchEvent(new Event("cart_updated"));
}
