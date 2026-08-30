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

## Коммиты

Conventional Commits, заголовок на русском в повелительном наклонении
(«добавить», «починить», а не «добавил» / «добавляет»), без точки в конце,
до 72 символов:

```
<тип>(<область>): <что сделано>

<почему так, а не иначе — если это не очевидно из диффа>
```

Типы: `feat` (новая функциональность), `fix` (исправление поведения),
`refactor` (поведение не меняется), `test`, `docs`, `chore` (сборка,
конфигурация, зависимости), `perf`.

Область — пакет, которого касается изменение: `api`, `web`, `shared`,
`config` (общие конфиги ESLint/TypeScript), `claude` (файлы `.claude/`).
Для изменений по всему монорепо область опускается.

Тело сообщения — не пересказ диффа, а причины: почему выбран этот подход,
какие альтернативы отпали и почему, какие границы задачи проведены сознательно.
Всё, что в этом файле описано как «зафиксировано намеренно», попало сюда
из таких тел коммитов. Список изменённых файлов в тело не выписывать —
он и так есть в самом коммите.

Один коммит — одна законченная единица работы, которая собирается и проходит
тесты сама по себе. Правки в чужом модуле, понадобившиеся ради текущей фичи
(например, новый запрос в `categories` ради `transactions`), едут вместе
с ней, а не отдельным коммитом «на будущее».

Перед коммитом: `pnpm lint && pnpm typecheck && pnpm test`, а при правках
в `apps/api` — ещё и `pnpm db:up && cd apps/api && pnpm test:e2e`.

## Git-флоу (GitHub Flow)

Основная ветка — `main`, всегда в деплоящемся состоянии. Прямые коммиты в `main`
не делаются — вся работа идёт через короткоживущие фича-ветки и Pull Request.

Именование веток — `<тип>/<краткое-описание-через-дефисы>` на английском, тип —
один из тех, что используются в Conventional Commits (`feature`, `fix`, `refactor`,
`chore`, `docs`), например: `feature/main-screen`, `fix/transactions-summary`.

Процесс:

1. Новая ветка создаётся от актуального `main` (`git checkout main && git pull &&
   git checkout -b feature/...`).
2. Работа и коммиты — по правилам из раздела «Коммиты» выше.
3. Ветка пушится в origin, открывается Pull Request в `main` через `gh pr create`.
4. Перед открытием PR — тот же чек-лист, что и перед коммитом
   (`pnpm lint && pnpm typecheck && pnpm test`, при правках в `apps/api` — ещё
   `pnpm test:e2e`).
5. Слияние — только через PR (Squash and merge или обычный merge, без
   `git push --force` в `main`), ветка после слияния удаляется.

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

## NestJS: что нужно знать при правке apps/api

**`@typescript-eslint/consistent-type-imports` отключено в `packages/eslint-config/nest.js`
и это осознанное решение, не трогать.** Nest резолвит зависимости конструктора через
`emitDecoratorMetadata` — компилятор кладёт в `design:paramtypes` реальный класс, только
если импорт не type-only. `import type X` на инжектируемом сервисе не ошибка компиляции,
но ломает DI в рантайме (Nest получит `Object` вместо класса, а не сам сервис). Общее
правило в `packages/eslint-config/base.js` этого не знает и будет чинить это неправильно
при `eslint --fix` — при добавлении новых конструкторов с DI в `apps/api` следить самому,
что импорты классов-зависимостей остаются value-импортами.

**Не использовать `class-validator`/`class-transformer` и Nest'овский `ValidationPipe`.**
Эти пакеты сознательно не установлены — валидация только через Zod. Nest'овский
`ValidationPipe` требует `class-validator` в рантайме независимо от того, используются
ли его декораторы, и роняет приложение при старте, если пакета нет.

**`nestjs-zod` не используется** — версия на момент создания проекта объявляет peer
`@nestjs/common ^10 || ^11` и с Nest 12 не ставится. Вместо неё — свой
`ZodValidationPipe` в `apps/api/src/common/pipes/zod-validation.pipe.ts`, применяется
точечно на `@Body()`/`@Query()`.

