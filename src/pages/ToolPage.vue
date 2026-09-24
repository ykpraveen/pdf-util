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
  imagesToPdf,
  isEncryptedPdf,
  loadPdf,
  pdfToImages,
  removePassword,
  reorderDeletePages,
  rotatePages,
  setPassword,
  splitPdf,
  type PageRange,
} from '../lib/pdf'
import { extractText, summarizePdf } from '../lib/summary'
import { compressPdfInWorker, mergePdfsInWorker, ocrPdfInWorker } from '../workers/heavy.client'
import { useI18n } from '../i18n'

const descriptionKeys: Record<string, string> = {
  'Merge PDFs': 'tools.merge.description', 'Split PDF': 'tools.split.description', Organize: 'tools.organize.description', Compress: 'tools.compress.description',
  'PDF to image': 'tools.pdfToImage.description', 'Image to PDF': 'tools.imageToPdf.description', 'Set password': 'tools.password.description',
  'Remove password': 'tools.password.description', Watermark: 'tools.watermark.description', OCR: 'tools.ocr.description', Summarize: 'tools.summary.description',
}

const fileStore = useFileStore()
const { t } = useI18n()
const route = useRoute()
const tool = computed(() => route.meta.tool as string)
const toolLabel = computed(() => {
  const key = descriptionKeys[tool.value]?.replace('.description', '.label')
  return t(key ?? tool.value)
})
const description = computed(() => t(descriptionKeys[tool.value] ?? ''))
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
const progressDetail = ref('')
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
    // A file we just password-protected is expected to be unreadable without its
    // password - that's success, not a failure worth surfacing as an error.
    if (!(await isEncryptedPdf(file))) {
      error.value = t('errors.pdfUnreadable')
    }
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
  progressDetail.value = ''
  error.value = null
}

function updateHeavyProgress(completed: number, total: number): void {
  if (total <= 0) return
  progress.value = 10 + Math.round((completed / total) * 85)
  progressDetail.value = t(tool.value === 'Merge PDFs' ? 'output.fileProgress' : 'output.pageProgress', {
    completed,
    total,
  })
}

function requirePdf(message: string): File {
  if (!primaryPdf.value) throw new Error(message)
  return primaryPdf.value
}

async function processMerge(): Promise<void> {
  if (pdfFiles.value.length < 2) throw new Error(t('errors.mergeCount'))
  publishResult(await mergePdfsInWorker(pdfFiles.value, updateHeavyProgress), 'merged.pdf')
}

async function processSplit(): Promise<void> {
  const outputs = await splitPdf(requirePdf(t('errors.splitFile')), ranges.value)
  fileStore.publishResults(outputs.map((bytes, index) => makeFile(bytes, `split-${index + 1}.pdf`)))
}

async function processPassword(): Promise<void> {
  const file = requirePdf(t('errors.protectFile'))
  if (!password.value || password.value !== confirmPassword.value) throw new Error(t('errors.passwords'))
  publishResult(await setPassword(file, password.value), 'protected.pdf')
}

async function processRemovePassword(): Promise<void> {
  publishResult(await removePassword(requirePdf(t('errors.unlockFile')), password.value), 'unlocked.pdf')
}

async function processOrganize(): Promise<void> {
  const file = requirePdf(t('errors.organizeFile'))
  const order = parsePageOrder()
  if (!order.length) throw new Error(t('errors.pageNumber'))
  let output = await reorderDeletePages(file, order)
  if (rotation.value) {
    const orderedFile = makeFile(output, 'organized.pdf')
    const selectedOrderedPage = Math.max(0, order.indexOf(selectedPage.value))
    output = await rotatePages(orderedFile, [selectedOrderedPage], rotation.value)
  }
  publishResult(output, 'organized.pdf')
}

async function processCompress(): Promise<void> {
  publishResult(await compressPdfInWorker(requirePdf(t('errors.compressFile')), { quality: compressionQuality.value, maxDimension: compressionDimension.value }, updateHeavyProgress), 'compressed.pdf')
}

async function processPdfToImage(): Promise<void> {
  const images = await pdfToImages(requirePdf(t('errors.convertFile')), imageFormat.value, imageScale.value)
  fileStore.publishResults(images.map((blob, index) => new File([blob], `page-${index + 1}.${imageFormat.value}`, { type: blob.type })))
}

async function processImageToPdf(): Promise<void> {
  if (!imageFiles.value.length) throw new Error(t('errors.imageCount'))
  publishResult(await imagesToPdf(imageFiles.value), 'images.pdf')
}

async function processWatermark(): Promise<void> {
  publishResult(await addWatermark(requirePdf(t('errors.watermarkFile')), { text: watermarkText.value, opacity: watermarkOpacity.value, rotate: watermarkRotation.value }), 'watermarked.pdf')
}

async function processOcr(): Promise<void> {
  const pages = await ocrPdfInWorker(requirePdf(t('errors.ocrFile')), 'eng', updateHeavyProgress)
  ocrText.value = pages.map((page) => `Page ${page.pageNumber}\n${page.text}`).join('\n\n')
  fileStore.publishResults([new File([ocrText.value], 'ocr.txt', { type: 'text/plain' })])
}

async function processSummary(): Promise<void> {
  const file = requirePdf(t('errors.summaryFile'))

  summaryText.value = await summarizePdf(file, summarySentenceCount.value, {
    extractText,
    ocrPdfInWorker,
    onOcrStart: () => { progressDetail.value = t('output.summaryOcrFallback') },
    onProgress: updateHeavyProgress,
  })

  if (!summaryText.value.trim()) throw new Error(t('errors.summaryNoText'))

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
    if (!processor) throw new Error(t('errors.unavailable'))
    await processor()
    progress.value = 100
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('errors.operation')
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
    <RouterLink to="/" class="back-link" :aria-label="t('tool.back')"><ArrowLeft :size="15" aria-hidden="true" /> {{ t('tool.back') }}</RouterLink>
    <div class="tool-page-heading"><p class="eyebrow">{{ toolLabel }}</p><h1 id="tool-title">{{ toolLabel }}</h1><p>{{ description }}</p></div>
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
      <ToolOutput :tool="tool" :is-processing="isProcessing" :progress="progress" :progress-detail="progressDetail" :error="error" :file-count="fileStore.files.length" :summary-text="summaryText" :ocr-text="ocrText" :results="results" @process="processTool" />
    </div>
    <p class="tool-note">{{ t('tool.note') }}</p>
  </section>
</template>