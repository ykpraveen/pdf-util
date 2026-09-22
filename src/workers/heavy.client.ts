import type { CompressOptions } from '../lib/pdf'
import type { PageText } from '../lib/ocr'
import type {
  HeavyWorkerProgress,
  HeavyWorkerRequestPayload,
  HeavyWorkerResponse,
  HeavyWorkerResult,
} from './heavy.types'

let operationId = 0

async function runWorker(
  request: HeavyWorkerRequestPayload,
  transfer: Transferable[],
  onProgress?: HeavyWorkerProgress,
): Promise<HeavyWorkerResult> {
  const worker = new Worker(new URL('./heavy.worker.ts', import.meta.url), { type: 'module' })
  const id = operationId++

  return new Promise((resolve, reject) => {
    worker.addEventListener('message', (event: MessageEvent<HeavyWorkerResponse>) => {
      if (event.data.id !== id) return

      if (event.data.type === 'progress') {
        onProgress?.(event.data.completed, event.data.total)
        return
      }

      worker.terminate()
      if (event.data.type === 'result') {
        resolve(event.data.result)
      } else {
        reject(new Error(event.data.error))
      }
    })
    worker.addEventListener('error', (event) => {
      worker.terminate()
      reject(new Error(event.message || 'The background operation failed.'))
    })
    worker.postMessage({ ...request, id }, transfer)
  })
}

export async function mergePdfsInWorker(
  files: File[],
  onProgress?: HeavyWorkerProgress,
): Promise<Uint8Array> {
  const buffers = await Promise.all(files.map((file) => file.arrayBuffer()))
  const result = await runWorker({ operation: 'merge', files: buffers }, buffers, onProgress)
  return new Uint8Array(result as ArrayBuffer)
}

export async function compressPdfInWorker(
  file: File,
  options: CompressOptions = {},
  onProgress?: HeavyWorkerProgress,
): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer()
  const result = await runWorker({ operation: 'compress', file: buffer, options }, [buffer], onProgress)
  return new Uint8Array(result as ArrayBuffer)
}

export async function ocrPdfInWorker(
  file: File,
  language = 'eng',
  onProgress?: HeavyWorkerProgress,
): Promise<PageText[]> {
  const buffer = await file.arrayBuffer()
  return runWorker(
    { operation: 'ocr', file: buffer, language },
    [buffer],
    onProgress,
  ) as Promise<PageText[]>
}