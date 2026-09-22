<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { FileText, Files, FolderOpen, House, Menu, ScanText, Scissors, ShieldCheck, Sparkles, FileArchive, FileImage, FileKey, X } from '@lucide/vue'
import { useFileStore } from './stores/files'

const route = useRoute()
const fileStore = useFileStore()
const isMobileNavOpen = ref(false)
const activeTool = computed(() => route.meta.tool as string | undefined)
const tools = [
  { label: 'Merge PDFs', path: '/merge', icon: Files }, { label: 'Split PDF', path: '/split', icon: Scissors },
  { label: 'Organize', path: '/organize', icon: FolderOpen }, { label: 'Compress', path: '/compress', icon: FileArchive },
  { label: 'PDF to image', path: '/pdf-to-image', icon: FileImage }, { label: 'Image to PDF', path: '/image-to-pdf', icon: FileImage },
  { label: 'Password', path: '/password/set', icon: FileKey }, { label: 'Watermark', path: '/watermark', icon: ShieldCheck },
  { label: 'OCR', path: '/ocr', icon: ScanText }, { label: 'Summarize', path: '/summary', icon: Sparkles },
]

function closeMobileNav(): void {
  isMobileNavOpen.value = false
}

watch(() => route.fullPath, closeMobileNav)
</script>

<template>
  <div class="app-shell" @keydown.esc="closeMobileNav">
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <aside class="sidebar" :class="{ 'sidebar-open': isMobileNavOpen }">
      <RouterLink to="/" class="brand" aria-label="Paperwork home"><span class="brand-mark"><FileText :size="16" /></span><span>paperwork</span></RouterLink>
      <nav id="primary-navigation" class="primary-nav" aria-label="Primary navigation">
        <RouterLink to="/" class="nav-link" exact-active-class="nav-link-active" @click="closeMobileNav"><House :size="17" /><span>Overview</span></RouterLink>
        <p class="nav-label">Tools</p>
        <RouterLink v-for="tool in tools" :key="tool.path" :to="tool.path" class="nav-link" active-class="nav-link-active" @click="closeMobileNav"><component :is="tool.icon" :size="17" /><span>{{ tool.label }}</span></RouterLink>
      </nav>
      <div class="sidebar-footnote"><ShieldCheck :size="16" /><span>Files stay on your device.</span></div>
    </aside>
    <button v-if="isMobileNavOpen" type="button" class="mobile-nav-backdrop" aria-label="Close navigation menu" @click="closeMobileNav" />
    <main id="main-content" class="main-content">
      <header class="topbar"><button type="button" class="icon-button mobile-menu" :aria-expanded="isMobileNavOpen" aria-controls="primary-navigation" aria-label="Toggle navigation menu" @click="isMobileNavOpen = !isMobileNavOpen"><Menu :size="20" /></button><div class="breadcrumbs"><span>Workspace</span><span class="slash">/</span><strong>{{ activeTool || 'Overview' }}</strong></div><div class="topbar-actions"><span class="local-badge"><span class="status-dot"></span> Local only</span></div></header>
      <div v-if="fileStore.files.length" class="file-strip"><div class="file-strip-copy"><Files :size="16" /><span>{{ fileStore.files.length }} file{{ fileStore.files.length === 1 ? '' : 's' }} ready in workspace</span></div><button class="text-button" @click="fileStore.clearFiles">Clear all <X :size="14" /></button></div>
      <RouterView />
    </main>
  </div>
</template>
