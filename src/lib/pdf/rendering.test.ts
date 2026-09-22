import { PDFDocument } from 'pdf-lib'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestJpeg } from '../test-fixtures'

const { getDocument } = vi.hoisted(() => ({ getDocument: vi.fn() }))

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument,
  GlobalWorkerOptions: { workerSrc: '' },
}))

import { compressPdf, pdfToImages } from './index'

function createPdfJsDocument(pageCount = 1) {
  const pageCleanup = vi.fn()
  const render = vi.fn(() => ({ promise: Promise.resolve() }))
  const getViewport = vi.fn(({ scale }: { scale: number }) => ({
    width: 300 * scale,
    height: 400 * scale,
  }))
  const page = { cleanup: pageCleanup, getViewport, render }
  const cleanup = vi.fn().mockResolvedValue(undefined)
  const pdf = {
    numPages: pageCount,
    getPage: vi.fn().mockResolvedValue(page),
    cleanup,
  }

  getDocument.mockReturnValue({ promise: Promise.resolve(pdf) })
  return { cleanup, getViewport, pageCleanup, pdf, render }
}

function stubCanvas() {
  const jpeg = createTestJpeg()
  const context = { fillStyle: '', fillRect: vi.fn() }
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
    toBlob: vi.fn(async (callback: BlobCallback, type?: string) => {
      callback(new Blob([await jpeg.arrayBuffer()], { type }))
    }),
  }

  vi.stubGlobal('document', { createElement: vi.fn(() => canvas) })
  return { canvas, context }
}

describe('PDF canvas helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders every PDF page to the requested image format', async () => {
    const { cleanup, pageCleanup, render } = createPdfJsDocument(2)
    const { canvas } = stubCanvas()

    const images = await pdfToImages(new File(['pdf'], 'source.pdf'), 'png', 1.5)

    expect(images).toHaveLength(2)
    expect(images.every((image) => image.type === 'image/png')).toBe(true)
    expect(canvas.width).toBe(450)
    expect(canvas.height).toBe(600)
    expect(render).toHaveBeenCalledTimes(2)
    expect(pageCleanup).toHaveBeenCalledTimes(2)
    expect(cleanup).toHaveBeenCalledOnce()
  })

  it('rebuilds pages as bounded JPEG images when the result is smaller', async () => {
    const { getViewport, pageCleanup } = createPdfJsDocument()
    stubCanvas()
    const source = new File([new Uint8Array(20_000)], 'large.pdf')

    const output = await compressPdf(source, { quality: 0.6, maxDimension: 200 })
    const document = await PDFDocument.load(output)

    expect(output.length).toBeLessThan(source.size)
    expect(document.getPageCount()).toBe(1)
    expect(document.getPage(0).getSize()).toEqual({ width: 300, height: 400 })
    expect(getViewport).toHaveBeenNthCalledWith(1, { scale: 1 })
    expect(getViewport).toHaveBeenNthCalledWith(2, { scale: 0.5 })
    expect(pageCleanup).toHaveBeenCalledOnce()
  })

  it('keeps the original bytes when rebuilding would make the file larger', async () => {
    createPdfJsDocument()
    stubCanvas()
    const sourceBytes = new Uint8Array([1, 2, 3])

    const output = await compressPdf(new File([sourceBytes], 'small.pdf'), {})

    expect(output).toEqual(sourceBytes)
  })

  it('cleans up the page and document when rendering fails', async () => {
    const { cleanup, pageCleanup, render } = createPdfJsDocument()
    stubCanvas()
    render.mockReturnValueOnce({ promise: Promise.reject(new Error('Render failed')) })

    await expect(pdfToImages(new File(['pdf'], 'source.pdf'), 'png', 1)).rejects.toThrow('Render failed')
    expect(pageCleanup).toHaveBeenCalledOnce()
    expect(cleanup).toHaveBeenCalledOnce()
  })
})