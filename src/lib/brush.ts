import type { Mask, Point } from "./types";

/** Restore pushes matte values toward 255 (keep), erase toward 0 (remove). */
export type BrushMode = "restore" | "erase";

export interface Brush {
  /** Radius of the stamp in pixels (image space). */
  readonly radius: number;
  /**
   * Edge softness, 0..1. 1 = hard circle (full strength to the rim), 0 =
   * fully feathered (strength falls to zero from the very centre).
   */
  readonly hardness: number;
  readonly mode: BrushMode;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function assertConsistent(mask: Mask): void {
  if (mask.data.length !== mask.width * mask.height) {
    throw new RangeError(
      `mask data length ${String(mask.data.length)} does not match ${String(mask.width)}x${String(mask.height)}`,
    );
  }
}

/**
 * Stamp a single soft dab into a mutable mask buffer. Pixels within
 * `radius` of (cx, cy) are blended toward the mode's target value by a
 * strength that follows the hardness falloff. Mutates `data` in place.
 */
function stampDab(
  data: Uint8Array,
  width: number,
  height: number,
  cx: number,
  cy: number,
  brush: Brush,
): void {
  const radius = Math.max(0, brush.radius);
  if (radius === 0) return;

  const hardness = clamp01(brush.hardness);
  const target = brush.mode === "restore" ? 255 : 0;
  const inner = radius * hardness;
  const falloff = radius - inner;

  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(width - 1, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(height - 1, Math.ceil(cy + radius));

  for (let y = minY; y <= maxY; y++) {
    const dy = y - cy;
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;

      const strength = dist <= inner || falloff === 0 ? 1 : clamp01(1 - (dist - inner) / falloff);
      if (strength === 0) continue;

      const idx = y * width + x;
      const current = data[idx] ?? 0;
      data[idx] = Math.round(current + (target - current) * strength);
    }
  }
}

/** Paint a single dab at one point, returning a new mask. */
export function paintDab(mask: Mask, at: Point, brush: Brush): Mask {
  assertConsistent(mask);
  const data = new Uint8Array(mask.data);
  stampDab(data, mask.width, mask.height, at.x, at.y, brush);
  return { data, width: mask.width, height: mask.height };
}

/**
 * Paint a continuous stroke between two points by stamping overlapping dabs
 * along the segment (spacing derived from the radius so the line stays solid).
 * Returns a new mask; the input is untouched. Copying the buffer once and
 * stamping every dab into it keeps a stroke O(pixels-touched), not
 * O(dabs × total-pixels).
 */
export function paintStroke(mask: Mask, from: Point, to: Point, brush: Brush): Mask {
  assertConsistent(mask);
  const data = new Uint8Array(mask.data);
  const { width, height } = mask;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const spacing = Math.max(1, brush.radius / 4);
  const steps = Math.max(1, Math.ceil(distance / spacing));

  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    stampDab(data, width, height, from.x + dx * t, from.y + dy * t, brush);
  }

  return { data, width, height };
}
