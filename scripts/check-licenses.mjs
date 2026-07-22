// License gate: fails the build if any installed package (prod or dev)
// declares a license outside the allowlist. AGPL/LGPL must never enter this
// project, even transitively, because the app bundles everything client-side
// and ships an ONNX model — the whole point is a permissively-licensed,
// self-hostable background remover (no @imgly/background-removal AGPL, no
// BRIA RMBG CC-BY-NC).
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ALLOWED = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "MPL-2.0",
  "ISC",
  "0BSD",
  "CC0-1.0",
  "Unlicense",
  "BlueOak-1.0.0",
  "CC-BY-4.0",
  "Python-2.0",
  "Zlib",
]);

// Packages whose npm-registry "license" field is legacy free text instead of
// a valid SPDX id. Each entry must be manually verified against the upstream
// LICENSE file (source + date noted) so the exception is auditable, rather
// than loosening the string-matching rules for everyone.
const VERIFIED_EXCEPTIONS = {};

// Node-only native packages that are NEVER part of the shipped browser bundle,
// so their licenses cannot reach the client. `sharp` (and its @img/sharp-*
// native binaries, some of which are LGPL-3.0-or-later) is a Node-side
// dependency of @huggingface/transformers used only for server image decoding.
// The browser build resolves the package's "default"/web export
// (dist/transformers.web.js), which stubs the import out ("// ignore-modules:
// sharp") — verified 2026-07-22 against @huggingface/transformers@4.2.0. The
// gate's rule targets client-bundled licenses (see header), so excluding this
// Node-only family keeps the check honest instead of green-lighting LGPL for
// code that actually ships.
function isNodeOnlyUnbundled(name) {
  return name === "sharp" || name.startsWith("@img/sharp-");
}

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const nodeModules = join(root, "node_modules");

function listPackageDirs(dir) {
  const dirs = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.name.startsWith("@")) {
      dirs.push(...listPackageDirs(full));
    } else {
      dirs.push(full);
    }
  }
  return dirs;
}

function licenseExpressionAllowed(expression) {
  // Handles plain IDs and simple OR expressions like "(MIT OR Apache-2.0)".
  const cleaned = expression.replaceAll("(", "").replaceAll(")", "");
  if (cleaned.includes(" OR ")) {
    return cleaned.split(" OR ").some((part) => ALLOWED.has(part.trim()));
  }
  return cleaned.split(" AND ").every((part) => ALLOWED.has(part.trim()));
}

const violations = [];
for (const dir of listPackageDirs(nodeModules)) {
  const manifestPath = join(dir, "package.json");
  if (!existsSync(manifestPath)) continue;
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    continue;
  }
  const license =
    typeof manifest.license === "string"
      ? manifest.license
      : (manifest.license?.type ?? manifest.licenses?.[0]?.type ?? "UNKNOWN");
  const name = manifest.name ?? "";
  if (isNodeOnlyUnbundled(name)) continue;
  const exception = VERIFIED_EXCEPTIONS[name];
  const allowed = exception !== undefined ? true : licenseExpressionAllowed(license);
  if (!allowed) {
    violations.push(`${manifest.name ?? dir}@${manifest.version ?? "?"} -> ${license}`);
  }
}

if (violations.length > 0) {
  console.error("License check FAILED. Disallowed licenses found:");
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exit(1);
}
console.log("License check passed: all installed packages are on the allowlist.");
