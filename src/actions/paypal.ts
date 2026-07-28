"use server";

import {
  CheckoutPaymentIntent,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { randomUUID } from "node:crypto";
import { paypalClient } from "@/lib/paypalClient";
import { getProduct, type CartItem } from "@/lib/product";
import type { FindEligiblePaymentMethodsResponse } from "@paypal/react-paypal-js/sdk-v6";

const ordersController = new OrdersController(paypalClient);

/**
 * Get the PayPal Client ID for SDK initialization
 */
export const getBrowserSafeClientId = async () => {
  const clientId = process.env.PAYPAL_SANDBOX_CLIENT_ID;
  if (!clientId) {
    throw new Error("PAYPAL_SANDBOX_CLIENT_ID is not defined");
  }
  return clientId;
};

/**
 * Create a PayPal order for one-time payment
 */
export const createOrder = async (cart: CartItem[]) => {
  // Calculate order totals
  let totalAmount = 0;
  const items = cart.map((item) => {
    const product = getProduct(item.sku);
    const itemTotal = (parseFloat(product.price) * item.quantity).toFixed(2);
    totalAmount += parseFloat(itemTotal);

    return {
      sku: item.sku,
      name: product.name,
      quantity: String(item.quantity),
      unitAmount: {
        currencyCode: "USD",
        value: product.price,
      },
    };
  });

  const totalAmountStr = totalAmount.toFixed(2);

  const orderRequestBody = {
    intent: CheckoutPaymentIntent.Capture,
    purchaseUnits: [
      {
        amount: {
          currencyCode: "USD",
          value: totalAmountStr,
          breakdown: {
            itemTotal: {
              currencyCode: "USD",
              value: totalAmountStr,
            },
          },
        },
        items,
      },
    ],
  };

  try {
    const { result, statusCode } = await ordersController.createOrder({
      body: orderRequestBody,
      paypalRequestId: randomUUID(),
      prefer: "return=minimal",
    });

    if (statusCode !== 201) {
      throw new Error(`Failed to create order: ${statusCode}`);
    }

    if (!result?.id) {
      throw new Error("No order ID returned from PayPal");
    }

    return { orderId: result.id };
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    throw error;
  }
};

/**
 * Capture a PayPal order (finalize payment)
 */
export const captureOrder = async ({ orderId }: { orderId: string }) => {
  try {
    const { result, statusCode } = await ordersController.captureOrder({
      id: orderId,
      prefer: "return=minimal",
      paypalRequestId: randomUUID(),
    });

    if (statusCode !== 201) {
      throw new Error(`Failed to capture order: ${statusCode}`);
    }

    return result;
  } catch (error) {
    console.error("Error capturing PayPal order:", error);
    throw error;
  }
};

const getAccessToken = async () => {
  const clientId = process.env.PAYPAL_SANDBOX_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SANDBOX_CLIENT_SECRET;

  const response = await fetch(
    "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const { access_token } = await response.json();
  return access_token as string;
};

/**
 * Prefetches PayPal eligible payment methods on the server so the client can
 * hydrate PayPalProvider via eligibleMethodsResponse instead of fetching
 * client-side.
 */
export const fetchEligibleMethods =
  async (): Promise<FindEligiblePaymentMethodsResponse> => {
    const accessToken = await getAccessToken();

    const response = await fetch(
      "https://api-m.sandbox.paypal.com/v2/payments/find-eligible-methods",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          purchase_units: [{ amount: { currency_code: "USD" } }],
          preferences: { payment_flow: "ONE_TIME_PAYMENT" },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch eligible methods: ${response.status}`);
    }

    const json = await response.json();
    console.log(
      "[server] fetchEligibleMethods result:",
      JSON.stringify(json).slice(0, 200),
    );
    return json;
  };

