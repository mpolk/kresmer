import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';

export default defineConfig({
  // https://vitejs.dev/config/
    plugins: [
      vue(), 
      dts(), 
      cssInjectedByJsPlugin({topExecutionPriority: false}),
    ],
    base: './',

    resolve: {
      alias: {
        vue: "vue/dist/vue.esm-bundler.js",
      }
    },

    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/Kresmer.ts'),
        name: 'Kresmer',
        fileName: (format) => `kresmer.${format}.js`,
        },
      sourcemap: true,
      rollupOptions: {
        external: ['vue'],
        output: {
          // Provide global variables to use in the UMD build
          // Add external deps here
          globals: {
            vue: 'Vue',
          },
          exports: "named",
        },
      }
    }  
});