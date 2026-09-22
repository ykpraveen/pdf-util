<script setup lang="ts">
import { Plus, Trash2 } from '@lucide/vue'
import type { PageRange } from '../lib/pdf'

const props = defineProps<{
  pageCount: number
  modelValue: PageRange[]
}>()

const emit = defineEmits<{
  'update:modelValue': [ranges: PageRange[]]
}>()

function updateRange(index: number, key: keyof PageRange, value: string): void {
  const next = props.modelValue.map((range) => ({ ...range }))
  next[index][key] = Math.max(1, Math.min(props.pageCount || 1, Number(value) || 1))
  emit('update:modelValue', next)
}

function addRange(): void {
  emit('update:modelValue', [...props.modelValue, { start: 1, end: Math.max(1, props.pageCount) }])
}

function removeRange(index: number): void {
  emit('update:modelValue', props.modelValue.filter((_, rangeIndex) => rangeIndex !== index))
}
</script>

<template>
  <fieldset class="range-selector">
    <legend>Page ranges</legend>
    <div v-if="!modelValue.length" class="range-empty">Add a range to choose which pages to use.</div>
    <div v-for="(range, index) in modelValue" :key="index" class="range-row">
      <label :for="`range-start-${index}`">From <input :id="`range-start-${index}`" type="number" min="1" :max="pageCount" :value="range.start" @input="updateRange(index, 'start', ($event.target as HTMLInputElement).value)" /></label>
      <span class="range-separator">to</span>
      <label :for="`range-end-${index}`">To <input :id="`range-end-${index}`" type="number" min="1" :max="pageCount" :value="range.end" @input="updateRange(index, 'end', ($event.target as HTMLInputElement).value)" /></label>
      <button type="button" class="icon-button range-remove" aria-label="Remove page range" @click="removeRange(index)"><Trash2 :size="16" /></button>
    </div>
    <button type="button" class="text-button range-add" @click="addRange"><Plus :size="15" /> Add range</button>
  </fieldset>
</template>