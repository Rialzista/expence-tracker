import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';

/**
 * Общая база для всех пакетов монорепо.
 * Prettier подключён последним и только отключает конфликтующие правила —
 * форматирование остаётся за самим Prettier, а не за ESLint.
 */
export const baseConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { turbo: turboPlugin },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },
  eslintConfigPrettier,
  {
    ignores: ['dist/**', '.next/**', 'coverage/**', 'node_modules/**', 'generated/**'],
  },
];

export default baseConfig;
