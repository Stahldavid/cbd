import js from '@eslint/js';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';
import jestPlugin from 'eslint-plugin-jest';
// import { defineConfig } from "eslint/config"; // Remove or comment out this line

export default [
  js.configs.recommended, // Include the recommended config directly
  prettierConfig, // Add this to disable ESLint rules that conflict with Prettier
  {
    // Main configuration for JS files (non-test files)
    files: ['**/*.{js,mjs,cjs}'],
    ignores: ['**/*.test.js', '**/tests/**', '**/node_modules/**'], // Ignore test files here
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      sourceType: 'module',
      ecmaVersion: 'latest',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Configuration specifically for test files
    files: ['**/*.test.js', '**/tests/**/*.{js,mjs,cjs}'], // Target test files
    ...jestPlugin.configs['flat/recommended'], // Apply Jest recommended rules & globals
    languageOptions: {
      // Add languageOptions here for test files
      globals: {
        ...globals.node, // Add Node.js globals
        ...globals.jest, // Jest plugin should add these, but being explicit can help
        fetch: true, // Define fetch as a global for tests (mocked or otherwise)
      },
    },
    rules: {
      ...jestPlugin.configs['flat/recommended'].rules,
      // You can override or add specific Jest rules here if needed
      // e.g., "jest/no-disabled-tests": "warn",
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // Keep your no-unused-vars rule
      'jest/no-conditional-expect': 'warn', // Set to warn for now, can be addressed later
    },
  },
];
