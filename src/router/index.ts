import { createRouter, createWebHistory } from 'vue-router'

const toolRoutes = [
  ['merge', 'Merge PDFs'], ['split', 'Split PDF'], ['organize', 'Organize'], ['compress', 'Compress'],
  ['pdf-to-image', 'PDF to image'], ['image-to-pdf', 'Image to PDF'], ['watermark', 'Watermark'],
  ['ocr', 'OCR'], ['summary', 'Summarize'],
]

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('../pages/HomePage.vue') },
    ...toolRoutes.map(([path, label]) => ({ path: `/${path}`, component: () => import('../pages/ToolPage.vue'), meta: { tool: label } })),
    { path: '/password/set', component: () => import('../pages/ToolPage.vue'), meta: { tool: 'Set password' } },
    { path: '/password/remove', component: () => import('../pages/ToolPage.vue'), meta: { tool: 'Remove password' } },
  ],
})

export default router