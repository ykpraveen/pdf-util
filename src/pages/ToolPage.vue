<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import FileDropZone from '../components/FileDropZone.vue'
import PageRangeSelector from '../components/PageRangeSelector.vue'
import PdfPreviewThumbnails from '../components/PdfPreviewThumbnails.vue'
import ToolOptions from '../components/ToolOptions.vue'
import ToolOutput from '../components/ToolOutput.vue'
import { useFileStore } from '../stores/files'
import {
  addWatermark,
  compressPdf,
  imagesToPdf,
  loadPdf,
  mergePdfs,
  pdfToImages,
  removePassword,
  reorderDeletePages,
  rotatePages,
  setPassword,
  splitPdf,
  type PageRange,
} from '../lib/pdf'
import { ocrPdf } from '../lib/ocr'
import { extractText, summarize } from '../lib/summary'

const descriptions: Record<string, string> = {
  'Merge PDFs': 'Bring documents together in the order you choose.',
  'Split PDF': 'Choose pages or ranges to make a new document.',
  Organize: 'Arrange, rotate, or remove pages exactly as needed.',
  Compress: 'Reduce file size while keeping your document readable.',
  'PDF to image': 'Export every page as a crisp image.',
  'Image to PDF': 'Turn photos and scans into a single PDF.',
  'Set password': 'Add a password before sharing your document.',
  'Remove password': 'Unlock a document with the correct password.',
  Watermark: 'Add a subtle text mark across selected pages.',
  OCR: 'Extract searchable text from scanned pages.',
  Summarize: 'Get the important points without sending data anywhere.',
}

