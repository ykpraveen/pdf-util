import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createWorker, loadPdfJsDoc, recognize, terminate } = vi.hoisted(() => ({
  recognize: vi.fn(),
  terminate: vi.fn(),
  createWorker: vi.fn(),
  loadPdfJsDoc: vi.fn(),
}))

vi.mock('tesseract.js', () => ({ createWorker }))
vi.mock('../pdf', () => ({ loadPdfJsDoc }))

import { ocrPage, ocrPdf } from './index'
import { OCR_EMPTY_PDF_MESSAGE, OCR_PAGE_FAILURE_TEXT, OCR_UNSUPPORTED_PDF_MESSAGE } from './errors'

describe('OCR helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createWorker.mockResolvedValue({ recognize, terminate })
    terminate.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('recognizes a canvas and terminates its worker', async () => {
    const canvas = {} as HTMLCanvasElement
    recognize.mockResolvedValue({ data: { text: '  Recognized text\n' } })

    await expect(ocrPage(canvas, 'eng')).resolves.toBe('Recognized text')
    expect(createWorker).toHaveBeenCalledWith('eng')
    expect(recognize).toHaveBeenCalledWith(canvas)
    expect(terminate).toHaveBeenCalledOnce()
  })

  it('rejects an empty OCR language before creating a worker', async () => {
    await expect(ocrPage({} as HTMLCanvasElement, '  ')).rejects.toThrow('language')
    expect(createWorker).not.toHaveBeenCalled()
  })

  it('recognizes every PDF page and cleans up resources', async () => {
    const pageCleanup = vi.fn()
    const pdfCleanup = vi.fn().mockResolvedValue(undefined)
    const render = vi.fn(() => ({ promise: Promise.resolve() }))
    const getPage = vi.fn().mockResolvedValue({
      getViewport: vi.fn(() => ({ width: 200, height: 300 })),
      render,
      cleanup: pageCleanup,
    })
    const context = { fillStyle: '', fillRect: vi.fn() }
    const canvas = { width: 0, height: 0, getContext: vi.fn(() => context) }

    vi.stubGlobal('document', { createElement: vi.fn(() => canvas) })
    loadPdfJsDoc.mockResolvedValue({ numPages: 2, getPage, cleanup: pdfCleanup })
    recognize
      .mockResolvedValueOnce({ data: { text: 'First page' } })
      .mockResolvedValueOnce({ data: { text: 'Second page' } })

    await expect(ocrPdf(new File([], 'sample.pdf'))).resolves.toEqual([
      { pageNumber: 1, text: 'First page' },
      { pageNumber: 2, text: 'Second page' },
    ])
    expect(createWorker).toHaveBeenCalledWith('eng')
    expect(getPage).toHaveBeenCalledTimes(2)
    expect(pageCleanup).toHaveBeenCalledTimes(2)
    expect(terminate).toHaveBeenCalledOnce()
    expect(pdfCleanup).toHaveBeenCalledOnce()

  })

  it('reports an unsupported-PDF error when every page fails to recognize', async () => {
    const pageCleanup = vi.fn()
    const pdfCleanup = vi.fn().mockResolvedValue(undefined)
    const canvas = { getContext: vi.fn(() => ({ fillStyle: '', fillRect: vi.fn() })) }

    vi.stubGlobal('document', { createElement: vi.fn(() => canvas) })
    loadPdfJsDoc.mockResolvedValue({
      numPages: 1,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn(() => ({ width: 100, height: 100 })),
        render: vi.fn(() => ({ promise: Promise.resolve() })),
        cleanup: pageCleanup,
      }),
      cleanup: pdfCleanup,
    })
    recognize.mockRejectedValue(new Error('OCR failed'))

    await expect(ocrPdf(new File([], 'sample.pdf'))).rejects.toThrow(OCR_UNSUPPORTED_PDF_MESSAGE)
    expect(pageCleanup).toHaveBeenCalledOnce()
    expect(terminate).toHaveBeenCalledOnce()
    expect(pdfCleanup).toHaveBeenCalledOnce()

  })

  it('keeps successful pages and inserts a placeholder for pages that fail to recognize', async () => {
    const pageCleanup = vi.fn()
    const pdfCleanup = vi.fn().mockResolvedValue(undefined)
    const canvas = { getContext: vi.fn(() => ({ fillStyle: '', fillRect: vi.fn() })) }

    vi.stubGlobal('document', { createElement: vi.fn(() => canvas) })
    loadPdfJsDoc.mockResolvedValue({
      numPages: 2,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn(() => ({ width: 100, height: 100 })),
        render: vi.fn(() => ({ promise: Promise.resolve() })),
        cleanup: pageCleanup,
      }),
      cleanup: pdfCleanup,
    })
    recognize
      .mockResolvedValueOnce({ data: { text: 'First page' } })
      .mockRejectedValueOnce(new Error('OCR failed'))

    await expect(ocrPdf(new File([], 'sample.pdf'))).resolves.toEqual([
      { pageNumber: 1, text: 'First page' },
      { pageNumber: 2, text: OCR_PAGE_FAILURE_TEXT },
    ])
    expect(pageCleanup).toHaveBeenCalledTimes(2)
    expect(terminate).toHaveBeenCalledOnce()
    expect(pdfCleanup).toHaveBeenCalledOnce()
  })

  it('rejects with a friendly message for a PDF with no pages', async () => {
    const pdfCleanup = vi.fn().mockResolvedValue(undefined)

    loadPdfJsDoc.mockResolvedValue({ numPages: 0, cleanup: pdfCleanup })

    await expect(ocrPdf(new File([], 'sample.pdf'))).rejects.toThrow(OCR_EMPTY_PDF_MESSAGE)
    expect(pdfCleanup).toHaveBeenCalledOnce()
    expect(createWorker).not.toHaveBeenCalled()
  })

  it('rejects with a friendly message when the PDF itself cannot be loaded', async () => {
    loadPdfJsDoc.mockRejectedValue(Object.assign(new Error('bad file'), { name: 'InvalidPDFException' }))

    await expect(ocrPdf(new File([], 'sample.pdf'))).rejects.toThrow(
      "This file isn't a valid PDF and can't be processed for OCR.",
    )
    expect(createWorker).not.toHaveBeenCalled()
  })

  it('cleans up the PDF when worker initialization fails', async () => {
    const pdfCleanup = vi.fn().mockResolvedValue(undefined)

    loadPdfJsDoc.mockResolvedValue({ numPages: 1, cleanup: pdfCleanup })
    createWorker.mockRejectedValue(new Error('Worker failed'))

    await expect(ocrPdf(new File([], 'sample.pdf'))).rejects.toThrow('Worker failed')
    expect(pdfCleanup).toHaveBeenCalledOnce()
    expect(terminate).not.toHaveBeenCalled()
  })
})