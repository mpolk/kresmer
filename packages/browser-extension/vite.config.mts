import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config.js';
// import i18nextLoader from 'vite-plugin-i18next-loader';
// import vueDevTools from 'vite-plugin-vue-devtools';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    crx({manifest}),
    // i18nextLoader({
    //   paths: ['./locales'], 
    //   namespaceResolution: 'basename',
    // }),
    // vueDevTools(),
  ],
  base: './',

  resolve: {
    alias: {
      vue: "vue/dist/vue.esm-bundler.js",
      // '~bootstrap': path.resolve('./', 'node_modules/bootstrap'),
      '~kresmer': path.resolve('./', 'node_modules/kresmer'),
    }
  },

  build: {
    rollupOptions: {
      input: {
        app: "./index.html"
      },
    },
  },

  server: {
    watch: {awaitWriteFinish: {stabilityThreshold: 1000}}
  },
  
})
