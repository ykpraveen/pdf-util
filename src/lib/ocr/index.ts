import { createWorker } from 'tesseract.js'
import type { Worker } from 'tesseract.js'
import { loadPdfJsDoc } from '../pdf'
import { renderPdfPage } from '../pdf/render'
import { describeOcrLoadFailure, OCR_EMPTY_PDF_MESSAGE, OCR_PAGE_FAILURE_TEXT, OCR_UNSUPPORTED_PDF_MESSAGE } from './errors'

export type PageText = {
  pageNumber: number
  text: string
}

const OCR_RENDER_SCALE = 2

async function recognizePage(worker: Worker, canvas: HTMLCanvasElement): Promise<string> {
  const result = await worker.recognize(canvas)
  return result.data.text.trim()
}

export async function ocrPage(canvas: HTMLCanvasElement, lang: string): Promise<string> {
  if (!lang.trim()) {
    throw new Error('An OCR language is required.')
  }

  const worker = await createWorker(lang)

  try {
    return await recognizePage(worker, canvas)
  } finally {
    await worker.terminate()
  }
}

export async function ocrPdf(file: File): Promise<PageText[]> {
  let pdf: Awaited<ReturnType<typeof loadPdfJsDoc>>

  try {
    pdf = await loadPdfJsDoc(file)
  } catch (cause) {
    throw new Error(describeOcrLoadFailure(cause), { cause })
  }

  if (pdf.numPages === 0) {
    await pdf.cleanup()
    throw new Error(OCR_EMPTY_PDF_MESSAGE)
  }

  let worker: Worker | undefined
  const pages: PageText[] = []
  let failedPages = 0

  try {
    worker = await createWorker('eng')

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)

      try {
        const { canvas } = await renderPdfPage(page, OCR_RENDER_SCALE, '#ffffff')

        pages.push({
          pageNumber,
          text: await recognizePage(worker, canvas),
        })
      } catch (cause) {
        failedPages += 1
        pages.push({ pageNumber, text: OCR_PAGE_FAILURE_TEXT })
        console.error(`OCR failed on page ${pageNumber}:`, cause)
      } finally {
        page.cleanup()
      }
    }

    if (failedPages === pdf.numPages) throw new Error(OCR_UNSUPPORTED_PDF_MESSAGE)

    return pages
  } finally {
    await worker?.terminate()
    await pdf.cleanup()
  }
}