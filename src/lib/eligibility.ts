import "server-only";

import { fetchEligibleMethods } from "@paypal/react-paypal-js/sdk-v6/server";
import { headers } from "next/headers";

import { getPayPalAccessToken, PAYPAL_ENVIRONMENT } from "@/lib/paypalClient";
import { calculateCartTotal, type CartItem } from "@/lib/product";

/**
 * Pre-fetch eligible payment methods on the server using the SDK's own server
 * method, `fetchEligibleMethods` (imported from `@paypal/react-paypal-js/sdk-v6/server`).
 *
 * This is a plain server-side async function, NOT a `"use server"` action: it's
 * a render-time READ called directly from the `/checkout` Server Component, so it
 * needn't be exposed to the client as an action endpoint. The resolved response
 * is passed to `PayPalProvider` via `eligibleMethodsResponse`, which hydrates the
 * SDK so the browser makes no eligibility request of its own.
 *
 * Prefer this over a hand-rolled REST call: it keeps the request/response shape
 * in lockstep with the SDK. If you must call the REST API directly instead (e.g.
 * you already have your own PayPal REST wrapper), POST to
 * `/v2/payments/find-eligible-methods` and pass the JSON response to
 * `eligibleMethodsResponse` unchanged.
 */
export async function getEligiblePaymentMethods(cart: CartItem[]) {
  const totalAmountStr = calculateCartTotal(cart);
  const accessToken = await getPayPalAccessToken();

  // The eligibility API infers geo/device from the request's User-Agent (and IP)
  // when called from a browser. Server-side, forward the shopper's User-Agent so
  // results reflect the shopper rather than this server.
  const userAgent = (await headers()).get("user-agent") ?? undefined;

  return fetchEligibleMethods({
    // Bound the request so a hung eligibility call can't block the render.
    signal: AbortSignal.timeout(10_000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(userAgent && { "User-Agent": userAgent }),
    },
    environment: PAYPAL_ENVIRONMENT,
    payload: {
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: totalAmountStr,
          },
        },
      ],
      preferences: {
        payment_flow: "ONE_TIME_PAYMENT",
        // Scope the response to the methods this app renders. Keep in sync with
        // the buttons in checkout/CheckoutClient.tsx — BASIC_CARDS backs the
        // PayPalGuestPaymentButton (BCDC guest checkout).
        payment_source_constraint: {
          constraint_type: "INCLUDE",
          payment_sources: [
            "PAYPAL",
            "PAYPAL_PAY_LATER",
            "VENMO",
            "BASIC_CARDS",
          ],
        },
      },
    },
  });
}
