import type { RgbaImage, Size } from "./types";

// Canvas-backed raster helpers. These are the only lib/ functions that touch
// browser drawing APIs; the rest of the pipeline operates on plain typed
// arrays so it stays unit-testable. OffscreenCanvas is used when available
// (works inside a worker), with an HTMLCanvasElement fallback.

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
type AnyContext2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

/** Thrown when a 2D context or PNG encode cannot be obtained from a canvas. */
export class RasterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RasterError";
  }
}

function createCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  throw new RasterError("no canvas implementation available in this environment");
}

function get2d(canvas: AnyCanvas): AnyContext2D {
  // getContext("2d") is resolved per concrete canvas type: calling it on the
  // union widens the result to the "2d" | "bitmaprenderer" | ... overload, so
  // each branch is narrowed first to get the plain 2D context type.
  const ctx: AnyContext2D | null =
    typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas
      ? canvas.getContext("2d")
      : (canvas as HTMLCanvasElement).getContext("2d");
  if (ctx === null) {
    throw new RasterError("could not acquire a 2D canvas context");
  }
  return ctx;
}

function toImageData(image: RgbaImage): ImageData {
  // Copy into a fresh ArrayBuffer-backed array: the ImageData constructor
  // rejects the SharedArrayBuffer-capable Uint8ClampedArray<ArrayBufferLike>
  // type our rasters carry.
  return new ImageData(new Uint8ClampedArray(image.data), image.width, image.height);
}

function readImageData(ctx: AnyContext2D, width: number, height: number): RgbaImage {
  const imageData = ctx.getImageData(0, 0, width, height);
  return { data: imageData.data, width, height };
}

/** Convert a decoded ImageBitmap into a plain RGBA raster. */
export function bitmapToRgba(bitmap: ImageBitmap): RgbaImage {
  const canvas = createCanvas(bitmap.width, bitmap.height);
  const ctx = get2d(canvas);
  ctx.drawImage(bitmap, 0, 0);
  return readImageData(ctx, bitmap.width, bitmap.height);
}

/**
 * Resize an RGBA raster using the browser's built-in smoothing. Used to
 * downscale the input to the inference size before the model runs.
 */
export function resizeRgba(image: RgbaImage, target: Size): RgbaImage {
  if (target.width === image.width && target.height === image.height) {
    return { data: new Uint8ClampedArray(image.data), width: image.width, height: image.height };
  }

  const source = createCanvas(image.width, image.height);
  get2d(source).putImageData(toImageData(image), 0, 0);

  const dest = createCanvas(target.width, target.height);
  const ctx = get2d(dest);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, target.width, target.height);
  return readImageData(ctx, target.width, target.height);
}

/** Encode an RGBA raster to a PNG blob (lossless, alpha-preserving). */
export async function encodePng(image: RgbaImage): Promise<Blob> {
  const canvas = createCanvas(image.width, image.height);
  get2d(canvas).putImageData(toImageData(image), 0, 0);

  if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: "image/png" });
  }

  const htmlCanvas = canvas as HTMLCanvasElement;
  return new Promise<Blob>((resolve, reject) => {
    htmlCanvas.toBlob((blob) => {
      if (blob === null) {
        reject(new RasterError("PNG encoding failed (toBlob returned null)"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}
