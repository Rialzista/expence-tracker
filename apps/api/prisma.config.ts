import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Prisma 7 больше не подхватывает .env автоматически (dotenv отключён
// в загрузчике конфига намеренно) — грузим общий .env из корня монорепо сами,
// тем же путём, что и ConfigModule.forRoot() в src/app.module.ts.
loadEnv({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
