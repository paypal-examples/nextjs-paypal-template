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
  useEligibleMethods,
  INSTANCE_LOADING_STATE,
  type OnApproveDataOneTimePayments,
  type OnCancelDataOneTimePayments,
  type OnCompleteData,
  type OnErrorData,
} from "@paypal/react-paypal-js/sdk-v6";
import { PRODUCT, calculateCartTotal, type CartItem } from "@/lib/product";
import { createOrder, captureOrder } from "@/actions/paypal";
import { clearCart } from "@/actions/cart";
import {
  PaymentStatusBar,
  type PaymentStatus,
} from "@/components/PaymentStatusBar";

/**
 * EXAMPLE 2 — client-side eligibility with a payload.
 *
 * There is NO `eligibleMethodsResponse` on the provider, so eligibility is not
 * hydrated. This component calls `useEligibleMethods({ payload })` and the hook
 * fetches from the SDK on the client. The payload carries the amount/flow, which
 * matters for amount-sensitive methods (e.g. Pay Later thresholds).
 */
const PaymentButtons = ({
  cart,
  onStatusChange,
}: {
  cart: CartItem;
  onStatusChange: (status: PaymentStatus) => void;
}) => {
  const { loadingStatus } = usePayPal();
  const { eligiblePaymentMethods, isLoading, error } = useEligibleMethods({
    payload: {
      amount: calculateCartTotal([cart]),
      currencyCode: "USD",
      paymentFlow: "ONE_TIME_PAYMENT",
    },
  });

  const isSdkLoading = loadingStatus === INSTANCE_LOADING_STATE.PENDING;

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

  if (isSdkLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
        <span className="ml-3 text-sm text-[var(--foreground-secondary)]">
          Loading payment methods...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-[var(--error)]">
        Unable to determine eligible payment methods.{" "}
        {error.message || "Please refresh the page and try again."}
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
 * Client view for Example 2. The provider has NO eligibleMethodsResponse —
 * eligibility is fetched on the client by `useEligibleMethods` above.
 */
const CheckoutClientFetch = ({
  cart,
  clientId,
}: {
  cart: CartItem;
  clientId: string;
}) => {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const subtotal = (parseFloat(PRODUCT.price) * cart.quantity).toFixed(2);

  const isDone =
    status === "success" || status === "cancel" || status === "error";

  // Clear the cart only when leaving — see the note in checkout/CheckoutClient.tsx.
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
            Example: client-side fetch with payload
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
          ) : status === "processing" ? null : (
            <PayPalProvider
              environment="sandbox"
              clientId={clientId}
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

export default CheckoutClientFetch;
