# CLAUDE.md — apps/web

Контекст для Claude Code при работе с Next.js-фронтендом. Общая структура монорепо,
команды запуска, git-флоу, конвенции коммитов и устройство `packages/shared` —
в `CLAUDE.md` в корне монорепозитория, этот файл их не дублирует.

## Что нужно знать при правке apps/web

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

## Feature-Sliced Design

Функционал логина/регистрации (`entities/session`, `features/auth/login`,
`features/auth/register`, `shared/ui`) в `apps/web/src` написан по Feature-Sliced Design —
это первый FSD-код в проекте; главный экран (дашборд) и страницы
`(dashboard)/transactions|categories|stats` продолжают эту же архитектуру
(`entities/transaction`, `entities/category`, `features/auth/logout`,
`features/transactions/*`, `features/categories/*`, `widgets/app-header`,
`widgets/app-sidebar`, `widgets/dashboard-summary`, `widgets/transactions-list`,
`widgets/categories-list`, `widgets/stats-overview`). Остальной существующий код
(`src/lib/*`, `src/stores/ui-store.ts`)
FSD-слоями не является и **умышленно не мигрирован** — временное сосуществование двух
подходов, осознанный технический долг, а не недосмотр. При следующей доработке фронтенда
стоит постепенно перевести остальное на те же слои (`src/lib/api-client.ts`/`query-client.ts`
→ кандидаты в `shared/api`, `src/lib/utils.ts` → `shared/lib`, `src/stores/ui-store.ts` —
в `entities`/`features`/`widgets` по мере появления там реальной доменной логики).

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
  `transactionKeys` при успехе), `ui/create-transaction-form.tsx` (форменная Zod-схема
  `transactionFormSchema` из `entities/transaction/model/transaction-form-schema.ts`, общая
  с формой редактирования, не `createTransactionSchema` напрямую — `<input type="date">`
  отдаёт `YYYY-MM-DD`, а не полный ISO 8601; `categoryId` — сентинел `NO_CATEGORY`
  для пункта «Без категории»),
  `ui/create-transaction-dialog.tsx` (обёртка формы в `shared/ui/dialog`).
- `widgets/app-header` — поиск и меню профиля (`ui/user-menu.tsx`, аватар-инициалы +
  `LogoutMenuItem` из `features/auth/logout`); подключается один раз в
  `app/(dashboard)/layout.tsx`, общий для всех роутов группы.
- `widgets/app-sidebar` — навигация (`ui/sidebar-nav-links.tsx`, `usePathname` для
  подсветки активного пункта); подключается там же, в `app/(dashboard)/layout.tsx`.
- `widgets/transactions-list` — список транзакций на странице `/transactions`: пагинация —
  локальный `useState` (не Zustand и не URL — состояние используется только этим
  виджетом), `limit` фиксирован на `10` (бэкенд по умолчанию отдаёт `20`).
- `shared/ui` — примитивы shadcn/ui. `components.json#aliases.ui` указывает на
  `@/shared/ui` (было `@/components/ui`); `aliases.utils` не менялся и остаётся
  `@/lib/utils` — `cn()` не переезжает в FSD-слой вместе с UI-компонентами.
- Страницы `app/(auth)/login`, `app/(auth)/register`, `app/(dashboard)/page.tsx` —
  обычные файлы Next.js App Router (расположение диктуется файловой маршрутизацией
  Next, а не FSD), компонуют `Card`/виджеты из соответствующих FSD-слоёв.

`entities/session` также содержит `ui/auth-guard.tsx` (`AuthGuard`) — клиентский guard,
которым обёрнуты дети в `app/(dashboard)/layout.tsx`: он ждёт окончания гидратации
`persist`-стора (`useSessionStore.persist.hasHydrated()`/`onFinishHydration`, иначе на
первом рендере `accessToken` ещё `null` и авторизованных пользователей перекидывало бы
на `/login` при каждой перезагрузке) и, если после гидратации токена нет, делает
`router.replace('/login')`. Guard подписан на `accessToken` из стора, поэтому редирект
срабатывает и в момент истечения токена — `apiFetch` при первом же 401 от бэкенда
вызывает `clearSession()`, `accessToken` становится `null`, и `AuthGuard` тут же уводит
на `/login` (без ручного перехода, как было раньше). Границы, зафиксированные сознательно
и оставшиеся как есть: нет `middleware.ts` — guard клиентский, а не серверный (страницы
`(dashboard)/*` на сервере рендерятся всегда, редирект происходит уже в браузере); нет
редиректа уже авторизованных пользователей с `/login`/`/register`.
`lib/api-client.ts` подставляет `Authorization: Bearer <accessToken>` во все запросы,
читая токен через `useSessionStore.getState()` (не хук — синхронный доступ вне React-дерева);
это первый кросс-слойный импорт `lib/* → entities/*` в проекте, циклов не создаёт. На
сервере (RSC) `accessToken` всегда `null` (стор персистится в `localStorage`, которого
там нет) — поэтому все компоненты, читающие защищённые данные, явно `'use client'` и
используют TanStack Query в браузере. Кнопка выхода (`clearSession()` + редирект на
`/login`) есть — `features/auth/logout`, вызывается из `widgets/app-header`.
