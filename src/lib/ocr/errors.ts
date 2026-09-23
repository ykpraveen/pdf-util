// pdfjs-dist throws typed exceptions (PasswordException, InvalidPDFException, ...) whose
// `.name` survives even though they extend the native `Error` via a closure, not a real
// `class Foo extends Error` - so we branch on `.name` instead of `instanceof`.
export const OCR_PASSWORD_PROTECTED_MESSAGE =
  'This PDF is password-protected. Remove the password before running OCR.'
export const OCR_INVALID_PDF_MESSAGE = "This file isn't a valid PDF and can't be processed for OCR."
export const OCR_UNSUPPORTED_PDF_MESSAGE =
  'This PDF could not be processed for OCR. It may be corrupted or use an unsupported format.'
export const OCR_EMPTY_PDF_MESSAGE = 'This PDF has no pages to run OCR on.'
export const OCR_PAGE_FAILURE_TEXT = '[This page could not be processed for OCR.]'

export function describeOcrLoadFailure(cause: unknown): string {
  const name = cause instanceof Error ? cause.name : undefined

  if (name === 'PasswordException') return OCR_PASSWORD_PROTECTED_MESSAGE
  if (name === 'InvalidPDFException') return OCR_INVALID_PDF_MESSAGE
  return OCR_UNSUPPORTED_PDF_MESSAGE
}
