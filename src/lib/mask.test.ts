import { describe, expect, it } from "vitest";
import { invertMask, resizeMaskBilinear, thresholdMask } from "./mask";
import type { Mask } from "./types";

function mask(width: number, height: number, values: number[]): Mask {
  return { data: Uint8Array.from(values), width, height };
}

describe("resizeMaskBilinear", () => {
  it("returns an independent copy when the size is unchanged", () => {
    const src = mask(2, 2, [0, 64, 128, 255]);
    const out = resizeMaskBilinear(src, { width: 2, height: 2 });
    expect(Array.from(out.data)).toEqual([0, 64, 128, 255]);
    expect(out.data).not.toBe(src.data);
  });

  it("preserves a uniform mask at any target size", () => {
    const src = mask(3, 3, Array<number>(9).fill(200));
    const out = resizeMaskBilinear(src, { width: 7, height: 5 });
    expect(out.width).toBe(7);
    expect(out.height).toBe(5);
    expect(Array.from(out.data).every((v) => v === 200)).toBe(true);
  });

  it("interpolates a horizontal gradient with pixel-centre alignment", () => {
    const src = mask(2, 1, [0, 255]);
    const out = resizeMaskBilinear(src, { width: 4, height: 1 });
    expect(Array.from(out.data)).toEqual([0, 64, 191, 255]);
  });

  it("rejects inconsistent mask data length", () => {
    const broken: Mask = { data: new Uint8Array(3), width: 2, height: 2 };
    expect(() => resizeMaskBilinear(broken, { width: 4, height: 4 })).toThrow(RangeError);
  });

  it("rejects a non-positive target size", () => {
    const src = mask(2, 2, [0, 0, 0, 0]);
    expect(() => resizeMaskBilinear(src, { width: 0, height: 4 })).toThrow(RangeError);
  });
});

describe("thresholdMask", () => {
  it("binarises around the threshold", () => {
    const src = mask(2, 2, [10, 128, 200, 255]);
    expect(Array.from(thresholdMask(src, 128).data)).toEqual([0, 0, 255, 255]);
  });
});

describe("invertMask", () => {
  it("flips foreground and background", () => {
    const src = mask(2, 1, [0, 255]);
    expect(Array.from(invertMask(src).data)).toEqual([255, 0]);
  });
});
