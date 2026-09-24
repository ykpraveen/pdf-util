import { describe, expect, it, vi } from 'vitest'
import { createTestPdf } from '../test-fixtures'
import { extractText, isTextSparse, summarize, summarizePdf } from './index'

describe('summary helpers', () => {
  it('extracts text from every PDF page', async () => {
    const text = await extractText(await createTestPdf(2))

    expect(text).toContain('Page 1')
    expect(text).toContain('Page 2')
    expect(text.indexOf('Page 1')).toBeLessThan(text.indexOf('Page 2'))
  })

  it('selects the sentence with the most distinctive, informative terms', () => {
    const text = [
      'Solar panels produce clean electricity.',
      'Weekend markets sell fresh flowers.',
      'Solar electricity lowers solar electricity costs.',
    ].join(' ')

    expect(summarize(text, 1)).toBe('Solar panels produce clean electricity.')
  })

  it('returns selected sentences in their original order', () => {
    const text = [
      'Cloud systems improve reliable delivery.',
      'A violin played softly.',
      'Reliable cloud backups protect systems.',
    ].join(' ')

    expect(summarize(text, 2)).toBe(
      'Cloud systems improve reliable delivery. Reliable cloud backups protect systems.',
    )
  })

  it('normalizes short and empty input', () => {
    expect(summarize('  One sentence.\nSecond sentence. ', 5)).toBe('One sentence. Second sentence.')
    expect(summarize('  ', 1)).toBe('')
  })

  it('rejects invalid sentence counts', () => {
    expect(() => summarize('Some text.', 0)).toThrow('positive integer')
    expect(() => summarize('Some text.', 1.5)).toThrow('positive integer')
  })
})

describe('isTextSparse', () => {
  it('treats empty or very short text as sparse', () => {
    expect(isTextSparse('')).toBe(true)
    expect(isTextSparse('Just a few words here')).toBe(true)
  })

  it('treats a normal paragraph as not sparse', () => {
    expect(isTextSparse(Array(25).fill('word').join(' '))).toBe(false)
  })
})

describe('summarizePdf', () => {
  it('falls back to OCR when the extracted text is near-empty', async () => {
    const file = await createTestPdf(1)
    const extractText = vi.fn().mockResolvedValue('   ')
    const ocrPdfInWorker = vi.fn().mockResolvedValue([
      { pageNumber: 1, text: 'Solar panels produce clean electricity for homes everywhere.' },
    ])
    const onOcrStart = vi.fn()

    const result = await summarizePdf(file, 1, { extractText, ocrPdfInWorker, onOcrStart })

    expect(ocrPdfInWorker).toHaveBeenCalledWith(file, 'eng', undefined)
    expect(onOcrStart).toHaveBeenCalledOnce()
    expect(result).toContain('Solar panels')
  })

  it('skips OCR when the extracted text is already sufficient', async () => {
    const file = await createTestPdf(1)
    const extractText = vi.fn().mockResolvedValue(Array(30).fill('word').join(' ') + '.')
    const ocrPdfInWorker = vi.fn()

    await summarizePdf(file, 1, { extractText, ocrPdfInWorker })

    expect(ocrPdfInWorker).not.toHaveBeenCalled()
  })
})