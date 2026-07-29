"use client";

/**
 * Payment status shared across the checkout examples.
 *   idle       — no payment attempt yet
 *   processing — buyer approved; capturing the order server-side
 *   success    — capture succeeded
 *   cancel     — buyer dismissed the PayPal window
 *   error      — something failed
 */
export type PaymentStatus =
  | "idle"
  | "processing"
  | "success"
  | "cancel"
  | "error";

const STATUS_UI: Record<
  Exclude<PaymentStatus, "idle">,
  { label: string; className: string }
> = {
  processing: {
    label: "Processing payment…",
    className:
      "bg-[var(--background-secondary)] text-[var(--foreground)] border-[var(--border)]",
  },
  success: {
    label: "✓ Payment successful",
    className:
      "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30",
  },
  cancel: {
    label: "Payment cancelled — no charge was made",
    className:
      "bg-[var(--background-secondary)] text-[var(--foreground-secondary)] border-[var(--border)]",
  },
  error: {
    label: "✗ Payment failed — please try again",
    className:
      "bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/30",
  },
};

/**
 * A thin status banner shown on the checkout page. Renders nothing while idle.
 */
export function PaymentStatusBar({ status }: { status: PaymentStatus }) {
  if (status === "idle") return null;

  const { label, className } = STATUS_UI[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`mb-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${className}`}
    >
      {status === "processing" && (
        <span className="w-4 h-4 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
      )}
      {label}
    </div>
  );
}
