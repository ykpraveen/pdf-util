import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { createTestPdf, createTestPng } from '../test-fixtures'
import {
  addWatermark,
  compressPdf,
  imagesToPdf,
  loadPdf,
  loadPdfJsDoc,
  mergePdfs,
  pdfToImages,
  reorderDeletePages,
  rotatePages,
  splitPdf,
} from './index'

describe('pdf helpers', () => {
  it('loads a PDF through pdf-lib', async () => {
    const document = await loadPdf(await createTestPdf(2))

    expect(document.getPageCount()).toBe(2)
  })

  it('loads a PDF through pdf.js', async () => {
    const source = await createTestPdf(2)
    const document = await loadPdfJsDoc(source)

    expect(document.numPages).toBe(2)
  })

  it('merges multiple PDFs into a single document', async () => {
    const first = await createTestPdf(1, 'First')
    const second = await createTestPdf(2, 'Second')

    const merged = await mergePdfs([first, second])
    const mergedDoc = await PDFDocument.load(merged)

    expect(mergedDoc.getPageCount()).toBe(3)
  })

  it('splits a PDF into requested ranges', async () => {
    const source = await createTestPdf(3)
    const parts = await splitPdf(source, [{ start: 2, end: 3 }])
    const partDoc = await PDFDocument.load(parts[0])

    expect(parts).toHaveLength(1)
    expect(partDoc.getPageCount()).toBe(2)
  })

  it('reorders the requested page order', async () => {
    const source = await createTestPdf(3)
    const reordered = await reorderDeletePages(source, [2, 0, 1])
    const doc = await PDFDocument.load(reordered)

    expect(doc.getPageCount()).toBe(3)
    expect(doc.getPages().map((page) => page.getWidth())).toEqual([222, 220, 221])
  })

  it('rotates selected pages without crashing', async () => {
    const source = await createTestPdf(2)
    const rotated = await rotatePages(source, [0], 90)
    const doc = await PDFDocument.load(rotated)

    expect(doc.getPageCount()).toBe(2)
    expect(doc.getPage(0).getRotation().angle).toBe(90)
  })

  it('preserves pages that are not selected for watermarking', async () => {
    const source = await createTestPdf(2)
    const watermarked = await addWatermark(source, {
      text: 'Internal',
      pageIndexes: [0],
    })
    const document = await PDFDocument.load(watermarked)

    expect(document.getPageCount()).toBe(2)
  })

  it('adds an image watermark', async () => {
    const source = await createTestPdf(1)
    const watermarked = await addWatermark(source, { image: createTestPng(), rotate: 0 })
    const document = await PDFDocument.load(watermarked)

    expect(document.getPageCount()).toBe(1)
    expect(watermarked.length).toBeGreaterThan(await source.arrayBuffer().then((buffer) => buffer.byteLength))
  })

  it('converts supported images to PDF pages', async () => {
    const output = await imagesToPdf([createTestPng(), createTestPng()])
    const document = await PDFDocument.load(output)

    expect(document.getPageCount()).toBe(2)
    expect(document.getPage(0).getSize()).toEqual({ width: 1, height: 1 })
  })

  it('rejects unsupported image formats', async () => {
    const image = new File(['not an image'], 'image.webp', { type: 'image/webp' })

    await expect(imagesToPdf([image])).rejects.toThrow('PNG and JPEG')
  })

  it('rejects invalid PDF-to-image scales before rendering', async () => {
    const source = await createTestPdf(1)

    await expect(pdfToImages(source, 'png', 0)).rejects.toThrow('scale')
    await expect(pdfToImages(source, 'png', Number.NaN)).rejects.toThrow('scale')
  })

  it('rejects invalid compression options before processing the PDF', async () => {
    const source = await createTestPdf(1)

    await expect(compressPdf(source, { quality: 0 })).rejects.toThrow('quality')
    await expect(compressPdf(source, { quality: Number.NaN })).rejects.toThrow('quality')
    await expect(compressPdf(source, { maxDimension: 0 })).rejects.toThrow('dimension')
  })

})
