import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

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

  // optimizeDeps: {
  //   include: ['kresmer'],
  // },

  build: {
    rollupOptions: {
      input: {
        app: "./index.electron.html"
      }
    },
    // commonjsOptions: { include: [/kresmer/] },    
  },
  
})
