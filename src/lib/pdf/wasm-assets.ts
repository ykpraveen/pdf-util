// pdfjs-dist decodes JBIG2/CCITT and JPX images (the compression scanners commonly use)
// through WASM modules that must be located explicitly, or decoding silently fails.
import jbig2Wasm from 'pdfjs-dist/wasm/jbig2.wasm?url'
import jbig2Fallback from 'pdfjs-dist/wasm/jbig2_nowasm_fallback.js?url'
import openjpegWasm from 'pdfjs-dist/wasm/openjpeg.wasm?url'
import openjpegFallback from 'pdfjs-dist/wasm/openjpeg_nowasm_fallback.js?url'
import qcmsWasm from 'pdfjs-dist/wasm/qcms_bg.wasm?url'
import quickjsWasm from 'pdfjs-dist/wasm/quickjs-eval.wasm?url'
import quickjsFallback from 'pdfjs-dist/wasm/quickjs-eval.js?url'

// Referencing every file (even ones we don't read directly) is what makes Vite emit them
// as build assets, so `pdfWasmUrl` below can locate them all at runtime.
const pdfWasmAssetUrls = [
  jbig2Wasm,
  jbig2Fallback,
  openjpegWasm,
  openjpegFallback,
  qcmsWasm,
  quickjsWasm,
  quickjsFallback,
]

export const pdfWasmUrl = pdfWasmAssetUrls[0].replace(/[^/]*$/, '')

type BinaryDataKind = 'cMapUrl' | 'standardFontDataUrl' | 'wasmUrl'

// The shape pdfjs-dist's `getDocument({ BinaryDataFactory })` option expects: it
// constructs the class itself and calls `.fetch()` on it reflectively.
export interface BinaryDataFactoryLike {
  fetch(request: { kind: BinaryDataKind; filename: string }): Promise<Uint8Array>
}

// pdfjs-dist's default `DOMBinaryDataFactory` reads `document.baseURI`, which doesn't
// exist inside a plain Worker. `heavy.worker.ts` calls `getDocument()` directly (not via
// pdfjs-dist's own internal worker), so it needs a fetch implementation that doesn't touch `document`.
export class WorkerSafeBinaryDataFactory implements BinaryDataFactoryLike {
  private readonly urls: Partial<Record<BinaryDataKind, string>>

  constructor(urls: Partial<Record<BinaryDataKind, string>>) {
    this.urls = urls
  }

  async fetch({ kind, filename }: { kind: BinaryDataKind; filename: string }): Promise<Uint8Array> {
    const baseUrl = this.urls[kind]
    if (!baseUrl) {
      throw new Error(`Ensure that the \`${kind}\` API parameter is provided.`)
    }

    const url = `${baseUrl}${filename}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Unable to load "${kind}" data at: ${url}`)
    }

    return new Uint8Array(await response.arrayBuffer())
  }
}
