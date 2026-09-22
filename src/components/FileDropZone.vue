<script setup lang="ts">
import { ref } from 'vue'
import { FileUp, UploadCloud } from '@lucide/vue'
import { useFileStore } from '../stores/files'

defineProps<{ accept?: string; multiple?: boolean }>()
const fileStore = useFileStore()
const isDragging = ref(false)

function handleFiles(fileList: FileList | null) {
  if (fileList) fileStore.addFiles(Array.from(fileList))
}
</script>

<template>
  <label class="drop-zone" :class="{ 'drop-zone-active': isDragging }" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="isDragging = false; handleFiles($event.dataTransfer?.files ?? null)">
    <input type="file" :accept="accept" :multiple="multiple" @change="handleFiles(($event.target as HTMLInputElement).files)" />
    <span class="upload-icon"><UploadCloud :size="24" /></span>
    <span class="drop-title">Drop your files here</span>
    <span class="drop-subtitle">or <span class="browse-link">browse from your device</span></span>
    <span class="drop-hint"><FileUp :size="13" /> {{ accept || 'PDF' }} files · processed locally</span>
  </label>
</template>