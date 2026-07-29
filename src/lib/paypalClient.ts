import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
} from "@paypal/paypal-server-sdk";

const PAYPAL_SANDBOX_CLIENT_ID = process.env.PAYPAL_SANDBOX_CLIENT_ID;
const PAYPAL_SANDBOX_CLIENT_SECRET = process.env.PAYPAL_SANDBOX_CLIENT_SECRET;

if (!PAYPAL_SANDBOX_CLIENT_ID || !PAYPAL_SANDBOX_CLIENT_SECRET) {
  throw new Error(
    "Missing PayPal credentials: PAYPAL_SANDBOX_CLIENT_ID and PAYPAL_SANDBOX_CLIENT_SECRET must be set",
  );
}

/**
 * The PayPal environment this app targets. Single source of truth so the
 * server-side eligibility call stays in sync with the SDK client below.
 */
export const PAYPAL_ENVIRONMENT = "sandbox" as const;

export const paypalClient = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: PAYPAL_SANDBOX_CLIENT_ID,
    oAuthClientSecret: PAYPAL_SANDBOX_CLIENT_SECRET,
  },
  timeout: 0,
  environment: Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: {
      logBody: true,
    },
    logResponse: {
      logHeaders: true,
    },
  },
});

/**
 * Mint an OAuth access token via client-credentials. Needed for REST calls that
 * aren't wrapped by an SDK controller (e.g. the eligibility API), which require
 * an explicit `Authorization: Bearer <token>` header.
 */
export async function getPayPalAccessToken(): Promise<string> {
  const authorization =
    "Basic " +
    Buffer.from(
      `${PAYPAL_SANDBOX_CLIENT_ID}:${PAYPAL_SANDBOX_CLIENT_SECRET}`,
    ).toString("base64");

  const { result } = await new OAuthAuthorizationController(
    paypalClient,
  ).requestToken({ authorization });

  return result.accessToken;
}
