<script setup lang="ts">
import { Plus, Trash2 } from '@lucide/vue'
import type { PageRange } from '../lib/pdf'
import { useI18n } from '../i18n'

const props = defineProps<{
  pageCount: number
  modelValue: PageRange[]
}>()

const emit = defineEmits<{
  'update:modelValue': [ranges: PageRange[]]
}>()
const { t } = useI18n()

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
    <legend>{{ t('ranges.title') }}</legend>
    <div v-if="!modelValue.length" class="range-empty">{{ t('ranges.empty') }}</div>
    <div v-for="(range, index) in modelValue" :key="index" class="range-row">
      <label :for="`range-start-${index}`">{{ t('ranges.from') }} <input :id="`range-start-${index}`" type="number" min="1" :max="pageCount" :value="range.start" :aria-label="`${t('ranges.from')} ${index + 1}`" @input="updateRange(index, 'start', ($event.target as HTMLInputElement).value)" /></label>
      <span class="range-separator">{{ t('ranges.to').toLowerCase() }}</span>
      <label :for="`range-end-${index}`">{{ t('ranges.to') }} <input :id="`range-end-${index}`" type="number" min="1" :max="pageCount" :value="range.end" :aria-label="`${t('ranges.to')} ${index + 1}`" @input="updateRange(index, 'end', ($event.target as HTMLInputElement).value)" /></label>
      <button type="button" class="icon-button range-remove" :aria-label="`${t('ranges.remove')} ${index + 1}`" @click="removeRange(index)"><Trash2 :size="16" aria-hidden="true" /></button>
    </div>
    <button type="button" class="text-button range-add" :aria-label="t('ranges.add')" @click="addRange"><Plus :size="15" aria-hidden="true" /> {{ t('ranges.add') }}</button>
  </fieldset>
</template>