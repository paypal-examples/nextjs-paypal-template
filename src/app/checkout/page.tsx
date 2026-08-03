import { redirect } from "next/navigation";

import { readCart } from "@/lib/cart";
import { getEligiblePaymentMethods } from "@/lib/eligibility";
import CheckoutClient from "./CheckoutClient";

/**
 * ============================================================================
 * EXAMPLE 1 — Server-side fetch + hydrate  (RECOMMENDED)
 * ============================================================================
 * This checkout is a Server Component. Eligibility is fetched on the SERVER
 * during rendering (overlapping with SSR) via our server method
 * `fetchEligibleMethods` (see src/lib/eligibility.ts), then passed to
 * `PayPalProvider` through the `eligibleMethodsResponse` prop. The provider
 * hydrates the SDK from it, so the browser makes NO eligibility request of its
 * own and there is no flash of missing/stale buttons.
 *
 * Key rule for this pattern: the client CONSUMES the hydrated result WITHOUT
 * passing a payload (see CheckoutClient.tsx). Passing a payload on the client
 * would be treated as a separate query and trigger a redundant fetch.
 */
const CheckoutPage = async () => {
  const cart = await readCart();
  if (!cart) {
    redirect("/");
  }

  // clientId is browser-safe; read it on the server and pass it down as a prop.
  const clientId = process.env.PAYPAL_SANDBOX_CLIENT_ID;
  if (!clientId) {
    throw new Error("PAYPAL_SANDBOX_CLIENT_ID is not defined");
  }

  // Pre-fetch eligibility server-side. On failure, don't block the page — show a
  // graceful error instead of a broken checkout.
  let eligibleMethodsResponse;
  let prefetchFailed = false;
  try {
    eligibleMethodsResponse = await getEligiblePaymentMethods([cart]);
  } catch (error) {
    console.error("Eligibility prefetch failed:", error);
    prefetchFailed = true;
  }

  return (
    <CheckoutClient
      cart={cart}
      clientId={clientId}
      eligibleMethodsResponse={eligibleMethodsResponse}
      prefetchFailed={prefetchFailed}
    />
  );
};

export default CheckoutPage;
