import { describe, expect, it } from 'vitest'
import { createTestPdf } from '../test-fixtures'
import { extractText, summarize } from './index'

describe('summary helpers', () => {
  it('extracts text from every PDF page', async () => {
    const text = await extractText(await createTestPdf(2))

    expect(text).toContain('Page 1')
    expect(text).toContain('Page 2')
    expect(text.indexOf('Page 1')).toBeLessThan(text.indexOf('Page 2'))
  })

  it('selects sentences containing the most frequent meaningful words', () => {
    const text = [
      'Solar panels produce clean electricity.',
      'Weekend markets sell fresh flowers.',
      'Solar electricity lowers solar electricity costs.',
    ].join(' ')

    expect(summarize(text, 1)).toBe('Solar electricity lowers solar electricity costs.')
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