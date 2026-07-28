import { fetchEligibleMethods } from "@/actions/paypal";
import CheckoutServerRestClient from "./CheckoutServerRestClient";

const CheckoutServerOnlyPage = async () => {
  let eligibleMethodsResponse;
  try {
    eligibleMethodsResponse = await fetchEligibleMethods();
  } catch (error) {
    console.error("Failed to prefetch eligible methods:", error);
  }

  return (
    <CheckoutServerRestClient eligibleMethodsResponse={eligibleMethodsResponse} />
  );
};

export default CheckoutServerOnlyPage;
