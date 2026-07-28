"use client";

export const SCENARIOS = [
  {
    href: "/checkout",
    label: "Server hydration + client fetch (both)",
    description:
      "Custom REST server action hydrates PayPalProvider AND the client also calls useEligibleMethods(). Redundant on purpose.",
  },
  {
    href: "/checkout-server-sdk",
    label: "Server hydration via SDK method only",
    description:
      "react-paypal-js's own fetchEligibleMethods (from sdk-v6/server) hydrates PayPalProvider. No client-side fetch.",
  },
  {
    href: "/checkout-server-rest",
    label: "Server hydration via custom REST only",
    description:
      "REST fetch to the eligibility endpoint hydrates PayPalProvider. No client-side fetch.",
  },
  {
    href: "/checkout-client-only",
    label: "Client-side fetch only",
    description:
      "No server hydration. useEligibleMethods() fetches eligibility entirely on the client.",
  },
];

const CheckoutScenarios = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (href: string) => void;
}) => {
  return (
    <div role="radiogroup" aria-label="Eligibility test scenario" className="grid gap-3 sm:grid-cols-2">
      {SCENARIOS.map((scenario) => (
        <label
          key={scenario.href}
          className={`text-left p-4 rounded-2xl border cursor-pointer transition-colors ${
            value === scenario.href
              ? "border-[var(--accent)]"
              : "border-[var(--border)] hover:border-[var(--accent)]"
          }`}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="checkout-scenario"
              value={scenario.href}
              checked={value === scenario.href}
              onChange={() => onChange(scenario.href)}
              className="mt-1"
            />
            <div>
              <p className="text-sm font-medium text-[var(--foreground)] mb-1">
                {scenario.label}
              </p>
              <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">
                {scenario.description}
              </p>
            </div>
          </div>
        </label>
      ))}
    </div>
  );
};

export default CheckoutScenarios;
