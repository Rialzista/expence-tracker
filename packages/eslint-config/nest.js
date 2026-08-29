import globals from 'globals';

import { baseConfig } from './base.js';

export const nestConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      // Декораторы Nest (@Injectable, @Controller) опираются на метаданные
      // типов, из-за чего пустые интерфейсы и any в сигнатурах неизбежны.
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // DI в Nest резолвит зависимости конструктора через emitDecoratorMetadata:
      // компилятор кладёт в design:paramtypes реальный класс, только если импорт
      // не type-only. `import type X` на инжектируемом сервисе не ошибка
      // компиляции, но ломает рантайм — Nest получит Object вместо класса.
      // Правило не знает о decorator-метаданных, поэтому здесь оно вредно.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];

export default nestConfig;
