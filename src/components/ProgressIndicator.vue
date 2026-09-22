<script setup lang="ts">
import { computed } from 'vue'
import { LoaderCircle } from '@lucide/vue'

const props = withDefaults(defineProps<{
  value?: number
  label?: string
  detail?: string
  indeterminate?: boolean
}>(), {
  value: 0,
  label: 'Processing',
  detail: '',
  indeterminate: false,
})

const percentage = computed(() => Math.max(0, Math.min(100, props.value)))
</script>

<template>
  <div class="progress-indicator" role="status" aria-live="polite" aria-atomic="true">
    <div class="progress-copy"><span><LoaderCircle class="spin" :size="15" aria-hidden="true" /> {{ label }}</span><output v-if="!indeterminate">{{ percentage }}%</output></div>
    <progress class="progress-track" :class="{ 'progress-track-indeterminate': indeterminate }" :value="indeterminate ? undefined : percentage" max="100" :aria-label="label" />
    <p v-if="detail" class="progress-detail">{{ detail }}</p>
  </div>
</template>