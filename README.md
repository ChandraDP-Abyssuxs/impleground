# ImPleGround

An all-in-one, client-side image processing sandbox. Every feature — crop
and retouch, background removal, retro dithering, OCR — runs entirely in
the browser via WebAssembly and Canvas. No backend, no uploads.

## Workspace

- **🛠️ Image Playground** — crop, resize, flip, rotate, and live
  brightness/contrast/saturation via `CanvasRenderingContext2D.filter`.
  Crop/resize/rotate/flip are committed steps with undo history; the
  color sliders are non-destructive and re-render on top of the last
  commit.
- **🧼 Magic Eraser** — background (or foreground) removal via
  [`@imgly/background-removal`](https://www.npmjs.com/package/@imgly/background-removal),
  running a segmentation model on-device through ONNX Runtime Web/WASM.
- **👾 Retro Studio** — pixelation, four palette presets (GameBoy,
  CGA, NES-inspired, adjustable-level monochrome), and hand-implemented
  Floyd–Steinberg error-diffusion and Bayer 4×4/8×8 ordered dithering.
- **📝 Vision OCR** — text extraction via
  [`tesseract.js`](https://www.npmjs.com/package/tesseract.js), with a
  live recognition-progress readout and one-click copy.

One image is shared across all four panels (upload once, switch tabs
freely); each panel keeps its own canvas mounted-but-hidden while
inactive, so in-progress edits survive a tab switch. The top-bar
**Export PNG** button always rasterizes whichever panel is currently
open.

## A correction on the spec

The brief named the background-removal package `@imgly/background-removal-js`.
The actual npm package is [`@imgly/background-removal`](https://www.npmjs.com/package/@imgly/background-removal)
— `background-removal-js` is the name of its GitHub repo, not the
published package. This project uses the real package name throughout;
`onnxruntime-web` (its WASM inference peer dependency) is pinned
explicitly in `package.json` rather than left to implicit peer
auto-install.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-checks with tsc -b, then builds to dist/
npm run lint      # oxlint
```

Requires Node 20+.

## Deploying to Vercel

This is a static SPA — no server, no API routes, no environment
variables required.

1. Push this repo to GitHub/GitLab/Bitbucket and import it in Vercel,
   **or** run `vercel` from this directory with the Vercel CLI.
2. Framework preset: **Vite** (auto-detected). Build command
   `npm run build`, output directory `dist` — both are already set in
   `vercel.json`, along with SPA rewrites and headers for `.wasm`
   assets and cross-origin isolation.
3. Deploy. No further configuration needed — it fits comfortably on
   the Hobby tier.

### About the model downloads

By default, `@imgly/background-removal` fetches its ONNX segmentation
model from a public CDN at runtime (not from your own deployment), and
caches it in the browser after first use — this is what the progress
bar in Magic Eraser is tracking. `onnxruntime-web`'s own WASM runtime,
by contrast, *is* bundled into this app's own build output (Vite picks
it up automatically as a static asset). For a fully self-hosted,
CDN-independent setup, `@imgly/background-removal` supports a
`publicPath` config option to point at your own hosted copy of the
model files — see its README if you need that.

## Browser support

Everything here needs WebAssembly; Magic Eraser and Vision OCR
additionally rely on Web Workers. The app feature-detects WebAssembly
on load and shows an inline fallback message in Magic Eraser (rather
than a hard crash) on browsers that lack it — Image Playground and
Retro Studio, which are pure Canvas 2D, keep working regardless. Each
panel is also wrapped in its own error boundary, so a crash in one
tool doesn't take down the other three.

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · lucide-react icons.
No image processing ever touches a server — everything above runs in
`<canvas>`, WebAssembly, and Web Workers, client-side only.
