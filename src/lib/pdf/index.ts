import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'
import type { PDFImage } from 'pdf-lib'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { renderPdfPage } from './render'

export type PageRange = {
  start: number
  end: number
}

export type WatermarkOptions = {
  text?: string
  image?: File
  pageIndexes?: number[]
  opacity?: number
  rotate?: number
  x?: number
  y?: number
  fontSize?: number
}

export type CompressOptions = {
  quality?: number
  maxDimension?: number
}

let pdfJsModule: Promise<typeof import('pdfjs-dist')> | undefined
type QpdfModule = Awaited<ReturnType<typeof import('qpdf-wasm').default>>

let qpdfModule: Promise<QpdfModule> | undefined
let qpdfOperationId = 0

function getPdfJsModule(): Promise<typeof import('pdfjs-dist')> {
  if (!pdfJsModule) {
    pdfJsModule = typeof window === 'undefined'
      ? import('pdfjs-dist/legacy/build/pdf.mjs')
      : import('pdfjs-dist').then((module) => {
          module.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url,
          ).toString()
          return module
        })
  }

  return pdfJsModule
}

export async function loadPdf(file: File): Promise<PDFDocument> {
  const bytes = await file.arrayBuffer()
  return PDFDocument.load(bytes)
}

export async function loadPdfJsDoc(file: File): Promise<PDFDocumentProxy> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const { getDocument } = await getPdfJsModule()

  return getDocument({ data: bytes }).promise
}

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create()

  for (const file of files) {
    const source = await loadPdf(file)
    const copiedPages = await merged.copyPages(source, source.getPageIndices())
    copiedPages.forEach((page) => merged.addPage(page))
  }

  return merged.save()
}

export async function splitPdf(file: File, ranges: PageRange[]): Promise<Uint8Array[]> {
  const source = await loadPdf(file)
  const pageCount = source.getPageCount()
  const outputs: Uint8Array[] = []

  for (const range of ranges) {
    const start = Math.max(0, range.start - 1)
    const end = Math.min(pageCount, range.end)

    if (start >= end) continue

    const indexes = Array.from({ length: end - start }, (_, index) => start + index)
    const doc = await PDFDocument.create()
    const pages = await doc.copyPages(source, indexes)
    pages.forEach((page) => doc.addPage(page))
    outputs.push(await doc.save())
  }

  return outputs
}

export async function setPassword(file: File, password: string): Promise<Uint8Array> {
  validatePassword(password)
  return runQpdf(file, (inputPath, outputPath) => [
    '--encrypt',
    password,
    createOwnerPassword(),
    '256',
    '--',
    inputPath,
    outputPath,
  ])
}

export async function removePassword(file: File, password: string): Promise<Uint8Array> {
  validatePassword(password)
  return runQpdf(file, (inputPath, outputPath) => [
    `--password=${password}`,
    '--decrypt',
    inputPath,
    outputPath,
  ])
}

async function getQpdfModule(): Promise<QpdfModule> {
  if (!qpdfModule) {
    qpdfModule = Promise.all([
      import('qpdf-wasm'),
      import('qpdf-wasm/qpdf.js?url'),
      import('qpdf-wasm/qpdf.wasm?url'),
    ]).then(async ([{ default: initQpdf }, { default: scriptUrl }, { default: wasmUrl }]) => initQpdf({
      locateFile: (fileName) => {
        if (fileName === 'qpdf.js') return scriptUrl
        if (fileName === 'qpdf.wasm') return wasmUrl
        return fileName
      },
    }))
  }

  return qpdfModule
}

async function runQpdf(file: File, args: (inputPath: string, outputPath: string) => string[]): Promise<Uint8Array> {
  const operationId = qpdfOperationId++
  const inputPath = `/pdf-util-input-${operationId}.pdf`
  const outputPath = `/pdf-util-output-${operationId}.pdf`
  const qpdf = await getQpdfModule()

  qpdf.FS.writeFile(inputPath, new Uint8Array(await file.arrayBuffer()))

  try {
    const exitCode = qpdf.callMain(args(inputPath, outputPath))

    if (exitCode !== 0) {
      throw new Error('qpdf could not process the PDF. Check the password and try again.')
    }

    return new Uint8Array(qpdf.FS.readFile(outputPath))
  } finally {
    removeQpdfFile(qpdf, inputPath)
    removeQpdfFile(qpdf, outputPath)
  }
}

function removeQpdfFile(qpdf: QpdfModule, path: string): void {
  try {
    qpdf.FS.unlink(path)
  } catch {
    // qpdf may not create an output file after an unsuccessful operation.
  }
}

function validatePassword(password: string): void {
  if (!password) {
    throw new Error('A non-empty password is required.')
  }
}

function createOwnerPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function reorderDeletePages(file: File, newOrder: number[]): Promise<Uint8Array> {
  const source = await loadPdf(file)
  const doc = await PDFDocument.create()
  const orderedPages = await doc.copyPages(source, newOrder)
  orderedPages.forEach((page) => doc.addPage(page))
  return doc.save()
}

