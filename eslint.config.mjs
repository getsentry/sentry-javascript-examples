import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 2018,
      sourceType: 'module',
      parser: tsParser,
    },
    plugins: {},
    rules: {
      // custom rules
    },
  },
];