**Ошибки всех видов приводятся к общему формату** через `HttpExceptionFilter`
(`apps/api/src/common/filters/`), зарегистрированный глобально в `app.module.ts` —
`{ statusCode, message, errors?, timestamp, path }`, схема — `apiErrorSchema` в shared.

**Prisma 7 (важное отличие от Prisma 5/6):** датасорс в `schema.prisma` не содержит `url`.
Строка подключения для CLI (`migrate`, `studio`) задаётся в `apps/api/prisma.config.ts`,
рантайм-клиент получает её через драйвер-адаптер `@prisma/adapter-pg`, собираемый в
конструкторе `PrismaService` (`apps/api/src/prisma/prisma.service.ts`) из `ConfigService`.
Prisma CLI больше не грузит `.env` автоматически — `prisma.config.ts` делает это сам
через `dotenv`, читая общий `.env` из корня монорепо. Генерируемый клиент лежит в
`apps/api/src/generated/prisma` (внутри `rootDir`, иначе `nest build` его не подхватит) —
после смены `prisma/schema.prisma` пересоздать через `pnpm db:generate`.

**Авторизация — JWT, гвард глобальный.** `JwtAuthGuard` подключён в `app.module.ts` через
`APP_GUARD` и закрывает все маршруты по умолчанию; публичные (`/auth/register`,
`/auth/login`, `/health`) помечены декоратором `@Public()`. Идентификатор пользователя
достаётся декоратором `@CurrentUser()`/`@CurrentUser('id')` из `req.user`, куда его кладёт
`JwtStrategy.validate`. Подробности маршрутов — в `apps/api/src/auth/README.md`.

**Межмодульное взаимодействие — через CQRS (`@nestjs/cqrs`).** Модуль `users` хранит
репозиторий (`UsersRepository`, единственное место, обращающееся к Prisma) и сервис
(`UsersService`), но не экспортирует их — наружу видны только классы команд/запросов/событий
(`CreateUserCommand`, `GetUserByIdQuery`, `GetUserCredentialsByEmailQuery`,
`UserRegisteredEvent`). `AuthService` берёт пользователя не через прямой импорт сервиса,
а через `CommandBus`/`QueryBus`. `CqrsModule.forRoot()` вызывается **ровно один раз**, в
`app.module.ts` — он `global: true`, и повторный вызов в другом модуле завёл бы вторую шину,
из-за которой команды перестали бы находить свои хендлеры. Модуль `categories` переведён
на тот же паттерн (`CategoriesRepository` + `CategoriesService` не экспортируются, наружу —
`CreateCategoryCommand`/`UpdateCategoryCommand`/`DeleteCategoryCommand`/`GetCategoriesQuery`/
`GetCategoryByIdQuery`). Домен `transactions` устроен так же
(`TransactionsRepository` + `TransactionsService` не экспортируются, наружу —
`CreateTransactionCommand`/`UpdateTransactionCommand`/`DeleteTransactionCommand`/
`GetTransactionsQuery`/`GetTransactionQuery`/`GetTransactionsSummaryQuery`).

`TransactionsService` — первый потребитель чужого модуля по этой шине: перед записью
операции он проверяет `categoryId` через `GetCategoryByIdQuery` (отдаёт `null`, а не 404 —
решение принимает вызывающая сторона), а для сводки берёт названия категорий через
`GetCategoriesQuery`. Прямого импорта `CategoriesService` нет и быть не должно.

Переменные окружения валидируются один раз на старте через Zod-схему
(`apps/api/src/config/env.schema.ts`), подключённую в `ConfigModule.forRoot({ validate })` —
ошибка в `.env` роняет процесс сразу, а не всплывает посреди запроса.

## Next.js: что нужно знать при правке apps/web

`pnpm typecheck` в `apps/web` — это `next typegen && tsc --noEmit`, не просто `tsc`.
Типы `LayoutProps<'/'>` и подобные генерируются Next-ом в `.next/types/`, их не существует
до первого `next dev`/`next build`/`next typegen` — `tsc --noEmit` в одиночку падает
с `Cannot find name 'LayoutProps'`.

