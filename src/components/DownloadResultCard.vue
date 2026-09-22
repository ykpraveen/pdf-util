<script setup lang="ts">
import { Download, FileCheck2 } from '@lucide/vue'

const props = withDefaults(defineProps<{
  file: Blob
  filename: string
  label?: string
}>(), {
  label: 'Your file is ready',
})

function downloadFile(): void {
  const url = URL.createObjectURL(props.file)
  const link = document.createElement('a')
  link.href = url
  link.download = props.filename
  link.click()
  URL.revokeObjectURL(url)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <section class="download-result" aria-label="Download result">
    <div class="download-result-copy"><span class="download-result-icon"><FileCheck2 :size="19" /></span><div><strong>{{ label }}</strong><p>{{ filename }} · {{ formatSize(file.size) }}</p></div></div>
    <button type="button" class="button button-primary" @click="downloadFile"><Download :size="16" /> Download</button>
  </section>
</template>