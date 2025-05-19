import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import prettierConfig from "eslint-config-prettier";

export default [
  // Global config for all JS/JSX files
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node, // Keep node globals for general purpose
      },
    },
    plugins: {
      react: pluginReact,
    },
    settings: {
      react: {
        version: "detect", // Detect React version
      },
    },
    rules: {
      ...js.configs.recommended.rules, // Apply recommended JS rules
      ...pluginReact.configs.recommended.rules, // Apply recommended React rules
      "react/react-in-jsx-scope": "off", // Not needed with new JSX transform
      "react/prop-types": "off", // Disable prop-types for now
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }], // Ignore unused vars/args starting with _
      // Add any other global rules or overrides here
    },
  },
  // Specific config for test files
  {
    files: ["**/*.test.{js,jsx}", "**/*.spec.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.jest, // Add Jest globals
      },
    },
    // If you were using eslint-plugin-jest, its config would go here
    // For now, just adding globals.jest should solve 'no-undef' for jest functions
  },
  // Prettier config should be last to override other formatting rules
  prettierConfig,
];