export async function rotatePages(file: File, pageIndices: number[], angle: number): Promise<Uint8Array> {
  const source = await loadPdf(file)
  const doc = await PDFDocument.create()
  const pages = await doc.copyPages(source, source.getPageIndices())

  pages.forEach((page, index) => {
    if (pageIndices.includes(index)) {
      page.setRotation(degrees(angle))
    }
    doc.addPage(page)
  })

  return doc.save()
}

export async function addWatermark(file: File, options: WatermarkOptions): Promise<Uint8Array> {
  const source = await loadPdf(file)
  const doc = await PDFDocument.create()
  const pages = await doc.copyPages(source, source.getPageIndices())

  const watermarkImage = options.image ? await embedImage(doc, options.image) : undefined
  const text = options.text ?? (watermarkImage ? undefined : 'CONFIDENTIAL')
  const font = text ? await doc.embedFont(StandardFonts.Helvetica) : undefined
  const color = rgb(0.75, 0.75, 0.75)
  const { opacity = 0.3, rotate = 45, x, y, fontSize = 40 } = options

  pages.forEach((page, index) => {
    const target = doc.addPage(page)
    const pageToUse = pageIndicesAllowed(index, options.pageIndexes)
    if (!pageToUse) return

    const { width, height } = page.getSize()

    if (watermarkImage) {
      const imageSize = watermarkImage.scaleToFit(width * 0.35, height * 0.35)
      target.drawImage(watermarkImage, {
        x: x ?? (width - imageSize.width) / 2,
        y: y ?? (height - imageSize.height) / 2,
        width: imageSize.width,
        height: imageSize.height,
        rotate: degrees(rotate),
        opacity,
      })
    }

    if (text && font) {
      const textWidth = font.widthOfTextAtSize(text, fontSize)
      target.drawText(text, {
        x: x ?? (width - textWidth) / 2,
        y: y ?? height / 2,
        size: fontSize,
        font,
        color,
        rotate: degrees(rotate),
        opacity,
      })
    }
  })

  return doc.save()
}

function pageIndicesAllowed(index: number, selected?: number[]): boolean {
  if (!selected || selected.length === 0) return true
  return selected.includes(index)
}

export async function pdfToImages(file: File, format: 'png' | 'jpeg', scale: number): Promise<Blob[]> {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error('Image scale must be greater than zero.')
  }

  const pdf = await loadPdfJsDoc(file)
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const images: Blob[] = []

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)

      try {
        const { canvas } = await renderPdfPage(page, scale)
        images.push(await canvasToBlob(canvas, mimeType))
      } finally {
        page.cleanup()
      }
    }
  } finally {
    await pdf.cleanup()
  }

  return images
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: 'image/jpeg' | 'image/png',
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Unable to encode the rendered PDF page.'))
      }
    }, mimeType, quality)
  })
}

export async function imagesToPdf(images: File[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create()

  for (const imageFile of images) {
    const image = await embedImage(doc, imageFile)

    const page = doc.addPage([image.width, image.height])
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    })
  }

  return doc.save()
}

async function embedImage(doc: PDFDocument, file: File): Promise<PDFImage> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  const bytes = await file.arrayBuffer()

  if (file.type === 'image/jpeg' || extension === 'jpg' || extension === 'jpeg') {
    return doc.embedJpg(bytes)
  }

  if (file.type === 'image/png' || extension === 'png') {
    return doc.embedPng(bytes)
  }

  throw new Error('Only PNG and JPEG images are supported.')
}

export async function compressPdf(file: File, options: CompressOptions = {}): Promise<Uint8Array> {
  const { quality = 0.72, maxDimension = 1600 } = options

  if (!Number.isFinite(quality) || quality <= 0 || quality > 1) {
    throw new Error('Compression quality must be greater than zero and at most one.')
  }

  if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
    throw new Error('Compression maximum dimension must be greater than zero.')
  }

  const sourceBytes = new Uint8Array(await file.arrayBuffer())
  const source = await loadPdfJsDoc(file)
  const compressed = await PDFDocument.create()

  try {
    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
      const page = await source.getPage(pageNumber)

      try {
        const originalViewport = page.getViewport({ scale: 1 })
        const scale = Math.min(1, maxDimension / Math.max(originalViewport.width, originalViewport.height))
        const { canvas } = await renderPdfPage(page, scale, '#ffffff')

        const imageBlob = await canvasToBlob(canvas, 'image/jpeg', quality)
        const image = await compressed.embedJpg(await imageBlob.arrayBuffer())
        const outputPage = compressed.addPage([originalViewport.width, originalViewport.height])
        outputPage.drawImage(image, {
          x: 0,
          y: 0,
          width: originalViewport.width,
          height: originalViewport.height,
        })
      } finally {
        page.cleanup()
      }
    }
  } finally {
    await source.cleanup()
  }

  const compressedBytes = await compressed.save()
  return compressedBytes.length < sourceBytes.length ? compressedBytes : sourceBytes
}
