# API — детальное описание

Базовый URL: `http://localhost:3001/api` (глобальный префикс `api`,
`app.setGlobalPrefix('api')` в `apps/api/src/main.ts`). Интерактивная
Swagger-документация — `/api/docs` после запуска `apps/api`
(`SwaggerModule.setup`, схема собирается из `@ApiOperation`/`@ApiResponse`
на контроллерах).

Все маршруты, кроме помеченных **public**, требуют заголовок
`Authorization: Bearer <accessToken>`. Guard — `JwtAuthGuard`, подключён
глобально через `APP_GUARD`; исключения — маршруты с декоратором
`@Public()`.

## Формат ошибок

Единый для всего API, формируется `HttpExceptionFilter`
(`apps/api/src/common/filters/http-exception.filter.ts`), схема —
`apiErrorSchema` в `packages/shared`:

```jsonc
{
  "statusCode": 400,
  "message": "Ошибка валидации",
  "errors": { /* только для ошибок ZodValidationPipe: дерево из z.treeifyError */ },
  "timestamp": "2026-08-30T12:00:00.000Z",
  "path": "/api/transactions"
}
```

`errors` присутствует только когда исключение (`BadRequestException`) несёт
это поле в теле — сейчас единственный источник таких ошибок:
`ZodValidationPipe`. Ошибки 5xx дополнительно логируются на сервере со
стек-трейсом, наружу уходит только `"Внутренняя ошибка сервера"`.

Валидация переменных окружения (`envSchema`,
`apps/api/src/config/env.schema.ts`) — не HTTP-слой: некорректный `.env`
роняет процесс на старте, до приёма любых запросов.

## Валидация запросов

Тело/query/param каждого маршрута валидируется вручную через
`ZodValidationPipe(<schema>)` на конкретном параметре — глобального
`ValidationPipe` в проекте нет (см. `architecture.md`). Схемы — из
`@expense-tracker/shared`, они же определяют TypeScript-тип DTO через
`z.infer`.

---

## `auth`

Контроллер: `apps/api/src/auth/auth.controller.ts`. Подробный поток —
`apps/api/src/auth/README.md`.

### `POST /api/auth/register` — public

Регистрация нового пользователя.

- **Тело** (`registerSchema`):
  ```ts
  { email: string; password: string /* 8-128 симв. */; name: string /* 1-100, trim */ }
  ```
- **Ответ `201`** (`authResponseSchema`):
  ```ts
  { accessToken: string; user: { id, email, name, createdAt } }
  ```
- **Ошибки**: `400` невалидное тело; `409` email уже зарегистрирован
  (`ConflictException` из `UsersService.create`, дублирует уникальный индекс
  `users.email`).
- **Логика**: пароль хешируется `argon2.hash(..., { type: argon2.argon2id })`
  в `AuthService.register`, создание пользователя идёт через
  `CreateUserCommand` (CQRS, модуль `users`), затем сразу выдаётся токен.

### `POST /api/auth/login` — public

- **Тело** (`loginSchema`): `{ email: string; password: string }`.
- **Ответ `200`** (не `201` — вход ничего не создаёт): тот же
  `authResponseSchema`, что и у `register`.
- **Ошибки**: `401` — и при отсутствующем email, и при неверном пароле,
  **сообщение одинаковое** («Неверный email или пароль») — намеренно, чтобы
  по коду/тексту ответа нельзя было перебором узнать зарегистрированные
  адреса.
- **Логика**: пользователь + `passwordHash` берутся через
  `GetUserCredentialsByEmailQuery`, пароль проверяется `argon2.verify`.

### `GET /api/auth/me`

Требует `Bearer`-токен.

- **Ответ `200`** (`userResponseSchema`): `{ id, email, name, createdAt }`.
- **Ошибки**: `401` без валидного токена; `404` если пользователь из токена
  уже удалён из БД (крайне маловероятно на практике — `JwtStrategy.validate`
  уже делает такую проверку и сам вернул бы `401` раньше).

### JWT payload

`{ sub: string /* userId */, email: string }`, подписывается
`JWT_SECRET`/`JWT_EXPIRES_IN` (по умолчанию `15m`). Refresh-токена нет —
по истечении access-токена клиенту нужно логиниться заново.

---

## `categories`

Контроллер: `apps/api/src/categories/categories.controller.ts`. Все
маршруты требуют `Bearer`-токен, все операции — в границах текущего
пользователя (`userId` из `@CurrentUser('id')`).

### `GET /api/categories`

- **Ответ `200`**: `CategoryResponse[]`, отсортирован по `name` (`asc`).
- Возвращает только категории текущего пользователя.

### `POST /api/categories`

- **Тело** (`createCategorySchema`):
  ```ts
  {
    name: string;      // 1-50, trim
    type: 'INCOME' | 'EXPENSE';
    icon?: string;     // до 50 символов
    color?: string;    // HEX вида #RRGGBB
  }
  ```
- **Ответ `201`** (`categoryResponseSchema`):
  `{ id, name, type, icon, color, createdAt, updatedAt }`.
- **Ошибки**: `400` невалидное тело; `409` — категория с таким `name` уже
  есть у этого пользователя (уникальный индекс `[userId, name]`, ловится в
  `CategoriesService.mapUniqueConstraintError` по коду Prisma `P2002`).

### `PATCH /api/categories/:id`

- **Тело** (`updateCategorySchema`) — любое подмножество полей, но не
  пустое (`.refine` требует хотя бы один ключ):
  ```ts
  {
    name?: string;
    type?: 'INCOME' | 'EXPENSE';
    icon?: string | null;   // null явно очищает поле
    color?: string | null;  // null явно очищает поле
  }
  ```
