import { describe, expect, it } from "vitest";
import {
  aggregateLoadProgress,
  INFERENCE_MAX_EDGE,
  MODEL_IDS,
  resolveModel,
} from "./model-config";

describe("resolveModel", () => {
  it("runs the fp16 birefnet weights on webgpu (only fp32/fp16 exist upstream)", () => {
    expect(resolveModel("birefnet", "webgpu")).toEqual({
      modelId: "onnx-community/BiRefNet_lite-ONNX",
      dtype: "fp16",
    });
  });

  it("reuses the same fp16 birefnet weights on the wasm fallback", () => {
    expect(resolveModel("birefnet", "wasm")).toEqual({
      modelId: "onnx-community/BiRefNet_lite-ONNX",
      dtype: "fp16",
    });
  });

  it("maps the modnet portrait option to its own model id", () => {
    expect(resolveModel("modnet", "webgpu").modelId).toBe("Xenova/modnet");
    expect(MODEL_IDS.modnet).toBe("Xenova/modnet");
  });

  it("keeps modnet at full precision on webgpu and quantized on the wasm fallback", () => {
    expect(resolveModel("modnet", "webgpu").dtype).toBe("fp32");
    expect(resolveModel("modnet", "wasm").dtype).toBe("q8");
  });

  it("keeps the inference edge at 1024", () => {
    expect(INFERENCE_MAX_EDGE).toBe(1024);
  });
});

describe("aggregateLoadProgress", () => {
  it("returns 0 when nothing is known yet", () => {
    expect(aggregateLoadProgress([])).toBe(0);
    expect(aggregateLoadProgress([{ loaded: 0, total: 0 }])).toBe(0);
  });

  it("weights files by byte size", () => {
    const progress = aggregateLoadProgress([
      { loaded: 50, total: 100 },
      { loaded: 20, total: 100 },
    ]);
    expect(progress).toBeCloseTo(0.35, 5);
  });

  it("clamps to the [0, 1] range", () => {
    expect(aggregateLoadProgress([{ loaded: 200, total: 100 }])).toBe(1);
    expect(aggregateLoadProgress([{ loaded: -10, total: 100 }])).toBe(0);
  });
});
