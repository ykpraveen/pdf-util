<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { FileText, Files, FolderOpen, House, Menu, ScanText, Scissors, ShieldCheck, Sparkles, FileArchive, FileImage, FileKey, X } from '@lucide/vue'
import { useFileStore } from './stores/files'
import { useI18n } from './i18n'

const route = useRoute()
const fileStore = useFileStore()
const { locale, setLocale, t } = useI18n()
const isMobileNavOpen = ref(false)
const activeTool = computed(() => route.meta.tool as string | undefined)
const tools = [
  { key: 'merge', path: '/merge', icon: Files }, { key: 'split', path: '/split', icon: Scissors },
  { key: 'organize', path: '/organize', icon: FolderOpen }, { key: 'compress', path: '/compress', icon: FileArchive },
  { key: 'pdfToImage', path: '/pdf-to-image', icon: FileImage }, { key: 'imageToPdf', path: '/image-to-pdf', icon: FileImage },
  { key: 'password', path: '/password/set', icon: FileKey }, { key: 'watermark', path: '/watermark', icon: ShieldCheck },
  { key: 'ocr', path: '/ocr', icon: ScanText }, { key: 'summary', path: '/summary', icon: Sparkles },
]

const toolLabels: Record<string, string> = {
  'Merge PDFs': 'tools.merge.label', 'Split PDF': 'tools.split.label', Organize: 'tools.organize.label', Compress: 'tools.compress.label',
  'PDF to image': 'tools.pdfToImage.label', 'Image to PDF': 'tools.imageToPdf.label', Password: 'tools.password.label',
  'Set password': 'tools.password.label', 'Remove password': 'tools.password.label', Watermark: 'tools.watermark.label', OCR: 'tools.ocr.label', Summarize: 'tools.summary.label',
}

function translatedToolLabel(name: string | undefined): string {
  return name ? t(toolLabels[name] ?? name) : t('nav.overview')
}

function closeMobileNav(): void {
  isMobileNavOpen.value = false
}

watch(() => route.fullPath, closeMobileNav)
</script>

<template>
  <div class="app-shell" @keydown.esc="closeMobileNav">
    <a class="skip-link" href="#main-content">{{ t('a11y.skip') }}</a>
    <aside class="sidebar" :class="{ 'sidebar-open': isMobileNavOpen }">
      <RouterLink to="/" class="brand" :aria-label="t('a11y.home')"><span class="brand-mark"><FileText :size="16" aria-hidden="true" /></span><span>paperwork</span></RouterLink>
      <nav id="primary-navigation" class="primary-nav" :aria-label="t('a11y.primaryNavigation')">
        <RouterLink to="/" class="nav-link" exact-active-class="nav-link-active" @click="closeMobileNav"><House :size="17" aria-hidden="true" /><span>{{ t('nav.overview') }}</span></RouterLink>
        <p class="nav-label">{{ t('nav.tools') }}</p>
        <RouterLink v-for="tool in tools" :key="tool.path" :to="tool.path" class="nav-link" active-class="nav-link-active" @click="closeMobileNav"><component :is="tool.icon" :size="17" aria-hidden="true" /><span>{{ t(`tools.${tool.key}.label`) }}</span></RouterLink>
      </nav>
      <div class="sidebar-footnote"><ShieldCheck :size="16" aria-hidden="true" /><span>{{ t('nav.filesStay') }}</span></div>
    </aside>
    <button v-if="isMobileNavOpen" type="button" class="mobile-nav-backdrop" :aria-label="t('a11y.closeNavigation')" @click="closeMobileNav" />
    <main id="main-content" class="main-content">
      <header class="topbar"><button type="button" class="icon-button mobile-menu" :aria-expanded="isMobileNavOpen" aria-controls="primary-navigation" :aria-label="t('a11y.toggleNavigation')" @click="isMobileNavOpen = !isMobileNavOpen"><Menu :size="20" aria-hidden="true" /></button><div class="breadcrumbs"><span>{{ t('nav.workspace') }}</span><span class="slash">/</span><strong>{{ translatedToolLabel(activeTool) }}</strong></div><div class="topbar-actions"><span class="local-badge"><span class="status-dot"></span> {{ t('nav.localOnly') }}</span><div class="language-switch" role="group" :aria-label="t('language.switch')"><button type="button" class="language-option" :class="{ 'language-option-active': locale === 'en' }" :aria-pressed="locale === 'en'" :aria-label="t('language.english')" @click="setLocale('en')">EN</button><span class="language-divider" aria-hidden="true">|</span><button type="button" class="language-option" :class="{ 'language-option-active': locale === 'de' }" :aria-pressed="locale === 'de'" :aria-label="t('language.german')" @click="setLocale('de')">DE</button></div></div></header>
      <div v-if="fileStore.files.length" class="file-strip"><div class="file-strip-copy"><Files :size="16" aria-hidden="true" /><span>{{ t('nav.filesReady', { count: fileStore.files.length }) }}</span></div><button type="button" class="text-button" :aria-label="t('a11y.clearFiles')" @click="fileStore.clearFiles">{{ t('a11y.clearFiles') }} <X :size="14" aria-hidden="true" /></button></div>
      <RouterView />
    </main>
  </div>
</template>
