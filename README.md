# Трекер расходов

Монорепозиторий: Next.js на фронтенде, NestJS + Prisma + PostgreSQL на бэкенде,
общие контракты на Zod между ними.

> Сейчас это **заготовка**: структура, конфигурация и заглушки модулей.
> Зависимости не установлены, миграции не создавались.

## Состав

| Пакет | Назначение |
|---|---|
| `apps/web` | Next.js 16, App Router, Tailwind 4, TanStack Query, Zustand |
| `apps/api` | NestJS 12, Prisma 7, Swagger |
| `packages/shared` | Zod-схемы и типы DTO — единый контракт для web и api |
| `packages/eslint-config` | Общие flat-конфиги ESLint (`base` / `next` / `nest`) |
| `packages/typescript-config` | Общие `tsconfig` (`base` / `nextjs` / `nestjs`) |

Каталоги `react-leveling-plan/` и `dotnet-core-plan/` — учебные планы,
в состав воркспейса не входят.

## Первый запуск

```bash
corepack enable pnpm            # pnpm 11 без глобальной установки
cp .env.example .env

pnpm install
pnpm db:up                      # PostgreSQL 17 в Docker
pnpm db:migrate                 # первая миграция + prisma generate
pnpm dev                        # web и api параллельно
```

Нужны Node >= 22.12 и Docker (Docker Desktop или OrbStack).

## Порты

| Сервис | Адрес |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001/api |
| Swagger | http://localhost:3001/api/docs |
| PostgreSQL | `localhost:5432` |

## Команды

| Команда | Что делает |
|---|---|
| `pnpm dev` | Дев-серверы web и api |
| `pnpm build` | Сборка всех пакетов в порядке зависимостей |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Проверки по всему монорепо |
| `pnpm db:up` / `pnpm db:down` | Поднять/остановить PostgreSQL |
| `pnpm db:migrate` / `pnpm db:studio` | Миграции и Prisma Studio |
| `pnpm format` | Prettier по всему репозиторию |

## Три версии, зафиксированные намеренно

Не «обновляйте» их не глядя — каждая закреплена по конкретной причине.

1. **Prisma — ровно `7.10.0`, без каретки.** Тег `latest` в npm сейчас указывает
   на `8.0.0-rc`, то есть обычная установка затащила бы release candidate.
   Стабильная ветка помечена тегом `prev`.
2. **TypeScript — `~6.0.3`, не 7.x.** `latest` — уже 7.0.2, но `@nestjs/cli@12`
   тянет `typescript ~6.0.2`, а `typescript-eslint@8` объявляет peer
   `typescript <6.1.0`. На TS 7 линтер и сборка Nest разъедутся.
3. **`nestjs-zod` не используется.** Версия 5.5 объявляет peer
   `@nestjs/common ^10 || ^11` и с Nest 12 не ставится. Вместо неё —
   свой `ZodValidationPipe` в `apps/api/src/common/pipes/`.

## Как устроены контракты

Одна Zod-схема в `packages/shared` обслуживает три места:

* валидацию тела запроса в Nest — через `ZodValidationPipe`;
* типы DTO по обе стороны — через `z.infer`;
* валидацию формы на фронте — через `zodResolver` в React Hook Form.

Рассинхрон контракта между фронтом и бэком ловится компилятором, а не в рантайме.
Пакет собирается (`tsc`) перед web и api — за порядком следит Turborepo.

## Что ещё не сделано

Авторизация (структура есть, реализации нет — см. `apps/api/src/auth/README.md`),
CI/CD, Docker-образы для деплоя, seed-скрипты, компоненты shadcn/ui
(конфиг `components.json` готов, компоненты добавляются через `pnpm dlx shadcn add`).
