// Shared value types for the background-removal pipeline. Kept UI-free and
// framework-free so every lib/ module can be unit-tested in isolation.

/** Width/height pair in pixels. */
export interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * A full RGBA raster. `data` holds width * height * 4 bytes in row-major order
 * (R, G, B, A per pixel), exactly like the array returned by
 * CanvasRenderingContext2D.getImageData().
 */
export interface RgbaImage {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
}

/**
 * A single-channel alpha matte, one byte per pixel (0 = fully background,
 * 255 = fully foreground). Produced by the segmentation model and edited by
 * the brush tools before it is composited onto the original image.
 */
export interface Mask {
  readonly data: Uint8Array;
  readonly width: number;
  readonly height: number;
}

/** An 8-bit-per-channel colour. `a` defaults to 255 (opaque) when parsed. */
export interface Rgba {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

/** A point in image space (pixels, origin top-left). */
export interface Point {
  readonly x: number;
  readonly y: number;
}
