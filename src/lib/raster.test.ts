import { describe, expect, it } from "vitest";
import { RasterError, bitmapToRgba, encodePng, resizeRgba } from "./raster";
import type { RgbaImage } from "./types";

// NOTE ON ENVIRONMENT: raster.ts is the only lib module that drives the browser
// canvas 2D API (drawImage / getImageData / convertToBlob). Under the happy-dom
// test environment, canvas.getContext("2d") returns null, so every code path
// that needs a real 2D context throws RasterError. That is exactly the failure
// contract we assert here (get2d must surface a RasterError, never a raw
// TypeError). The *successful* pixel round-trips are exercised end-to-end in a
// real browser by the Playwright E2E suite, where a genuine 2D context exists.

function image(width: number, height: number, pixels: number[]): RgbaImage {
  return { data: Uint8ClampedArray.from(pixels), width, height };
}

describe("RasterError", () => {
  it("is an Error subclass carrying the raster name", () => {
    const error = new RasterError("boom");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("RasterError");
    expect(error.message).toBe("boom");
  });
});

describe("resizeRgba", () => {
  it("returns a defensive copy without touching the canvas when the size is unchanged", () => {
    const source = image(2, 1, [1, 2, 3, 4, 5, 6, 7, 8]);
    const out = resizeRgba(source, { width: 2, height: 1 });

    expect(out.width).toBe(2);
    expect(out.height).toBe(1);
    expect(Array.from(out.data)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    // Distinct backing buffer: mutating the copy must not affect the source.
    out.data[0] = 200;
    expect(source.data[0]).toBe(1);
  });

  it("throws RasterError when an actual resize needs a 2D context that is unavailable", () => {
    const source = image(2, 1, [1, 2, 3, 4, 5, 6, 7, 8]);
    expect(() => resizeRgba(source, { width: 1, height: 1 })).toThrow(RasterError);
  });
});

describe("bitmapToRgba", () => {
  it("throws RasterError when no 2D context can be acquired", () => {
    // A structural stand-in for ImageBitmap: bitmapToRgba only reads width /
    // height before it needs the (unavailable) 2D context.
    const fakeBitmap = { width: 2, height: 2, close: () => undefined } as unknown as ImageBitmap;
    expect(() => bitmapToRgba(fakeBitmap)).toThrow(RasterError);
  });
});

describe("encodePng", () => {
  it("rejects with RasterError when the canvas has no 2D context", async () => {
    await expect(encodePng(image(1, 1, [255, 0, 0, 255]))).rejects.toBeInstanceOf(RasterError);
  });
});
