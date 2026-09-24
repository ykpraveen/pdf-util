# Paperwork

Paperwork is a privacy-first PDF toolkit that runs entirely in the browser. Files are processed on your device and are never uploaded to a backend.
Article about the project is available at https://dev.to/ykpraveen/keeping-a-solo-projects-codebase-honest-without-a-team-of-reviewers-4eia
Deployed version is accessible at https://pdf-util-eta.vercel.app/

## Features

- Merge and split PDFs
- Reorder, rotate, and delete pages
- Compress PDFs
- Convert PDFs to images and images to PDFs
- Set or remove PDF passwords
- Add text watermarks
- OCR scanned pages
- Create offline extractive summaries
- English and German interface

## Technology

- Vue 3 and TypeScript
- Vite
- Pinia and Vue Router
- `pdf-lib` and `pdfjs-dist` for PDF operations
- `qpdf-wasm` for password protection
- Tesseract.js for client-side OCR

## Local development

Install dependencies and start the Vite development server:

```sh
npm install
npm run dev
```

Other useful commands:

```sh
npm run test       # Run unit tests
npm run lint       # Run ESLint
npm run build      # Type-check and create the production bundle
npm run preview    # Preview the production bundle locally
```

## Deployment

The app is a static Vite build and can be deployed to Vercel:

```sh
npm run build
```

Deploy the generated `dist/` directory. Keep the headers in [`vercel.json`](vercel.json), which provide the cross-origin isolation required by the qpdf-WASM worker and configure SPA route handling.

## Fallow audit

The repository audits changed files with Fallow. Run the local audit with:

```sh
npx fallow audit --changed-since HEAD
```

Pull requests can audit changes against the main branch:

```sh
npx fallow audit --base origin/main
```

Installing dependencies configures the Git hook through Husky. The generated `.fallow/` cache is ignored.
