import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useFileStore = defineStore('files', () => {
  const files = ref<File[]>([])
  const results = ref<File[]>([])

  function addFiles(incoming: File[]) {
    results.value = []
    files.value = [...files.value, ...incoming]
  }

  function publishResults(incoming: File[]) {
    results.value = incoming
    files.value = incoming
  }

  function clearResults() { results.value = [] }

  function clearFiles() {
    files.value = []
    results.value = []
  }

  return { files, results, addFiles, publishResults, clearResults, clearFiles }
})