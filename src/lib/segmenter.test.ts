import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env, pipeline } from "@huggingface/transformers";
import { BackgroundRemover, SegmentationError } from "./segmenter";
import type { LoadProgress } from "./segmenter";
import type { RgbaImage } from "./types";

// The real @huggingface/transformers pulls in onnxruntime-web and cannot run
// under happy-dom, and downloading the ~40-90 MB weights in a unit test is out
// of the question. We mock the module with:
//  - a RawImage stub (the pipeline input wrapper the segmenter constructs),
//  - a mutable `env` object (configureLocalModels writes to it — we assert it),
//  - a `pipeline` factory that replays scripted progress events, then returns a
//    fake "remover" function whose output the test controls via `hoisted`.
// This is the DOCUMENTED fake model: no ONNX session, a caller-supplied result.
interface Hoisted {
  // What the fake remover function returns when invoked with an input image.
  removerOutput: unknown;
  // Progress events the fake pipeline replays to the progress_callback.
  progressEvents: Array<{ status: string; file: string; loaded?: number; total?: number }>;
}

const hoisted = vi.hoisted(
  (): Hoisted => ({
    removerOutput: undefined,
    progressEvents: [],
  }),
);

vi.mock("@huggingface/transformers", () => {
  class RawImage {
    readonly data: Uint8Array | Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
    readonly channels: number;
    constructor(
      data: Uint8Array | Uint8ClampedArray,
      width: number,
      height: number,
      channels: number,
    ) {
      this.data = data;
      this.width = width;
      this.height = height;
      this.channels = channels;
    }
  }

  const env = { allowRemoteModels: true, allowLocalModels: false, localModelPath: "" };

  const pipeline = vi.fn(
    (_task: string, _modelId: string, opts: { progress_callback?: (info: unknown) => void }) => {
      for (const event of hoisted.progressEvents) opts.progress_callback?.(event);
      // The fake remover: ignores the input, returns the scripted model output.
      return Promise.resolve((): unknown => hoisted.removerOutput);
    },
  );

  return { pipeline, env, RawImage };
});

/** RGBA raster whose alpha channel carries the given per-pixel matte values. */
function rgbaWithAlpha(width: number, height: number, alphas: number[]): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    data[p * 4 + 0] = 10;
    data[p * 4 + 1] = 20;
    data[p * 4 + 2] = 30;
    data[p * 4 + 3] = alphas[p] ?? 0;
  }
  return { data, width, height };
}

/** A RawImage-like model output: RGBA pixels whose alpha encodes the matte. */
function rawImageOutput(width: number, height: number, alphas: number[]): unknown {
  const data = new Uint8Array(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    data[p * 4 + 3] = alphas[p] ?? 0;
  }
  return { data, width, height, channels: 4 };
}

beforeEach(() => {
  hoisted.removerOutput = undefined;
  hoisted.progressEvents = [];
  vi.mocked(pipeline).mockClear();
  // Reset the mocked env so each test observes configureLocalModels afresh.
  env.allowRemoteModels = true;
  env.allowLocalModels = false;
  env.localModelPath = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BackgroundRemover construction", () => {
  it("defaults to the birefnet model and exposes a null backend before loading", () => {
    const remover = new BackgroundRemover();
    expect(remover.model).toBe("birefnet");
    expect(remover.backend).toBeNull();
  });

  it("honours an explicit model choice", () => {
    expect(new BackgroundRemover({ model: "modnet" }).model).toBe("modnet");
  });
});

