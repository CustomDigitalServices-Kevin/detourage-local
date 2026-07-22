import { describe, expect, it } from "vitest";
import { computeInferenceSize } from "./geometry";

describe("computeInferenceSize", () => {
  it("leaves images within maxEdge untouched (scale 1)", () => {
    expect(computeInferenceSize({ width: 800, height: 600 }, 1024)).toEqual({
      width: 800,
      height: 600,
      scale: 1,
    });
  });

  it("leaves an image exactly at maxEdge untouched", () => {
    expect(computeInferenceSize({ width: 1024, height: 512 }, 1024)).toEqual({
      width: 1024,
      height: 512,
      scale: 1,
    });
  });

  it("downscales a wide landscape by its longest edge", () => {
    expect(computeInferenceSize({ width: 2000, height: 1000 }, 1024)).toEqual({
      width: 1024,
      height: 512,
      scale: 1024 / 2000,
    });
  });

  it("downscales a tall portrait by its longest edge", () => {
    expect(computeInferenceSize({ width: 1000, height: 2000 }, 1024)).toEqual({
      width: 512,
      height: 1024,
      scale: 1024 / 2000,
    });
  });

  it("downscales a large square", () => {
    const result = computeInferenceSize({ width: 4000, height: 4000 }, 1024);
    expect(result.width).toBe(1024);
    expect(result.height).toBe(1024);
    expect(result.scale).toBeCloseTo(0.256, 5);
  });

  it("never returns a dimension below 1", () => {
    const result = computeInferenceSize({ width: 4000, height: 2 }, 8);
    expect(result.width).toBe(8);
    expect(result.height).toBe(1);
  });

  it("rejects non-positive source dimensions", () => {
    expect(() => computeInferenceSize({ width: 0, height: 100 }, 1024)).toThrow(RangeError);
    expect(() => computeInferenceSize({ width: 100, height: -5 }, 1024)).toThrow(RangeError);
  });

  it("rejects a non-positive or non-finite maxEdge", () => {
    expect(() => computeInferenceSize({ width: 100, height: 100 }, 0)).toThrow(RangeError);
    expect(() => computeInferenceSize({ width: 100, height: 100 }, Number.NaN)).toThrow(RangeError);
  });
});
