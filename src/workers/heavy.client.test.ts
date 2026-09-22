import { beforeEach, describe, expect, it, vi } from 'vitest'
import { compressPdfInWorker, mergePdfsInWorker, ocrPdfInWorker } from './heavy.client'
import type { HeavyWorkerRequest, HeavyWorkerResponse } from './heavy.types'

type MessageListener = (event: MessageEvent<HeavyWorkerResponse>) => void
type ErrorListener = (event: ErrorEvent) => void

type PostedMessage = {
  request: HeavyWorkerRequest
  transfer: Transferable[]
}

let responseFor: (request: HeavyWorkerRequest) => HeavyWorkerResponse
const posted: PostedMessage[] = []
const terminate = vi.fn()

class WorkerStub {
  private messageListener?: MessageListener

  addEventListener(type: 'message', listener: MessageListener): void
  addEventListener(type: 'error', listener: ErrorListener): void
  addEventListener(type: 'message' | 'error', listener: MessageListener | ErrorListener): void {
    if (type === 'message') this.messageListener = listener as MessageListener
  }

  postMessage(request: HeavyWorkerRequest, transfer: Transferable[]): void {
    posted.push({ request, transfer })
    queueMicrotask(() => {
      this.messageListener?.({
        data: { id: request.id, type: 'progress', completed: 1, total: 2 },
      } as MessageEvent<HeavyWorkerResponse>)
      this.messageListener?.({ data: responseFor(request) } as MessageEvent<HeavyWorkerResponse>)
    })
  }

  terminate(): void {
    terminate()
  }
}

describe('heavy worker client', () => {
  beforeEach(() => {
    posted.length = 0
    terminate.mockClear()
    vi.stubGlobal('Worker', WorkerStub)
  })

  it('transfers merge inputs and reconstructs the worker output', async () => {
    responseFor = (request) => ({
      id: request.id,
      type: 'result',
      result: new Uint8Array([4, 5, 6]).buffer,
    })
    const onProgress = vi.fn()

    const output = await mergePdfsInWorker([
      new File([new Uint8Array([1])], 'one.pdf'),
      new File([new Uint8Array([2])], 'two.pdf'),
    ], onProgress)

    expect(Array.from(output)).toEqual([4, 5, 6])
    expect(posted[0].request.operation).toBe('merge')
    expect(posted[0].transfer).toHaveLength(2)
    expect(onProgress).toHaveBeenCalledWith(1, 2)
    expect(terminate).toHaveBeenCalledOnce()
  })

  it('passes compression options to the worker', async () => {
    responseFor = (request) => ({ id: request.id, type: 'result', result: new ArrayBuffer(0) })

    await compressPdfInWorker(new File([], 'source.pdf'), { quality: 0.5, maxDimension: 800 })

    expect(posted[0].request).toMatchObject({
      operation: 'compress',
      options: { quality: 0.5, maxDimension: 800 },
    })
  })

  it('returns OCR pages and propagates worker failures', async () => {
    responseFor = (request) => ({
      id: request.id,
      type: 'result',
      result: [{ pageNumber: 1, text: 'Recognized' }],
    })
    await expect(ocrPdfInWorker(new File([], 'scan.pdf'))).resolves.toEqual([
      { pageNumber: 1, text: 'Recognized' },
    ])

    responseFor = (request) => ({ id: request.id, type: 'error', error: 'Worker failed' })
    await expect(ocrPdfInWorker(new File([], 'scan.pdf'))).rejects.toThrow('Worker failed')
    expect(terminate).toHaveBeenCalledTimes(2)
  })
})
