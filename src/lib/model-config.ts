import type { Backend } from "./device";

/**
 * Available segmentation models. Both are self-hosted under public/models/ so
 * inference stays same-origin (connect-src 'self').
 *
 * - birefnet: onnx-community/BiRefNet_lite-ONNX (MIT) — best quality, general
 *   subjects. Default.
 * - modnet:   Xenova/modnet (Apache-2.0) — lighter, tuned for portraits, the
 *   "fast portrait" option.
 *
 * BRIA RMBG (CC BY-NC) and @imgly/background-removal (AGPL) are deliberately
 * excluded — see public/models/README.md and scripts/check-licenses.mjs.
 */
export type ModelChoice = "birefnet" | "modnet";

/** ONNX weight precision, mapped onto the files each model ships. */
export type Dtype = "fp32" | "fp16" | "q8";

export const MODEL_IDS: Readonly<Record<ModelChoice, string>> = {
  birefnet: "onnx-community/BiRefNet_lite-ONNX",
  modnet: "Xenova/modnet",
};

/**
 * Longest edge (px) fed to the model. ≈1024 keeps tensor memory bounded on
 * large photos while preserving enough detail for a clean matte. The mask is
 * upscaled back to full resolution afterwards.
 */
export const INFERENCE_MAX_EDGE = 1024;

export interface ResolvedModel {
  readonly modelId: string;
  readonly dtype: Dtype;
}

/**
 * Pick the model id and weight precision for a backend.
 *
 * BiRefNet_lite-ONNX ships only two variants — fp32 (`model.onnx`, ~214 MiB)
 * and fp16 (`model_fp16.onnx`, ~109 MiB); there is no quantized (q8) export in
 * that repo. fp16 is therefore the lightest self-hostable weight and we use it
 * on both backends: WebGPU runs fp16 natively, and the WASM/CPU fallback loads
 * the same file (onnxruntime-web computes fp16 ops in fp32). Sharing one file
 * halves the download versus fp32 and keeps a single asset in the dist.
 *
 * modnet (Xenova/modnet) does ship a quantized export, so it keeps the classic
 * split: full precision on WebGPU, quantized q8 on the WASM/CPU fallback.
 */
export function resolveModel(choice: ModelChoice, backend: Backend): ResolvedModel {
  if (choice === "birefnet") {
    return { modelId: MODEL_IDS.birefnet, dtype: "fp16" };
  }
  return {
    modelId: MODEL_IDS[choice],
    dtype: backend === "webgpu" ? "fp32" : "q8",
  };
}

export interface FileProgress {
  /** Bytes downloaded so far. */
  readonly loaded: number;
  /** Total bytes for the file (0 when the server sent no content-length). */
  readonly total: number;
}

/**
 * Aggregate per-file download progress into a single 0..1 fraction, weighted
 * by byte size so a large weights file dominates the bar. Returns 0 when no
 * byte totals are known yet (avoids a jumpy bar at the very start). The result
 * is clamped to [0, 1].
 */
export function aggregateLoadProgress(files: Iterable<FileProgress>): number {
  let loaded = 0;
  let total = 0;
  for (const file of files) {
    loaded += Math.max(0, file.loaded);
    total += Math.max(0, file.total);
  }
  if (total === 0) return 0;
  return Math.min(1, Math.max(0, loaded / total));
}
