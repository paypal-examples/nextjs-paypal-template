import { fetchEligibleMethods } from "@/actions/paypal";
import CheckoutClient from "./CheckoutClient";

const CheckoutPage = async () => {
  let eligibleMethodsResponse;
  try {
    eligibleMethodsResponse = await fetchEligibleMethods();
  } catch (error) {
    console.error("Failed to prefetch eligible methods:", error);
  }

  return <CheckoutClient eligibleMethodsResponse={eligibleMethodsResponse} />;
};

export default CheckoutPage;
