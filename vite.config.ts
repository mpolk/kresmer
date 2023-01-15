import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), dts()],
  base: './',

  resolve: {
    alias: {
      vue: "vue/dist/vue.esm-bundler.js",
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
    }
  },

  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/Kresmer.ts'),
      name: 'Kresmer',
      fileName: (format) => `kresmer.${format}.js`,
    },

    rollupOptions: {
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // Add external deps here
        globals: {
          vue: 'Vue',
        },
      },
    }
  }  
})
