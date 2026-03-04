import vue from "eslint-plugin-vue";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import parser from "vue-eslint-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { defineConfig } from "eslint/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([{
    files: ["**/*.ts", "**/*.vue"],
    basePath: __dirname,

    plugins: {
	js,
        vue,
        "@typescript-eslint": typescriptEslint
    },

    extends: [
	"js/recommended",
	"vue/essential",
	"@typescript-eslint/recommended",
    ],

    languageOptions: {
        globals: {
            ...globals.browser,
            Routing: "readable",
        },

        parser: parser,
        ecmaVersion: "latest",
        sourceType: "module",

        parserOptions: {
            parser: "@typescript-eslint/parser",
        },
    },

    rules: {
	"@typescript-eslint/no-unused-expressions": ["error", {"allowShortCircuit": true}],
        "@typescript-eslint/no-non-null-assertion": "off",

        "vue/multi-word-component-names": ["error", {
            ignores: ["paginator"],
        }],

        "vue/no-multiple-template-root": "off",
        "vue/no-v-for-template-key": "off",
        // "vue/no-v-for-template-key-for-child": "on",
    },
}]);