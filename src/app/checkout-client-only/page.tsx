import CheckoutClientOnlyClient from "./CheckoutClientOnlyClient";

// No server action here on purpose: this page tests a pure client-side
// eligibility fetch via useEligibleMethods(), with no server hydration.
const CheckoutClientOnlyPage = () => {
  return <CheckoutClientOnlyClient />;
};

export default CheckoutClientOnlyPage;
