import { redirect } from "next/navigation";

import { readCart } from "@/lib/cart";
import CartView from "./CartView";

/**
 * Cart page — a Server Component. Reads the cart from the cookie on the server
 * (no client round-trip) and redirects home if empty. Interactive parts live in
 * the `CartView` client island.
 */
const CartPage = async () => {
  const cart = await readCart();
  if (!cart) {
    redirect("/");
  }

  return <CartView initialQuantity={cart.quantity} />;
};

export default CartPage;
