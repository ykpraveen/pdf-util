import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import type { PageText } from '../ocr'
import { loadPdfJsDoc } from '../pdf'
import { STOP_WORDS } from './stopwords'
import { splitSentencesWithMeta } from './sentences'
import { scoreSentences } from './score'

export async function extractText(file: File): Promise<string> {
  const pdf = await loadPdfJsDoc(file)
  const pages: string[] = []

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)

      try {
        const content = await page.getTextContent()
        const chunks: string[] = []

        for (const item of content.items) {
          if (!isTextItem(item)) continue
          chunks.push(item.str, item.hasEOL ? '\n' : ' ')
        }

        const pageText = chunks
          .join('')
          .split('\n')
          .map((line) => line.replace(/\s+/g, ' ').trim())
          .filter(Boolean)
          .join('\n')

        pages.push(pageText)
      } finally {
        page.cleanup()
      }
    }
  } finally {
    await pdf.cleanup()
  }

  return pages.filter(Boolean).join('\n\n')
}

export function summarize(text: string, sentenceCount: number): string {
  if (!Number.isInteger(sentenceCount) || sentenceCount <= 0) {
    throw new Error('Sentence count must be a positive integer.')
  }

  const sentences = splitSentencesWithMeta(text, (sentence) => tokenize(sentence).length)
  if (sentences.length <= sentenceCount) return sentences.map((sentence) => sentence.text).join(' ')

  return scoreSentences(sentences, tokenize, STOP_WORDS)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, sentenceCount)
    .sort((left, right) => left.index - right.index)
    .map((sentence) => sentence.text)
    .join(' ')
}

// A scanned/image-only PDF has an empty or near-empty text layer. Below this many words,
// extractText's output is treated as unusable and OCR is run instead.
const NEAR_EMPTY_WORD_THRESHOLD = 20

export function isTextSparse(text: string): boolean {
  return tokenize(text).length < NEAR_EMPTY_WORD_THRESHOLD
}

export type SummarizePdfDeps = {
  extractText: (file: File) => Promise<string>
  ocrPdfInWorker: (
    file: File,
    language: string,
    onProgress?: (completed: number, total: number) => void,
  ) => Promise<PageText[]>
  onOcrStart?: () => void
  onProgress?: (completed: number, total: number) => void
}

// Extracts text and summarizes it, transparently falling back to OCR when the embedded
// text layer is empty or near-empty (a scanned/image-only PDF).
export async function summarizePdf(file: File, sentenceCount: number, deps: SummarizePdfDeps): Promise<string> {
  let text = await deps.extractText(file)

  if (isTextSparse(text)) {
    deps.onOcrStart?.()
    const pages = await deps.ocrPdfInWorker(file, 'eng', deps.onProgress)
    text = pages.map((page) => page.text).join('\n\n')
  }

  return summarize(text, sentenceCount)
}

function isTextItem(item: TextItem | { type: string }): item is TextItem {
  return 'str' in item
}

function tokenize(text: string): string[] {
  return text.toLocaleLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []
}
