import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// RTL auto-cleanup only runs with injected globals; register it explicitly.
afterEach(() => {
  cleanup();
});

// happy-dom does not always provide the object-URL API the preview flow relies
// on. Provide a minimal, deterministic shim so component tests can exercise the
// real add/remove code paths (the browser and the E2E suite use the native
// implementation).
if (typeof URL.createObjectURL !== "function") {
  let counter = 0;
  URL.createObjectURL = (): string => `blob:test-${(counter++).toString()}`;
}
if (typeof URL.revokeObjectURL !== "function") {
  URL.revokeObjectURL = (): void => {
    /* no-op: nothing to release for the shimmed blob URLs above */
  };
}
