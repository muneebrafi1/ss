import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cp } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = import.meta.dirname

/**
 * Copies the static extension shell into `dist/`.
 *
 * `manifest.json` is not an import graph entry point, so nothing else would
 * place it beside the bundles Chrome expects to load it with.
 */
function copyExtensionShell(): Plugin {
  return {
    name: 'stacklens:copy-extension-shell',
    apply: 'build',
    async closeBundle() {
      await cp(resolve(root, 'manifest.json'), resolve(root, 'dist/manifest.json'))
      const icons = resolve(root, 'icons')
      if (existsSync(icons)) {
        await cp(icons, resolve(root, 'dist/icons'), { recursive: true })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyExtensionShell()],
  resolve: {
    alias: { '@': resolve(root, 'src') },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(root, 'popup.html'),
        options: resolve(root, 'options.html'),
        welcome: resolve(root, 'welcome.html'),
        report: resolve(root, 'report.html'),
        history: resolve(root, 'history.html'),
        technologies: resolve(root, 'technologies.html'),
        privacy: resolve(root, 'privacy.html'),
        background: resolve(root, 'src/background/index.ts'),
      },
      output: {
        // Predictable paths so manifest.json can reference them directly.
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
