import { redirect } from "next/navigation";

import { readCart } from "@/lib/cart";
import CheckoutClientFetch from "./CheckoutClientFetch";

/**
 * ============================================================================
 * EXAMPLE 2 — Client-side fetch with a payload
 * ============================================================================
 * No server-side eligibility prefetch here. This thin Server Component only
 * reads the cart (for the amount) and the browser-safe clientId, then hands them
 * to a client component that calls `useEligibleMethods({ payload })` to fetch
 * eligibility ON THE CLIENT.
 *
 * Use this pattern when you are NOT prefetching server-side (e.g. a purely
 * client-rendered checkout). Do NOT combine it with `eligibleMethodsResponse`
 * hydration — passing a payload while also hydrating causes a redundant
 * client-side eligibility request (the hydrated data is stored without a
 * payload, so a payload-specific call can never match it).
 */
const CheckoutClientPage = async () => {
  const cart = await readCart();
  if (!cart) {
    redirect("/");
  }

  const clientId = process.env.PAYPAL_SANDBOX_CLIENT_ID;
  if (!clientId) {
    throw new Error("PAYPAL_SANDBOX_CLIENT_ID is not defined");
  }

  return <CheckoutClientFetch cart={cart} clientId={clientId} />;
};

export default CheckoutClientPage;
