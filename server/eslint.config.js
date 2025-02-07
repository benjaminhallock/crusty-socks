import js from '@eslint/js';
import perfectionist from 'eslint-plugin-perfectionist';
import globals from 'globals';

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
                ...globals.node,
                ...globals.es2021
            }
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'semi': ['error', 'always'],
            'quotes': ['error', 'single']
        }
    }
];