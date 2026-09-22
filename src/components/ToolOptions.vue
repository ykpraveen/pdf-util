<script setup lang="ts">
defineProps<{
  tool: string
  pageOrder: string
  rotation: number
  password: string
  confirmPassword: string
  compressionQuality: number
  compressionDimension: number
  imageFormat: 'png' | 'jpeg'
  imageScale: number
  watermarkText: string
  watermarkOpacity: number
  watermarkRotation: number
  summarySentenceCount: number
}>()
import { useI18n } from '../i18n'

const { t } = useI18n()

const emit = defineEmits<{
  'update:pageOrder': [value: string]
  'update:rotation': [value: number]
  'update:password': [value: string]
  'update:confirmPassword': [value: string]
  'update:compressionQuality': [value: number]
  'update:compressionDimension': [value: number]
  'update:imageFormat': [value: 'png' | 'jpeg']
  'update:imageScale': [value: number]
  'update:watermarkText': [value: string]
  'update:watermarkOpacity': [value: number]
  'update:watermarkRotation': [value: number]
  'update:summarySentenceCount': [value: number]
}>()
</script>

<template>
  <div v-if="tool === 'Organize'" class="tool-options">
    <label for="page-order">{{ t('options.pageOrder') }} <input id="page-order" :value="pageOrder" type="text" :placeholder="t('options.pageOrderPlaceholder')" :aria-label="t('options.pageOrder')" @input="emit('update:pageOrder', ($event.target as HTMLInputElement).value)" /></label>
    <label for="page-rotation">{{ t('options.rotatePage') }} <select id="page-rotation" :value="rotation" :aria-label="t('options.rotatePage')" @change="emit('update:rotation', Number(($event.target as HTMLSelectElement).value))"><option :value="0">{{ t('options.noRotation') }}</option><option :value="90">{{ t('options.degrees', { value: 90 }) }}</option><option :value="180">{{ t('options.degrees', { value: 180 }) }}</option><option :value="270">{{ t('options.degrees', { value: 270 }) }}</option></select></label>
  </div>
  <div v-if="tool === 'Set password' || tool === 'Remove password'" class="tool-options">
    <label for="password">{{ t('options.password') }} <input id="password" :value="password" type="password" autocomplete="new-password" :aria-label="t('options.password')" @input="emit('update:password', ($event.target as HTMLInputElement).value)" /></label>
    <label v-if="tool === 'Set password'" for="confirm-password">{{ t('options.confirmPassword') }} <input id="confirm-password" :value="confirmPassword" type="password" autocomplete="new-password" :aria-label="t('options.confirmPassword')" @input="emit('update:confirmPassword', ($event.target as HTMLInputElement).value)" /></label>
  </div>
  <div v-if="tool === 'Compress'" class="tool-options tool-options-three">
    <label for="compression-quality">{{ t('options.quality') }} <input id="compression-quality" :value="compressionQuality" type="number" min="0.1" max="1" step="0.05" :aria-label="t('options.quality')" @input="emit('update:compressionQuality', Number(($event.target as HTMLInputElement).value))" /></label>
    <label for="compression-dimension">{{ t('options.maxDimension') }} <input id="compression-dimension" :value="compressionDimension" type="number" min="320" step="80" :aria-label="t('options.maxDimension')" @input="emit('update:compressionDimension', Number(($event.target as HTMLInputElement).value))" /></label>
  </div>
  <div v-if="tool === 'PDF to image'" class="tool-options tool-options-three">
    <label for="image-format">{{ t('options.format') }} <select id="image-format" :value="imageFormat" :aria-label="t('options.format')" @change="emit('update:imageFormat', ($event.target as HTMLSelectElement).value as 'png' | 'jpeg')"><option value="jpeg">JPEG</option><option value="png">PNG</option></select></label>
    <label for="image-scale">{{ t('options.scale') }} <input id="image-scale" :value="imageScale" type="number" min="0.5" max="4" step="0.25" :aria-label="t('options.scale')" @input="emit('update:imageScale', Number(($event.target as HTMLInputElement).value))" /></label>
  </div>
  <div v-if="tool === 'Watermark'" class="tool-options tool-options-three">
    <label for="watermark-text">{{ t('options.text') }} <input id="watermark-text" :value="watermarkText" type="text" :aria-label="t('options.text')" @input="emit('update:watermarkText', ($event.target as HTMLInputElement).value)" /></label>
    <label for="watermark-opacity">{{ t('options.opacity') }} <input id="watermark-opacity" :value="watermarkOpacity" type="number" min="0.05" max="1" step="0.05" :aria-label="t('options.opacity')" @input="emit('update:watermarkOpacity', Number(($event.target as HTMLInputElement).value))" /></label>
    <label for="watermark-rotation">{{ t('options.rotation') }} <input id="watermark-rotation" :value="watermarkRotation" type="number" min="0" max="360" :aria-label="t('options.rotation')" @input="emit('update:watermarkRotation', Number(($event.target as HTMLInputElement).value))" /></label>
  </div>
  <div v-if="tool === 'Summarize'" class="tool-options">
    <label for="summary-sentence-count">{{ t('options.sentences') }} <input id="summary-sentence-count" :value="summarySentenceCount" type="number" min="1" max="20" :aria-label="t('options.sentences')" @input="emit('update:summarySentenceCount', Number(($event.target as HTMLInputElement).value))" /></label>
  </div>
</template>