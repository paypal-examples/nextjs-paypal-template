export const PRODUCT = {
  name: "World Cup Ball",
  tagline: "Precision. Control. Perfection.",
  description:
    "Tournament-grade match ball engineered for peak performance. Thermal-bonded panels deliver consistent flight and true touch in every condition.",
  price: "75.00",
  sku: "1blwyeo8",
};

export type CartItem = {
  sku: string;
  quantity: number;
};

// Cart persistence lives in a cookie so checkout Server Components can read it
// during SSR. See src/lib/cart.ts (read) and src/actions/cart.ts (write).

/**
 * Get a product by SKU
 * Currently only one product is available
 */
export function getProduct(sku: string) {
  if (sku !== PRODUCT.sku) {
    throw new Error(`Product not found: ${sku}`);
  }
  return PRODUCT;
}

/**
 * Get all available products
 */
export function getAllProducts() {
  return [PRODUCT];
}

/**
 * Calculate the total amount for a cart, returned as a fixed-2 string (e.g. "150.00")
 */
export function calculateCartTotal(cart: CartItem[]): string {
  const total = cart.reduce((sum, item) => {
    const product = getProduct(item.sku);
    return sum + parseFloat(product.price) * item.quantity;
  }, 0);
  return total.toFixed(2);
}
