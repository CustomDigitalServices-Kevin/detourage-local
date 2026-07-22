import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computeCutout, renderResult, renderToPngBlob } from "./pipeline";
import type { BackgroundOption } from "./pipeline";
import type { BackgroundRemover } from "./segmenter";
import type { Mask, RgbaImage, Size } from "./types";

// computeCutout orchestrates decode → downscale → segment → upscale. The decode
// step and the canvas-backed resize/encode live in ./decode and ./raster, both
// of which need a real browser. We mock those two modules so the ORCHESTRATION
// (which size is fed to the model, that the matte is upscaled back to the
// original resolution) is unit-testable, and drive segmentation with a
// DOCUMENTED fake remover instead of the real ONNX model.
const decodeMock = vi.hoisted(() => vi.fn<(file: File) => Promise<RgbaImage>>());
const resizeRgbaMock = vi.hoisted(() => vi.fn<(image: RgbaImage, target: Size) => RgbaImage>());
const encodePngMock = vi.hoisted(() => vi.fn<(image: RgbaImage) => Promise<Blob>>());

vi.mock("./decode", () => ({
  decodeImageFile: decodeMock,
  DecodeError: class DecodeError extends Error {},
}));

vi.mock("./raster", () => ({
  resizeRgba: resizeRgbaMock,
  encodePng: encodePngMock,
  RasterError: class RasterError extends Error {},
}));

function image(width: number, height: number, pixels: number[]): RgbaImage {
  return { data: Uint8ClampedArray.from(pixels), width, height };
}

function opaque(width: number, height: number): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    data[p * 4 + 0] = 200;
    data[p * 4 + 3] = 255;
  }
  return { data, width, height };
}

function mask(width: number, height: number, values: number[]): Mask {
  return { data: Uint8Array.from(values), width, height };
}

/**
 * A fake BackgroundRemover: no ONNX model. `segment` returns a caller-supplied
 * matte and records the image it was handed, so the test can assert the model
 * saw the DOWNSCALED image, never the full-resolution original.
 */
function fakeRemover(matte: Mask): { remover: BackgroundRemover; segment: ReturnType<typeof vi.fn> } {
  const segment = vi.fn<(image: RgbaImage) => Promise<Mask>>().mockResolvedValue(matte);
  const remover = { segment } as unknown as BackgroundRemover;
  return { remover, segment };
}

const RED_OPAQUE = image(1, 1, [255, 0, 0, 255]);

beforeEach(() => {
  decodeMock.mockReset();
  resizeRgbaMock.mockReset();
  encodePngMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("renderResult", () => {
  it("produces a transparent cutout for the transparent option", () => {
    const out = renderResult(RED_OPAQUE, mask(1, 1, [0]), { kind: "transparent" });
    expect(Array.from(out.data)).toEqual([255, 0, 0, 0]);
  });

  it("fills a solid colour for the color option", () => {
    const bg: BackgroundOption = { kind: "color", color: { r: 0, g: 0, b: 255, a: 255 } };
    const out = renderResult(RED_OPAQUE, mask(1, 1, [0]), bg);
    expect(Array.from(out.data)).toEqual([0, 0, 255, 255]);
  });

  it("composites over a replacement image for the image option", () => {
    const bg: BackgroundOption = { kind: "image", image: image(1, 1, [0, 255, 0, 255]) };
    const out = renderResult(RED_OPAQUE, mask(1, 1, [0]), bg);
    expect(Array.from(out.data)).toEqual([0, 255, 0, 255]);
  });
});

describe("computeCutout (downscale → segment → upscale)", () => {
  it("downscales to the inference size, runs the model on it, and upscales the matte back", async () => {
    // A 4x2 original with maxEdge = 2 forces a 0.5 downscale to 2x1.
    const original = opaque(4, 2);
    const downscaled = opaque(2, 1); // documented synthetic downscaled input
    // Documented synthetic matte at inference resolution: left transparent,
    // right opaque. Upscaling a 2x1 matte to 4x2 must yield a 4x2 mask.
    const smallMatte = mask(2, 1, [0, 255]);

    decodeMock.mockResolvedValue(original);
    resizeRgbaMock.mockReturnValue(downscaled);
    const { remover, segment } = fakeRemover(smallMatte);

    const file = new File([new Uint8Array([1])], "photo.png", { type: "image/png" });
    const cutout = await computeCutout(file, remover, { maxEdge: 2 });

    // Model was fed the DOWNSCALED image at the computed 2x1 inference size…
    expect(resizeRgbaMock).toHaveBeenCalledTimes(1);
    expect(resizeRgbaMock.mock.calls[0]?.[1]).toMatchObject({ width: 2, height: 1 });
    expect(segment).toHaveBeenCalledWith(downscaled);

    // …and the returned matte is upscaled back onto the full-resolution original.
    expect(cutout.original).toBe(original);
    expect(cutout.mask.width).toBe(4);
    expect(cutout.mask.height).toBe(2);
    expect(cutout.mask.data.length).toBe(8);
  });

  it("skips the downscale entirely when the image already fits within maxEdge", async () => {
    const original = opaque(2, 2);
    const matte = mask(2, 2, [0, 64, 128, 255]);

    decodeMock.mockResolvedValue(original);
    const { remover, segment } = fakeRemover(matte);

    const file = new File([new Uint8Array([1])], "small.png", { type: "image/png" });
    const cutout = await computeCutout(file, remover, { maxEdge: 1024 });

    // scale === 1: no canvas resize, and the model sees the untouched original.
    expect(resizeRgbaMock).not.toHaveBeenCalled();
    expect(segment).toHaveBeenCalledWith(original);
    expect(cutout.mask.width).toBe(2);
    expect(cutout.mask.height).toBe(2);
    expect(Array.from(cutout.mask.data)).toEqual([0, 64, 128, 255]);
  });
});

describe("renderToPngBlob", () => {
  it("renders the chosen background and encodes the composite to PNG", async () => {
    const sentinel = new Blob(["png"], { type: "image/png" });
    encodePngMock.mockResolvedValue(sentinel);

    const blob = await renderToPngBlob(RED_OPAQUE, mask(1, 1, [0]), { kind: "transparent" });

    expect(blob).toBe(sentinel);
    expect(encodePngMock).toHaveBeenCalledTimes(1);
    // The encoder receives the composited result, not the raw original: with a
    // transparent option and a zero matte, alpha is knocked out to 0.
    const encoded = encodePngMock.mock.calls[0]?.[0];
    expect(Array.from(encoded?.data ?? [])).toEqual([255, 0, 0, 0]);
  });
});
