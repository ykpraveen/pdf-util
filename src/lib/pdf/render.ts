import type { PDFPageProxy, PageViewport } from 'pdfjs-dist'

type RenderedPage = {
  canvas: HTMLCanvasElement
  viewport: PageViewport
}

export async function renderPdfPage(
  page: PDFPageProxy,
  scale: number,
  background?: string,
): Promise<RenderedPage> {
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to create a canvas rendering context.')
  }

  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)

  if (background) {
    context.fillStyle = background
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  await page.render({ canvas, canvasContext: context, viewport }).promise
  return { canvas, viewport }
}