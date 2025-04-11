import js from '@eslint/js'
import perfectionist from 'eslint-plugin-perfectionist'

export default [
  { ignores: ['node_modules', 'dist'] },
  {
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-imports': 'error',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js globals
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        exports: 'writable',
        global: 'readonly',
        module: 'writable',
        process: 'readonly',
        require: 'readonly',
        // ES2021 globals
        AggregateError: 'readonly',
        FinalizationRegistry: 'readonly',
        WeakRef: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
    },
  },
]
