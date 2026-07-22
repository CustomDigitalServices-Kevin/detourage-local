import type { Size } from "./types";

export interface ScaledSize {
  readonly width: number;
  readonly height: number;
  /**
   * Ratio applied to the source. Always <= 1: the inference pass never
   * upscales — that would waste memory without adding detail.
   */
  readonly scale: number;
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number, received ${String(value)}`);
  }
}

/**
 * Compute the size at which an image is fed to the segmentation model.
 *
 * The mandatory memory technique: large photos are downscaled so the longest
 * edge is at most `maxEdge` (≈1024 px) before inference, then the resulting
 * mask is bilinearly upscaled back onto the full-resolution original. Running
 * the model directly on a 4000 px photo would allocate hundreds of MB of
 * tensors and frequently crash the tab.
 *
 * Images already within `maxEdge` are returned untouched (scale = 1).
 */
export function computeInferenceSize(source: Size, maxEdge: number): ScaledSize {
  assertPositiveFinite(source.width, "source.width");
  assertPositiveFinite(source.height, "source.height");
  assertPositiveFinite(maxEdge, "maxEdge");

  const longest = Math.max(source.width, source.height);
  if (longest <= maxEdge) {
    return { width: Math.round(source.width), height: Math.round(source.height), scale: 1 };
  }

  const scale = maxEdge / longest;
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  return { width, height, scale };
}
