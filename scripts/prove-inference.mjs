// Native (onnxruntime-node) proof that the SELF-HOSTED BiRefNet_lite weights
// really segment foreground from background — real inference, no mock.
//
// Why native and not the browser: the ONNX model has a STATIC 1024x1024 input
// (verified: feeding 512 yields "invalid dimensions ... Expected: 1024"), and
// its fp16->fp32 activations at that resolution exceed the browser WASM heap
// ceiling (std::bad_alloc, both single-threaded and cross-origin-isolated).
// onnxruntime-node runs the same weights on the native CPU EP with system RAM,
// so it isolates the question "do the weights + the tool's transformers.js
// pipeline actually produce a correct matte?" from the browser memory ceiling.
//
// It loads the model from public/models with allowRemoteModels=false (100%
// local, same file the browser tool ships) and runs the identical
// transformers.js "background-removal" pipeline the app uses.

import { fileURLToPath } from "node:url";
import path from "node:path";
import { env, pipeline, RawImage } from "@huggingface/transformers";

const here = path.dirname(fileURLToPath(import.meta.url));
const modelsDir = path.resolve(here, "..", "public", "models");

// Point transformers.js at the self-hosted weights only — no Hub fetch.
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = modelsDir;

function buildDiscImage(size) {
  // Warm radial disc (salient foreground) on a white background (to remove).
  const data = new Uint8ClampedArray(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.32;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        const t = dist / radius; // 0 center -> 1 edge
        data[i] = Math.round(255 * (1 - t) + 122 * t);
        data[i + 1] = Math.round(106 * (1 - t) + 20 * t);
        data[i + 2] = Math.round(61 * (1 - t) + 0 * t);
      } else {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      }
      data[i + 3] = 255;
    }
  }
  return new RawImage(data, size, size, 4);
}

async function main() {
  const size = 512;
  const input = buildDiscImage(size);

  console.log("[prove] loading self-hosted model from", modelsDir);
  const t0 = Date.now();
  const remover = await pipeline(
    "background-removal",
    "onnx-community/BiRefNet_lite-ONNX",
    {
      dtype: "fp16",
    },
  );
  const loadMs = Date.now() - t0;

  const t1 = Date.now();
  const output = await remover(input);
  const inferenceMs = Date.now() - t1;

  const result = Array.isArray(output) ? output[0] : output;
  if (result.channels !== 4) {
    throw new Error(`expected RGBA output, got ${result.channels} channels`);
  }
  const { data, width, height } = result;

  const alphaAt = (x, y) => data[(y * width + x) * 4 + 3];
  const corners = [
    alphaAt(4, 4),
    alphaAt(width - 5, 4),
    alphaAt(4, height - 5),
    alphaAt(width - 5, height - 5),
  ];
  const cornerAvg = corners.reduce((s, v) => s + v, 0) / corners.length;
  const center = alphaAt(Math.floor(width / 2), Math.floor(height / 2));

  let transparent = 0;
  let opaque = 0;
  const total = width * height;
  for (let p = 0; p < total; p++) {
    const a = data[p * 4 + 3];
    if (a < 32) transparent++;
    else if (a > 224) opaque++;
  }

  const report = {
    backend: "onnxruntime-node (native CPU)",
    modelFile: "onnx/model_fp16.onnx",
    loadMs,
    inferenceMs,
    outputWidth: width,
    outputHeight: height,
    centerAlpha: center,
    cornerAvgAlpha: Number(cornerAvg.toFixed(1)),
    transparentFraction: Number((transparent / total).toFixed(3)),
    opaqueFraction: Number((opaque / total).toFixed(3)),
  };
  console.log("[prove] result:", JSON.stringify(report, null, 2));

  const checks = [
    ["background corners transparent (cornerAvg < 128)", cornerAvg < 128],
    ["foreground centre opaque (center > 128)", center > 128],
    [
      "large opacity contrast (center - cornerAvg > 80)",
      center - cornerAvg > 80,
    ],
    ["has transparent bg pixels (>5%)", transparent / total > 0.05],
    ["has opaque fg pixels (>5%)", opaque / total > 0.05],
  ];
  let allPass = true;
  for (const [label, ok] of checks) {
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
    if (!ok) allPass = false;
  }
  if (!allPass) {
    console.error(
      "[prove] FAILED: the model did not produce an effective foreground matte",
    );
    process.exit(1);
  }
  console.log(
    "[prove] SUCCESS: the self-hosted model really removed the background",
  );
}

main().catch((error) => {
  console.error("[prove] ERROR:", error);
  process.exit(1);
});
