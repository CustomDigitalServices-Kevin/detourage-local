import { describe, expect, it } from "vitest";
import { detectBackend, isWebGpuAvailable } from "./device";

describe("isWebGpuAvailable", () => {
  it("is false when navigator has no gpu", async () => {
    await expect(isWebGpuAvailable({})).resolves.toBe(false);
  });

  it("is true when a real adapter is obtainable", async () => {
    const nav = { gpu: { requestAdapter: () => Promise.resolve({}) } };
    await expect(isWebGpuAvailable(nav)).resolves.toBe(true);
  });

  it("is false when the adapter request resolves null", async () => {
    const nav = { gpu: { requestAdapter: () => Promise.resolve(null) } };
    await expect(isWebGpuAvailable(nav)).resolves.toBe(false);
  });

  it("is false when the adapter request throws", async () => {
    const nav = {
      gpu: {
        requestAdapter: () => {
          throw new Error("no gpu");
        },
      },
    };
    await expect(isWebGpuAvailable(nav)).resolves.toBe(false);
  });
});

describe("detectBackend", () => {
  it("falls back to wasm when navigator has no gpu", async () => {
    await expect(detectBackend({})).resolves.toBe("wasm");
  });

  it("selects webgpu when an adapter is available", async () => {
    const nav = { gpu: { requestAdapter: () => Promise.resolve({}) } };
    await expect(detectBackend(nav)).resolves.toBe("webgpu");
  });

  it("falls back to wasm when the adapter request resolves null", async () => {
    const nav = { gpu: { requestAdapter: () => Promise.resolve(null) } };
    await expect(detectBackend(nav)).resolves.toBe("wasm");
  });

  it("falls back to wasm when the adapter request throws", async () => {
    const nav = {
      gpu: {
        requestAdapter: () => {
          throw new Error("no gpu");
        },
      },
    };
    await expect(detectBackend(nav)).resolves.toBe("wasm");
  });
});
