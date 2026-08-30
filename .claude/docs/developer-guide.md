# Гайд для разработчиков

Практическое руководство: как поднять проект, как устроены типовые задачи,
на что обратить внимание перед коммитом. Общие правила репозитория — в
корневом `CLAUDE.md`; специфика пакетов — `apps/api/CLAUDE.md`,
`apps/web/CLAUDE.md`. Этот файл не дублирует их дословно, а собирает
рабочий процесс в одном месте.

## Быстрый старт

```bash
corepack enable pnpm
cp .env.example .env      # единый .env в корне — читают и web, и api
pnpm install
pnpm db:up                # PostgreSQL 17 в Docker (нужен Docker/OrbStack)
pnpm db:migrate            # применить миграции + сгенерировать Prisma Client
pnpm dev                   # web :3000, api :3001, Swagger :3001/api/docs
```

Требования: Node.js ≥ 22.12, pnpm через corepack (версия закреплена в
`package.json#packageManager`), Docker для PostgreSQL.

Полезные адреса после `pnpm dev`:

| Сервис | Адрес |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001/api |
| Swagger | http://localhost:3001/api/docs |
| PostgreSQL | localhost:5432 |

## Повседневные команды

```bash
pnpm dev / build / lint / typecheck / test   # по всему монорепо (Turborepo)
pnpm format                                    # prettier --write везде

pnpm --filter @expense-tracker/api <script>   # точечно в пакете
pnpm --filter @expense-tracker/web <script>

pnpm db:up / db:down / db:logs
pnpm db:migrate            # prisma migrate dev
pnpm db:studio             # Prisma Studio
pnpm db:generate           # пересобрать Prisma Client после правки schema.prisma
```

Один тестовый файл напрямую через vitest (быстрее, чем гонять весь Turborepo):

```bash
cd apps/web && pnpm exec vitest run src/lib/api-client.test.ts
cd apps/api && pnpm exec vitest run --config ./vitest.config.ts src/common/health.controller.spec.ts
```

E2E-тесты API поднимают весь `AppModule`, включая реальное подключение к БД
— без `pnpm db:up` падают на `$connect()`:

```bash
cd apps/api && pnpm test:e2e
```

## Перед коммитом / перед PR

```bash
pnpm lint && pnpm typecheck && pnpm test
# если правили apps/api:
pnpm db:up && cd apps/api && pnpm test:e2e
```

`apps/web`'s `pnpm typecheck` — это `next typegen && tsc --noEmit`, не
просто `tsc`: типы вроде `LayoutProps<'/'>` генерируются Next-ом в
`.next/types/` и не существуют до первого `next dev`/`build`/`typegen`.

## Как добавить новый доменный эндпоинт (сквозной пример)

На примере гипотетического поля/маршрута в существующем модуле, например
`categories`:

1. **Контракт** — новая/изменённая Zod-схема в
   `packages/shared/src/schemas/category.schema.ts`, экспорт из
   `packages/shared/src/index.ts`. Если это response-схема — не забыть, что
   маппер (`category.mapper.ts`) должен перечислять новое поле явно.
2. **Repository** (`categories.repository.ts`) — если нужен новый запрос к
   Prisma. Всегда фильтровать по `userId` в самом `where`, никогда не
   находить запись только по `id` с последующей проверкой владельца в коде.
3. **Service** (`categories.service.ts`) — доменная логика, бросает
   `NotFoundException`/`ConflictException` и т.п. Не экспортируется из
   модуля.
4. **Command или Query** (`commands/`/`queries/`) — новый класс + хендлер
   (`@CommandHandler`/`@QueryHandler`), если это новая операция, а не правка
   существующей. Зарегистрировать в `CategoryCommandHandlers`/
   `CategoryQueryHandlers` (`commands/index.ts`/`queries/index.ts`) и
   подключить в `categories.module.ts` (`providers`).
5. **Controller** — новый маршрут через `CommandBus.execute`/
   `QueryBus.execute`, `ZodValidationPipe` на входных данных, актуализировать
   `@ApiOperation`/`@ApiResponse` для Swagger.
6. **Тесты** — юнит-тест сервиса (`*.service.spec.ts`, мокается repository)
   обязателен; e2e — по необходимости.
7. **Фронтенд**, если нужен UI — хук в `entities/<domain>/model/` (TanStack
   Query, `query-keys.ts`), форма/диалог в `features/<domain>/<action>/` со
   своей Zod-схемой формы, если DTO из `shared` не ложится напрямую на HTML
   input (пример — даты, см. `apps/web/CLAUDE.md`).

Если новая функциональность требует данных из **другого** доменного модуля
(например, `transactions` нужно знать про `categories`) — только через
`CommandBus`/`QueryBus` с публичным классом из `commands/`/`queries/` этого
модуля. Прямой импорт чужого `*.service.ts` — красный флаг при код-ревью в
этом проекте.

## Конвенции кода

- **Валидация — только Zod.** `class-validator`/`class-transformer` и
  Nest'овский `ValidationPipe` в проекте не установлены и добавлять их не
  нужно — `ZodValidationPipe` покрывает эту роль точечно на каждом параметре.
- **DTO — это `z.infer`, не классы.** У DTO нет `@ApiProperty()` — это
  правило их не касается: он для классов с decorators, а не для типов Zod.
