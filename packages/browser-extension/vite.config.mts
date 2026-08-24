import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config.js';
// import i18nextLoader from 'vite-plugin-i18next-loader';

const fixManifestPlugin = (targetBrowser: string) => {
  return {
    name: 'fix-manifest-crxjs',
    transformCrxManifest(manifest: any) {
      // 1. Настройка фонового скрипта для Firefox
      if (targetBrowser === 'firefox') {
        if (manifest.background) {
          // Firefox требует массив скриптов вместо service_worker
          // manifest.background.scripts = ['src/background/index.ts'];
          delete manifest.background.service_worker;
          // manifest.background.type = 'module';
        }
        
        // Firefox в MV3 требует явного указания ID расширения для некоторых функций
        manifest.browser_specific_settings = {
          gecko: {
            id: "kresmer@mpolk.in.ua", // придумайте любой ID в формате email
            strict_min_version: "109.0"
          }
        };
      }

      // 2. Настройка веб-доступных ресурсов (наш старый фикс)
      // manifest.web_accessible_resources = [
      //   {
      //     resources: ["src/viewer.html", "assets/*", "**/*.js", "**/*.css"],
      //     matches: ["http://*/*", "https://*/*", "file:///*"],
      //     use_dynamic_url: false
      //   }
      // ];

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
      // output: {
      //   dir: `dist/${targetBrowser}`,
      // }
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
