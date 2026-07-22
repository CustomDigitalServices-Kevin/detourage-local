import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useWebGpuAvailability } from "./use-webgpu";

describe("useWebGpuAvailability", () => {
  it("starts in the checking state before the probe resolves", () => {
    const { result } = renderHook(() => useWebGpuAvailability(() => new Promise<boolean>(() => {})));
    expect(result.current).toBe("checking");
  });

  it("reports available when the probe resolves true", async () => {
    const { result } = renderHook(() => useWebGpuAvailability(() => Promise.resolve(true)));
    await waitFor(() => {
      expect(result.current).toBe("available");
    });
  });

  it("reports unavailable when the probe resolves false", async () => {
    const { result } = renderHook(() => useWebGpuAvailability(() => Promise.resolve(false)));
    await waitFor(() => {
      expect(result.current).toBe("unavailable");
    });
  });
});
