import type { Point, Size } from "../../lib";

/** The bounding box of a rendered canvas, as returned by getBoundingClientRect. */
export interface DisplayRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Map a pointer position (client coordinates) onto the pixel coordinates of the
 * underlying full-resolution image. The canvas is drawn at native resolution
 * and scaled by CSS, so a click at the middle of a displayed 400 px-wide canvas
 * backing a 4000 px image lands at x ≈ 2000. Coordinates are clamped to the
 * image bounds so a pointer that drifts a hair outside the element never
 * produces an out-of-range index.
 */
export function clientPointToImage(
  clientX: number,
  clientY: number,
  rect: DisplayRect,
  image: Size,
): Point {
  const nx = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width;
  const ny = rect.height === 0 ? 0 : (clientY - rect.top) / rect.height;
  const x = clamp(Math.round(nx * image.width), 0, image.width - 1);
  const y = clamp(Math.round(ny * image.height), 0, image.height - 1);
  return { x, y };
}

/**
 * Radius of the brush in image pixels given a radius expressed in displayed
 * (CSS) pixels. The user drags over the scaled-down canvas, so a 20 px on-screen
 * brush must cover proportionally more image pixels on a large photo.
 */
export function displayRadiusToImage(displayRadius: number, rect: DisplayRect, image: Size): number {
  if (rect.width === 0) return displayRadius;
  const scale = image.width / rect.width;
  return Math.max(1, Math.round(displayRadius * scale));
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
