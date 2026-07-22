// Runtime backend selection for the ONNX inference session.
//
// This tool ships as WebGPU-only (Option A): BiRefNet_lite exports a static
// 1024x1024 input, and the fp16->fp32 activations at that size exhaust the
// browser WASM heap (onnxruntime-web aborts with std::bad_alloc, proven
// 2026-07-22). So the WASM path is never taken automatically in production —
// the UI probes WebGPU up front (isWebGpuAvailable) and refuses to launch any
// inference when it is missing. The "wasm" backend remains a valid, explicit,
// caller-forced option (unit tests and native tooling exercise it), which is
// why detectBackend still knows about it.

export type Backend = "webgpu" | "wasm";

interface GpuLike {
  requestAdapter(): Promise<unknown>;
}

interface NavigatorGpuLike {
  readonly gpu?: GpuLike;
}

function defaultNavigator(): NavigatorGpuLike | undefined {
  return typeof navigator === "undefined" ? undefined : (navigator as NavigatorGpuLike);
}

/**
 * True only when a real WebGPU adapter is obtainable. `navigator.gpu` can be
 * present yet still hand back null on machines with no compatible adapter, so
 * we actually request one. Never throws — any failure to probe is treated as
 * "WebGPU unavailable". This is the single source of truth the UI gates on.
 */
export async function isWebGpuAvailable(
  nav: NavigatorGpuLike | undefined = defaultNavigator(),
): Promise<boolean> {
  const gpu = nav?.gpu;
  if (gpu === undefined) return false;

  try {
    const adapter = await gpu.requestAdapter();
    return adapter !== null && adapter !== undefined;
  } catch {
    return false;
  }
}

/**
 * Resolve the fastest usable backend: "webgpu" when an adapter is obtainable,
 * otherwise "wasm". Kept as the honest backend classifier; production forces
 * "webgpu" (see createCutoutEngine) and never relies on the "wasm" branch.
 */
export async function detectBackend(
  nav: NavigatorGpuLike | undefined = defaultNavigator(),
): Promise<Backend> {
  return (await isWebGpuAvailable(nav)) ? "webgpu" : "wasm";
}
