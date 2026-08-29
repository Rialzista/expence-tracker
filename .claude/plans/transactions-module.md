# Модуль транзакций (apps/api)

## Context

Задача из `.claude/prompts/transactions.md` — реализовать `TransactionsModule`, центральный
домен приложения (учёт доходов и расходов). Сейчас модуль существует как заглушка:
`apps/api/src/transactions/{controller,service,module}.ts`, все методы сервиса бросают
`NotFoundException('Ещё не реализовано')`, репозитория и CQRS-слоя нет.

**Важное расхождение с текстом ТЗ, снятое с пользователем.** ТЗ предлагает добавить модель
`Transaction` и создать миграцию `add-transactions`. Этого делать не нужно: модель уже
описана в `apps/api/prisma/schema.prisma` (строки 56–80) вместе с обратными связями
`User.transactions` / `Category.transactions`, и таблица уже создана миграцией
`20260828135645_init`. Zod-контракты (`createTransactionSchema`, `updateTransactionSchema`,
`transactionResponseSchema`, `transactionQuerySchema`) тоже уже лежат в
`packages/shared/src/schemas/transaction.schema.ts`.

Решения, подтверждённые пользователем:

- схема БД остаётся как есть (`note`, `currency`, `categoryId` nullable, `updatedAt`) —
  новая миграция не создаётся;
- фильтры списка остаются `from`/`to` (не `dateFrom`/`dateTo`), пагинация `page`/`limit`
  сохраняется, `GET /transactions` возвращает `Paginated<TransactionResponse>`;
- `GET /transactions/summary` отдаёт итоги **и** разбивку по категориям;
- фронтенд (`apps/web`) в задачу не входит.

Итог: работа сводится к тому, чтобы перевести `transactions` на тот же CQRS-паттерн, что
и `categories`, и добавить агрегацию.

## Что уже есть и переиспользуется

| Что | Где |
|---|---|
| Образец структуры модуля | `apps/api/src/categories/**` (controller → CommandBus/QueryBus → service → repository → mapper) |
| `ZodValidationPipe` | `apps/api/src/common/pipes/zod-validation.pipe.ts` |
| `@CurrentUser('id')` | `apps/api/src/auth/decorators/current-user.decorator.ts` |
| `idSchema`, `moneySchema`, `paginationQuerySchema`, `Paginated<T>` | `packages/shared/src/common.ts` |
| `transactionTypeSchema`, `currencySchema` | `packages/shared/src/enums.ts` |
| Единый формат ошибок | `HttpExceptionFilter`, уже глобальный в `app.module.ts` |
| Регистрация модуля | `TransactionsModule` уже в `imports` `app.module.ts` — трогать не нужно |

`CqrsModule.forRoot()` вызывается **только** в `app.module.ts` — в `TransactionsModule`
его импортировать нельзя (вторая шина ⇒ хендлеры перестанут находиться).

## Шаг 1. Контракты в `packages/shared`

Файл `packages/shared/src/schemas/transaction.schema.ts`:

1. **Переписать `updateTransactionSchema` явно**, не через `createTransactionSchema.partial()`.
   Причина: в `createTransactionSchema` поле `currency` объявлено как `currencySchema`,
   а это `z.enum(...).default('USD')` — `.partial()` оборачивает поле с дефолтом и делает
   поведение PATCH без `currency` неочевидным (риск молчаливой перезаписи валюты на `USD`).
   Заодно — как в `updateCategorySchema` — разрешить очистку необязательных полей
   (`note`, `categoryId` — `.nullable().optional()`) и добавить
   `.refine((dto) => Object.keys(dto).length > 0, 'Нужно передать хотя бы одно поле')`,
   чтобы пустой PATCH давал 400, а не молчаливый no-op.

2. **Добавить схемы для агрегации:**

```ts
/** month и year обязательны — период агрегации задаётся явно. */
export const transactionSummaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(1970).max(2100),
});

export const categorySummarySchema = z.object({
  categoryId: idSchema.nullable(), // null — операции без категории
  categoryName: z.string().nullable(),
  type: transactionTypeSchema,
  total: z.string(),
});

export const transactionSummaryResponseSchema = z.object({
  month: z.number(),
  year: z.number(),
  income: z.string(),
  expense: z.string(),
  balance: z.string(),
  byCategory: z.array(categorySummarySchema),
});
```

плюс `z.infer`-типы `TransactionSummaryQuery`, `CategorySummary`, `TransactionSummary`.

