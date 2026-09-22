<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { FileWarning, LoaderCircle } from '@lucide/vue'
import { loadPdfJsDoc } from '../lib/pdf'
import { renderPdfPage } from '../lib/pdf/render'
import { useI18n } from '../i18n'

type Thumbnail = {
  pageNumber: number
  source: string
}

const props = withDefaults(defineProps<{
  file?: File | null
  selectedPage?: number
  scale?: number
}>(), {
  file: null,
  selectedPage: 0,
  scale: 0.18,
})

const emit = defineEmits<{
  select: [pageIndex: number]
}>()

const thumbnails = ref<Thumbnail[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
let renderRequest = 0
const { t } = useI18n()

watch(() => [props.file, props.scale] as const, renderThumbnails, { immediate: true })

async function renderPageThumbnail(pageNumber: number, pdf: Awaited<ReturnType<typeof loadPdfJsDoc>>): Promise<Thumbnail> {
  const page = await pdf.getPage(pageNumber)
  try {
    const { canvas } = await renderPdfPage(page, props.scale, '#ffffff')
    return { pageNumber, source: canvas.toDataURL('image/jpeg', 0.82) }
  } finally {
    page.cleanup()
  }
}

async function renderAllThumbnails(pdf: Awaited<ReturnType<typeof loadPdfJsDoc>>, request: number): Promise<Thumbnail[]> {
  const rendered: Thumbnail[] = []
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    rendered.push(await renderPageThumbnail(pageNumber, pdf))
    if (request !== renderRequest) return []
  }
  return rendered
}

// fallow-ignore-next-line complexity
async function renderThumbnails(): Promise<void> {
  const request = ++renderRequest
  thumbnails.value = []
  error.value = null

  if (!props.file) return

  isLoading.value = true
  try {
    const pdf = await loadPdfJsDoc(props.file)
    try {
      const rendered = await renderAllThumbnails(pdf, request)
      if (request === renderRequest) thumbnails.value = rendered
    } finally {
      await pdf.cleanup()
    }
  } catch (cause) {
    if (request === renderRequest) error.value = cause instanceof Error ? cause.message : t('errors.preview')
  } finally {
    if (request === renderRequest) isLoading.value = false
  }
}

onBeforeUnmount(() => { renderRequest += 1 })
</script>

<template>
  <div class="pdf-thumbnails" role="region" :aria-label="t('preview.title')">
    <div v-if="isLoading" class="component-state"><LoaderCircle class="spin" :size="18" aria-hidden="true" /> {{ t('preview.loading') }}</div>
    <div v-else-if="error" class="component-state component-state-error"><FileWarning :size="18" /> {{ error }}</div>
    <p v-else-if="!file" class="component-state">{{ t('preview.choose') }}</p>
    <p v-else-if="!thumbnails.length" class="component-state">{{ t('preview.empty') }}</p>
    <div v-else class="thumbnail-grid">
      <button
        v-for="thumbnail in thumbnails"
        :key="thumbnail.pageNumber"
        type="button"
        class="thumbnail-button"
        :class="{ 'thumbnail-button-selected': selectedPage === thumbnail.pageNumber - 1 }"
        :aria-label="t('preview.select', { page: thumbnail.pageNumber })"
        :aria-pressed="selectedPage === thumbnail.pageNumber - 1"
        @click="emit('select', thumbnail.pageNumber - 1)"
      >
        <span class="thumbnail-frame"><img :src="thumbnail.source" alt="" /></span>
        <span class="thumbnail-label">{{ thumbnail.pageNumber }}</span>
      </button>
    </div>
  </div>
</template>