import type { CompressOptions } from '../lib/pdf'
import type { PageText } from '../lib/ocr'

export type HeavyWorkerRequest =
  | { id: number; operation: 'merge'; files: ArrayBuffer[] }
  | { id: number; operation: 'compress'; file: ArrayBuffer; options: CompressOptions }
  | { id: number; operation: 'ocr'; file: ArrayBuffer; language: string }

export type HeavyWorkerRequestPayload =
  HeavyWorkerRequest extends infer Request
    ? Request extends HeavyWorkerRequest
      ? Omit<Request, 'id'>
      : never
    : never

export type HeavyWorkerResult = ArrayBuffer | PageText[]

export type HeavyWorkerResponse =
  | { id: number; type: 'progress'; completed: number; total: number }
  | { id: number; type: 'result'; result: HeavyWorkerResult }
  | { id: number; type: 'error'; error: string }

export type HeavyWorkerProgress = (completed: number, total: number) => void