<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowRight, FileArchive, FileImage, FileKey, Files, ScanText, Scissors, ShieldCheck, Sparkles } from '@lucide/vue'

const tools = [
  { label: 'Merge PDFs', description: 'Combine multiple documents into one.', path: '/merge', icon: Files, color: 'coral' },
  { label: 'Split PDF', description: 'Extract pages or create smaller files.', path: '/split', icon: Scissors, color: 'yellow' },
  { label: 'Organize pages', description: 'Reorder, rotate, or remove pages.', path: '/organize', icon: Files, color: 'blue' },
  { label: 'Compress PDF', description: 'Make files smaller for sharing.', path: '/compress', icon: FileArchive, color: 'green' },
  { label: 'PDF to image', description: 'Turn pages into PNG or JPEG files.', path: '/pdf-to-image', icon: FileImage, color: 'lavender' },
  { label: 'Image to PDF', description: 'Build a new PDF from your photos and scans.', path: '/image-to-pdf', icon: FileImage, color: 'lavender' },
  { label: 'Protect a PDF', description: 'Set or remove a document password.', path: '/password/set', icon: FileKey, color: 'pink' },
  { label: 'Watermark', description: 'Stamp a text mark across selected pages.', path: '/watermark', icon: ShieldCheck, color: 'amber' },
  { label: 'OCR scanned pages', description: 'Make scanned documents searchable.', path: '/ocr', icon: ScanText, color: 'mint' },
  { label: 'Summarize', description: 'Pull out key points, fully offline.', path: '/summary', icon: Sparkles, color: 'peach' },
]
</script>

<template>
  <section class="home-page">
    <div class="hero-copy"><p class="eyebrow">A quiet place for your documents</p><h1>Make PDFs <em>work</em> for you.</h1><p class="hero-description">Simple tools for the everyday PDF tasks that get in the way. Everything runs in your browser, so your files never leave your device.</p></div>
    <div class="section-heading"><div><p class="section-kicker">Start with a tool</p><h2>What do you need to do?</h2></div><span class="tool-count">{{ tools.length }} tools</span></div>
    <div class="tool-grid"><RouterLink v-for="tool in tools" :key="tool.path" :to="tool.path" class="tool-card"><span class="tool-card-icon" :class="`icon-${tool.color}`"><component :is="tool.icon" :size="21" /></span><span class="tool-card-content"><strong>{{ tool.label }}</strong><span>{{ tool.description }}</span></span><ArrowRight class="tool-arrow" :size="17" /></RouterLink></div>
    <div class="privacy-band"><span class="privacy-spark">✦</span><span><strong>Your privacy is built in.</strong> No uploads, no accounts, no hidden servers.</span></div>
  </section>
</template>