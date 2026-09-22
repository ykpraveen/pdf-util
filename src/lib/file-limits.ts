export const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024
export const MAX_WORKSPACE_SIZE_BYTES = 500 * 1024 * 1024

export type FileSizeLimitIssue = {
  reason: 'file' | 'workspace'
  filename?: string
}

export function getFileSizeLimitIssue(
  existing: File[],
  incoming: File[],
): FileSizeLimitIssue | null {
  const oversized = incoming.find((file) => file.size > MAX_FILE_SIZE_BYTES)
  if (oversized) return { reason: 'file', filename: oversized.name }

  const totalSize = [...existing, ...incoming].reduce((total, file) => total + file.size, 0)
  return totalSize > MAX_WORKSPACE_SIZE_BYTES ? { reason: 'workspace' } : null
}