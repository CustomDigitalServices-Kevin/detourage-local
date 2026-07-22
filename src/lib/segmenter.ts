import { pipeline, env, RawImage } from "@huggingface/transformers";
import type { ProgressInfo } from "@huggingface/transformers";
import type { Backend } from "./device";
import { detectBackend } from "./device";
import type { Dtype, FileProgress, ModelChoice } from "./model-config";
import { aggregateLoadProgress, resolveModel } from "./model-config";
import type { Mask, RgbaImage } from "./types";

/** Thrown when the model output cannot be turned into a usable matte. */
export class SegmentationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SegmentationError";
  }
}

export interface LoadProgress {
  /** Overall model download completion, 0..1. */
  readonly fraction: number;
  /** True once the pipeline is fully initialised and ready to segment. */
  readonly ready: boolean;
}

export type LoadProgressHandler = (progress: LoadProgress) => void;

export interface RemoverOptions {
  /** Which self-hosted model to run. Defaults to "birefnet". */
  readonly model?: ModelChoice;
  /** Force a backend; omit to auto-detect WebGPU with WASM fallback. */
  readonly backend?: Backend;
  /**
   * Same-origin base path where the ONNX weights live. Kept relative so the
   * build works under any deployment sub-path; the browser resolves it against
   * the document base URL and connect-src 'self' is preserved.
   */
  readonly localModelPath?: string;
}

// Point Transformers.js at the self-hosted weights: no network fetch to the
// Hugging Face Hub at runtime, which is what keeps the "100% local" promise
// honest and the strict CSP intact.
function configureLocalModels(localModelPath: string): void {
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = localModelPath;
}

// Isolated so its awaited return type can be captured for the pipeline field
// without hand-writing the library's callable intersection type.
function createRemover(
  modelId: string,
  device: Backend,
  dtype: Dtype,
  progressCallback: (info: ProgressInfo) => void,
) {
  return pipeline("background-removal", modelId, {
    device,
    dtype,
    progress_callback: progressCallback,
  });
}

type RemoverPipeline = Awaited<ReturnType<typeof createRemover>>;

function trackDownload(files: Map<string, FileProgress>, info: ProgressInfo): void {
  if (info.status === "progress") {
    files.set(info.file, { loaded: info.loaded, total: info.total });
  } else if (info.status === "done") {
    const existing = files.get(info.file);
    if (existing !== undefined) {
      files.set(info.file, { loaded: existing.total, total: existing.total });
    }
  }
}

// Structural view of the RawImage the pipeline returns. Kept local (rather
// than leaning on the library's callable-but-`any` return type) so the model
// output is narrowed through a real type guard instead of an unsafe cast.
interface RawImageLike {
  readonly data: Uint8Array | Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly channels: number;
}

function isRawImageLike(value: unknown): value is RawImageLike {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    (candidate["data"] instanceof Uint8Array || candidate["data"] instanceof Uint8ClampedArray) &&
    typeof candidate["width"] === "number" &&
    typeof candidate["height"] === "number" &&
    typeof candidate["channels"] === "number"
  );
}

function extractAlphaMask(image: RawImageLike): Mask {
  const { data, width, height, channels } = image;
  if (channels !== 4) {
    throw new SegmentationError(`expected an RGBA result, received ${String(channels)} channels`);
  }
  const mask = new Uint8Array(width * height);
  for (let p = 0; p < mask.length; p++) {
    mask[p] = data[p * 4 + 3] ?? 0;
  }
  return { data: mask, width, height };
}

/**
 * Loads a self-hosted segmentation model once and reuses the session for every
 * image (batch-friendly: the tens-of-MB weights are never reloaded between
 * images). Call load() to prime the model with a progress bar, then segment()
 * per image; both are safe to call concurrently — the pipeline is built once.
 */
export class BackgroundRemover {
  readonly model: ModelChoice;
  readonly #forcedBackend: Backend | undefined;
  readonly #localModelPath: string;
  #loadPromise: Promise<RemoverPipeline> | null = null;
  #resolvedBackend: Backend | null = null;

  constructor(options: RemoverOptions = {}) {
    this.model = options.model ?? "birefnet";
    this.#forcedBackend = options.backend;
    this.#localModelPath = options.localModelPath ?? "models/";
  }

  /** The backend actually chosen, once the model has started loading. */
  get backend(): Backend | null {
    return this.#resolvedBackend;
  }

  /** Prime the model, reporting download progress. Idempotent. */
  async load(onProgress?: LoadProgressHandler): Promise<void> {
    await this.#getPipeline(onProgress);
  }

  /**
   * Run the model on one downscaled image and return its alpha matte at the
   * same resolution. The caller upscales the matte back to the original size.
   */
  async segment(image: RgbaImage): Promise<Mask> {
    if (image.data.length !== image.width * image.height * 4) {
      throw new SegmentationError(
        `image data length ${String(image.data.length)} does not match ${String(image.width)}x${String(image.height)} RGBA`,
      );
    }
    const remover = await this.#getPipeline();
    const input = new RawImage(image.data, image.width, image.height, 4);
    const output: unknown = await remover(input);
    const result: unknown = Array.isArray(output) ? output[0] : output;
    if (!isRawImageLike(result)) {
      throw new SegmentationError("model returned an unexpected result");
    }
    return extractAlphaMask(result);
  }

  #getPipeline(onProgress?: LoadProgressHandler): Promise<RemoverPipeline> {
    this.#loadPromise ??= this.#buildPipeline(onProgress);
    return this.#loadPromise;
  }

  async #buildPipeline(onProgress?: LoadProgressHandler): Promise<RemoverPipeline> {
    configureLocalModels(this.#localModelPath);
    const backend = this.#forcedBackend ?? (await detectBackend());
    this.#resolvedBackend = backend;

    const { modelId, dtype } = resolveModel(this.model, backend);
    const files = new Map<string, FileProgress>();

    const handleProgress = (info: ProgressInfo): void => {
      trackDownload(files, info);
      onProgress?.({ fraction: aggregateLoadProgress(files.values()), ready: false });
    };

    const remover = await createRemover(modelId, backend, dtype, handleProgress);
    onProgress?.({ fraction: 1, ready: true });
    return remover;
  }
}