describe("BackgroundRemover.load", () => {
  it("points transformers.js at the self-hosted weights and reports readiness", async () => {
    hoisted.progressEvents = [
      { status: "progress", file: "weights.onnx", loaded: 30, total: 60 },
      { status: "done", file: "weights.onnx" },
    ];
    const remover = new BackgroundRemover({ backend: "wasm" });
    const seen: LoadProgress[] = [];

    await remover.load((p) => seen.push(p));

    // connect-src 'self' stays intact: remote models disabled, local enabled,
    // default same-origin base path.
    expect(env.allowRemoteModels).toBe(false);
    expect(env.allowLocalModels).toBe(true);
    expect(env.localModelPath).toBe("models/");

    // Backend resolved; BiRefNet ships no q8, so the fp16 weights are used on
    // the CPU/WASM path too (onnxruntime-web computes fp16 ops in fp32).
    expect(remover.backend).toBe("wasm");
    expect(vi.mocked(pipeline)).toHaveBeenCalledTimes(1);
    const call = vi.mocked(pipeline).mock.calls[0];
    expect(call?.[1]).toBe("onnx-community/BiRefNet_lite-ONNX");
    expect(call?.[2]).toMatchObject({ device: "wasm", dtype: "fp16" });

    // A mid-download fraction (30/60) surfaced, and the final event is ready.
    expect(seen.some((p) => Math.abs(p.fraction - 0.5) < 1e-9)).toBe(true);
    expect(seen.at(-1)).toEqual({ fraction: 1, ready: true });
  });

  it("uses a custom local model path when provided", async () => {
    const remover = new BackgroundRemover({ backend: "wasm", localModelPath: "assets/onnx/" });
    await remover.load();
    expect(env.localModelPath).toBe("assets/onnx/");
  });

  it("selects fp16 weights on the WebGPU backend", async () => {
    const remover = new BackgroundRemover({ backend: "webgpu" });
    await remover.load();
    expect(vi.mocked(pipeline).mock.calls[0]?.[2]).toMatchObject({
      device: "webgpu",
      dtype: "fp16",
    });
  });

  it("builds the pipeline only once across repeated loads", async () => {
    const remover = new BackgroundRemover({ backend: "wasm" });
    await remover.load();
    await remover.load();
    expect(vi.mocked(pipeline)).toHaveBeenCalledTimes(1);
  });
});

describe("BackgroundRemover.segment", () => {
  it("extracts the alpha channel of an RGBA result as the matte", async () => {
    hoisted.removerOutput = rawImageOutput(2, 1, [12, 250]);
    const remover = new BackgroundRemover({ backend: "wasm" });

    const mask = await remover.segment(rgbaWithAlpha(2, 1, [255, 255]));

    expect(mask.width).toBe(2);
    expect(mask.height).toBe(1);
    expect(Array.from(mask.data)).toEqual([12, 250]);
  });

  it("unwraps an array-wrapped model result", async () => {
    hoisted.removerOutput = [rawImageOutput(1, 1, [77])];
    const remover = new BackgroundRemover({ backend: "wasm" });

    const mask = await remover.segment(rgbaWithAlpha(1, 1, [255]));
    expect(Array.from(mask.data)).toEqual([77]);
  });

  it("rejects an input whose data length does not match its dimensions, before loading", async () => {
    const remover = new BackgroundRemover({ backend: "wasm" });
    const malformed: RgbaImage = { data: new Uint8ClampedArray(3), width: 2, height: 1 };

    await expect(remover.segment(malformed)).rejects.toBeInstanceOf(SegmentationError);
    // The guard runs before any model work: the pipeline is never built.
    expect(vi.mocked(pipeline)).not.toHaveBeenCalled();
  });

  it("rejects a non-RGBA model result", async () => {
    hoisted.removerOutput = { data: new Uint8Array(2), width: 2, height: 1, channels: 1 };
    const remover = new BackgroundRemover({ backend: "wasm" });

    await expect(remover.segment(rgbaWithAlpha(2, 1, [255, 255]))).rejects.toThrow(
      SegmentationError,
    );
  });

  it("rejects an unrecognised model result shape", async () => {
    hoisted.removerOutput = { unexpected: true };
    const remover = new BackgroundRemover({ backend: "wasm" });

    await expect(remover.segment(rgbaWithAlpha(1, 1, [255]))).rejects.toThrow(SegmentationError);
  });
});

describe("SegmentationError", () => {
  it("is an Error subclass with the segmentation name", () => {
    const error = new SegmentationError("bad matte");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("SegmentationError");
  });
});
