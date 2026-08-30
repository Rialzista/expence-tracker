# Трекер расходов

Веб-приложение для учёта личных доходов и расходов: категории, операции,
сводка за месяц. Монорепозиторий: Next.js на фронтенде, NestJS + Prisma +
PostgreSQL на бэкенде, общие Zod-контракты между ними — рассинхрон типов
между фронтом и бэком ловится компилятором, а не в рантайме.

## Стек и технологии

| Пакет | Назначение | Технологии |
|---|---|---|
| `apps/web` | Фронтенд | Next.js 16 (App Router), React 19, Tailwind 4, shadcn/ui, TanStack Query, Zustand, React Hook Form + Zod |
| `apps/api` | Бэкенд | NestJS 12, CQRS (`@nestjs/cqrs`), Prisma 7 (`@prisma/adapter-pg`), PostgreSQL 17, JWT-авторизация (Passport, argon2id), Swagger |
| `packages/shared` | Общие Zod-схемы и типы DTO для web и api | Zod |
| `packages/eslint-config`, `packages/typescript-config` | Общие конфиги ESLint/TypeScript | — |

Инфраструктура монорепо — pnpm workspaces + Turborepo.

## Требования

- Node.js >= 22.12
- pnpm (через corepack, версия закреплена в `package.json#packageManager`)
- Docker (Docker Desktop или OrbStack) — для PostgreSQL в контейнере

## Установка и запуск

```bash
corepack enable pnpm
cp .env.example .env      # единый .env в корне, читают и web, и api

pnpm install
pnpm db:up                # PostgreSQL 17 в Docker
pnpm db:migrate           # применить миграции + сгенерировать Prisma Client
pnpm dev                  # web :3000, api :3001, Swagger :3001/api/docs
```

После этого:

| Сервис | Адрес |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001/api |
| Swagger | http://localhost:3001/api/docs |
| PostgreSQL | `localhost:5432` |

### Прочие команды

```bash
pnpm build / lint / typecheck / test   # по всему монорепо, через Turborepo
pnpm format                             # prettier --write по всему репозиторию

pnpm --filter @expense-tracker/api <script>   # точечно в одном пакете
pnpm --filter @expense-tracker/web <script>

pnpm db:up / db:down / db:logs          # PostgreSQL в Docker
pnpm db:migrate / pnpm db:studio        # миграции / Prisma Studio
```

Один тестовый файл, напрямую через vitest:

```bash
cd apps/web && pnpm exec vitest run src/lib/api-client.test.ts
cd apps/api && pnpm exec vitest run --config ./vitest.config.ts src/common/health.controller.spec.ts
```

E2E-тесты API поднимают весь `AppModule`, включая реальное подключение к БД —
без `pnpm db:up` падают на `$connect()`:

```bash
cd apps/api && pnpm test:e2e
```

## Переменные окружения

Единый файл `.env` в корне монорепозитория, читают и `apps/web`, и `apps/api`
(пробрасываются через `turbo.json#globalPassThroughEnv`). Пример — в
`.env.example`. Переменные API валидируются один раз на старте через Zod
(`apps/api/src/config/env.schema.ts`) — некорректный `.env` роняет процесс
сразу, а не всплывает посреди запроса.

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `POSTGRES_USER` | Пользователь PostgreSQL (для `docker-compose.yml`) | `expense` |
| `POSTGRES_PASSWORD` | Пароль PostgreSQL | `expense` |
| `POSTGRES_DB` | Имя базы данных | `expense_tracker` |
| `DATABASE_URL` | Строка подключения Prisma, `postgresql://user:pass@host:5432/db?schema=public` | — (обязательна) |
| `API_PORT` | Порт, на котором слушает NestJS | `3001` |
| `NODE_ENV` | `development` / `production` / `test` | `development` |
| `CORS_ORIGIN` | Разрешённый origin для CORS на бэкенде | `http://localhost:3000` |
| `JWT_SECRET` | Секрет для подписи access-токена, не короче 16 символов | — (обязательна) |
| `JWT_EXPIRES_IN` | Время жизни access-токена | `15m` |
| `NEXT_PUBLIC_API_URL` | Базовый URL API для фронтенда | `http://localhost:3001/api` |

Авторизация — только access-токен (без refresh); по его истечении фронтенд
сбрасывает сессию при первом же `401` от API.

## Структура проекта

```
apps/
  web/    # Next.js: App Router (страницы) + Feature-Sliced Design (entities/features/widgets/shared)
  api/    # NestJS: модули auth, users, categories, transactions — CQRS между собой
packages/
  shared/             # Zod-схемы и типы DTO — общий контракт web ↔ api
  eslint-config/       # base / next / nest
  typescript-config/   # base / nextjs / nestjs
```

Подробности — в `CLAUDE.md` (общее по монорепо), `apps/api/CLAUDE.md`,
`apps/web/CLAUDE.md`.

### Модель данных

`User` 1—N `Category` 1—N `Transaction` (категория у операции необязательна —
`categoryId` может быть `null`). `Transaction.amount` — `Decimal(12, 2)`,
`Transaction.type` и `Category.type` — `INCOME` / `EXPENSE`. Схема — в
`apps/api/prisma/schema.prisma`.

## API

Все маршруты, кроме отмеченных `public`, требуют заголовок
`Authorization: Bearer <accessToken>`. Полная спецификация со схемами
запросов/ответов — в Swagger (`/api/docs`) после запуска `apps/api`.

### `auth`

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/api/auth/register` | Регистрация — `{ accessToken, user }` *(public)* |
| `POST` | `/api/auth/login` | Вход — `{ accessToken, user }` *(public)* |
| `GET` | `/api/auth/me` | Текущий пользователь |

### `categories`

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/api/categories` | Список категорий текущего пользователя |
| `POST` | `/api/categories` | Создать категорию |
| `PATCH` | `/api/categories/:id` | Обновить категорию |
| `DELETE` | `/api/categories/:id` | Удалить категорию |

### `transactions`

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/api/transactions` | Список операций: пагинация, фильтры по периоду/типу/категории |
| `GET` | `/api/transactions/summary` | Сводка за месяц: доход, расход, баланс, разбивка по категориям |
| `GET` | `/api/transactions/:id` | Одна операция |
| `POST` | `/api/transactions` | Создать операцию |
| `PATCH` | `/api/transactions/:id` | Обновить операцию |
| `DELETE` | `/api/transactions/:id` | Удалить операцию |

### `health`

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/api/health` | Проверка живости *(public)* |

## Три версии, зафиксированные намеренно

Не «обновлять» их не глядя без проверки — каждая закреплена по конкретной
причине, актуальной на момент создания проекта:

1. **Prisma — ровно `7.10.0`, без каретки** (`prisma` и `@prisma/client` в
   `apps/api/package.json`). Тег `latest` в npm указывал на `8.0.0-rc` —
   обычная установка затащила бы release candidate.
2. **TypeScript — `~6.0.3`, не 7.x** (везде в монорепо). `@nestjs/cli@12`
   тянет `typescript ~6.0.2`, а `typescript-eslint@8` объявляет peer
   `typescript <6.1.0` — на TS 7 линтер и сборка Nest разъедутся.
3. **`nestjs-zod` не используется** — версия на момент создания проекта
   объявляет peer `@nestjs/common ^10 || ^11` и с Nest 12 не ставится.
   Вместо неё — свой `ZodValidationPipe` в `apps/api/src/common/pipes/`.

## Что ещё не сделано

CI/CD, Docker-образы для деплоя, refresh-токены, seed-скрипты, страница
`stats`, редирект/guard для незалогиненных пользователей на защищённых
роутах фронтенда.
