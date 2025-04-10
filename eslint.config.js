import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import mochaPlugin from "eslint-plugin-mocha";

export default defineConfig([
    { files: ["src/**/*.ts"], plugins: { js }, extends: ["js/recommended"] },
    { files: ["src/**/*.ts"], languageOptions: { globals: globals.node } },
    {
        files: ["**/*.spec.ts"],
        env: { mocha: true },
    },
    tseslint.configs.recommended,
    eslintConfigPrettier,
    globalIgnores(["node_modules", "dist"]),
    mochaPlugin.configs.flat.recommended,
]);
