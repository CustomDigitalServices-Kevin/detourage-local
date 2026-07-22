import type { Mask, Size } from "./types";

function assertDimensions(width: number, height: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new RangeError(
      `mask dimensions must be positive integers, received ${String(width)}x${String(height)}`,
    );
  }
}

function assertConsistent(mask: Mask): void {
  assertDimensions(mask.width, mask.height);
  const expected = mask.width * mask.height;
  if (mask.data.length !== expected) {
    throw new RangeError(
      `mask data length ${String(mask.data.length)} does not match ${String(mask.width)}x${String(mask.height)} (${String(expected)})`,
    );
  }
}

function clampIndex(value: number, max: number): number {
  if (value < 0) return 0;
  if (value > max) return max;
  return value;
}

/**
 * Resize a single-channel mask with bilinear interpolation. Used to upscale
 * the low-resolution inference mask back onto the full-resolution image
 * (the memory technique), but works in both directions.
 *
 * Pixel centres are mapped with the standard (i + 0.5) convention so the
 * result stays geometrically aligned with a canvas drawImage() resize of the
 * matching RGBA image. When the target size equals the source, a defensive
 * copy is returned so callers can mutate it freely.
 */
export function resizeMaskBilinear(mask: Mask, target: Size): Mask {
  assertConsistent(mask);
  assertDimensions(target.width, target.height);

  const { data: src, width: sw, height: sh } = mask;
  const dw = target.width;
  const dh = target.height;

  if (dw === sw && dh === sh) {
    return { data: new Uint8Array(src), width: sw, height: sh };
  }

  const out = new Uint8Array(dw * dh);
  const scaleX = sw / dw;
  const scaleY = sh / dh;

  for (let y = 0; y < dh; y++) {
    const sy = (y + 0.5) * scaleY - 0.5;
    const y0 = Math.floor(sy);
    const wy = sy - y0;
    const row0 = clampIndex(y0, sh - 1) * sw;
    const row1 = clampIndex(y0 + 1, sh - 1) * sw;

    for (let x = 0; x < dw; x++) {
      const sx = (x + 0.5) * scaleX - 0.5;
      const x0 = Math.floor(sx);
      const wx = sx - x0;
      const c0 = clampIndex(x0, sw - 1);
      const c1 = clampIndex(x0 + 1, sw - 1);

      const p00 = src[row0 + c0] ?? 0;
      const p01 = src[row0 + c1] ?? 0;
      const p10 = src[row1 + c0] ?? 0;
      const p11 = src[row1 + c1] ?? 0;

      const top = p00 + (p01 - p00) * wx;
      const bottom = p10 + (p11 - p10) * wx;
      out[y * dw + x] = Math.round(top + (bottom - top) * wy);
    }
  }

  return { data: out, width: dw, height: dh };
}

/**
 * Hard-threshold a mask into a binary matte: values strictly above
 * `threshold` become 255, the rest 0. Useful for a crisp cutout without the
 * soft anti-aliased border the model produces.
 */
export function thresholdMask(mask: Mask, threshold: number): Mask {
  assertConsistent(mask);
  if (!Number.isFinite(threshold)) {
    throw new RangeError(`threshold must be a finite number, received ${String(threshold)}`);
  }
  const out = new Uint8Array(mask.data.length);
  for (let i = 0; i < mask.data.length; i++) {
    out[i] = (mask.data[i] ?? 0) > threshold ? 255 : 0;
  }
  return { data: out, width: mask.width, height: mask.height };
}

/** Invert a mask (255 - value), i.e. keep the background instead of the subject. */
export function invertMask(mask: Mask): Mask {
  assertConsistent(mask);
  const out = new Uint8Array(mask.data.length);
  for (let i = 0; i < mask.data.length; i++) {
    out[i] = 255 - (mask.data[i] ?? 0);
  }
  return { data: out, width: mask.width, height: mask.height };
}