- **Ответ `200`**: обновлённая `CategoryResponse`.
- **Ошибки**: `400` пустое тело или невалидные поля; `404` категория не
  найдена у этого пользователя; `409` конфликт по `[userId, name]`.

### `DELETE /api/categories/:id`

- **Ответ `204`**, тела нет.
- **Ошибки**: `404` категория не найдена у этого пользователя.
- **Побочный эффект**: у всех операций (`transactions`), ссылавшихся на эту
  категорию, `categoryId` становится `null` (FK `onDelete: SetNull`) —
  операции не удаляются вместе с категорией.

---

## `transactions`

Контроллер: `apps/api/src/transactions/transactions.controller.ts`. Все
маршруты требуют `Bearer`-токен, все операции — в границах текущего
пользователя.

> Маршрут `GET /summary` объявлен **до** `GET /:id` в контроллере
> намеренно: Nest матчит маршруты по порядку объявления, иначе строка
> `'summary'` попала бы в параметр `:id` и не прошла бы `idSchema`.

### `GET /api/transactions`

Список операций с пагинацией и фильтрами.

- **Query** (`transactionQuerySchema`, всё опционально кроме пагинации):
  ```ts
  {
    page?: number;       // default 1
    limit?: number;      // default 20, max 100
    from?: string;        // ISO 8601, включительно
    to?: string;          // ISO 8601, включительно
    type?: 'INCOME' | 'EXPENSE';
    categoryId?: string;  // UUID
  }
  ```
- **Ответ `200`** (`Paginated<TransactionResponse>`):
  ```ts
  { items: TransactionResponse[]; total: number; page: number; limit: number }
  ```
- Сортировка — `date desc, createdAt desc`. `items`/`total` считаются одним
  `$transaction` (findMany + count), чтобы между ними не могла вклиниться
  запись, из-за которой `total` разошёлся бы со страницей.

### `GET /api/transactions/summary`

Агрегация за календарный месяц.

- **Query** (`transactionSummaryQuerySchema`) — оба поля **обязательны**,
  значений по умолчанию нет:
  ```ts
  { month: number /* 1-12 */; year: number /* 1970-2100 */ }
  ```
- **Ответ `200`** (`TransactionSummary`):
  ```ts
  {
    month: number;
    year: number;
    income: string;   // сумма всех INCOME за месяц
    expense: string;  // сумма всех EXPENSE за месяц
    balance: string;  // income - expense
    byCategory: Array<{
      categoryId: string | null;   // null — операции без категории
      categoryName: string | null;
      type: 'INCOME' | 'EXPENSE';
      total: string;
    }>; // отсортировано по total desc
  }
  ```
- Границы месяца считаются в UTC (`Date.UTC(year, month-1, 1)` …
  `Date.UTC(year, month, 1)`, полуинтервал `[from, to)`) — колонка `date` в
  БД `Timestamptz(3)`, локальная зона процесса Node не должна сдвигать
  месяц.
- Валюта в агрегации не разделяется — суммируются все операции пользователя
  за период независимо от `currency` (мультивалютный сплит не реализован).

### `GET /api/transactions/:id`

- **Ответ `200`**: `TransactionResponse`.
- **Ошибки**: `400` невалидный UUID; `404` операция не найдена у этого
  пользователя.

### `POST /api/transactions`

- **Тело** (`createTransactionSchema`):
  ```ts
  {
    amount: string;       // "-?\d{1,10}(\.\d{1,2})?", не "0"
    currency?: 'USD'|'EUR'|'RUB'|'GEL'|'KZT'; // default 'USD'
    type: 'INCOME' | 'EXPENSE';
    date: string;          // ISO 8601
    categoryId?: string;   // UUID, должен принадлежать текущему пользователю
    note?: string;          // до 500 символов
  }
  ```
- **Ответ `201`**: созданная `TransactionResponse`.
- **Ошибки**: `400` невалидное тело; `404` `categoryId` передан, но такой
  категории нет у пользователя (`assertCategoryBelongsToUser` в
  `TransactionsService` — обращается к `categories` через
  `GetCategoryByIdQuery`, а не напрямую).

### `PATCH /api/transactions/:id`

- **Тело** (`updateTransactionSchema`) — непустое подмножество полей:
  ```ts
  {
    amount?: string;
    currency?: 'USD'|'EUR'|'RUB'|'GEL'|'KZT'; // без default — не передали, не меняем
    type?: 'INCOME' | 'EXPENSE';
    date?: string;
    categoryId?: string | null;  // null снимает категорию
    note?: string | null;         // null очищает заметку
  }
  ```
- **Ответ `200`**: обновлённая `TransactionResponse`.
- **Ошибки**: `400` пустое тело/невалидные поля; `404` операция не найдена,
  либо новый `categoryId` не принадлежит пользователю.

### `DELETE /api/transactions/:id`

- **Ответ `204`**, тела нет.
- **Ошибки**: `404` операция не найдена у этого пользователя.

---

## `health`

### `GET /api/health` — public

- **Ответ `200`**: `{ status: 'ok', timestamp: string }`. Без проверки
  реального подключения к БД — просто living-probe процесса Nest.

---

## Заголовки и CORS

`app.enableCors({ origin: CORS_ORIGIN, credentials: true })` — один
разрешённый origin из `.env` (по умолчанию `http://localhost:3000`). Тело
запроса и ответа — `application/json`; `api-client.ts` на фронте всегда
ставит `Content-Type: application/json`.
