/***************************************************************************\
 *                            🕸 KresMer 🕸
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2026 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *                  Browser extension build configuration
 ***************************************************************************/

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config.js';
// import i18nextLoader from 'vite-plugin-i18next-loader';

const fixManifestPlugin = (targetBrowser: string) => {
  return {
    name: 'fix-manifest-crxjs',
    transformCrxManifest(manifest: any) {
      if (targetBrowser === 'firefox') {
        if (manifest.background) {
          // Firefox requires an array of scripts instead of a service_worker
          delete manifest.background.service_worker;
        }//if

        manifest.permissions.push("webRequestBlocking");
        
        manifest.browser_specific_settings = {
          gecko: {
            id: "kresmer@mpolk.in.ua",
            strict_min_version: "109.0"
          }
        };

        manifest.content_scripts = [
            {
                matches: ["file:///**/*.kre"],
                js: ["src/content/injector.ts"],
                run_at: "document_end"
            }
        ];
      }//if Firefox

      return manifest;
    },
  };
}

const targetBrowser = process.env.TARGET_BROWSER || 'chrome';
export default defineConfig({
  plugins: [
    vue(),
    crx({manifest}),
    fixManifestPlugin(targetBrowser),
    // i18nextLoader({
    //   paths: ['./locales'], 
    //   namespaceResolution: 'basename',
    // }),
  ],
  base: './',

  resolve: {
    alias: {
      vue: "vue/dist/vue.esm-bundler.js",
      // '~kresmer': path.resolve('./', 'node_modules/kresmer'),
    }
  },

  build: {
    outDir: `dist/${targetBrowser}`,
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
    cors: {
      origin: [
        /chrome-extension:\/\//,
      ],
    },
  },  
})
