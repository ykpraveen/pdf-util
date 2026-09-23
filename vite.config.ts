import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// pdfjs-dist's WASM image decoders (JBIG2/OpenJPEG/qcms) build their fetch URL by
// concatenating `wasmUrl` with these exact, hardcoded filenames at runtime - they can't
// be content-hashed like normal assets, or pdfjs-dist requests a URL that doesn't exist.
const PDFJS_WASM_ASSET_NAMES = new Set([
  'jbig2.wasm',
  'jbig2_nowasm_fallback.js',
  'openjpeg.wasm',
  'openjpeg_nowasm_fallback.js',
  'qcms_bg.wasm',
  'quickjs-eval.wasm',
  'quickjs-eval.js',
])

const assetFileNames = (assetInfo: { names?: string[] }): string => {
  const name = assetInfo.names?.[0] ?? ''
  return PDFJS_WASM_ASSET_NAMES.has(name)
    ? 'assets/[name][extname]'
    : 'assets/[name]-[hash][extname]'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  worker: {
    rollupOptions: { output: { assetFileNames } },
  },
  build: {
    rollupOptions: {
      output: { assetFileNames },
    },
  },
})
