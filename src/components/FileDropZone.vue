<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { FileUp, UploadCloud } from '@lucide/vue'
import { useFileStore } from '../stores/files'

const props = withDefaults(defineProps<{ accept?: string; multiple?: boolean }>(), {
  accept: '.pdf,application/pdf',
  multiple: false,
})
const fileStore = useFileStore()
const isDragging = ref(false)
const inputId = useId()
const inputLabel = computed(() => `${props.multiple ? 'Upload files' : 'Upload a file'}${props.accept ? ` (${props.accept})` : ''}`)

function handleFiles(fileList: FileList | null) {
  if (fileList) fileStore.addFiles(Array.from(fileList))
}
</script>

<template>
  <label class="drop-zone" :class="{ 'drop-zone-active': isDragging }" :for="inputId" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="isDragging = false; handleFiles($event.dataTransfer?.files ?? null)">
    <input :id="inputId" class="sr-only" type="file" :accept="props.accept" :multiple="props.multiple" :aria-label="inputLabel" @change="handleFiles(($event.target as HTMLInputElement).files)" />
    <span class="upload-icon"><UploadCloud :size="24" /></span>
    <span class="drop-title">Drop your files here</span>
    <span class="drop-subtitle">or <span class="browse-link">browse from your device</span></span>
    <span class="drop-hint"><FileUp :size="13" /> {{ accept || 'PDF' }} files · processed locally</span>
  </label>
</template>