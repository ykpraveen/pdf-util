<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowRight, FileArchive, FileImage, FileKey, Files, ScanText, Scissors, ShieldCheck, Sparkles } from '@lucide/vue'
import { useI18n } from '../i18n'

const tools = [
  { key: 'merge', path: '/merge', icon: Files, color: 'coral' }, { key: 'split', path: '/split', icon: Scissors, color: 'yellow' },
  { key: 'organize', path: '/organize', icon: Files, color: 'blue' }, { key: 'compress', path: '/compress', icon: FileArchive, color: 'green' },
  { key: 'pdfToImage', path: '/pdf-to-image', icon: FileImage, color: 'lavender' }, { key: 'imageToPdf', path: '/image-to-pdf', icon: FileImage, color: 'lavender' },
  { key: 'password', path: '/password/set', icon: FileKey, color: 'pink' }, { key: 'watermark', path: '/watermark', icon: ShieldCheck, color: 'amber' },
  { key: 'ocr', path: '/ocr', icon: ScanText, color: 'mint' }, { key: 'summary', path: '/summary', icon: Sparkles, color: 'peach' },
]

const { t } = useI18n()
</script>

<template>
  <section class="home-page">
    <div class="hero-copy"><p class="eyebrow">{{ t('home.eyebrow') }}</p><h1>{{ t('home.titleBefore') }}<em>{{ t('home.titleEmphasis') }}</em>{{ t('home.titleAfter') }}</h1><p class="hero-description">{{ t('home.description') }}</p></div>
    <div class="section-heading"><div><p class="section-kicker">{{ t('home.start') }}</p><h2>{{ t('home.question') }}</h2></div><span class="tool-count">{{ t('home.toolCount', { count: tools.length }) }}</span></div>
    <div class="tool-grid"><RouterLink v-for="tool in tools" :key="tool.path" :to="tool.path" class="tool-card" :aria-label="`${t(`tools.${tool.key}.label`)}: ${t(`tools.${tool.key}.description`)}`"><span class="tool-card-icon" :class="`icon-${tool.color}`"><component :is="tool.icon" :size="21" aria-hidden="true" /></span><span class="tool-card-content"><strong>{{ t(`tools.${tool.key}.label`) }}</strong><span>{{ t(`tools.${tool.key}.description`) }}</span></span><ArrowRight class="tool-arrow" :size="17" aria-hidden="true" /></RouterLink></div>
    <div class="privacy-band"><span class="privacy-spark" aria-hidden="true">✦</span><span><strong>{{ t('home.privacyTitle') }}</strong> {{ t('home.privacy') }}</span></div>
  </section>
</template>