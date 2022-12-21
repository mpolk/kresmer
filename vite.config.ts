import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',

  resolve: {
    alias: {
      vue: "vue/dist/vue.esm-bundler.js",
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
    }
  },

  build: {
    rollupOptions: {
      input: {
        app: "./index.electron.html"
      }
    }
  }  
})