const fileStore = useFileStore()
const route = useRoute()
const tool = computed(() => route.meta.tool as string)
const description = computed(() => descriptions[tool.value] ?? '')
const pdfFiles = computed(() => fileStore.files.filter((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')))
const imageFiles = computed(() => fileStore.files.filter((file) => file.type.startsWith('image/')))
const primaryPdf = computed(() => pdfFiles.value[0] ?? null)
const pageCount = ref(0)
const selectedPage = ref(0)
const ranges = ref<PageRange[]>([{ start: 1, end: 1 }])
const pageOrder = ref('')
const rotation = ref(90)
const password = ref('')
const confirmPassword = ref('')
const watermarkText = ref('CONFIDENTIAL')
const watermarkOpacity = ref(0.3)
const watermarkRotation = ref(45)
const imageFormat = ref<'png' | 'jpeg'>('jpeg')
const imageScale = ref(1.5)
const compressionQuality = ref(0.72)
const compressionDimension = ref(1600)
const summarySentenceCount = ref(5)
const summaryText = ref('')
const ocrText = ref('')
const isProcessing = ref(false)
const progress = ref(0)
const error = ref<string | null>(null)
const results = computed(() => fileStore.results)

watch(primaryPdf, loadPageCount, { immediate: true })
watch(pageCount, (count) => {
  if (!count) return
  ranges.value = [{ start: 1, end: count }]
  pageOrder.value = Array.from({ length: count }, (_, index) => index + 1).join(', ')
})

async function loadPageCount(file: File | null): Promise<void> {
  pageCount.value = 0
  if (!file) return

  try {
    const document = await loadPdf(file)
    pageCount.value = document.getPageCount()
  } catch {
    error.value = 'This PDF could not be read. Try an unlocked PDF or use the password tool first.'
  }
}

function makeBlob(bytes: Uint8Array, type = 'application/pdf'): Blob {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return new Blob([buffer], { type })
}

function makeFile(bytes: Uint8Array, filename: string, type = 'application/pdf'): File {
  return new File([makeBlob(bytes, type)], filename, { type })
}

function publishResult(bytes: Uint8Array, filename: string): void {
  fileStore.publishResults([makeFile(bytes, filename)])
}

function parsePageOrder(): number[] {
  return pageOrder.value
    .split(',')
    .map((value) => Number(value.trim()) - 1)
    .filter((index) => Number.isInteger(index) && index >= 0 && index < pageCount.value)
}

function clearOutput(): void {
  fileStore.clearResults()
  summaryText.value = ''
  ocrText.value = ''
  error.value = null
}

function requirePdf(message: string): File {
  if (!primaryPdf.value) throw new Error(message)
  return primaryPdf.value
}

async function processMerge(): Promise<void> {
  if (pdfFiles.value.length < 2) throw new Error('Choose at least two PDF files to merge.')
  publishResult(await mergePdfs(pdfFiles.value), 'merged.pdf')
}

async function processSplit(): Promise<void> {
  const outputs = await splitPdf(requirePdf('Choose a PDF to split.'), ranges.value)
  fileStore.publishResults(outputs.map((bytes, index) => makeFile(bytes, `split-${index + 1}.pdf`)))
}

async function processPassword(): Promise<void> {
  const file = requirePdf('Choose a PDF to protect.')
  if (!password.value || password.value !== confirmPassword.value) throw new Error('Enter matching passwords.')
  publishResult(await setPassword(file, password.value), 'protected.pdf')
}

async function processRemovePassword(): Promise<void> {
  publishResult(await removePassword(requirePdf('Choose a password-protected PDF.'), password.value), 'unlocked.pdf')
}

async function processOrganize(): Promise<void> {
  const file = requirePdf('Choose a PDF to organize.')
  const order = parsePageOrder()
  if (!order.length) throw new Error('Enter at least one valid page number.')
  let output = await reorderDeletePages(file, order)
  if (rotation.value) {
    const orderedFile = makeFile(output, 'organized.pdf')
    const selectedOrderedPage = Math.max(0, order.indexOf(selectedPage.value))
    output = await rotatePages(orderedFile, [selectedOrderedPage], rotation.value)
  }
  publishResult(output, 'organized.pdf')
}

async function processCompress(): Promise<void> {
  publishResult(await compressPdf(requirePdf('Choose a PDF to compress.'), { quality: compressionQuality.value, maxDimension: compressionDimension.value }), 'compressed.pdf')
}

async function processPdfToImage(): Promise<void> {
  const images = await pdfToImages(requirePdf('Choose a PDF to convert.'), imageFormat.value, imageScale.value)
  fileStore.publishResults(images.map((blob, index) => new File([blob], `page-${index + 1}.${imageFormat.value}`, { type: blob.type })))
}

async function processImageToPdf(): Promise<void> {
  if (!imageFiles.value.length) throw new Error('Choose at least one PNG or JPEG image.')
  publishResult(await imagesToPdf(imageFiles.value), 'images.pdf')
}

async function processWatermark(): Promise<void> {
  publishResult(await addWatermark(requirePdf('Choose a PDF to watermark.'), { text: watermarkText.value, opacity: watermarkOpacity.value, rotate: watermarkRotation.value }), 'watermarked.pdf')
}

async function processOcr(): Promise<void> {
  const pages = await ocrPdf(requirePdf('Choose a scanned PDF.'))
  ocrText.value = pages.map((page) => `Page ${page.pageNumber}\n${page.text}`).join('\n\n')
  fileStore.publishResults([new File([ocrText.value], 'ocr.txt', { type: 'text/plain' })])
}

async function processSummary(): Promise<void> {
  summaryText.value = summarize(await extractText(requirePdf('Choose a PDF to summarize.')), summarySentenceCount.value)
  fileStore.publishResults([new File([summaryText.value], 'summary.txt', { type: 'text/plain' })])
}

async function processTool(): Promise<void> {
  clearOutput()
  isProcessing.value = true
  progress.value = 12

  const processors: Record<string, () => Promise<void>> = {
    'Merge PDFs': processMerge,
    'Split PDF': processSplit,
    'Set password': processPassword,
    'Remove password': processRemovePassword,
    Organize: processOrganize,
    Compress: processCompress,
    'PDF to image': processPdfToImage,
    'Image to PDF': processImageToPdf,
    Watermark: processWatermark,
    OCR: processOcr,
    Summarize: processSummary,
  }

  try {
    const processor = processors[tool.value]
    if (!processor) throw new Error('This tool is not available.')
    await processor()
    progress.value = 100
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'The operation could not be completed.'
  } finally {
    isProcessing.value = false
  }
}

function selectPage(index: number): void {
  selectedPage.value = index
}
</script>

<template>
  <section class="tool-page" aria-labelledby="tool-title">
    <RouterLink to="/" class="back-link"><ArrowLeft :size="15" /> All tools</RouterLink>
    <div class="tool-page-heading"><p class="eyebrow">{{ tool }}</p><h1 id="tool-title">{{ tool }}</h1><p>{{ description }}</p></div>
    <div class="tool-panel tool-workspace">
      <FileDropZone :multiple="tool === 'Merge PDFs' || tool === 'Image to PDF'" :accept="tool === 'Image to PDF' ? 'image/png,image/jpeg' : '.pdf,application/pdf'" />
      <div v-if="primaryPdf && ['Split PDF', 'Organize', 'Watermark'].includes(tool)" class="tool-preview-block"><PdfPreviewThumbnails :file="primaryPdf" :selected-page="selectedPage" @select="selectPage" /></div>
      <PageRangeSelector v-if="tool === 'Split PDF'" v-model="ranges" :page-count="pageCount" />
      <ToolOptions
        v-model:page-order="pageOrder"
        v-model:rotation="rotation"
        v-model:password="password"
        v-model:confirm-password="confirmPassword"
        v-model:compression-quality="compressionQuality"
        v-model:compression-dimension="compressionDimension"
        v-model:image-format="imageFormat"
        v-model:image-scale="imageScale"
        v-model:watermark-text="watermarkText"
        v-model:watermark-opacity="watermarkOpacity"
        v-model:watermark-rotation="watermarkRotation"
        v-model:summary-sentence-count="summarySentenceCount"
        :tool="tool"
      />
      <ToolOutput :tool="tool" :is-processing="isProcessing" :progress="progress" :error="error" :file-count="fileStore.files.length" :summary-text="summaryText" :ocr-text="ocrText" :results="results" @process="processTool" />
    </div>
    <p class="tool-note">Your files are processed locally in this browser. Nothing is uploaded.</p>
  </section>
</template>