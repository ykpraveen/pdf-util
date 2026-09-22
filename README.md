# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## Fallow

The pre-commit hook audits changes since `HEAD`:

```sh
npx fallow audit --changed-since HEAD
```

The hook skips this check for the initial commit because no `HEAD` exists yet.

Pull requests audit changes against the main branch:

```sh
npx fallow audit --base origin/main
```

The generated `.fallow/` cache is ignored.

Installing dependencies with `npm install` configures the Git hook through Husky. To prevent merging a failed check, require the `Fallow / Check` status check in the repository branch protection rules.
