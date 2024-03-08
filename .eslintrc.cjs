/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  "root": true,
  "extends": [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/eslint-config-typescript/recommended"
  ],
  "overrides": [
    {
      "files": [
        "**/__tests__/*.{cy,spec}.{js,ts,jsx,tsx}",
        "cypress/e2e/**.{cy,spec}.{js,ts,jsx,tsx}"
      ],
    }
  ],
  "rules": {
    "@typescript-eslint/no-non-null-assertion": "off"
  }
}
