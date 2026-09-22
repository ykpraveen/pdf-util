<script setup lang="ts">
import { Download, FileCheck2 } from '@lucide/vue'
import { useI18n } from '../i18n'

const props = withDefaults(defineProps<{
  file: Blob
  filename: string
  label?: string
}>(), {
  label: '',
})
const { t } = useI18n()

function downloadFile(): void {
  const url = URL.createObjectURL(props.file)
  const link = document.createElement('a')
  link.href = url
  link.download = props.filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <section class="download-result" :aria-label="t('download.result')">
    <div class="download-result-copy"><span class="download-result-icon"><FileCheck2 :size="19" aria-hidden="true" /></span><div><strong>{{ label || t('download.ready') }}</strong><p>{{ filename }} · {{ formatSize(file.size) }}</p></div></div>
    <button type="button" class="button button-primary" :aria-label="`${t('download.download')} ${filename}`" @click="downloadFile"><Download :size="16" aria-hidden="true" /> {{ t('download.download') }}</button>
  </section>
</template>