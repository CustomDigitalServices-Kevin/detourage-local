import type { Mask, Rgba, RgbaImage } from "./types";

function assertImageConsistent(image: RgbaImage): void {
  const expected = image.width * image.height * 4;
  if (image.data.length !== expected) {
    throw new RangeError(
      `image data length ${String(image.data.length)} does not match ${String(image.width)}x${String(image.height)} RGBA (${String(expected)})`,
    );
  }
}

function assertSameSize(image: RgbaImage, mask: Mask): void {
  if (image.width !== mask.width || image.height !== mask.height) {
    throw new RangeError(
      `image (${String(image.width)}x${String(image.height)}) and mask (${String(mask.width)}x${String(mask.height)}) must have the same dimensions`,
    );
  }
}

function assertSameImageSize(a: RgbaImage, b: RgbaImage): void {
  if (a.width !== b.width || a.height !== b.height) {
    throw new RangeError(
      `images must share dimensions: ${String(a.width)}x${String(a.height)} vs ${String(b.width)}x${String(b.height)}`,
    );
  }
}

/**
 * Effective foreground opacity of a pixel: the original alpha attenuated by
 * the matte, as a 0..1 fraction. A pixel that was already semi-transparent in
 * the source stays semi-transparent in the cutout.
 */
function coverage(originalAlpha: number, maskValue: number): number {
  return (originalAlpha / 255) * (maskValue / 255);
}

/**
 * Produce a transparent cutout: RGB is preserved, alpha becomes the original
 * alpha multiplied by the matte. This is the PNG-transparent output.
 */
export function applyMaskAsAlpha(image: RgbaImage, mask: Mask): RgbaImage {
  assertImageConsistent(image);
  assertSameSize(image, mask);

  const src = image.data;
  const out = new Uint8ClampedArray(src.length);
  const pixels = mask.data.length;

  for (let p = 0; p < pixels; p++) {
    const i = p * 4;
    out[i] = src[i] ?? 0;
    out[i + 1] = src[i + 1] ?? 0;
    out[i + 2] = src[i + 2] ?? 0;
    out[i + 3] = Math.round(coverage(src[i + 3] ?? 0, mask.data[p] ?? 0) * 255);
  }

  return { data: out, width: image.width, height: image.height };
}

/**
 * Composite the masked foreground over a solid opaque colour. The result is a
 * fully opaque image (alpha 255) — the background has been replaced.
 */
export function fillBackground(image: RgbaImage, mask: Mask, color: Rgba): RgbaImage {
  assertImageConsistent(image);
  assertSameSize(image, mask);

  const src = image.data;
  const out = new Uint8ClampedArray(src.length);
  const pixels = mask.data.length;

  for (let p = 0; p < pixels; p++) {
    const i = p * 4;
    const a = coverage(src[i + 3] ?? 0, mask.data[p] ?? 0);
    const inv = 1 - a;
    out[i] = Math.round((src[i] ?? 0) * a + color.r * inv);
    out[i + 1] = Math.round((src[i + 1] ?? 0) * a + color.g * inv);
    out[i + 2] = Math.round((src[i + 2] ?? 0) * a + color.b * inv);
    out[i + 3] = 255;
  }

  return { data: out, width: image.width, height: image.height };
}

/**
 * Composite the masked foreground over another image (a replacement
 * background of the same dimensions), using standard source-over alpha
 * blending. The background's own alpha is respected, so the output alpha is
 * the usual `fgA + bgA * (1 - fgA)`.
 */
export function compositeOverImage(
  foreground: RgbaImage,
  mask: Mask,
  background: RgbaImage,
): RgbaImage {
  assertImageConsistent(foreground);
  assertImageConsistent(background);
  assertSameSize(foreground, mask);
  assertSameImageSize(foreground, background);

  const fg = foreground.data;
  const bg = background.data;
  const out = new Uint8ClampedArray(fg.length);
  const pixels = mask.data.length;

  for (let p = 0; p < pixels; p++) {
    const i = p * 4;
    const fa = coverage(fg[i + 3] ?? 0, mask.data[p] ?? 0);
    const ba = (bg[i + 3] ?? 0) / 255;
    const outA = fa + ba * (1 - fa);

    if (outA <= 0) {
      out[i] = 0;
      out[i + 1] = 0;
      out[i + 2] = 0;
      out[i + 3] = 0;
      continue;
    }

    for (let c = 0; c < 3; c++) {
      const fgC = fg[i + c] ?? 0;
      const bgC = bg[i + c] ?? 0;
      out[i + c] = Math.round((fgC * fa + bgC * ba * (1 - fa)) / outA);
    }
    out[i + 3] = Math.round(outA * 255);
  }

  return { data: out, width: foreground.width, height: foreground.height };
}
