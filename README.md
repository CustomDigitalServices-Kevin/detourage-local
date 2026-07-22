# Détourage local

Background remover that runs **100% in your browser**: PNG, JPG, WebP, HEIC. Your images never leave your device. No upload, no server, no account. GDPR-friendly by design.

Un outil de suppression d'arrière-plan qui fonctionne **100% dans votre navigateur** : PNG, JPG, WebP, HEIC. Vos images ne quittent jamais votre appareil. Aucun envoi, aucun serveur, aucun compte.

## Why / Pourquoi

Cloud background removers (remove.bg, Canva, Photoroom...) upload your images to third-party servers. For sensitive photos (ID, confidential product, personal document), the image still left your device, transited networks and was stored by a third party. This tool runs the segmentation model locally on your GPU (WebGPU): nothing is ever sent anywhere.

## Compatibility

**A WebGPU-capable browser is required** — Chrome or Edge on desktop, recent version (roughly the last two years). Safari 18+ (macOS/iOS) also ships WebGPU. When WebGPU is not available, the app does not attempt a cutout: it shows a clear, honest message instead of silently failing or producing a broken result.

Un navigateur compatible **WebGPU** est requis : Chrome ou Edge sur ordinateur, version récente. Sans WebGPU, l'outil n'essaie pas de détourer : il affiche un message clair.

### Why WebGPU only (no WebAssembly fallback)

The bundled model, **BiRefNet_lite (ONNX)**, exports a **static 1024×1024 input** (a smaller input is rejected: "invalid dimensions ... Expected: 1024"). At that fixed size its fp16→fp32 activations exceed the browser's WebAssembly heap ceiling: `onnxruntime-web` aborts with `std::bad_alloc`, both single-threaded and cross-origin-isolated (threads do not lower peak memory). This was measured and confirmed on 2026-07-22. A CPU/WASM fallback would therefore crash rather than run, so it is deliberately disabled: the app runs on WebGPU, whose GPU memory handles the fixed 1024 input, or not at all.

WebGPU covers the large majority of desktop Chromium traffic; running the real self-hosted inference on WebGPU is verified (`npm run prove:inference`, native CPU proof of the same weights, plus the in-browser E2E when a GPU adapter is exposed).

### Fast-follow

A lighter, general-purpose fallback model (**U2Netp**, dynamic input, WASM-friendly) is planned as a fast-follow after visual QA, to widen browser coverage without the fixed-1024 memory wall.

## How it works

- A background-removal model (BiRefNet_lite, ONNX, MIT license) is **self-hosted** under `public/models/` and loaded over same-origin fetch — the strict CSP keeps `connect-src 'self'`, so the "100% local" claim is technically enforced.
- Inference runs on **WebGPU** (the device is forced; the WASM path is never taken automatically — see *Compatibility*). Availability is probed once at load with `navigator.gpu.requestAdapter()`.
- Memory-safe pipeline: the input is downscaled to ~1024px for inference, then the alpha mask is upscaled and composited onto the full-resolution original.
- HEIC (iPhone) photos are decoded with `heic2any` before inference.

Because the model is self-hosted and cached (Cache API / service worker), the tool works **offline after the first model load**.

## Tech

- Vite 7 + React 19 + TypeScript strict + Tailwind CSS v4, fully static, no backend
- `@huggingface/transformers` (Transformers.js) for ONNX inference on WebGPU
- PWA: app shell precached, model runtime-cached on first use
- Strict CSP with no external `connect-src`: the "no upload" claim is technically enforced

## Deployment note (headers)

WebGPU does **not** require cross-origin isolation, so no special COOP/COEP headers are needed for the production path. (Multi-threaded WASM would need `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`, but WASM is not the runtime path here.)

## Development

```bash
npm install
npm run dev             # dev server
npm run test            # unit tests (Vitest)
npm run test:e2e        # end-to-end tests (Playwright)
npm run lint            # ESLint
npm run typecheck       # tsc --noEmit
npm run build           # typecheck + production build
npm run check:licenses  # dependency license allowlist (no AGPL/LGPL, no CC-BY-NC models)
npm run fetch:model     # download the self-hosted ONNX weights (gitignored)
npm run prove:inference # native (onnxruntime-node) proof the weights remove a background
```

The ONNX weights (`public/models/**/*.onnx`) are gitignored (large) and re-fetched with `npm run fetch:model`.

## License

MIT. Dependency policy: only MIT / Apache-2.0 / BSD / MPL-2.0 (and equivalent permissive) licenses are allowed, enforced by `npm run check:licenses` in CI. The bundled model is MIT-licensed. See the third-party licenses page in the app for attributions.

Made by [Custom Digital Services](https://custom-digital-services.fr) — more free tools at [custom-digital-services.fr/outils](https://custom-digital-services.fr/outils/).
