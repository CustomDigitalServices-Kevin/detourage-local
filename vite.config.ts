import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// Strict CSP injected at build time only (the dev server needs inline
// scripts for HMR). connect-src 'self' is the technical enforcement of the
// "no upload" promise: the browser itself blocks any cross-origin request.
// The background-removal model (ONNX) is self-hosted under /models/, so it
// loads over same-origin fetch and connect-src stays 'self' — nothing is
// ever sent to Hugging Face or anywhere else at runtime.
// 'wasm-unsafe-eval' is required by onnxruntime-web (WASM backend used when
// WebGPU is unavailable). style-src-attr covers inline style attributes
// (progress bars / preview transforms).
const CSP = [
  "default-src 'none'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self'",
  "style-src-attr 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "connect-src 'self'",
  "font-src 'self'",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
  "object-src 'none'",
].join("; ");

function injectCsp(): Plugin {
  return {
    name: "inject-csp",
    apply: "build",
    transformIndexHtml(html) {
      return html.replace(
        "<meta charset=\"UTF-8\" />",
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      );
    },
  };
}

// Deployed under /outils/detourage/ on the CDS site; base must stay relative
// so the same build also works on GitHub Pages or a local preview.
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    injectCsp(),
    VitePWA({
      registerType: "autoUpdate",
      // External registerSW.js file, not an inline script: keeps the strict
      // CSP (script-src 'self') intact.
      injectRegister: "script-defer",
      workbox: {
        // App shell precached for offline use. Two classes of large asset are
        // deliberately kept OUT of the precache — the ONNX model weights (tens
        // of MB) and onnxruntime's oversized asyncify WASM variant (~24 MB) —
        // so the service-worker install stays light. Both are runtime-cached on
        // first use instead (see runtimeCaching below), delivering the honest
        // "offline after the first model load" promise without a 24 MB install.
        globPatterns: ["**/*.{js,css,html,wasm,svg,png,woff2}"],
        globIgnores: ["**/models/**", "**/*.asyncify*.wasm"],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes("/models/"),
            handler: "CacheFirst",
            options: {
              cacheName: "detourage-models",
              expiration: { maxEntries: 8 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // The asyncify WASM backend, runtime-cached the first time
            // onnxruntime needs it (WebGPU JSEP / proxy paths).
            urlPattern: ({ url }) => url.pathname.endsWith(".wasm"),
            handler: "CacheFirst",
            options: {
              cacheName: "detourage-wasm",
              expiration: { maxEntries: 8 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: "Détourage local",
        short_name: "Détourage",
        description:
          "Remove image backgrounds entirely in your browser. No upload, no server.",
        theme_color: "#ff6b00",
        background_color: "#0b0b0d",
        display: "standalone",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
    }),
  ],
  build: {
    target: "es2022",
    sourcemap: false,
  },
  worker: {
    format: "es",
  },
});