Экспорт из `packages/shared/src/index.ts` уже покрыт (`export * from './schemas/transaction.schema.js'`) — править не нужно.

**Явные допущения агрегации** (зафиксировать комментарием в схеме):
- суммы — строки, как `moneySchema`: `Decimal` не приводится к `number` нигде по пути;
- `income`/`expense` — положительные суммы по типу, `balance = income − expense`;
- границы месяца считаются в UTC (`Date.UTC(year, month-1, 1)` ≤ `date` < `Date.UTC(year, month, 1)`),
  т.к. колонка — `@db.Timestamptz(3)`;
- валюта в агрегации **не разделяется** — суммируются все операции пользователя за период
  независимо от `currency`. Мультивалютный сплит — отдельная задача.

## Шаг 2. Кросс-модульный доступ к категории

При создании/обновлении транзакции с `categoryId` нужно убедиться, что категория
принадлежит текущему пользователю (иначе чужой UUID пройдёт по FK и утечёт в чужие данные,
либо Prisma отдаст сырой `P2003`).

Прямой импорт `CategoriesService` запрещён паттерном — модуль его не экспортирует.
Поэтому в `apps/api/src/categories/queries/` добавляется **`GetCategoryByIdQuery`**
(+ `get-category-by-id.handler.ts`, экспорт из `queries/index.ts`, добавление в
`CategoryQueryHandlers`), а `CategoriesService` получает метод `findOne(userId, id)`
поверх уже существующего `CategoriesRepository.findByIdForUser`.

`TransactionsService` дёргает его через `QueryBus`; если категории нет —
`NotFoundException('Категория не найдена')`.

## Шаг 3. Модуль `apps/api/src/transactions`

Целевая структура (зеркалит `categories`):

```
transactions/
├── transactions.controller.ts
├── transactions.module.ts
├── transactions.service.ts
├── transactions.repository.ts        (новый)
├── transaction.mapper.ts             (новый)
├── transactions.service.spec.ts      (новый)
├── commands/
│   ├── create-transaction.{command,handler}.ts
│   ├── update-transaction.{command,handler}.ts
│   ├── delete-transaction.{command,handler}.ts
│   └── index.ts
└── queries/
    ├── get-transactions.{query,handler}.ts
    ├── get-transaction.{query,handler}.ts
    ├── get-transactions-summary.{query,handler}.ts
    └── index.ts
```

**`transactions.repository.ts`** — единственное место с Prisma в модуле, все методы
фильтруют по `userId` на уровне запроса:

- `findManyByUser(userId, query)` → `this.prisma.$transaction([findMany, count])`,
  `where` собирается из `from`/`to` (`date: { gte, lte }`), `type`, `categoryId`;
  `orderBy: { date: 'desc' }`, `skip: (page-1)*limit`, `take: limit`;
- `findByIdForUser(id, userId)` → `findFirst({ where: { id, userId } })`;
- `create(data)` / `update(id, data)` / `remove(id, userId)` — как в `CategoriesRepository`
  (`remove` через `deleteMany` + возврат `count`);
- `sumByType(userId, from, to)` → `groupBy({ by: ['type'], _sum: { amount: true } })`;
- `sumByCategory(userId, from, to)` → `groupBy({ by: ['categoryId', 'type'], _sum: { amount: true } })`;
  названия категорий добираются одним `category.findMany({ where: { userId } })` и
  сопоставляются в памяти (`groupBy` не умеет join).

**`transaction.mapper.ts`** — `toTransactionResponse(tx: Transaction): TransactionResponse`,
явно перечисляет поля (без `userId`), `amount: tx.amount.toString()`,
`date/createdAt/updatedAt: .toISOString()`.

**`transactions.service.ts`** — реальная логика вместо заглушек, наружу из модуля не
экспортируется:

- `findAll(userId, query): Promise<Paginated<TransactionResponse>>`;
- `findOne(userId, id)` → `NotFoundException('Операция не найдена')` при `null`;
- `create(userId, dto)` — сначала проверка категории через `QueryBus`, затем создание;
- `update(userId, id, dto)` — `findByIdForUser` → 404, проверка категории → создание;
- `remove(userId, id)` — `count === 0` ⇒ 404;
- `getSummary(userId, { month, year })` — считает границы UTC, две агрегации,
  собирает `TransactionSummary`; суммы приводятся через `Decimal.toFixed(2)`.