`next.config.ts` должен оставаться обычным CJS-совместимым TS-файлом без `import.meta` —
использование `import.meta.url` (например, для ручного вычисления `outputFileTracingRoot`)
заставляет компилятор конфига Next завернуть его в ESM-бандл, который падает с
`ReferenceError: exports is not defined`. Next и так корректно определяет корень монорепо
по `pnpm-lock.yaml` в корне — вручную это переопределять не нужно.

`settings.react.version` в `packages/eslint-config/next.js` зафиксирован явно
(`'19.2.8'`), а не `'detect'` — на ESLint 10 автоопределение версии React в
`eslint-plugin-react@7.37.5` падает (`contextOrFilename.getFilename is not a function`,
метод убран из API ESLint 10, а не просто устарел). Не менять на `'detect'`.

Конфиг vitest — `vitest.config.mts` (не `.ts`): расширение `.mts` нужно, чтобы Vite
однозначно грузил файл как ESM, не полагаясь на угадывание по содержимому.

shadcn/ui настроен (`components.json`, `src/lib/utils.ts` с хелпером `cn`); компоненты
`button`/`input`/`label`/`form`/`card` уже добавлены в `src/shared/ui` — новые добавлять
через `pnpm dlx shadcn add <component>` (алиас `ui` в `components.json` указывает на
`@/shared/ui`, см. раздел про FSD ниже).

## Frontend: Feature-Sliced Design

Функционал логина/регистрации (`entities/session`, `features/auth/login`,
`features/auth/register`, `shared/ui`) в `apps/web/src` написан по Feature-Sliced Design —
это первый FSD-код в проекте; главный экран (дашборд) продолжает эту же архитектуру
(`entities/transaction`, `entities/category`, `features/auth/logout`,
`features/transactions/create-transaction`, `widgets/app-header`,
`widgets/transactions-list`). Остальной существующий код
(`src/lib/*`, `src/stores/ui-store.ts`, страницы `(dashboard)/transactions|categories|stats`)
FSD-слоями не является и **умышленно не мигрирован** — временное сосуществование двух
подходов, осознанный технический долг, а не недосмотр. При следующей доработке фронтенда
стоит постепенно перевести остальное на те же слои (`src/lib/api-client.ts`/`query-client.ts`
→ кандидаты в `shared/api`, `src/lib/utils.ts` → `shared/lib`, `src/stores/ui-store.ts` и
оставшиеся страницы `(dashboard)/*` — в `entities`/`features`/`widgets` по мере появления
там реальной доменной логики).

Расположение нового кода:

- `entities/session` — `useSessionStore` (Zustand + `persist`, ключ `auth-session` в
  `localStorage`): `accessToken`, `user`, `setSession`, `clearSession`. Наружу слой отдаёт
  только сам хук — типы `AuthResponse`/`UserResponse` потребители берут напрямую из
  `@expense-tracker/shared`.
- `entities/transaction` — `model/use-transactions.ts` (`useQuery` + `keepPreviousData`
  для пагинации без мигания), `model/query-keys.ts` (`transactionKeys`),
  `lib/format-transaction.ts` (знак/цвет суммы — только по `type`, не по знаку в строке
  `amount`; дата — через `Intl.DateTimeFormat`, без сторонних date-библиотек),
  `ui/transaction-row.tsx`.
- `entities/category` — `model/use-categories.ts` (`useQuery` без пагинации — бэкенд
  отдаёт весь список сразу). `TransactionResponse` не содержит вложенной категории, только
  `categoryId` — join с именем категории делается на клиенте.
- `features/auth/login`, `features/auth/register`, `features/auth/logout` — каждый:
  `model/` (хук на `useMutation` для `login`/`register`, на `useRouter`+`clearSession`
  для `logout`) и `ui/` (форма или, для `logout`, пункт `DropdownMenuItem`).
- `features/transactions/create-transaction` — диалог добавления операции с главного
  экрана: `model/use-create-transaction.ts` (`useMutation`, инвалидирует
  `transactionKeys` при успехе), `ui/create-transaction-form.tsx` (своя Zod-схема формы,
  не `createTransactionSchema` напрямую — `<input type="date">` отдаёт `YYYY-MM-DD`, а
  не полный ISO 8601; `categoryId` — сентинел `NO_CATEGORY` для пункта «Без категории»),
  `ui/create-transaction-dialog.tsx` (обёртка формы в `shared/ui/dialog`).
