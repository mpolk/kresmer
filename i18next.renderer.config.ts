import { defineConfig } from 'i18next-cli';
import i18nextVuePlugin from 'i18next-cli-vue';

export default defineConfig({
  "locales": [
    "en",
    "uk"
  ],
  "extract": {
    "input": "src/renderer/**/*.{ts,vue}",
    "output": "locales/{{language}}/{{namespace}}.json",
    "defaultNS": "renderer",
    "ignoreNamespaces": ["main"],
    // "sort": false,
    "keySeparator": ".",
    "nsSeparator": ":",
    "contextSeparator": "_",
    "functions": [
      "t",
      "*.t"
    ],
    "transComponents": [
      "Trans"
    ]
  },
  "types": {
    "input": [
      "locales/{{language}}/{{namespace}}.json"
    ],
    "output": "src/{{namespace}}/types/i18next.d.ts"
  },
  "plugins": [
    i18nextVuePlugin({
      vueVersion: 3,
      attr: 'data-i18n',
    }),
  ]
});