# Категории трат: реализация модуля `categories`

## Context

Авторизация уже работает (JWT, глобальный `JwtAuthGuard`, `@CurrentUser()`), и следующий
доменный блок — категории трат. Часть работы в репозитории уже сделана заранее:

- **Сущность уже существует.** Модель `Category` описана в `apps/api/prisma/schema.prisma`
  (`id`, `userId`, `name`, `type`, `icon?`, `color?`, `createdAt`, `updatedAt`), FK на `users`
  с `onDelete: Cascade`, `@@unique([userId, name])`, `@@index([userId])`. Таблица `categories`
  уже создана применённой миграцией `20260828135645_init` — **новая миграция не нужна**.
- **Контракты уже описаны** в `packages/shared/src/schemas/category.schema.ts`
  (`createCategorySchema`, `updateCategorySchema`, `categoryResponseSchema`).
- **Контроллер уже написан** (`apps/api/src/categories/categories.controller.ts`) и закрыт
  глобальным гвардом — e2e-тест `apps/api/test/auth.e2e-spec.ts` уже проверяет, что
  `GET /api/categories` без токена отвечает 401.

Не реализован только доменный слой: `CategoriesService` — заглушка, все методы бросают
`NotFoundException('Ещё не реализовано')`, репозитория нет вовсе.

Цель: довести модуль до рабочего состояния — CRUD категорий, строго изолированных по
пользователю, по тому же паттерну, что и `users` (репозиторий → сервис → CQRS-шина).

### Два решения, принятых до начала работы

1. **Валидация остаётся на Zod, `class-validator` не вводится.** Пакет намеренно не
   установлен (см. CLAUDE.md): Nest'овский `ValidationPipe` требует его в рантайме и роняет
   приложение на старте. Роль «класса-валидатора» здесь выполняет `ZodValidationPipe`
   (`apps/api/src/common/pipes/zod-validation.pipe.ts`), применяемый точечно на
   `@Body()`/`@Param()`, а схемы живут в `packages/shared` — один контракт на web и api.
2. **Модуль переводится на CQRS полностью**, как `users`: наружу видны только классы
   команд/запросов, `CategoriesService` и `CategoriesRepository` не экспортируются.

---

## 1. Контракт (`packages/shared/src/schemas/category.schema.ts`)

Схемы почти готовы, две правки:

- `updateCategorySchema`: к `createCategorySchema.partial()` добавить
  `.refine((dto) => Object.keys(dto).length > 0, 'Нужно передать хотя бы одно поле')` —
  иначе `PATCH` с пустым телом проходит валидацию и вырождается в бессмысленный UPDATE.
- Разрешить сброс необязательных полей: в схеме обновления `icon` и `color` должны
  принимать `null` (`.nullable().optional()`), чтобы иконку/цвет можно было очистить.
  В `createCategorySchema` оставить как есть.

Поле `type` (`INCOME`/`EXPENSE`) в модели обязательное и уже есть в контракте — сохраняем,
хотя в постановке оно не упоминалось: колонка в БД `NOT NULL`.

Для валидации `:id` ничего добавлять не нужно — в shared уже есть `idSchema` (`z.uuid()`)
в `packages/shared/src/common.ts`.

## 2. Доступ к данным

**`apps/api/src/categories/categories.repository.ts`** (новый) — единственное место модуля,
обращающееся к Prisma; по образцу `apps/api/src/users/users.repository.ts` возвращает сырые
модели Prisma, маппинг делает сервис. `PrismaModule` глобальный, импортировать не нужно.

Методы (все принимают `userId` — изоляция по пользователю обеспечивается на уровне запроса,
а не проверкой после выборки):

- `findManyByUser(userId)` → `prisma.category.findMany({ where: { userId }, orderBy: { name: 'asc' } })`
- `findByIdForUser(id, userId)` → `findFirst({ where: { id, userId } })`
- `create(data: { userId; name; type; icon?; color? })`
- `update(id, userId, data)` → `updateMany({ where: { id, userId }, data })` + повторное чтение,
  либо `update({ where: { id } })` после проверки владения через `findByIdForUser`
  (второй вариант проще и достаточен — гонка правок собственной категории не критична)
- `remove(id, userId)` → `deleteMany({ where: { id, userId } })`, вернуть `count`

Важно: `where: { id }` без `userId` использовать нельзя нигде — иначе чужая категория
станет доступна по прямому UUID.

**`apps/api/src/categories/category.mapper.ts`** (новый) — `toCategoryResponse(category): CategoryResponse`
по образцу `apps/api/src/users/user.mapper.ts`: явно перечисляет поля, `createdAt`/`updatedAt`
через `.toISOString()`, `userId` наружу не отдаётся.

