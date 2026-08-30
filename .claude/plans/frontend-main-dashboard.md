# Главный экран (dashboard): меню, профиль, список транзакций с пагинацией

## Контекст

Ветка `feature/main-screen` уже создана от `main`. Нужно реализовать главный экран
трекера расходов: навигационное меню, профиль пользователя (с выходом из аккаунта)
и список транзакций с пагинацией по 10 штук на странице.

Бэкенд (`transactions`, `categories`, `auth`) уже полностью реализован на CQRS —
вопреки устаревшей фразе о заглушках в начале `CLAUDE.md` (git log: `feat(api):
реализовать модуль транзакций`, `добавить модуль категорий`, `добавить JWT-авторизацию`).
Но фронтенд пока не может ничего реально загрузить: `apiFetch` в `lib/api-client.ts`
не подставляет `Authorization: Bearer <token>`, а все нужные роуты (`GET /transactions`,
`GET /categories`) защищены глобальным `JwtAuthGuard`. Это заблокировало бы фичу
целиком, поэтому точечное добавление заголовка входит в объём задачи (подтверждено
пользователем), а не откладывается как в `CLAUDE.md` про «следующую задачу».

Также обнаружен независимый, но блокирующий фичу баг: `globals.css` объявляет только
`--background`/`--foreground`, а все существующие `shared/ui/*` компоненты (`button.tsx`
и т.д.) уже используют классы вроде `bg-primary`, `bg-destructive`, `bg-accent`,
`text-muted-foreground` — токены для них в Tailwind 4 `@theme` не объявлены, поэтому
классы тихо не эмитятся. Новые компоненты (`dropdown-menu`, `avatar`) будут страдать
от того же — токены нужно дополнить в шаге 0.

Решения, принятые с пользователем:
- Главный экран — это корень `/` (не отдельная `/dashboard`-страница).
- «Меню» = навигационное меню (ссылки Транзакции/Категории/Статистика), фильтр над
  списком по типу/категории сейчас делать не нужно.
- Authorization-заголовок добавляется сейчас, точечно (без guard/middleware/refresh —
  это осознанно остаётся будущей задачей).
- Профиль включает кнопку выхода (`clearSession()` + редирект на `/login`).

## Архитектурные решения

- **Новый FSD-слой `widgets/`** — ровно два виджета: `app-header` (навигация + профиль,
  переиспользуется всеми `(dashboard)/*` роутами через общий layout) и
  `transactions-list` (список + пагинация, используется только на `/`).
- **`entities/category`** и **`entities/transaction`** — новые entity-слои, зеркалят
  уже принятый в проекте паттерн `entities/session` (`model/` — query-хуки,
  `index.ts` — экспортирует только хуки/компоненты, типы берутся напрямую из
  `@expense-tracker/shared`).
- **Join категории на клиенте**: `TransactionResponse` содержит только `categoryId`,
  без вложенного объекта. `GET /categories` отдаёт весь список без пагинации —
  грузится одним `useQuery`, дальше `Map<id, CategoryResponse>` через `useMemo` в
  `transactions-list`. Сбой загрузки категорий не должен рушить список транзакций —
  в этом случае просто показывать `—` вместо названия.
- **Пагинация — локальный `useState` в `transactions-list`**, не Zustand и не URL.
  Состояние используется только этим виджетом; `ui-store.ts` явно документирует
  принцип «серверные данные и не расшариваемый UI-стейт в глобальный стор не тащим».
  TanStack Query v5: `placeholderData: keepPreviousData`, чтобы при смене страницы не
  мигал список, `limit` фиксирован на `10` (бэкенд по умолчанию отдаёт `20`, порог не
  выставлен — так что `limit` нужно передавать явно).
- **Сумма/цвет** — знак и цвет берутся только из `type` (`INCOME`→зелёный/`+`,
  `EXPENSE`→красный/`-`), не из знака самой строки `amount`: `moneySchema` в
  `packages/shared` разрешает как `-123.45`, так и `123.45` независимо от `type`,
  готовой формы создания транзакции ещё нет, так что полагаться на знак в `amount`
  нельзя — при отображении обрезать возможный ведущий `-` строковой операцией
  (не через `Number()`, чтобы не терять точность `Decimal(12,2)`).
