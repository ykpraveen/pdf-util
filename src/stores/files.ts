import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useFileStore = defineStore('files', () => {
  const files = ref<File[]>([])
  const hasPdf = computed(() => files.value.some((file) => file.type === 'application/pdf'))

  function addFiles(incoming: File[]) { files.value = [...files.value, ...incoming] }
  function clearFiles() { files.value = [] }

  return { files, hasPdf, addFiles, clearFiles }
})