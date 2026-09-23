import { describe, expect, it } from 'vitest'
import {
  describeOcrLoadFailure,
  OCR_INVALID_PDF_MESSAGE,
  OCR_PASSWORD_PROTECTED_MESSAGE,
  OCR_UNSUPPORTED_PDF_MESSAGE,
} from './errors'

function pdfjsException(name: string): Error {
  return Object.assign(new Error('pdf.js failure'), { name })
}

describe('describeOcrLoadFailure', () => {
  it('recognizes a password-protected PDF', () => {
    expect(describeOcrLoadFailure(pdfjsException('PasswordException'))).toBe(
      OCR_PASSWORD_PROTECTED_MESSAGE,
    )
  })

  it('recognizes an invalid PDF', () => {
    expect(describeOcrLoadFailure(pdfjsException('InvalidPDFException'))).toBe(
      OCR_INVALID_PDF_MESSAGE,
    )
  })

  it('falls back to a generic unsupported-PDF message for anything else', () => {
    expect(describeOcrLoadFailure(pdfjsException('UnknownErrorException'))).toBe(
      OCR_UNSUPPORTED_PDF_MESSAGE,
    )
    expect(describeOcrLoadFailure(new Error('boom'))).toBe(OCR_UNSUPPORTED_PDF_MESSAGE)
    expect(describeOcrLoadFailure('not an error')).toBe(OCR_UNSUPPORTED_PDF_MESSAGE)
    expect(describeOcrLoadFailure(undefined)).toBe(OCR_UNSUPPORTED_PDF_MESSAGE)
  })
})