- **`Authorization` через `useSessionStore.getState()`** внутри `apiFetch` (не хук —
  синхронный доступ вне React-дерева). Это первый кросс-слойный импорт `lib/* →
  entities/*` в проекте; циклов нет (`session-store.ts` ничего не импортирует из
  `lib/*`), явных enforced границ FSD в репозитории нет (no `eslint-plugin-boundaries`).
  На сервере (RSC) токен всегда будет `null`, т.к. `zustand/persist` использует
  `localStorage` — но это не проблема для этой задачи: все новые виджеты, читающие
  защищённые данные, явно `'use client'` и используют TanStack Query в браузере.
  Зафиксировать это коротким комментарием в `api-client.ts`.
- **Logout — отдельная фича `features/auth/logout`**, симметрично `features/auth/login`
  /`register`. Виджет `app-header` остаётся чисто композиционным.
- **`app/page.tsx` удаляется**, его роль переходит `app/(dashboard)/page.tsx` (route
  group не добавляет сегмент URL, оба резолвятся в `/` — если оставить оба, Next
  выдаст конфликт путей). `app/(dashboard)/transactions|categories|stats/page.tsx` не
  трогаем — остаются как есть, автоматически получат общий header через layout.

## Порядок реализации

**Шаг 0 — база.**
`cd apps/web && pnpm dlx shadcn add dropdown-menu avatar badge skeleton`. Проверить,
дополнил ли CLI `src/app/globals.css` токенами темы (`--color-primary`, `-card`,
`-destructive`, `-muted`, `-accent`, `-border`, `-ring`, `-input`, `-popover`,
`-secondary`, `-radius`, light + `.dark`); если нет — дописать вручную стандартный
набор shadcn `new-york/neutral`, сохранив текущие `--background`/`--foreground`.

**Шаг 1 — `lib/api-client.ts`.** Добавить подстановку `Authorization: Bearer` из
`useSessionStore.getState().accessToken` (только если токен есть). Дополнить
`lib/api-client.test.ts` кейсом на заголовок (через `useSessionStore.setState(...)` +
проверку `request.headers.get('Authorization')` в MSW-хендлере).

**Шаг 2 — `entities/category`.** `model/use-categories.ts` (`useQuery(['categories'], …)`
→ `CategoryResponse[]`), `index.ts` экспортирует `useCategories`.

**Шаг 3 — `entities/transaction`.**
`model/query-keys.ts` (`transactionKeys.all`/`.list({page, limit})`),
`model/use-transactions.ts` (`useQuery` + `URLSearchParams` + `keepPreviousData`),
`lib/format-transaction.ts` (`formatTransactionAmount`, `formatTransactionDate` через
`Intl.DateTimeFormat('ru-RU', …)`, без новых зависимостей — в проекте нет date-fns/dayjs),
`ui/transaction-row.tsx` (презентационный, без `'use client'`), `index.ts`.

**Шаг 4 — `features/auth/logout`.** `model/use-logout.ts` (`clearSession()` +
`router.push('/login')`, без `useMutation` — чисто клиентское действие, revoke на
бэкенде нет), `ui/logout-menu-item.tsx` (`DropdownMenuItem`, `variant="destructive"`,
иконка `LogOut` из `lucide-react`), `index.ts`.

**Шаг 5 — `widgets/app-header`.** `ui/nav-links.tsx` (`'use client'`, `usePathname()`,
ссылки на `/transactions`, `/categories`, `/stats`, активная подсвечена), `ui/user-menu.tsx`
(`'use client'`, `user = useSessionStore((s) => s.user)`, `Avatar` с инициалами-fallback,
`DropdownMenu` с именем/email + `LogoutMenuItem`), `ui/app-header.tsx` (компонует оба),
`index.ts`.

**Шаг 6 — `widgets/transactions-list`.** `ui/transactions-list.tsx` (`'use client'`):
`useState(1)` для страницы, `limit = 10`, `useTransactions`, `useCategories`, join через
`useMemo`; состояния loading (`Skeleton`×5), error (`ApiRequestError.message` либо общий
текст), empty («Транзакций пока нет»), список `TransactionRow`; кнопки «Назад»/«Вперёд»
(`disabled` по `page <= 1` / `page * limit >= total`), текст «Страница N из
`Math.ceil(total/limit)`». `index.ts`.

