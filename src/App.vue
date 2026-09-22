<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { FileText, Files, FolderOpen, House, Menu, ScanText, Scissors, ShieldCheck, Sparkles, FileArchive, FileImage, FileKey, X } from '@lucide/vue'
import { useFileStore } from './stores/files'

const route = useRoute()
const fileStore = useFileStore()
const activeTool = computed(() => route.meta.tool as string | undefined)
const tools = [
  { label: 'Merge PDFs', path: '/merge', icon: Files }, { label: 'Split PDF', path: '/split', icon: Scissors },
  { label: 'Organize', path: '/organize', icon: FolderOpen }, { label: 'Compress', path: '/compress', icon: FileArchive },
  { label: 'PDF to image', path: '/pdf-to-image', icon: FileImage }, { label: 'Image to PDF', path: '/image-to-pdf', icon: FileImage },
  { label: 'Password', path: '/password/set', icon: FileKey }, { label: 'Watermark', path: '/watermark', icon: ShieldCheck },
  { label: 'OCR', path: '/ocr', icon: ScanText }, { label: 'Summarize', path: '/summary', icon: Sparkles },
]
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <RouterLink to="/" class="brand" aria-label="Paperwork home"><span class="brand-mark"><FileText :size="16" /></span><span>paperwork</span></RouterLink>
      <nav class="primary-nav" aria-label="Primary navigation">
        <RouterLink to="/" class="nav-link" exact-active-class="nav-link-active"><House :size="17" /><span>Overview</span></RouterLink>
        <p class="nav-label">Tools</p>
        <RouterLink v-for="tool in tools" :key="tool.path" :to="tool.path" class="nav-link" active-class="nav-link-active"><component :is="tool.icon" :size="17" /><span>{{ tool.label }}</span></RouterLink>
      </nav>
      <div class="sidebar-footnote"><ShieldCheck :size="16" /><span>Files stay on your device.</span></div>
    </aside>
    <main class="main-content">
      <header class="topbar"><button class="icon-button mobile-menu" aria-label="Open menu"><Menu :size="20" /></button><div class="breadcrumbs"><span>Workspace</span><span class="slash">/</span><strong>{{ activeTool || 'Overview' }}</strong></div><div class="topbar-actions"><span class="local-badge"><span class="status-dot"></span> Local only</span></div></header>
      <div v-if="fileStore.files.length" class="file-strip"><div class="file-strip-copy"><Files :size="16" /><span>{{ fileStore.files.length }} file{{ fileStore.files.length === 1 ? '' : 's' }} ready in workspace</span></div><button class="text-button" @click="fileStore.clearFiles">Clear all <X :size="14" /></button></div>
      <RouterView />
    </main>
  </div>
</template>
