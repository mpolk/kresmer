import { defineConfig, UserConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';

export default defineConfig(({command, mode}) => {
  // https://vitejs.dev/config/
  const config: UserConfig = {
    plugins: [vue(), dts(), cssInjectedByJsPlugin(),],
    base: './',

    resolve: {
      alias: {
        vue: "vue/dist/vue.esm-bundler.js",
        '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
      }
    },

    build: {
      sourcemap: true,
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
  };

  const libMode = command === "build";

  if (libMode) {
    config.build.lib = {
      entry: path.resolve(__dirname, 'src/Kresmer.ts'),
      name: 'Kresmer',
      fileName: (format) => `kresmer.${format}.js`,
    };
  } else {
    config.build.rollupOptions.input = {
      app: "./index.electron.html"
    };
  }//if

  return config;
});