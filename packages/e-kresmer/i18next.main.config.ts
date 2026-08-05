import { defineConfig } from 'i18next-cli';

export default defineConfig({
  "locales": [
    "en",
    "uk"
  ],
  "extract": {
    "input": "src/main/**/*.{ts,vue}",
    "output": "locales/{{language}}/{{namespace}}.json",
    "defaultNS": "main",
    "ignoreNamespaces": ["renderer"],
    "sort": false,
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
  }
});