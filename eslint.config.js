import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig([
    { files: ["src/**/*.ts"], plugins: { js }, extends: ["js/recommended"] },
    { files: ["src/**/*.ts"], languageOptions: { globals: globals.node } },
    tseslint.configs.recommended,
    eslintConfigPrettier,
]);
