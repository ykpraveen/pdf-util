import type { CompressOptions } from './index'

export function normalizeCompressionOptions(
  options: CompressOptions,
): Required<CompressOptions> {
  const quality = options.quality ?? 0.72
  const maxDimension = options.maxDimension ?? 1600

  if (!Number.isFinite(quality) || quality <= 0 || quality > 1) {
    throw new Error('Compression quality must be greater than zero and at most one.')
  }

  if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
    throw new Error('Compression maximum dimension must be greater than zero.')
  }

  return { quality, maxDimension }
}