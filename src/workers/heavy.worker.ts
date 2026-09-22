/// <reference lib="webworker" />

import { PDFDocument } from 'pdf-lib'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import { createWorker } from 'tesseract.js'
import type { PDFPageProxy } from 'pdfjs-dist'
import type { Worker as TesseractWorker } from 'tesseract.js'
import type { CompressOptions } from '../lib/pdf'
import { normalizeCompressionOptions } from '../lib/pdf/compression'
import type { PageText } from '../lib/ocr'
import type { HeavyWorkerRequest, HeavyWorkerResponse } from './heavy.types'

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

function reportProgress(id: number, completed: number, total: number): void {
  const response: HeavyWorkerResponse = { id, type: 'progress', completed, total }
  self.postMessage(response)
}

async function merge(id: number, files: ArrayBuffer[]): Promise<ArrayBuffer> {
  const output = await PDFDocument.create()

  for (const [index, bytes] of files.entries()) {
    const source = await PDFDocument.load(bytes)
    const pages = await output.copyPages(source, source.getPageIndices())
    pages.forEach((page) => output.addPage(page))
    reportProgress(id, index + 1, files.length)
  }

  return toArrayBuffer(await output.save())
}

async function renderPage(
  page: PDFPageProxy,
  scale: number,
): Promise<{ canvas: OffscreenCanvas; width: number; height: number }> {
  const viewport = page.getViewport({ scale })
  const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
  const context = canvas.getContext('2d')

  if (!context) throw new Error('Unable to create an offscreen canvas rendering context.')

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({
    canvas: canvas as unknown as HTMLCanvasElement,
    canvasContext: context as unknown as CanvasRenderingContext2D,
    viewport,
  }).promise

  return { canvas, width: viewport.width, height: viewport.height }
}

async function compress(id: number, bytes: ArrayBuffer, options: CompressOptions): Promise<ArrayBuffer> {
  const { quality, maxDimension } = normalizeCompressionOptions(options)
  const sourceBytes = new Uint8Array(bytes)
  const source = await getDocument({ data: sourceBytes }).promise
  const output = await PDFDocument.create()

  try {
    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
      const page = await source.getPage(pageNumber)

      try {
        const original = page.getViewport({ scale: 1 })
        const scale = Math.min(1, maxDimension / Math.max(original.width, original.height))
        const { canvas } = await renderPage(page, scale)
        const imageBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality })
        const image = await output.embedJpg(await imageBlob.arrayBuffer())
        const outputPage = output.addPage([original.width, original.height])
        outputPage.drawImage(image, {
          x: 0,
          y: 0,
          width: original.width,
          height: original.height,
        })
      } finally {
        page.cleanup()
      }

      reportProgress(id, pageNumber, source.numPages)
    }
  } finally {
    await source.cleanup()
  }

  const compressed = await output.save()
  return compressed.length < sourceBytes.length
    ? toArrayBuffer(compressed)
    : toArrayBuffer(sourceBytes)
}

async function ocr(id: number, bytes: ArrayBuffer, language: string): Promise<PageText[]> {
  if (!language.trim()) throw new Error('An OCR language is required.')

  const source = await getDocument({ data: new Uint8Array(bytes) }).promise
  let worker: TesseractWorker | undefined
  const pages: PageText[] = []

  try {
    worker = await createWorker(language)

    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
      const page = await source.getPage(pageNumber)

      try {
        const { canvas } = await renderPage(page, 2)
        const image = await canvas.convertToBlob({ type: 'image/png' })
        const result = await worker.recognize(image)
        pages.push({ pageNumber, text: result.data.text.trim() })
        reportProgress(id, pageNumber, source.numPages)
      } finally {
        page.cleanup()
      }
    }

    return pages
  } finally {
    await worker?.terminate()
    await source.cleanup()
  }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const output = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(output).set(bytes)
  return output
}

self.addEventListener('message', async (event: MessageEvent<HeavyWorkerRequest>) => {
  if (event.origin && event.origin !== self.location.origin) return

  const { id } = event.data

  try {
    let result: ArrayBuffer | PageText[]

    switch (event.data.operation) {
      case 'merge':
        result = await merge(id, event.data.files)
        break
      case 'compress':
        result = await compress(id, event.data.file, event.data.options)
        break
      case 'ocr':
        result = await ocr(id, event.data.file, event.data.language)
        break
    }

    const response: HeavyWorkerResponse = { id, type: 'result', result }
    self.postMessage(response, result instanceof ArrayBuffer ? [result] : [])
  } catch (cause) {
    const response: HeavyWorkerResponse = {
      id,
      type: 'error',
      error: cause instanceof Error ? cause.message : 'The background operation failed.',
    }
    self.postMessage(response)
  }
})