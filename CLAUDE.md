# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Что это

Монорепозиторий трекера расходов: Next.js на фронтенде, NestJS + Prisma + PostgreSQL на бэкенде,
общие Zod-контракты между ними. pnpm workspaces + Turborepo.

Сейчас это заготовка: структура, конфигурация и заглушки модулей проведены до конца,
но доменная логика (`categories`, `transactions`) и авторизация не реализованы —
методы сервисов бросают `NotFoundException`/`NotImplementedException`.

Каталоги `react-leveling-plan/` и `dotnet-core-plan/` — учебные планы пользователя,
в pnpm workspace не входят, к коду приложения отношения не имеют.

## Состав

| Пакет | Назначение |
|---|---|
| `apps/web` | Next.js 16 (App Router), Tailwind 4, TanStack Query, Zustand, React Hook Form |
| `apps/api` | NestJS 12, Prisma 7 (адаптер `@prisma/adapter-pg`), Swagger |
| `packages/shared` | Zod-схемы и типы DTO — единый контракт для web и api |
| `packages/eslint-config` | Общие flat-конфиги ESLint (`base` / `next` / `nest`) |
| `packages/typescript-config` | Общие `tsconfig` (`base` / `nextjs` / `nestjs`) |

Специфика конкретного пакета — в его собственном `CLAUDE.md`:
`apps/api/CLAUDE.md` (NestJS, Prisma, CQRS, авторизация),
`apps/web/CLAUDE.md` (Next.js, Feature-Sliced Design). Этот файл — только
общее для всего монорепозитория: структура, команды, git-флоу, контракты.

## Команды

Первый запуск:

```bash
corepack enable pnpm
cp .env.example .env      # единый .env в корне, читают и web, и api
pnpm install
pnpm db:up                # PostgreSQL 17 в Docker, нужен Docker/OrbStack
pnpm db:migrate
pnpm dev                  # web :3000, api :3001, Swagger :3001/api/docs
```

По всему монорепо (через Turborepo, с учётом зависимостей между пакетами):

```bash
pnpm dev / build / lint / typecheck / test
pnpm format                # prettier --write по всему репозиторию
```

Точечно, в конкретном пакете:

```bash
pnpm --filter @expense-tracker/api <script>
pnpm --filter @expense-tracker/web <script>
```

Один тестовый файл (напрямую через vitest, минуя turbo):

```bash
cd apps/web && pnpm exec vitest run src/lib/api-client.test.ts
cd apps/api && pnpm exec vitest run --config ./vitest.config.ts src/common/health.controller.spec.ts
```

E2E-тесты API (`apps/api/test/*.e2e-spec.ts`) поднимают весь `AppModule`, включая
`PrismaService.onModuleInit()` → реальный `$connect()` — без запущенного `pnpm db:up`
падают на подключении к БД:

```bash
cd apps/api && pnpm test:e2e
```

БД:

```bash
pnpm db:up / db:down / db:logs
pnpm db:migrate           # prisma migrate dev
pnpm db:studio
```

## Коммиты и git-флоу

Формат сообщения коммита (Conventional Commits на русском), чек-лист перед
коммитом, именование веток и процесс Pull Request — в skill `commit`
(`.claude/skills/commit/SKILL.md`).

## Как устроены контракты (packages/shared)

Одна Zod-схема в `packages/shared/src/schemas/*.schema.ts` обслуживает три места одновременно:

- валидацию тела запроса в Nest — через `ZodValidationPipe` (`apps/api/src/common/pipes/`);
- типы DTO по обе стороны — через `z.infer`;
- валидацию формы на фронте — через `zodResolver` в React Hook Form.

Рассинхрон контракта между фронтом и бэком ловится компилятором, а не в рантайме.
Пакет собирается через `tsc --build` перед `web`/`api` — порядок обеспечивает Turborepo
(`dependsOn: ["^build"]` в `turbo.json`); при `pnpm dev` собирается в watch-режиме параллельно.

Добавление нового DTO: новая Zod-схема в `packages/shared/src/schemas/`, экспорт из
`packages/shared/src/index.ts`, использование в контроллере через `ZodValidationPipe`
и на фронте через `zodResolver`.

Специфика NestJS (DI-импорты, Zod-валидация вместо class-validator, Prisma 7,
JWT-авторизация, CQRS между модулями) — в `apps/api/CLAUDE.md`.
Специфика Next.js и Feature-Sliced Design — в `apps/web/CLAUDE.md`.

## Три версии, зафиксированные намеренно

Не обновлять их не глядя без проверки — каждая закреплена по конкретной причине,
актуальной на момент создания проекта:

1. **Prisma — ровно `7.10.0`, без каретки** (в `apps/api/package.json`, оба —
   `prisma` и `@prisma/client`). Тег `latest` в npm тогда указывал на `8.0.0-rc` —
   обычная установка затащила бы release candidate.
2. **TypeScript — `~6.0.3`, не 7.x** (везде в монорепо). `@nestjs/cli@12` тянет
   `typescript ~6.0.2`, а `typescript-eslint@8` объявляет peer `typescript <6.1.0`.
   На TS 7 линтер и сборка Nest разъедутся.
3. **`nestjs-zod` не используется** — подробности в `apps/api/CLAUDE.md`.

## pnpm-specific

`pnpm-workspace.yaml` содержит `allowBuilds` — pnpm 11 по умолчанию блокирует
postinstall-скрипты новых зависимостей. При добавлении пакета с build-скриптом
pnpm откажется его выполнять, пока в `allowBuilds` не появится явный `true`/`false`
для этого пакета (или `pnpm approve-builds`). `@scarf/scarf` (телеметрия, транзитивная
через `swagger-ui-dist`) намеренно `false`.