## 3. Доменный слой (`apps/api/src/categories/categories.service.ts`)

Заменить заглушки реальной логикой (образец — `apps/api/src/users/users.service.ts`):

- `findAll(userId)` → список, маппинг через `toCategoryResponse`.
- `create(userId, dto)` → создание; нарушение `@@unique([userId, name])` ловится по коду
  Prisma `P2002` (`Prisma.PrismaClientKnownRequestError`) и превращается в
  `ConflictException('Категория с таким названием уже существует')`. Константу
  `UNIQUE_CONSTRAINT_VIOLATION = 'P2002'` в `users.service.ts` не переиспользуем через импорт
  (она приватная для модуля) — объявить локально, как там.
- `update(userId, id, dto)` → проверка существования через `findByIdForUser`, иначе
  `NotFoundException('Категория не найдена')`; тот же перехват `P2002` при переименовании.
- `remove(userId, id)` → `deleteMany`, при `count === 0` — `NotFoundException`.

Отсутствие чужой категории и отсутствие своей дают одинаковый 404 — существование чужих
записей наружу не подтверждается.

## 4. CQRS-обвязка

По образцу `apps/api/src/users/{commands,queries}`. Команды наследуют `Command<T>`, запросы —
`Query<T>` из `@nestjs/cqrs`, хендлеры дёргают `CategoriesService`.

```
apps/api/src/categories/
  commands/
    create-category.command.ts / .handler.ts
    update-category.command.ts / .handler.ts
    delete-category.command.ts / .handler.ts
    index.ts        // CategoryCommandHandlers + реэкспорт классов команд
  queries/
    get-categories.query.ts / .handler.ts
    index.ts        // CategoryQueryHandlers + реэкспорт
```

Событий (по аналогии с `UserRegisteredEvent`) на этом этапе не заводим — подписчиков нет.

**`categories.module.ts`**: провайдеры — `CategoriesService`, `CategoriesRepository`,
`...CategoryCommandHandlers`, `...CategoryQueryHandlers`; **`exports` убрать** (сейчас
экспортируется `CategoriesService`) — публичный контракт модуля это классы команд/запросов.
`CqrsModule.forRoot()` здесь **не вызывать**: он уже вызван ровно один раз в `app.module.ts`
и глобален; второй вызов завёл бы вторую шину, и хендлеры перестали бы находиться.

**Осторожно с DI-импортами**: правило `consistent-type-imports` в `apps/api` отключено
намеренно, но `eslint --fix` общего правила может испортить импорты. `CategoriesService`,
`CategoriesRepository`, `PrismaService`, `CommandBus`, `QueryBus` в конструкторах — только
value-импорты (`import { X } from ...`), не `import type`.

## 5. Контроллер (`apps/api/src/categories/categories.controller.ts`)

Переписать на шину, сохранив маршруты:

| Метод | Путь | Действие |
|---|---|---|
| `GET` | `/api/categories` | `queryBus.execute(new GetCategoriesQuery(userId))` |
| `POST` | `/api/categories` | `commandBus.execute(new CreateCategoryCommand(userId, dto))` → 201 |
| `PATCH` | `/api/categories/:id` | `UpdateCategoryCommand` |
| `DELETE` | `/api/categories/:id` | `DeleteCategoryCommand`, `@HttpCode(HttpStatus.NO_CONTENT)` |

Дополнительно к тому, что уже есть:

- `@Param('id', new ZodValidationPipe(idSchema))` — сейчас `:id` не валидируется, и
  невалидный UUID уходит в Prisma и всплывает как 500 вместо 400.
- `@ApiBearerAuth()`/`@ApiTags('categories')` уже стоят на классе; `@Public()` не ставить —
  глобальный `JwtAuthGuard` закрывает все маршруты, это и есть требуемая защита.
- `@ApiOperation`/`@ApiResponse` для читаемого Swagger на `:3001/api/docs`.

## 6. Тесты

- **`apps/api/src/categories/categories.service.spec.ts`** (новый, unit, без БД) — по образцу
  `apps/api/src/users/users.service.spec.ts`: репозиторий — `vi.fn()`-моки, фабрика
  `buildCategory()`. Кейсы: список маппится в `CategoryResponse` без `userId`; `P2002` при
  создании → `ConflictException`; `update`/`remove` несуществующей или чужой категории →
  `NotFoundException`; `remove` при `count === 0` → `NotFoundException`.
- **`apps/api/test/categories.e2e-spec.ts`** (новый) — по образцу `auth.e2e-spec.ts`:
  регистрация пользователя в `beforeAll` → токен → полный цикл create → findAll → update →
  delete → повторный delete даёт 404. Отдельно: 401 без токена, 400 на невалидном теле и
  на невалидном `:id`, 409 на дубле имени, и **изоляция**: второй пользователь не видит и не
  может удалить категорию первого (404).

