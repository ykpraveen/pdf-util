import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import { loadPdfJsDoc } from '../pdf'

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'for', 'from',
  'had', 'has', 'have', 'he', 'her', 'his', 'i', 'in', 'is', 'it', 'its', 'of',
  'on', 'or', 'our', 'she', 'that', 'the', 'their', 'they', 'this', 'to', 'was',
  'we', 'were', 'will', 'with', 'you', 'your',
])

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

  const sentences = splitSentences(text)
  if (sentences.length <= sentenceCount) return sentences.join(' ')

  const frequencies = new Map<string, number>()

  for (const word of tokenize(text)) {
    if (!STOP_WORDS.has(word)) {
      frequencies.set(word, (frequencies.get(word) ?? 0) + 1)
    }
  }

  return sentences
    .map((sentence, index) => {
      const words = tokenize(sentence).filter((word) => !STOP_WORDS.has(word))
      const score = words.reduce((total, word) => total + (frequencies.get(word) ?? 0), 0)
        / Math.sqrt(Math.max(words.length, 1))
      return { index, sentence, score }
    })
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, sentenceCount)
    .sort((left, right) => left.index - right.index)
    .map(({ sentence }) => sentence)
    .join(' ')
}

function isTextItem(item: TextItem | { type: string }): item is TextItem {
  return 'str' in item
}

function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map((sentence) => sentence.trim()) ?? []
}

function tokenize(text: string): string[] {
  return text.toLocaleLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []
}