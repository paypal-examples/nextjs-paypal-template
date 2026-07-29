"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PayPalProvider,
  PayPalOneTimePaymentButton,
  VenmoOneTimePaymentButton,
  PayLaterOneTimePaymentButton,
  PayPalGuestPaymentButton,
  usePayPal,
  INSTANCE_LOADING_STATE,
  type FindEligiblePaymentMethodsResponse,
  type OnApproveDataOneTimePayments,
  type OnCancelDataOneTimePayments,
  type OnCompleteData,
  type OnErrorData,
} from "@paypal/react-paypal-js/sdk-v6";
import { PRODUCT, type CartItem } from "@/lib/product";
import { createOrder, captureOrder } from "@/actions/paypal";
import { clearCart } from "@/actions/cart";
import {
  PaymentStatusBar,
  type PaymentStatus,
} from "@/components/PaymentStatusBar";

/**
 * EXAMPLE 1 — consuming server-hydrated eligibility.
 *
 * Eligibility was fetched server-side and hydrated into the PayPalProvider, so
 * this reads it DIRECTLY from `usePayPal()` — it does NOT call
 * `useEligibleMethods()`. Reading from context needs no payload and triggers no
 * client fetch. Buttons are gated on `isEligible(...)`.
 */
const PaymentButtons = ({
  cart,
  onStatusChange,
}: {
  cart: CartItem;
  onStatusChange: (status: PaymentStatus) => void;
}) => {
  const { loadingStatus, eligiblePaymentMethods } = usePayPal();

  const isLoading = loadingStatus === INSTANCE_LOADING_STATE.PENDING;

  const handleCreateOrder = async () => {
    return await createOrder([{ sku: cart.sku, quantity: cart.quantity }]);
  };

  const handlePaymentCallbacks = {
    onApprove: async (data: OnApproveDataOneTimePayments) => {
      onStatusChange("processing");
      console.log("[checkout] buyer approved, capturing order:", data.orderId);
      try {
        const captureResult = await captureOrder({ orderId: data.orderId });
        console.log("[checkout] ✓ payment successful:", captureResult);
        onStatusChange("success");
      } catch (err) {
        console.error("[checkout] ✗ capture failed:", err);
        onStatusChange("error");
      }
    },

    onCancel: (data: OnCancelDataOneTimePayments) => {
      console.log("[checkout] payment cancelled by buyer:", data);
      onStatusChange("cancel");
    },

    onError: (data: OnErrorData) => {
      console.error("[checkout] ✗ payment error:", data.message ?? data);
      onStatusChange("error");
    },

    onComplete: (data: OnCompleteData) => {
      console.log("[checkout] payment session completed:", data);
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
        <span className="ml-3 text-sm text-[var(--foreground-secondary)]">
          Loading payment methods...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {eligiblePaymentMethods?.isEligible("paypal") && (
        <PayPalOneTimePaymentButton
          createOrder={handleCreateOrder}
          presentationMode="auto"
          {...handlePaymentCallbacks}
        />
      )}

      {eligiblePaymentMethods?.isEligible("venmo") && (
        <VenmoOneTimePaymentButton
          createOrder={handleCreateOrder}
          presentationMode="auto"
          {...handlePaymentCallbacks}
        />
      )}

      {eligiblePaymentMethods?.isEligible("paylater") && (
        <PayLaterOneTimePaymentButton
          createOrder={handleCreateOrder}
          presentationMode="auto"
          {...handlePaymentCallbacks}
        />
      )}

      {/* "card" funding source maps to BASIC_CARDS (BCDC guest checkout) */}
      {eligiblePaymentMethods?.isEligible("card") && (
        <PayPalGuestPaymentButton
          createOrder={handleCreateOrder}
          {...handlePaymentCallbacks}
        />
      )}
    </div>
  );
};

/**
 * Client view for Example 1. Receives the server-fetched `eligibleMethodsResponse`
 * and hands it to `PayPalProvider` for hydration. No client-side eligibility
 * fetching happens here.
 */
const CheckoutClient = ({
  cart,
  clientId,
  eligibleMethodsResponse,
  prefetchFailed,
}: {
  cart: CartItem;
  clientId: string;
  eligibleMethodsResponse?: FindEligiblePaymentMethodsResponse;
  prefetchFailed: boolean;
}) => {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const subtotal = (parseFloat(PRODUCT.price) * cart.quantity).toFixed(2);

  const isDone =
    status === "success" || status === "cancel" || status === "error";

  // Clear the cart only when leaving the success screen — clearing it inside
  // onApprove would empty the cookie and make this Server Component redirect
  // home (its `if (!cart) redirect("/")` guard) before the buyer sees feedback.
  const handleContinue = () => {
    startTransition(async () => {
      await clearCart();
      router.push("/");
    });
  };

  return (
    <main className="flex-1 flex flex-col">
      <section className="flex-1 flex flex-col items-center px-6 py-16">
        <div className="max-w-lg w-full">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] mb-2">
            Checkout
          </h1>
          <p className="text-sm text-[var(--foreground-secondary)] mb-8">
            Example: server-side prefetch + hydrate
          </p>

          {/* Persistent payment status bar */}
          <PaymentStatusBar status={status} />

          {/* Order Summary — stays visible so feedback shows on this page */}
          <div className="mb-8">
            <h2 className="text-sm font-medium tracking-widest uppercase text-[var(--foreground-secondary)] mb-4">
              Order Summary
            </h2>

            <div className="flex items-center gap-4 py-4 border-t border-[var(--border)]">
              <div className="w-16 h-16 rounded-xl bg-[var(--background-secondary)] flex items-center justify-center shrink-0">
                <span className="text-2xl">⚽</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {PRODUCT.name}
                </p>
                <p className="text-sm text-[var(--foreground-secondary)]">
                  Qty: {cart.quantity}
                </p>
              </div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                ${subtotal}
              </p>
            </div>

            <div className="flex items-center justify-between py-4 border-t border-[var(--border)]">
              <span className="text-base font-medium text-[var(--foreground)]">
                Total
              </span>
              <span className="text-base font-medium text-[var(--foreground)]">
                ${subtotal}
              </span>
            </div>
          </div>

          {/* Payment area */}
          {isDone ? (
            <button
              onClick={handleContinue}
              disabled={isPending}
              className="w-full py-3 rounded-full bg-[var(--accent)] text-white text-base font-medium hover:bg-[var(--accent-hover)] transition-colors cursor-pointer disabled:opacity-60"
            >
              Continue Shopping
            </button>
          ) : status === "processing" ? null : prefetchFailed ? (
            <div className="py-8 text-center text-sm text-[var(--error)]">
              Unable to determine eligible payment methods. Please refresh the
              page and try again.
            </div>
          ) : (
            <PayPalProvider
              environment="sandbox"
              clientId={clientId}
              eligibleMethodsResponse={eligibleMethodsResponse}
              components={[
                "paypal-payments",
                "venmo-payments",
                "paypal-guest-payments",
              ]}
              pageType="checkout"
            >
              <PaymentButtons cart={cart} onStatusChange={setStatus} />
            </PayPalProvider>
          )}
        </div>
      </section>
    </main>
  );
};

export default CheckoutClient;
