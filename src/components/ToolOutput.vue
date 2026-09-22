<script setup lang="ts">
import { ArrowRight, CheckCircle2 } from '@lucide/vue'
import DownloadResultCard from './DownloadResultCard.vue'
import ProgressIndicator from './ProgressIndicator.vue'

defineProps<{
  tool: string
  isProcessing: boolean
  progress: number
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
  <ProgressIndicator v-if="isProcessing" :value="progress" :label="`Processing ${tool.toLowerCase()}`" />
  <p v-if="error" id="tool-error" class="tool-error" role="alert">{{ error }}</p>
  <div class="next-step">
    <div role="status" aria-live="polite"><CheckCircle2 :size="17" /><span>{{ fileCount ? `${fileCount} file${fileCount === 1 ? '' : 's'} ready` : 'Ready when you are' }}</span></div>
    <button type="button" class="button button-primary" :disabled="isProcessing" :aria-busy="isProcessing" :aria-describedby="error ? 'tool-error' : undefined" @click="$emit('process')">Process <ArrowRight :size="16" /></button>
  </div>
  <div v-if="summaryText || ocrText" class="text-output"><h2>{{ summaryText ? 'Summary' : 'Extracted text' }}</h2><label for="text-output-content">Generated text</label><textarea id="text-output-content" :value="summaryText || ocrText" readonly /></div>
  <div v-if="results.length" class="result-list"><DownloadResultCard v-for="result in results" :key="result.name" :file="result" :filename="result.name" /></div>
</template>