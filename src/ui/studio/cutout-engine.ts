import type { Backend, Cutout, LoadProgressHandler, RemoverOptions } from "../../lib";
import { BackgroundRemover, computeCutout } from "../../lib";

// The single seam between the React studio and the ONNX-backed lib. The UI is
// written against this interface, never against BackgroundRemover directly, so
// component tests can inject a deterministic fake and never spin up WebGPU or
// download weights. createCutoutEngine is the production wiring; it keeps ONE
// BackgroundRemover for the whole session (the ONNX session and its tens-of-MB
// weights are loaded once and reused for every image — the batch requirement).

export interface CutoutEngine {
  /** Backend actually chosen once loading has started, or null before then. */
  readonly backend: Backend | null;
  /** Prime the model, reporting download progress. Idempotent. */
  load(onProgress?: LoadProgressHandler): Promise<void>;
  /** Decode, segment and upscale one file into a full-resolution cutout. */
  cutout(file: File): Promise<Cutout>;
}

export function createCutoutEngine(options: RemoverOptions = {}): CutoutEngine {
  // Option A — force the WebGPU device. The app only ever reaches this seam
  // once WebGPU has been confirmed available (the Shell gates on it), so the
  // WASM path is never taken automatically: BiRefNet_lite's static 1024 input
  // exhausts the browser WASM heap (std::bad_alloc). A caller may still pass an
  // explicit backend (tests do); an absent option stays "webgpu".
  const remover = new BackgroundRemover({ backend: "webgpu", ...options });
  return {
    get backend(): Backend | null {
      return remover.backend;
    },
    load: (onProgress) => remover.load(onProgress),
    cutout: (file) => computeCutout(file, remover),
  };
}
