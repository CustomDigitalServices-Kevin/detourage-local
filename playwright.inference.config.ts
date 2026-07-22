import { defineConfig } from "@playwright/test";

// Dedicated config for the heavy, real-inference E2E proof. It runs against the
// Vite DEV server (not `vite preview`) for two reasons the default config can't
// satisfy:
//   1. dev serves /models/ live from public/, so the 114 MB self-hosted weights
//      are reachable without copying them into dist.
//   2. dev exposes the real TypeScript source modules for same-origin dynamic
//      import, so the test drives the app's own production pipeline.
// The single inference test is CPU-bound (single-threaded WASM), so no parallel
// workers and a generous per-test timeout (set inside the spec).
export default defineConfig({
  testDir: "./e2e",
  testMatch: "inference.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: process.env["CI"] === undefined,
    timeout: 120_000,
  },
});
