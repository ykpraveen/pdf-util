declare module 'qpdf-wasm' {
  type QpdfModule = {
    FS: {
      readFile(path: string): Uint8Array
      unlink(path: string): void
      writeFile(path: string, data: Uint8Array): void
    }
    callMain(args: string[]): number
  }

  type QpdfFactoryOptions = {
    locateFile(fileName: string): string
  }

  const initQpdf: (options: QpdfFactoryOptions) => Promise<QpdfModule>

  export default initQpdf
}