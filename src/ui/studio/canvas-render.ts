import type { RgbaImage } from "../../lib";

// Paint a plain RGBA raster onto a visible <canvas>. The canvas backing store
// is sized to the image's native resolution and displayed responsively via CSS
// (width: 100%), so previews stay crisp while the layout stays fluid. This is
// the single spot where the editor touches a DOM canvas; everything upstream is
// framework-free typed arrays.

/** Thrown when a 2D drawing context cannot be acquired from the canvas. */
export class CanvasRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CanvasRenderError";
  }
}

export function drawRgbaToCanvas(canvas: HTMLCanvasElement, image: RgbaImage): void {
  if (canvas.width !== image.width) canvas.width = image.width;
  if (canvas.height !== image.height) canvas.height = image.height;

  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new CanvasRenderError("could not acquire a 2D canvas context");
  }

  // Copy into a fresh ArrayBuffer-backed array: ImageData rejects the
  // SharedArrayBuffer-capable typed array the rasters may carry.
  const data = new Uint8ClampedArray(image.data);
  ctx.putImageData(new ImageData(data, image.width, image.height), 0, 0);
}
