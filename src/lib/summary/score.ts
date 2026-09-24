import type { SentenceInfo } from './sentences'

// Rewards earlier sentences, decaying with 1/(1+index) — cheap stand-in for the "lead sentence"
// convention in reports/articles, where the topic sentence tends to come first.
const LEAD_BIAS_WEIGHT = 0.15
// Flat multiplier for the first sentence of each source line (paragraph/bullet lead).
const PARAGRAPH_LEAD_BONUS = 1.1

export type ScoredSentence = { index: number; text: string; score: number }

export function scoreSentences(
  sentences: SentenceInfo[],
  tokenize: (text: string) => string[],
  stopWords: Set<string>,
): ScoredSentence[] {
  const tokensPerSentence = sentences.map((sentence) => tokenize(sentence.text).filter((word) => !stopWords.has(word)))
  const total = sentences.length

  const documentFrequency = new Map<string, number>()
  for (const tokens of tokensPerSentence) {
    for (const term of new Set(tokens)) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1)
    }
  }

  return sentences.map((sentence, index) => {
    const tokens = tokensPerSentence[index]
    if (tokens.length === 0) return { index, text: sentence.text, score: 0 }

    const termFrequency = new Map<string, number>()
    for (const term of tokens) termFrequency.set(term, (termFrequency.get(term) ?? 0) + 1)

    // Sum of (within-sentence term count * IDF weight) - deliberately not also divided by
    // sentence length here, since that's already handled once below via sqrt(length). Dividing
    // twice would over-penalize longer sentences and let short, low-content ones win on average
    // "distinctiveness" alone.
    let weightedSum = 0
    for (const [term, count] of termFrequency) {
      // Smoothed IDF: log((N+1)/(df+1)) + 1 stays positive even for tiny documents.
      const idf = Math.log((total + 1) / ((documentFrequency.get(term) ?? 0) + 1)) + 1
      weightedSum += count * idf
    }

    const lengthNormalized = weightedSum / Math.sqrt(tokens.length)
    const positionalBoost = 1 + LEAD_BIAS_WEIGHT / (1 + index)
    const leadBonus = sentence.isParagraphLead ? PARAGRAPH_LEAD_BONUS : 1

    return { index, text: sentence.text, score: lengthNormalized * positionalBoost * leadBonus }
  })
}
