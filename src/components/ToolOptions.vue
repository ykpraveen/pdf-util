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
    <label for="page-order">Page order <input id="page-order" :value="pageOrder" type="text" placeholder="1, 3, 2" @input="emit('update:pageOrder', ($event.target as HTMLInputElement).value)" /></label>
    <label for="page-rotation">Rotate selected page <select id="page-rotation" :value="rotation" @change="emit('update:rotation', Number(($event.target as HTMLSelectElement).value))"><option :value="0">No rotation</option><option :value="90">90 degrees</option><option :value="180">180 degrees</option><option :value="270">270 degrees</option></select></label>
  </div>
  <div v-if="tool === 'Set password' || tool === 'Remove password'" class="tool-options">
    <label for="password">Password <input id="password" :value="password" type="password" autocomplete="new-password" @input="emit('update:password', ($event.target as HTMLInputElement).value)" /></label>
    <label v-if="tool === 'Set password'" for="confirm-password">Confirm password <input id="confirm-password" :value="confirmPassword" type="password" autocomplete="new-password" @input="emit('update:confirmPassword', ($event.target as HTMLInputElement).value)" /></label>
  </div>
  <div v-if="tool === 'Compress'" class="tool-options tool-options-three">
    <label for="compression-quality">Quality <input id="compression-quality" :value="compressionQuality" type="number" min="0.1" max="1" step="0.05" @input="emit('update:compressionQuality', Number(($event.target as HTMLInputElement).value))" /></label>
    <label for="compression-dimension">Max dimension <input id="compression-dimension" :value="compressionDimension" type="number" min="320" step="80" @input="emit('update:compressionDimension', Number(($event.target as HTMLInputElement).value))" /></label>
  </div>
  <div v-if="tool === 'PDF to image'" class="tool-options tool-options-three">
    <label for="image-format">Format <select id="image-format" :value="imageFormat" @change="emit('update:imageFormat', ($event.target as HTMLSelectElement).value as 'png' | 'jpeg')"><option value="jpeg">JPEG</option><option value="png">PNG</option></select></label>
    <label for="image-scale">Scale <input id="image-scale" :value="imageScale" type="number" min="0.5" max="4" step="0.25" @input="emit('update:imageScale', Number(($event.target as HTMLInputElement).value))" /></label>
  </div>
  <div v-if="tool === 'Watermark'" class="tool-options tool-options-three">
    <label for="watermark-text">Text <input id="watermark-text" :value="watermarkText" type="text" @input="emit('update:watermarkText', ($event.target as HTMLInputElement).value)" /></label>
    <label for="watermark-opacity">Opacity <input id="watermark-opacity" :value="watermarkOpacity" type="number" min="0.05" max="1" step="0.05" @input="emit('update:watermarkOpacity', Number(($event.target as HTMLInputElement).value))" /></label>
    <label for="watermark-rotation">Rotation <input id="watermark-rotation" :value="watermarkRotation" type="number" min="0" max="360" @input="emit('update:watermarkRotation', Number(($event.target as HTMLInputElement).value))" /></label>
  </div>
  <div v-if="tool === 'Summarize'" class="tool-options">
    <label for="summary-sentence-count">Sentences <input id="summary-sentence-count" :value="summarySentenceCount" type="number" min="1" max="20" @input="emit('update:summarySentenceCount', Number(($event.target as HTMLInputElement).value))" /></label>
  </div>
</template>