import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: 'src',
  base: './',
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'layouts/*.hbs', dest: 'layouts' },
        { src: 'partials/*.hbs', dest: 'partials' },
        { src: 'helpers/*.js', dest: 'helpers' },
        { src: 'img/*', dest: 'img' },
        // simple-datatables is accessed via window.simpleDatatables global
        {
          src: resolve(__dirname, 'node_modules/simple-datatables/dist/umd/simple-datatables.js'),
          dest: 'js/vendor',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '~@fontsource': resolve(__dirname, 'node_modules/@fontsource'),
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      format: {
        comments: /^!/,
      },
    },
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        site: resolve(__dirname, 'src/js/site-entry.js'),
      },
      output: {
        banner: '(function(){',
        footer: '})();',
        entryFileNames: 'js/site.js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || ''
          if (name.endsWith('.css')) return 'css/site.css'
          if (/\.(woff2?|ttf|eot)$/.test(name)) return 'font/[name][extname]'
          if (/\.(png|jpg|jpeg|gif|svg|ico)$/.test(name)) return 'img/[name][extname]'
          return 'assets/[name][extname]'
        },
      },
    },
    sourcemap: false,
  },
  css: {
    devSourcemap: true,
  },
  server: {
    port: 5252,
  },
})