## 7. Документация

В `CLAUDE.md` обновить раздел про CQRS: сейчас там сказано, что «домены `categories`/`transactions`
на этот паттерн пока не переведены, их сервисы остаются заглушками» — после этой работы
заглушкой остаются только `transactions`.

---

## Проверка

```bash
# статика и unit-тесты (БД не нужна)
pnpm --filter @expense-tracker/api typecheck
pnpm --filter @expense-tracker/api lint
cd apps/api && pnpm exec vitest run --config ./vitest.config.ts src/categories/categories.service.spec.ts

# e2e — требуют поднятой БД
pnpm db:up
cd apps/api && pnpm test:e2e

# сборка контракта + всего монорепо
pnpm build
```

Ручная проверка через Swagger `http://localhost:3001/api/docs` после `pnpm dev`:
`POST /api/auth/register` → скопировать `accessToken` в Authorize → `POST /api/categories`
с `{ "name": "Продукты", "type": "EXPENSE", "color": "#ff8800", "icon": "cart" }` →
`GET /api/categories` → `PATCH` → `DELETE` (204) → повторный `DELETE` (404).

Миграции не запускаются: схема БД не меняется.

---

## Чек-лист реализации

### Контракт

- [ ] `packages/shared/src/schemas/category.schema.ts`: `updateCategorySchema` — добавить
      `.refine()` на непустое тело
- [ ] Там же: разрешить `null` для `icon` и `color` в схеме обновления (сброс значения)
- [ ] Пересобрать пакет (`pnpm --filter @expense-tracker/shared build`) или положиться на
      watch-режим `pnpm dev`

### Доступ к данным

- [ ] Создать `apps/api/src/categories/categories.repository.ts` — `CategoriesRepository`
      с `findManyByUser`, `findByIdForUser`, `create`, `update`, `remove`
- [ ] Убедиться, что ни в одном запросе нет `where: { id }` без `userId`
- [ ] Создать `apps/api/src/categories/category.mapper.ts` — `toCategoryResponse()`,
      `userId` наружу не отдаётся, даты через `.toISOString()`

### Доменный слой

- [ ] Переписать `apps/api/src/categories/categories.service.ts`: `findAll`, `create`,
      `update`, `remove` вместо заглушек
- [ ] `P2002` → `ConflictException` в `create` и `update` (локальная константа
      `UNIQUE_CONSTRAINT_VIOLATION`)
- [ ] Ненайденная / чужая категория → одинаковый `NotFoundException`

### CQRS

- [ ] `commands/create-category.command.ts` + `.handler.ts`
- [ ] `commands/update-category.command.ts` + `.handler.ts`
- [ ] `commands/delete-category.command.ts` + `.handler.ts`
- [ ] `commands/index.ts` — `CategoryCommandHandlers` + реэкспорт классов команд
- [ ] `queries/get-categories.query.ts` + `.handler.ts`, `queries/index.ts`
- [ ] `categories.module.ts`: провайдеры сервис + репозиторий + хендлеры, **`exports` удалить**
- [ ] Проверить, что `CqrsModule.forRoot()` в модуле **не** вызывается
- [ ] Проверить, что все зависимости конструкторов импортированы как value-импорты
      (не `import type`) — иначе DI сломается в рантайме

### Контроллер

- [ ] `categories.controller.ts` переведён на `CommandBus`/`QueryBus`
- [ ] `@Param('id', new ZodValidationPipe(idSchema))` на `PATCH` и `DELETE`
- [ ] `@HttpCode(HttpStatus.NO_CONTENT)` на `DELETE`
- [ ] `@ApiOperation` / `@ApiResponse` для Swagger; `@Public()` нигде не добавлен

### Тесты

- [ ] `apps/api/src/categories/categories.service.spec.ts` — unit-тесты на моках репозитория
      (маппинг, 409 на дубле, 404 на чужой/несуществующей)
- [ ] `apps/api/test/categories.e2e-spec.ts` — цикл CRUD, 401/400/409/404 и изоляция
      между двумя пользователями

### Финальные проверки

- [ ] `pnpm --filter @expense-tracker/api typecheck`
- [ ] `pnpm --filter @expense-tracker/api lint`
- [ ] `pnpm --filter @expense-tracker/api test`
- [ ] `pnpm db:up` + `cd apps/api && pnpm test:e2e`
- [ ] `pnpm build`
- [ ] Ручной прогон в Swagger `:3001/api/docs`
- [ ] Обновить раздел про CQRS в `CLAUDE.md` (заглушкой остаётся только `transactions`)
