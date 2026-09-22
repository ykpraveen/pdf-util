<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { FileUp, UploadCloud } from '@lucide/vue'
import { useFileStore } from '../stores/files'
import { useI18n } from '../i18n'
import { getFileSizeLimitIssue, type FileSizeLimitIssue } from '../lib/file-limits'

const props = withDefaults(defineProps<{ accept?: string; multiple?: boolean }>(), {
  accept: '.pdf,application/pdf',
  multiple: false,
})
const fileStore = useFileStore()
const { t } = useI18n()
const isDragging = ref(false)
const uploadError = ref('')
const inputId = useId()
const inputLabel = computed(() => `${t(props.multiple ? 'drop.uploadFiles' : 'drop.uploadFile')}${props.accept ? ` (${props.accept})` : ''}`)

function formatLimitIssue(issue: FileSizeLimitIssue): string {
  if (issue.reason === 'file') return t('errors.fileSize', { filename: issue.filename ?? '' })
  return t('errors.workspaceSize')
}

function addFiles(incoming: File[]): void {
  const issue = getFileSizeLimitIssue(fileStore.files, incoming)

  if (issue) {
    uploadError.value = formatLimitIssue(issue)
    return
  }

  uploadError.value = ''
  fileStore.addFiles(incoming)
}

function handleFiles(fileList: FileList | null): void {
  if (fileList) addFiles(Array.from(fileList))
}
</script>

<template>
  <div>
    <label class="drop-zone" :class="{ 'drop-zone-active': isDragging }" :for="inputId" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="isDragging = false; handleFiles($event.dataTransfer?.files ?? null)">
      <input :id="inputId" class="sr-only" type="file" :accept="props.accept" :multiple="props.multiple" :aria-label="inputLabel" :aria-describedby="uploadError ? `${inputId}-error` : undefined" @change="handleFiles(($event.target as HTMLInputElement).files)" />
      <span class="upload-icon"><UploadCloud :size="24" /></span>
      <span class="drop-title">{{ t('drop.drop') }}</span>
      <span class="drop-subtitle">{{ t('drop.or') }} <span class="browse-link">{{ t('drop.browse') }}</span></span>
      <span class="drop-hint"><FileUp :size="13" aria-hidden="true" /> {{ accept || t('drop.pdf') }} {{ t('drop.processed') }}</span>
    </label>
    <p v-if="uploadError" :id="`${inputId}-error`" class="tool-error" role="alert">{{ uploadError }}</p>
  </div>
</template>