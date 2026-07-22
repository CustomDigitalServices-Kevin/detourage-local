// Reproducible fetch of the self-hosted BiRefNet_lite ONNX weights.
//
// The fp16 weight (`model_fp16.onnx`, ~109 MiB) is deliberately kept OUT of git
// (see .gitignore) because of its size; this script re-downloads it into the
// exact layout Transformers.js expects and verifies its SHA-256 against the
// value published on the Hugging Face Hub, so a corrupted or truncated download
// fails loudly instead of shipping a broken model.
//
// Usage:
//   node scripts/fetch-model.mjs                 # -> public/models/...
//   node scripts/fetch-model.mjs <destModelsDir> # e.g. a deploy target
//
// Node >= 18 (global fetch). No external dependencies.

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_MODELS_DIR = resolve(HERE, "..", "public", "models");

// The one heavy asset we host. config.json / preprocessor_config.json are tiny
// and stay versioned in git, so they are not fetched here.
const WEIGHT = {
  // Relative to the models dir; matches env.localModelPath + modelId + subfolder.
  relPath: join("onnx-community", "BiRefNet_lite-ONNX", "onnx", "model_fp16.onnx"),
  url: "https://huggingface.co/onnx-community/BiRefNet_lite-ONNX/resolve/main/onnx/model_fp16.onnx",
  sha256: "d39b897ceb16ae654c1731f3dba0cf9b368d9cae74b5a57459b455cc8bfec402",
  bytes: 114538221,
};

async function sha256Of(path) {
  const hash = createHash("sha256");
  hash.update(await readFile(path));
  return hash.digest("hex");
}

async function alreadyValid(path) {
  try {
    const info = await stat(path);
    if (info.size !== WEIGHT.bytes) return false;
    return (await sha256Of(path)) === WEIGHT.sha256;
  } catch {
    return false;
  }
}

async function main() {
  const modelsDir = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_MODELS_DIR;
  const target = join(modelsDir, WEIGHT.relPath);

  if (await alreadyValid(target)) {
    console.log(`[fetch-model] up to date: ${target}`);
    return;
  }

  console.log(`[fetch-model] downloading ${WEIGHT.url}`);
  const res = await fetch(WEIGHT.url);
  if (!res.ok) {
    throw new Error(`download failed: HTTP ${res.status} ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());

  if (buffer.byteLength !== WEIGHT.bytes) {
    throw new Error(
      `size mismatch: got ${buffer.byteLength} bytes, expected ${WEIGHT.bytes}`,
    );
  }
  const digest = createHash("sha256").update(buffer).digest("hex");
  if (digest !== WEIGHT.sha256) {
    throw new Error(`sha256 mismatch: got ${digest}, expected ${WEIGHT.sha256}`);
  }

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, buffer);
  console.log(`[fetch-model] wrote ${target} (${buffer.byteLength} bytes, sha256 OK)`);
}

main().catch((err) => {
  console.error(`[fetch-model] ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
