import type { Mask, Rgba, RgbaImage } from "./types";
import { applyMaskAsAlpha, compositeOverImage, fillBackground } from "./composite";
import { computeInferenceSize } from "./geometry";
import { resizeMaskBilinear } from "./mask";
import { INFERENCE_MAX_EDGE } from "./model-config";
import { decodeImageFile } from "./decode";
import { encodePng, resizeRgba } from "./raster";
import type { BackgroundRemover } from "./segmenter";

/** How the removed background is replaced when rendering the final image. */
export type BackgroundOption =
  | { readonly kind: "transparent" }
  | { readonly kind: "color"; readonly color: Rgba }
  | { readonly kind: "image"; readonly image: RgbaImage };

/**
 * Composite the original image and its matte into the requested output. Pure:
 * given the same pixels it always produces the same result, which is why the
 * whole rendering step is unit-testable without a browser.
 */
export function renderResult(
  original: RgbaImage,
  mask: Mask,
  background: BackgroundOption,
): RgbaImage {
  switch (background.kind) {
    case "transparent":
      return applyMaskAsAlpha(original, mask);
    case "color":
      return fillBackground(original, mask, background.color);
    case "image":
      return compositeOverImage(original, mask, background.image);
  }
}

export interface Cutout {
  /** The pristine full-resolution original. */
  readonly original: RgbaImage;
  /** Full-resolution alpha matte aligned to `original`. */
  readonly mask: Mask;
}

export interface CutoutOptions {
  /** Longest edge fed to the model. Defaults to INFERENCE_MAX_EDGE (~1024). */
  readonly maxEdge?: number;
}

/**
 * Full cutout flow for one file: decode → downscale to inference size → run
 * the model → upscale the matte back to full resolution. Memory stays bounded
 * because the model only ever sees the downscaled image; the returned matte is
 * aligned to the original so any BackgroundOption can be rendered afterwards.
 */
export async function computeCutout(
  file: File,
  remover: BackgroundRemover,
  options: CutoutOptions = {},
): Promise<Cutout> {
  const original = await decodeImageFile(file);
  const maxEdge = options.maxEdge ?? INFERENCE_MAX_EDGE;

  const inference = computeInferenceSize(original, maxEdge);
  const downscaled =
    inference.scale === 1 ? original : resizeRgba(original, inference);

  const smallMask = await remover.segment(downscaled);
  const mask = resizeMaskBilinear(smallMask, original);

  return { original, mask };
}

/** Render a cutout with the chosen background and encode it to a PNG blob. */
export async function renderToPngBlob(
  original: RgbaImage,
  mask: Mask,
  background: BackgroundOption,
): Promise<Blob> {
  return encodePng(renderResult(original, mask, background));
}
