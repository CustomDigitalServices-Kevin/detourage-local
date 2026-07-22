import type { ReactElement } from "react";

interface SpinnerProps {
  className?: string;
}

/** A minimal spinning ring, used while the model loads or a cutout runs. */
export function Spinner({ className = "size-4" }: SpinnerProps): ReactElement {
  return (
    <span
      role="status"
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 border-line-strong border-t-orange ${className}`}
    />
  );
}
