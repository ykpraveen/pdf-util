import { createWorker } from 'tesseract.js'
import type { Worker } from 'tesseract.js'
import { loadPdfJsDoc } from '../pdf'
import { renderPdfPage } from '../pdf/render'

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
  const pdf = await loadPdfJsDoc(file)
  let worker: Worker | undefined
  const pages: PageText[] = []

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
      } finally {
        page.cleanup()
      }
    }

    return pages
  } finally {
    await worker?.terminate()
    await pdf.cleanup()
  }
}