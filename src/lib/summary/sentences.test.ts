import { describe, expect, it } from 'vitest'
import { splitSentencesWithMeta } from './sentences'

function wordCount(text: string): number {
  return (text.match(/[\p{L}\p{N}']+/gu) ?? []).length
}

function split(text: string): string[] {
  return splitSentencesWithMeta(text, wordCount).map((sentence) => sentence.text)
}

describe('splitSentencesWithMeta', () => {
  it('does not split on common abbreviations', () => {
    expect(split('Dr. Smith met Prof. Lee.')).toEqual(['Dr. Smith met Prof. Lee.'])
    expect(split('He lives in the U.S. now.')).toEqual(['He lives in the U.S. now.'])
    expect(split('Read the report, e.g. section two, and revise it.')).toEqual([
      'Read the report, e.g. section two, and revise it.',
    ])
  })

  it('does not split on decimals', () => {
    expect(split('The score is 3.14 out of 5. Good result.')).toEqual([
      'The score is 3.14 out of 5.',
      'Good result.',
    ])
  })

  it('does not split on ellipses and restores them intact', () => {
    expect(split('Wait... what happened? Then it stopped.')).toEqual([
      'Wait... what happened?',
      'Then it stopped.',
    ])
  })

  it('splits bulleted lines and strips the bullet marker', () => {
    const text = '• First important point\n• Second important point\n• Third important point'
    expect(split(text)).toEqual([
      'First important point',
      'Second important point',
      'Third important point',
    ])
  })

  it('merges short, unpunctuated fragments into the previous sentence', () => {
    const text = 'The quarterly results improved significantly.\nPage 3\nCosts remained flat this year.'
    const sentences = split(text)
    expect(sentences).toHaveLength(2)
    expect(sentences[0]).toBe('The quarterly results improved significantly. Page 3')
    expect(sentences[1]).toBe('Costs remained flat this year.')
  })

  it('keeps a short, fully punctuated sentence intact', () => {
    expect(split('Is that correct? Yes. It is confirmed.')).toEqual(['Is that correct?', 'Yes.', 'It is confirmed.'])
  })

  it('handles noisy multi-line text without producing empty entries', () => {
    const text = 'ANNUAL REPORT\n\nRevenue grew across all segments.\nNet income rose 12%.\n\nPage 1 of 12'
    const sentences = split(text)
    expect(sentences.every((sentence) => sentence.trim().length > 0)).toBe(true)
    expect(sentences.join(' ')).toContain('Revenue grew across all segments.')
  })
})
