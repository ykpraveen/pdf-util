import { describe, expect, it } from 'vitest'
import {
  getFileSizeLimitIssue,
  MAX_FILE_SIZE_BYTES,
  MAX_WORKSPACE_SIZE_BYTES,
} from './file-limits'

function sizedFile(size: number, name: string): File {
  return { name, size } as File
}

describe('file size limits', () => {
  it('accepts selections within both limits', () => {
    expect(getFileSizeLimitIssue([], [sizedFile(1024, 'small.pdf')])).toBeNull()
  })

  it('identifies a file over the per-file limit', () => {
    expect(getFileSizeLimitIssue([], [
      sizedFile(MAX_FILE_SIZE_BYTES + 1, 'large.pdf'),
    ])).toEqual({
      reason: 'file',
      filename: 'large.pdf',
    })
  })

  it('rejects a selection that exceeds the workspace limit', () => {
    expect(getFileSizeLimitIssue(
      [sizedFile(MAX_WORKSPACE_SIZE_BYTES - 100, 'existing.pdf')],
      [sizedFile(101, 'incoming.pdf')],
    )).toEqual({ reason: 'workspace' })
  })
})