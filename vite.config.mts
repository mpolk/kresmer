import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import i18nextLoader from 'vite-plugin-i18next-loader';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    i18nextLoader({
      paths: ['./locales'], 
      namespaceResolution: 'basename',
    }),
    vueDevTools(),
  ],
  base: './',

  resolve: {
    alias: {
      vue: "vue/dist/vue.esm-bundler.js",
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
      '~kresmer': path.resolve(__dirname, 'node_modules/kresmer'),
    }
  },

  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler"
      }
    }
  },

  build: {
    rollupOptions: {
      input: {
        app: "./index.electron.html"
      },
    },
  },

  server: {
    watch: {awaitWriteFinish: {stabilityThreshold: 1000}}
  },
  
})
