import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import perfectionist from "eslint-plugin-perfectionist";

export default [
  { ignores: ["dist", "node_modules", "coverage", ".vite"] },
  js.configs.recommended,
  react.configs.recommended,
  reactHooks.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        document: "readonly",
        navigator: "readonly",
        window: "readonly",
        console: "readonly",
        fetch: "readonly",
        alert: "readonly",
        localStorage: "readonly",
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      perfectionist,
    },
    rules: {
      "react/prop-types": "warn",
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "perfectionist/sort-imports": [
        "error",
        {
          type: "natural",
          order: "asc",
          groups: [
            "react",
            "router",
            "external",
            "internal-type",
            "internal",
            "hooks",
            "components",
            "style",
            "unknown",
          ],
        },
      ],
    },
  },
];
