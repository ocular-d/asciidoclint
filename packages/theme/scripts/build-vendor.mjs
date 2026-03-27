#!/usr/bin/env node
/**
 * Build vendor bundles (highlight.js) as self-contained IIFE scripts.
 *
 * highlight.bundle.js uses CommonJS require() and must be bundled into standalone
 * IIFE format since it's loaded via <script> tags in Antora (not ES modules).
 */

import { build } from 'vite'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { copyFileSync, mkdirSync, rmSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const tempDir = resolve(rootDir, '.vendor-build-tmp')
const vendorOutDir = resolve(rootDir, 'dist/js/vendor')

const vendorBundles = [
  { name: 'highlight', input: 'src/js/vendor/highlight.bundle.js' },
]

async function buildVendor () {
  rmSync(tempDir, { recursive: true, force: true })
  mkdirSync(vendorOutDir, { recursive: true })

  for (const { name, input } of vendorBundles) {
    console.log(`Building vendor/${name}.js...`)
    await build({
      configFile: false,
      root: rootDir,
      build: {
        outDir: tempDir,
        emptyOutDir: true,
        lib: {
          entry: resolve(rootDir, input),
          name: name,
          formats: ['iife'],
          fileName: () => `${name}.js`,
        },
        minify: 'terser',
        terserOptions: {
          format: {
            comments: /^!/,
          },
        },
        rollupOptions: {
          plugins: [
            nodeResolve(),
            commonjs({
              requireReturnsDefault: 'preferred',
            }),
          ],
        },
      },
      logLevel: 'warn',
    })
    copyFileSync(resolve(tempDir, `${name}.js`), resolve(vendorOutDir, `${name}.js`))
  }

  rmSync(tempDir, { recursive: true, force: true })
  console.log('Vendor bundles built successfully.')
}

buildVendor().catch((err) => {
  console.error('Vendor build failed:', err)
  process.exit(1)
})
