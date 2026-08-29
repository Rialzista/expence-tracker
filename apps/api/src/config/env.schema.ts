import { z } from 'zod';

/**
 * Переменные окружения проверяются один раз на старте приложения.
 * Ошибка в .env валит процесс сразу, а не всплывает посреди запроса.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET должен быть длиной не менее 16 символов'),
  JWT_EXPIRES_IN: z.string().default('15m'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const issues = z.prettifyError(result.error);
    throw new Error(`Некорректные переменные окружения:\n${issues}`);
  }

  return result.data;
}
