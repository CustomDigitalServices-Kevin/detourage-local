import { describe, expect, it } from "vitest";
import { applyMaskAsAlpha, compositeOverImage, fillBackground } from "./composite";
import type { Mask, RgbaImage } from "./types";

function image(width: number, height: number, pixels: number[]): RgbaImage {
  return { data: Uint8ClampedArray.from(pixels), width, height };
}

function mask(width: number, height: number, values: number[]): Mask {
  return { data: Uint8Array.from(values), width, height };
}

const RED_OPAQUE = image(1, 1, [255, 0, 0, 255]);

describe("applyMaskAsAlpha", () => {
  it("sets alpha from the matte while preserving RGB", () => {
    expect(Array.from(applyMaskAsAlpha(RED_OPAQUE, mask(1, 1, [128])).data)).toEqual([
      255, 0, 0, 128,
    ]);
    expect(Array.from(applyMaskAsAlpha(RED_OPAQUE, mask(1, 1, [0])).data)).toEqual([255, 0, 0, 0]);
    expect(Array.from(applyMaskAsAlpha(RED_OPAQUE, mask(1, 1, [255])).data)).toEqual([
      255, 0, 0, 255,
    ]);
  });

  it("attenuates an already semi-transparent source", () => {
    const semi = image(1, 1, [255, 0, 0, 128]);
    expect(applyMaskAsAlpha(semi, mask(1, 1, [255])).data[3]).toBe(128);
  });

  it("rejects a mask of a different size", () => {
    expect(() => applyMaskAsAlpha(RED_OPAQUE, mask(2, 1, [0, 0]))).toThrow(RangeError);
  });
});

describe("fillBackground", () => {
  const blue = { r: 0, g: 0, b: 255, a: 255 };

  it("shows only the background where the matte is empty", () => {
    expect(Array.from(fillBackground(RED_OPAQUE, mask(1, 1, [0]), blue).data)).toEqual([
      0, 0, 255, 255,
    ]);
  });

  it("shows only the foreground where the matte is full", () => {
    expect(Array.from(fillBackground(RED_OPAQUE, mask(1, 1, [255]), blue).data)).toEqual([
      255, 0, 0, 255,
    ]);
  });

  it("blends at a partial matte and stays opaque", () => {
    expect(Array.from(fillBackground(RED_OPAQUE, mask(1, 1, [128]), blue).data)).toEqual([
      128, 0, 127, 255,
    ]);
  });
});

describe("compositeOverImage", () => {
  const green = image(1, 1, [0, 255, 0, 255]);

  it("keeps the foreground where the matte is full", () => {
    expect(Array.from(compositeOverImage(RED_OPAQUE, mask(1, 1, [255]), green).data)).toEqual([
      255, 0, 0, 255,
    ]);
  });

  it("keeps the background where the matte is empty", () => {
    expect(Array.from(compositeOverImage(RED_OPAQUE, mask(1, 1, [0]), green).data)).toEqual([
      0, 255, 0, 255,
    ]);
  });

  it("produces a transparent pixel when both foreground and background are clear", () => {
    const clearFg = image(1, 1, [255, 0, 0, 0]);
    const clearBg = image(1, 1, [0, 255, 0, 0]);
    expect(Array.from(compositeOverImage(clearFg, mask(1, 1, [255]), clearBg).data)).toEqual([
      0, 0, 0, 0,
    ]);
  });

  it("rejects a background of a different size", () => {
    const wideBg = image(2, 1, [0, 0, 0, 255, 0, 0, 0, 255]);
    expect(() => compositeOverImage(RED_OPAQUE, mask(1, 1, [255]), wideBg)).toThrow(RangeError);
  });
});
