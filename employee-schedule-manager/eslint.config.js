import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

const compat = new FlatCompat();

export default [
    js.configs.recommended,
    ...compat.extends('plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended'),
    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: {
            parser: typescriptParser,
            sourceType: 'module',
        },
        plugins: {
            '@typescript-eslint': typescriptEslint,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'error',
        },
    },
    {
        ignores: ['dist', 'node_modules', 'build'],
    },
];