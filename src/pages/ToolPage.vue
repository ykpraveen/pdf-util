<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ArrowRight, CheckCircle2 } from '@lucide/vue'
import FileDropZone from '../components/FileDropZone.vue'
import ToolDialog from '../components/ToolDialog.vue'

const route = useRoute()
const tool = computed(() => route.meta.tool as string)
const isDialogOpen = ref(false)
const descriptions: Record<string, string> = {
  'Merge PDFs': 'Bring documents together in the order you choose.',
  'Split PDF': 'Choose pages or ranges to make a new document.',
  Organize: 'Arrange your pages exactly the way you need them.',
  Compress: 'Reduce file size while keeping your document readable.',
  'PDF to image': 'Export every page as a crisp image file.',
  'Image to PDF': 'Turn photos and scans into a single PDF.',
  'Set password': 'Add a password before sharing your document.',
  'Remove password': 'Unlock a document you have permission to use.',
  Watermark: 'Add a subtle text mark across selected pages.',
  OCR: 'Extract searchable text from scanned pages.',
  Summarize: 'Get the important points without sending data anywhere.',
}
</script>

<template>
  <section class="tool-page">
    <RouterLink to="/" class="back-link"><ArrowLeft :size="15" /> All tools</RouterLink>
    <div class="tool-page-heading">
      <p class="eyebrow">{{ tool }}</p>
      <h1>{{ tool }}</h1>
      <p>{{ descriptions[tool] }}</p>
    </div>
    <div class="tool-panel">
      <FileDropZone :multiple="tool === 'Merge PDFs'" :accept="tool === 'Image to PDF' ? 'image/*' : '.pdf,application/pdf'" />
      <div class="next-step">
        <div>
          <CheckCircle2 :size="17" />
          <span>Ready when you are</span>
        </div>
        <button class="button button-muted" @click="isDialogOpen = true">
          Continue <ArrowRight :size="16" />
        </button>
      </div>
    </div>
    <p class="tool-note">Your files are processed locally in this browser. Nothing is uploaded.</p>

    <ToolDialog
      :open="isDialogOpen"
      title="Process locally"
      description="This tool runs fully in your browser and keeps all file processing on your device."
      confirm-label="Continue"
      cancel-label="Close"
      @close="isDialogOpen = false"
      @confirm="isDialogOpen = false"
    />
  </section>
</template>