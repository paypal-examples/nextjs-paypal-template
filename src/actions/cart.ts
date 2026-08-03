"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { CART_COOKIE, CART_COOKIE_OPTIONS } from "@/lib/cart";
import type { CartItem } from "@/lib/product";

/**
 * Cart mutations — the ONLY place that writes the cart cookie. `cookies().set` /
 * `delete` can only be called from a Server Action or Route Handler, which keeps
 * the cart server-authoritative. Reads live in `src/lib/cart.ts` (`readCart`).
 *
 * The checkout routes are dynamic (they read the cookie fresh on every request),
 * so only the cart page needs revalidating after a mutation.
 */
export async function saveCart(item: CartItem): Promise<void> {
  (await cookies()).set(CART_COOKIE, JSON.stringify(item), CART_COOKIE_OPTIONS);
  revalidatePath("/cart");
}

export async function clearCart(): Promise<void> {
  (await cookies()).delete(CART_COOKIE);
  revalidatePath("/cart");
}