- **`import type` осторожно в `apps/api`.** Конструктор с DI не должен
  импортировать класс-зависимость через `import type` — `emitDecoratorMetadata`
  тогда не увидит реальный класс в `design:paramtypes`, и Nest получит
  `Object` вместо сервиса в рантайме. `@typescript-eslint/consistent-type-imports`
  поэтому выключен в `packages/eslint-config/nest.js` — при добавлении новых
  конструкторов с DI следить за этим самому, `eslint --fix` тут не спасёт
  (правило именно выключено, а не настроено иначе).
- **Мапперы явно перечисляют поля.** Никогда не отдавать наружу Prisma-модель
  напрямую (`return category` из контроллера) — только через
  `toCategoryResponse`/`toTransactionResponse`/`toUserResponse`, чтобы
  внутренние поля (`passwordHash`, `userId`) не утекли в ответ API.
- **Деньги — строки на всём пути**, `Prisma.Decimal` в агрегациях. См.
  `architecture.md` → «Денежные суммы» и `database-schema.md` → `amount`.
- **FSD на фронте — только для нового кода.** `src/lib/*`, `src/stores/*` и
  старые страницы `(dashboard)/*` не мигрированы на FSD намеренно (см.
  `apps/web/CLAUDE.md`) — не переносить их «заодно» в рамках несвязанной
  задачи; при доработке конкретного экрана можно перевести только его.

## Тестирование

Vitest везде, не Jest.

- `apps/api`: `*.spec.ts` рядом с файлом — юнит-тесты сервисов, репозиторий
  мокается вручную (`vi.fn()`), Prisma не поднимается. `test/*.e2e-spec.ts` —
  поднимает весь `AppModule` с реальной БД, гоняется отдельным конфигом
  (`vitest.config.e2e.ts`) через `pnpm test:e2e`.
- `apps/web`: `*.test.tsx` рядом с компонентом, Testing Library + MSW
  (`src/test/mocks/handlers.ts`) для мока HTTP вместо реального API.
  Конфиг — `vitest.config.mts` (обязательно `.mts`, не `.ts` — иначе Vite не
  всегда однозначно определяет ESM).

Новый эндпоинт/сервисный метод — минимум юнит-тест сервиса на happy path и
на основные ошибки (`NotFoundException`/`ConflictException`). Новая форма на
фронте — тест на успешную отправку и на отображение ошибки валидации.

## Git-флоу и коммиты

GitHub Flow: `main` — единственная долгоживущая ветка, всегда в
деплоящемся состоянии, прямые коммиты в неё не делаются.

```bash
git checkout main && git pull
git checkout -b feature/short-description   # feature|fix|refactor|chore|docs
# работа, коммиты
git push -u origin feature/short-description
gh pr create   # после прогона чек-листа "перед PR" выше
```

Коммиты — Conventional Commits, **заголовок на русском**, повелительное
наклонение («добавить», не «добавил»/«добавляет»), без точки в конце, до 72
символов:

```
<тип>(<область>): <что сделано>

<почему так, а не иначе — если не очевидно из диффа>
```

Типы: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`. Область —
пакет (`api`, `web`, `shared`, `config`, `claude`); для изменений по всему
монорепо область опускается. Тело — про причины и отвергнутые альтернативы,
не пересказ диффа (список файлов и так виден в самом коммите).

Один коммит — одна законченная единица работы, которая сама по себе
собирается и проходит тесты. Правки в чужом модуле ради текущей фичи едут
вместе с ней, не отдельным коммитом «на будущее».

## Частые ловушки

- **`prisma`/`@prisma/client` не выше `7.10.0`, TypeScript не выше `~6.0.3`**
  — обновление вслепую сломает сборку/линт (детали — корневой `CLAUDE.md`,
  «Три версии, зафиксированные намеренно»).
- **Новая зависимость с postinstall-скриптом** — pnpm 11 блокирует его по
  умолчанию; добавить пакет в `allowBuilds` в `pnpm-workspace.yaml`
  (`true`/`false` явно) или прогнать `pnpm approve-builds`.
- **`next.config.ts` должен оставаться CJS-совместимым** — не использовать
  `import.meta.url` внутри него, иначе сборка конфига падает
  (`ReferenceError: exports is not defined`). Next и так находит корень
  монорепо по `pnpm-lock.yaml`.
- **`.env` один на весь монорепо**, в корне, не в `apps/api`/`apps/web`.
  Backend читает его через `ConfigModule.forRoot({ envFilePath: ['../../.env']
  })`, Prisma CLI — через `apps/api/prisma.config.ts` (сам грузит dotenv,
  Prisma 7 CLI больше не делает это автоматически), frontend получает
  переменные `NEXT_PUBLIC_*` через Turborepo `globalPassThroughEnv`.
- **`GET /transactions/summary` не имеет значений по умолчанию** для
  `month`/`year` — «сводка неизвестно за что» не нужна; забыть один из
  параметров даст `400`, а не сводку за текущий месяц.
- **Изменение `schema.prisma` требует `pnpm db:migrate`**, а после смены
  структуры без новой миграции (например, руками правили сгенерированный
  клиент) — `pnpm db:generate`, иначе типы в `apps/api/src/generated/prisma`
  разойдутся с реальной БД.

## Куда смотреть дальше

- `architecture.md` — как устроены модули и слои целиком.
- `api-reference.md` — все маршруты, тела запросов/ответов, коды ошибок.
- `database-schema.md` — таблицы, поля, индексы, связи, миграции.
- `apps/api/src/auth/README.md` — детали потока авторизации.
- Swagger (`/api/docs`) — актуальная машиночитаемая спецификация API,
  сверять с ней в первую очередь при расхождении с этим документом.