**`transactions.controller.ts`** — переписывается на `CommandBus`/`QueryBus`, Swagger-декораторы
как в `CategoriesController`, `@Param('id', new ZodValidationPipe(idSchema))`,
`@Delete(':id')` с `@HttpCode(HttpStatus.NO_CONTENT)`.

> **Порядок маршрутов критичен:** `@Get('summary')` объявляется **до** `@Get(':id')`.
> Иначе Nest сматчит `/transactions/summary` на `:id`, и `idSchema` вернёт 400.

**`transactions.module.ts`** — `providers: [TransactionsService, TransactionsRepository,
...TransactionCommandHandlers, ...TransactionQueryHandlers]`, без импорта `CqrsModule`.
Существующий `exports: [TransactionsService]` **удаляется** — публичный контракт модуля
это классы команд/запросов, как в `categories`.

> Ловушка проекта: `@typescript-eslint/consistent-type-imports` в `nest.js` отключено
> намеренно. Все инжектируемые зависимости (`PrismaService`, `TransactionsRepository`,
> `CommandBus`, `QueryBus`, сервисы в хендлерах) импортируются **value-импортом**,
> `import type` только для DTO/типов Prisma-моделей.

## Шаг 4. Тесты

1. `apps/api/src/transactions/transactions.service.spec.ts` — по образцу
   `categories.service.spec.ts` (vitest, мок репозитория объектом `vi.fn()`, сервис
   создаётся конструктором напрямую, `QueryBus` мокается): маппинг без `userId`,
   пагинация, 404 на чужой/несуществующей транзакции, 404 на чужой категории,
   расчёт `balance` в `getSummary`.
2. `apps/api/test/transactions.e2e-spec.ts` — по образцу `categories.e2e-spec.ts`:
   401 без токена, 400 на невалидном теле и на `:id` не-uuid, 400 на `summary` без
   `month`/`year`, полный цикл create → list с фильтрами → get → patch → delete → 404,
   изоляция между двумя пользователями, `summary` после пары операций.

## Шаг 5. Документация

Обновить в `CLAUDE.md` фразу «Домен `transactions` на этот паттерн пока не переведён —
его сервис остаётся заглушкой» на описание переведённого модуля (по аналогии с абзацем
про `categories`), упомянув `GetCategoryByIdQuery` как новый пункт публичного контракта
модуля `categories`.

## Файлы, которые меняются

- `packages/shared/src/schemas/transaction.schema.ts` — правка + новые схемы
- `apps/api/src/transactions/*` — весь модуль (см. дерево выше)
- `apps/api/src/categories/categories.service.ts` — метод `findOne`
- `apps/api/src/categories/queries/{get-category-by-id.query.ts,get-category-by-id.handler.ts,index.ts}`
- `apps/api/test/transactions.e2e-spec.ts` — новый
- `CLAUDE.md` — актуализация раздела про CQRS

Не меняются: `apps/api/prisma/schema.prisma`, миграции, `app.module.ts`, `apps/web/**`.
Новых зависимостей не добавляется.

## Проверка

```bash
# 1. Юнит-тесты и типы без БД
pnpm --filter @expense-tracker/shared build
cd apps/api && pnpm exec vitest run --config ./vitest.config.ts src/transactions/transactions.service.spec.ts

# 2. Полная сборка монорепо (требование ТЗ)
pnpm build
pnpm lint && pnpm typecheck

# 3. Тесты — нужна поднятая БД
pnpm db:up
pnpm db:migrate            # должен сообщить, что изменений в схеме нет
pnpm test                  # см. примечание ниже
cd apps/api && pnpm test:e2e

# 4. Ручная проверка через Swagger :3001/api/docs
pnpm dev
```

> Примечание: `apps/api/vitest.config.ts` имеет `include: ['**/*.spec.ts']`, что
> захватывает и `test/*.e2e-spec.ts`. Поэтому `pnpm test` в `apps/api` тоже требует
> поднятой БД — это уже так для существующих тестов, менять поведение в этой задаче
> не нужно, но при прогоне без Docker падения будут ожидаемыми и не связанными с новым кодом.

Ручной сценарий: зарегистрироваться (`POST /api/auth/register`), создать категорию,
создать по одной операции `INCOME` и `EXPENSE` в текущем месяце, проверить
`GET /api/transactions?type=EXPENSE&from=...&to=...` (фильтр + `total`/`page`/`limit`),
`GET /api/transactions/summary?month=..&year=..` (`balance = income − expense`,
`byCategory` содержит созданную категорию), `PATCH`, `DELETE` → 204 и повторный
`DELETE` → 404.
