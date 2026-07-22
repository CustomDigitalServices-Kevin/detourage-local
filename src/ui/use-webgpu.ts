import { useEffect, useRef, useState } from "react";
import { isWebGpuAvailable } from "../lib";

/**
 * Lifecycle of the one-shot WebGPU probe:
 *  - "checking": the async adapter request is in flight (first paint);
 *  - "available": a real GPU adapter was obtained — inference may run;
 *  - "unavailable": no adapter — the app must refuse to launch inference.
 */
export type WebGpuStatus = "checking" | "available" | "unavailable";

/**
 * Probe WebGPU exactly once on mount and expose the result. The probe is
 * injectable so component tests stay deterministic without spinning up a real
 * GPU adapter. A ref guards against a state update after unmount (or after the
 * probe identity changes) without leaking the resolved value into stale state.
 */
export function useWebGpuAvailability(
  probe: () => Promise<boolean> = isWebGpuAvailable,
): WebGpuStatus {
  const [status, setStatus] = useState<WebGpuStatus>("checking");
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    void (async (): Promise<void> => {
      const ok = await probe();
      if (!cancelled.current) setStatus(ok ? "available" : "unavailable");
    })();
    return (): void => {
      cancelled.current = true;
    };
  }, [probe]);

  return status;
}
