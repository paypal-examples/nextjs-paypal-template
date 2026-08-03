import "server-only";

import { cookies } from "next/headers";

import type { CartItem } from "@/lib/product";

/**
 * Cart is stored in an httpOnly cookie (not sessionStorage) so it is readable on
 * the server. That lets a checkout Server Component read the cart during SSR —
 * required for the server-hydration example (`/checkout`), which pre-fetches
 * eligibility server-side before the page reaches the browser.
 *
 * Reads happen here (server-only). Writes go through the server actions in
 * `src/actions/cart.ts`, the only place allowed to call `cookies().set`.
 */
export const CART_COOKIE = "paypal-cart";

export const CART_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60, // 1 hour
  secure: process.env.NODE_ENV === "production",
};

/**
 * Read the cart from the request cookies. Call in Server Components / server
 * code. Returns `null` if there is no cart or it can't be parsed.
 */
export async function readCart(): Promise<CartItem | null> {
  const raw = (await cookies()).get(CART_COOKIE)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CartItem;
  } catch {
    return null;
  }
}
