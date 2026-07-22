// Public surface of the background-removal business logic. UI code imports
// from here; nothing in lib/ depends on React or the DOM tree.

export type { Size, RgbaImage, Mask, Rgba, Point } from "./types";

export { computeInferenceSize } from "./geometry";
export type { ScaledSize } from "./geometry";

export { parseColor, rgbToHex, InvalidColorError } from "./color";

export { resizeMaskBilinear, thresholdMask, invertMask } from "./mask";

export { applyMaskAsAlpha, fillBackground, compositeOverImage } from "./composite";

export { paintDab, paintStroke } from "./brush";
export type { Brush, BrushMode } from "./brush";

export { detectBackend, isWebGpuAvailable } from "./device";
export type { Backend } from "./device";

export {
  MODEL_IDS,
  INFERENCE_MAX_EDGE,
  resolveModel,
  aggregateLoadProgress,
} from "./model-config";
export type { ModelChoice, Dtype, ResolvedModel, FileProgress } from "./model-config";

export { isHeic, decodeImageFile, DecodeError } from "./decode";

export { bitmapToRgba, resizeRgba, encodePng, RasterError } from "./raster";

export { BackgroundRemover, SegmentationError } from "./segmenter";
export type { RemoverOptions, LoadProgress, LoadProgressHandler } from "./segmenter";

export { renderResult, computeCutout, renderToPngBlob } from "./pipeline";
export type { BackgroundOption, Cutout, CutoutOptions } from "./pipeline";
