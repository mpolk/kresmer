import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config.js';
// import i18nextLoader from 'vite-plugin-i18next-loader';
// import vueDevTools from 'vite-plugin-vue-devtools';

const fixManifestPlugin = () => {
  return {
    name: 'fix-manifest-crxjs',
    transformCrxManifest(manifest: any) {
      if (manifest.web_accessible_resources) {
        manifest.web_accessible_resources = manifest.web_accessible_resources.map((resource: any) => {
          if (resource.matches && resource.matches.includes('<all_urls>')) {
            // Заменяем опасный <all_urls> на безопасные веб-протоколы
            resource.matches = ['http://*/*', 'https://*/*'];
          }
          return resource;
        });
      }
      return manifest;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    crx({manifest}),
    fixManifestPlugin(),
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
      // '~kresmer': path.resolve('./', 'node_modules/kresmer'),
    }
  },

  build: {
    rollupOptions: {
      input: {
        app: "src/viewer.html",
        sandbox: "src/sandbox.html",
      },
    },
    sourcemap: true, 
    // minify: false 
  },

  server: {
    // watch: {awaitWriteFinish: {stabilityThreshold: 1000}},
    cors: {
      origin: [
        /chrome-extension:\/\//,
      ],
    },
  },  
})