**Шаг 7 — роуты.** Удалить `app/page.tsx`. Создать `app/(dashboard)/layout.tsx`
(server, `<AppHeader />` + `{children}`, без своего `<main>` — его рендерят страницы).
Создать `app/(dashboard)/page.tsx` (server, `<main>` + заголовок + `<TransactionsList />>`,
по паттерну `(auth)/login/page.tsx`). После добавления новых `page.tsx`/`layout.tsx`
выполнить `pnpm --filter @expense-tracker/web exec next typegen` (или `next dev`) до
чистого `tsc --noEmit` — иначе `LayoutProps<'/(dashboard)'>` ещё не сгенерирован
(та же ловушка, что уже описана в `CLAUDE.md`).

## Тесты

Расширить `apps/web/src/test/mocks/handlers.ts`: хендлер `GET /transactions` (12 записей,
`Paginated<TransactionResponse>`, чтобы проверить переход на 2-ю страницу при
`limit=10`), вторая категория с `type: 'INCOME'` (существующая — `EXPENSE`), чтобы
проверить оба цвета/знака при join. `GET /auth/me` не добавлять и не запрашивать —
профиль (`имя`/`email`) уже есть в `useSessionStore().user` после логина/регистрации,
доп. запрос добавил бы риск рассинхрона без пользы для этой задачи.

Новые тест-файлы (vitest + RTL + MSW, паттерн `features/auth/login/ui/login-form.test.tsx`):
- `widgets/transactions-list/ui/transactions-list.test.tsx` — рендер с join-категориями,
  пагинация вперёд/назад (границы disabled), пустой список, ошибка сервера, сбой
  `/categories` не ломает список транзакций.
- `widgets/app-header/ui/app-header.test.tsx` — активная ссылка по `pathname` (мок
  `next/navigation`, как в существующих auth-тестах), профиль показывает имя/email,
  клик «Выйти» очищает сессию и делает `router.push('/login')`.
- Дополнение `lib/api-client.test.ts` — кейс на `Authorization`-заголовок.

## Верификация

```bash
cd apps/web && pnpm exec next typegen   # один раз, до tsc — из-за новых page.tsx/layout.tsx
pnpm lint && pnpm typecheck && pnpm test
```
(`apps/api` не затрагивается, `pnpm test:e2e` не требуется.) Ручная проверка в браузере:
`pnpm dev`, залогиниться на `/login`, убедиться что `/` показывает шапку с меню и
профилем, список транзакций грузится реальными данными с сервера, пагинация переключает
страницы без 401, кнопка «Выйти» очищает сессию и уводит на `/login`.

## Затронутые файлы

| Файл | Действие |
|---|---|
| `apps/web/src/app/globals.css` | изменить (токены темы) |
| `apps/web/src/shared/ui/{dropdown-menu,avatar,badge,skeleton}.tsx` | создать (shadcn CLI) |
| `apps/web/src/lib/api-client.ts`, `api-client.test.ts` | изменить |
| `apps/web/src/entities/category/model/use-categories.ts`, `index.ts` | создать |
| `apps/web/src/entities/transaction/model/{query-keys,use-transactions}.ts`, `lib/format-transaction.ts`, `ui/transaction-row.tsx`, `index.ts` | создать |
| `apps/web/src/features/auth/logout/model/use-logout.ts`, `ui/logout-menu-item.tsx`, `index.ts` | создать |
| `apps/web/src/widgets/app-header/ui/{nav-links,user-menu,app-header}.tsx`, `index.ts`, `app-header.test.tsx` | создать |
| `apps/web/src/widgets/transactions-list/ui/transactions-list.tsx`, `index.ts`, `transactions-list.test.tsx` | создать |
| `apps/web/src/app/(dashboard)/layout.tsx`, `page.tsx` | создать |
| `apps/web/src/app/page.tsx` | удалить |
| `apps/web/src/test/mocks/handlers.ts` | изменить |
