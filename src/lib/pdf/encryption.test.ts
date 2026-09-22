import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestPdf } from '../test-fixtures'

const { callMain, files, initQpdf, unlink } = vi.hoisted(() => {
  const files = new Map<string, Uint8Array>()
  const writeFile = vi.fn((path: string, data: Uint8Array) => files.set(path, data))
  const readFile = vi.fn((path: string) => files.get(path) ?? new Uint8Array())
  const unlink = vi.fn((path: string) => files.delete(path))
  const callMain = vi.fn((args: string[]) => {
    const input = files.get(args.at(-2) ?? '') ?? new Uint8Array()
    files.set(args.at(-1) ?? '', input)
    return 0
  })
  const initQpdf = vi.fn(async () => ({ FS: { readFile, unlink, writeFile }, callMain }))
  return { callMain, files, initQpdf, unlink }
})

vi.mock('qpdf-wasm', () => ({ default: initQpdf }))
vi.mock('qpdf-wasm/qpdf.js?url', () => ({ default: '/qpdf.js' }))
vi.mock('qpdf-wasm/qpdf.wasm?url', () => ({ default: '/qpdf.wasm' }))

import { removePassword, setPassword } from './index'

describe('PDF password helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    files.clear()
    callMain.mockImplementation((args: string[]) => {
      const input = files.get(args.at(-2) ?? '') ?? new Uint8Array()
      files.set(args.at(-1) ?? '', input)
      return 0
    })
  })

  it('encrypts with AES-256 and removes temporary files', async () => {
    const source = await createTestPdf(1)
    const output = await setPassword(source, 'secret')
    const args = callMain.mock.calls[0]?.[0] as string[]

    expect(output).toEqual(new Uint8Array(await source.arrayBuffer()))
    expect(args.slice(0, 2)).toEqual(['--encrypt', 'secret'])
    expect(args[3]).toBe('256')
    expect(args[4]).toBe('--')
    expect(unlink).toHaveBeenCalledTimes(2)
    expect(files.size).toBe(0)
  })

  it('decrypts with the supplied password', async () => {
    await removePassword(await createTestPdf(1), 'secret')
    const args = callMain.mock.calls[0]?.[0] as string[]

    expect(args[0]).toBe('--password=secret')
    expect(args[1]).toBe('--decrypt')
    expect(unlink).toHaveBeenCalledTimes(2)
  })

  it('rejects empty passwords before loading qpdf', async () => {
    const source = await createTestPdf(1)

    await expect(setPassword(source, '')).rejects.toThrow('non-empty password')
    await expect(removePassword(source, '')).rejects.toThrow('non-empty password')
    expect(callMain).not.toHaveBeenCalled()
  })

  it('reports qpdf failures and still removes temporary files', async () => {
    callMain.mockReturnValueOnce(2)

    await expect(removePassword(await createTestPdf(1), 'wrong')).rejects.toThrow('could not process')
    expect(unlink).toHaveBeenCalledTimes(2)
    expect(files.size).toBe(0)
  })
})