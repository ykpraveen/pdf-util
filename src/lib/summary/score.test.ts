import { describe, expect, it } from 'vitest'
import { scoreSentences } from './score'
import { STOP_WORDS } from './stopwords'

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []
}

describe('scoreSentences', () => {
  it('rewards terms distinctive within the document over terms shared by every sentence', () => {
    // Same lead sentence, scored in two different corpora: in one, its words are echoed by
    // every other sentence (low IDF); in the other, they're unique to it (high IDF).
    const sameWordsEverywhere = scoreSentences(
      [
        { text: 'Reports summarize quarterly performance.', isParagraphLead: false },
        { text: 'Quarterly performance reports summarize well.', isParagraphLead: false },
        { text: 'Summarize quarterly performance in reports.', isParagraphLead: false },
      ],
      tokenize,
      STOP_WORDS,
    )[0]

    const wordsUniqueToLeadSentence = scoreSentences(
      [
        { text: 'Reports summarize quarterly performance.', isParagraphLead: false },
        { text: 'Weekend markets sell fresh flowers.', isParagraphLead: false },
        { text: 'A violin played softly tonight.', isParagraphLead: false },
      ],
      tokenize,
      STOP_WORDS,
    )[0]

    expect(wordsUniqueToLeadSentence.score).toBeGreaterThan(sameWordsEverywhere.score)
  })

  it('breaks ties in favor of the earlier sentence', () => {
    const sentences = [
      { text: 'Alpha bravo charlie delta.', isParagraphLead: false },
      { text: 'Delta charlie bravo alpha.', isParagraphLead: false },
    ]

    const scored = scoreSentences(sentences, tokenize, STOP_WORDS)
    expect(scored[0].score).toBeGreaterThan(scored[1].score)
  })

  it('boosts a paragraph-lead sentence over an otherwise identical one', () => {
    const sentences = [
      { text: 'Solar panels generate renewable electricity.', isParagraphLead: false },
      { text: 'Solar panels generate renewable electricity.', isParagraphLead: true },
    ]

    const scored = scoreSentences(sentences, tokenize, STOP_WORDS)
    expect(scored[1].score).toBeGreaterThan(scored[0].score)
  })

  it('scores an all-stopword sentence as zero', () => {
    const sentences = [{ text: 'It was to be.', isParagraphLead: false }]
    const scored = scoreSentences(sentences, tokenize, STOP_WORDS)
    expect(scored[0].score).toBe(0)
  })
})
