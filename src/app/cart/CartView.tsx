"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { PRODUCT } from "@/lib/product";
import { saveCart, clearCart } from "@/actions/cart";

const QUANTITY_OPTIONS = [1, 2, 3, 4, 5];

/**
 * Interactive cart view (client island). Quantity is seeded from the server-read
 * cookie via `initialQuantity`, kept in local state for instant feedback, and
 * persisted to the cookie through the `saveCart` / `clearCart` server actions.
 *
 * Offers TWO checkout routes so both integration examples are reachable:
 *   /checkout        — server-side prefetch + hydrate (recommended)
 *   /checkout-client — client-side useEligibleMethods({ payload })
 */
const CartView = ({ initialQuantity }: { initialQuantity: number }) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const subtotal = (parseFloat(PRODUCT.price) * quantity).toFixed(2);

  const handleQuantityChange = (nextQuantity: number) => {
    setQuantity(nextQuantity);
    startTransition(() =>
      saveCart({ sku: PRODUCT.sku, quantity: nextQuantity }),
    );
  };

  const handleRemove = () => {
    startTransition(async () => {
      await clearCart();
      router.push("/");
    });
  };

  return (
    <main className="flex-1 flex flex-col">
      <section className="flex-1 flex flex-col items-center px-6 py-16">
        <div className="max-w-2xl w-full">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] mb-10">
            Your Bag
          </h1>

          {/* Cart Item */}
          <div className="flex gap-6 py-8 border-t border-[var(--border)]">
            {/* Product Visual */}
            <div className="w-24 h-24 rounded-2xl bg-[var(--background-secondary)] flex items-center justify-center shrink-0">
              <span className="text-4xl">⚽</span>
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-medium text-[var(--foreground)]">
                    {PRODUCT.name}
                  </h2>
                  <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                    {PRODUCT.tagline}
                  </p>
                </div>
                <p className="text-base font-medium text-[var(--foreground)] whitespace-nowrap">
                  ${PRODUCT.price}
                </p>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="cart-quantity"
                    className="text-sm text-[var(--foreground-secondary)]"
                  >
                    Qty
                  </label>
                  <select
                    id="cart-quantity"
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(Number(e.target.value))
                    }
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] appearance-none cursor-pointer"
                  >
                    {QUANTITY_OPTIONS.map((qty) => (
                      <option key={qty} value={qty}>
                        {qty}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleRemove}
                  disabled={isPending}
                  className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors cursor-pointer disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="border-t border-[var(--border)] pt-6 mt-2">
            <div className="flex items-center justify-between mb-8">
              <span className="text-base text-[var(--foreground)]">
                Subtotal
              </span>
              <span className="text-base font-medium text-[var(--foreground)]">
                ${subtotal}
              </span>
            </div>

            {/* Two checkout routes — one per integration example */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/checkout")}
                className="w-full py-3 rounded-full bg-[var(--accent)] text-white text-base font-medium hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
              >
                Check Out — server hydration (recommended)
              </button>
              <button
                onClick={() => router.push("/checkout-client")}
                className="w-full py-3 rounded-full border border-[var(--border)] text-[var(--foreground)] text-base font-medium hover:bg-[var(--background-secondary)] transition-colors cursor-pointer"
              >
                Check Out — client-side fetch
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default CartView;
