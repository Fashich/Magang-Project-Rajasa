import js from '@eslint/js';
import react from 'eslint-plugin-react';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'build/**', 'coverage/**', 'node_modules/**', '.vite/**', 'vite.config.*'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      'react/jsx-uses-vars': 'error',
      'no-console': 'off',
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];
