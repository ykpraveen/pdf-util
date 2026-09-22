<script setup lang="ts">
import { ArrowRight, CheckCircle2 } from '@lucide/vue'
import DownloadResultCard from './DownloadResultCard.vue'
import ProgressIndicator from './ProgressIndicator.vue'
import { useI18n } from '../i18n'

const { t } = useI18n()

const toolKeys: Record<string, string> = {
  'Merge PDFs': 'merge', 'Split PDF': 'split', Organize: 'organize', Compress: 'compress', 'PDF to image': 'pdfToImage',
  'Image to PDF': 'imageToPdf', 'Set password': 'password', 'Remove password': 'password', Watermark: 'watermark', OCR: 'ocr', Summarize: 'summary',
}

defineProps<{
  tool: string
  isProcessing: boolean
  progress: number
  progressDetail: string
  error: string | null
  fileCount: number
  summaryText: string
  ocrText: string
  results: File[]
}>()

defineEmits<{
  process: []
}>()
</script>

<template>
  <ProgressIndicator v-if="isProcessing" :value="progress" :label="t('output.processing', { tool: t(`tools.${toolKeys[tool] ?? tool}.label`) })" :detail="progressDetail" />
  <p v-if="error" id="tool-error" class="tool-error" role="alert">{{ error }}</p>
  <div class="next-step">
    <div role="status" aria-live="polite"><CheckCircle2 :size="17" aria-hidden="true" /><span>{{ fileCount ? t('nav.filesReadyShort', { count: fileCount }) : t('output.ready') }}</span></div>
    <button type="button" class="button button-primary" :disabled="isProcessing" :aria-busy="isProcessing" :aria-describedby="error ? 'tool-error' : undefined" :aria-label="t('output.process')" @click="$emit('process')">{{ t('output.process') }} <ArrowRight :size="16" aria-hidden="true" /></button>
  </div>
  <div v-if="summaryText || ocrText" class="text-output"><h2>{{ summaryText ? t('output.summary') : t('output.extracted') }}</h2><label for="text-output-content">{{ t('output.generated') }}</label><textarea id="text-output-content" :aria-label="t('output.generated')" :value="summaryText || ocrText" readonly /></div>
  <div v-if="results.length" class="result-list"><DownloadResultCard v-for="result in results" :key="result.name" :file="result" :filename="result.name" /></div>
</template>