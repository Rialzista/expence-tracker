import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

import { baseConfig } from './base.js';

/**
 * eslint-config-next уже включает typescript-eslint, react, react-hooks
 * и jsx-a11y, поэтому собирать эти плагины вручную не нужно —
 * от базы берём только общие для монорепо правила.
 */
export const nextConfig = [
  ...baseConfig,
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      // Версия зафиксирована явно, а не 'detect': на ESLint 10 автоопределение
      // в eslint-plugin-react@7.37.5 падает — contextOrFilename.getFilename
      // больше не существует (API убран, а не только устарел).
      react: { version: '19.2.8' },
    },
    rules: {
      // JSX-трансформ React 19 не требует React в области видимости.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  {
    ignores: ['.next/**', 'out/**', 'next-env.d.ts'],
  },
];

export default nextConfig;
