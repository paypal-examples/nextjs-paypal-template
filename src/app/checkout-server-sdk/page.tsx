import { fetchEligibleMethodsViaSdk } from "@/actions/paypal";
import CheckoutServerSdkClient from "./CheckoutServerSdkClient";

const CheckoutSdkPage = async () => {
  let eligibleMethodsResponse;
  try {
    eligibleMethodsResponse = await fetchEligibleMethodsViaSdk();
  } catch (error) {
    console.error("Failed to prefetch eligible methods:", error);
  }

  return (
    <CheckoutServerSdkClient eligibleMethodsResponse={eligibleMethodsResponse} />
  );
};

export default CheckoutSdkPage;
