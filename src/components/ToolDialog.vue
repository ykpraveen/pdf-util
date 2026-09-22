<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'

const props = defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <TransitionRoot :show="props.open" as="template">
    <Dialog as="div" class="dialog-root" @close="emit('close')">
      <TransitionChild as="template" enter="dialog-enter" enter-from="dialog-enter-from" enter-to="dialog-enter-to" leave="dialog-leave" leave-from="dialog-leave-from" leave-to="dialog-leave-to">
        <div class="dialog-backdrop" />
      </TransitionChild>

      <div class="dialog-panel-wrap">
        <TransitionChild as="template" enter="dialog-enter" enter-from="dialog-enter-from" enter-to="dialog-enter-to" leave="dialog-leave" leave-from="dialog-leave-from" leave-to="dialog-leave-to">
          <DialogPanel class="dialog-panel">
            <DialogTitle as="h3" class="dialog-title">{{ props.title }}</DialogTitle>
            <p class="dialog-description">{{ props.description }}</p>

            <div class="dialog-actions">
              <button class="button button-muted" @click="emit('close')">
                {{ props.cancelLabel || 'Close' }}
              </button>
              <button class="button button-primary" @click="emit('confirm')">
                {{ props.confirmLabel || 'Confirm' }}
              </button>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