- `widgets/app-header` — навигация (`ui/nav-links.tsx`, `usePathname` для подсветки
  активного пункта) + меню профиля (`ui/user-menu.tsx`, аватар-инициалы +
  `LogoutMenuItem` из `features/auth/logout`); подключается один раз в
  `app/(dashboard)/layout.tsx`, общий для всех роутов группы.
- `widgets/transactions-list` — список транзакций на главном экране: пагинация —
  локальный `useState` (не Zustand и не URL — состояние используется только этим
  виджетом), `limit` фиксирован на `10` (бэкенд по умолчанию отдаёт `20`).
- `shared/ui` — примитивы shadcn/ui. `components.json#aliases.ui` указывает на
  `@/shared/ui` (было `@/components/ui`); `aliases.utils` не менялся и остаётся
  `@/lib/utils` — `cn()` не переезжает в FSD-слой вместе с UI-компонентами.
- Страницы `app/(auth)/login`, `app/(auth)/register`, `app/(dashboard)/page.tsx` —
  обычные файлы Next.js App Router (расположение диктуется файловой маршрутизацией
  Next, а не FSD), компонуют `Card`/виджеты из соответствующих FSD-слоёв.

Границы охвата сессии, зафиксированные сознательно: нет `middleware.ts`/guard,
защищающего `(dashboard)/*` роуты по наличию токена (при заходе без токена страницы
рендерятся, но запросы к API вернут 401); нет редиректа уже авторизованных пользователей
с `/login`/`/register`. Токен — только access (15 минут, `JWT_EXPIRES_IN`, без refresh) —
по его истечении `apiFetch` при первом же 401 от бэкенда сбрасывает сессию
(`clearSession()`), после чего `widgets/app-header` показывает анонимному пользователю
ссылку «Войти» вместо меню профиля; автоматического редиректа на `/login` в момент
истечения токена нет — только доступный путь для ручного перехода.
`lib/api-client.ts` подставляет `Authorization: Bearer <accessToken>` во все запросы,
читая токен через `useSessionStore.getState()` (не хук — синхронный доступ вне React-дерева);
это первый кросс-слойный импорт `lib/* → entities/*` в проекте, циклов не создаёт. На
сервере (RSC) `accessToken` всегда `null` (стор персистится в `localStorage`, которого
там нет) — поэтому все компоненты, читающие защищённые данные, явно `'use client'` и
используют TanStack Query в браузере. Кнопка выхода (`clearSession()` + редирект на
`/login`) есть — `features/auth/logout`, вызывается из `widgets/app-header`.

## Три версии, зафиксированные намеренно

Не обновлять их не глядя без проверки — каждая закреплена по конкретной причине,
актуальной на момент создания проекта:

1. **Prisma — ровно `7.10.0`, без каретки** (в `apps/api/package.json`, оба —
   `prisma` и `@prisma/client`). Тег `latest` в npm тогда указывал на `8.0.0-rc` —
   обычная установка затащила бы release candidate.
2. **TypeScript — `~6.0.3`, не 7.x** (везде в монорепо). `@nestjs/cli@12` тянет
   `typescript ~6.0.2`, а `typescript-eslint@8` объявляет peer `typescript <6.1.0`.
   На TS 7 линтер и сборка Nest разъедутся.
3. **`nestjs-zod` не используется** — см. раздел про NestJS выше.

## pnpm-specific

`pnpm-workspace.yaml` содержит `allowBuilds` — pnpm 11 по умолчанию блокирует
postinstall-скрипты новых зависимостей. При добавлении пакета с build-скриптом
pnpm откажется его выполнять, пока в `allowBuilds` не появится явный `true`/`false`
для этого пакета (или `pnpm approve-builds`). `@scarf/scarf` (телеметрия, транзитивная
через `swagger-ui-dist`) намеренно `false`.
