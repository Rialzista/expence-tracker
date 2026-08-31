# Редизайн фронтенда под референс "светлый крипто-wallet дашборд"

## Контекст

Пользователь показал скриншот-референс дашборда: тёплый off-white фон, крупные
закруглённые пастельные stat-карточки (мятная/голубая/персиковая) с круглыми
чёрными иконками-бейджами, тёмный (почти чёрный) sidebar с навигацией, линейный
график с плавающей pill-подсказкой, тёмная ink-панель с таблицей, список
"Recent Activities" с круглыми цветными аватарами. Попросил применить этот
визуальный стиль (шрифты, цвета, отступы) к нашему трекеру расходов.

Сейчас фронтенд (`apps/web`, Next.js 16 App Router, Tailwind 4 CSS-first,
shadcn/ui "new-york", Feature-Sliced Design) визуально — стандартная нейтральная
shadcn-палитра без сайдбара (только горизонтальный header), Geist-шрифты, узкая
центрированная колонка. Дашборд и `/transactions` фактически дублируют друг
друга (оба — просто список операций), `/stats` — пустая заглушка, хотя бэкенд
уже отдаёт готовую агрегацию (`GET /transactions/summary?month&year` →
income/expense/balance + разбивка по категориям), которой фронтенд не
пользуется вовсе.

Решено (согласовано с пользователем):
- график "расходы по категориям" — свой SVG-донат на реальных данных
  `/transactions/summary`, без новых npm-зависимостей (не recharts);
- `/stats` наполняется реальным содержимым на основе того же эндпоинта;
- тёмная тема не поддерживается — референс light-only, убираем существующий
  нейтральный `prefers-color-scheme: dark` блок.

Итог редизайна: дашборд становится summary-экраном (метрики + донат +
топ-категорий + последние 5 операций), `/transactions` — полноценным списком
с пагинацией (переезжает туда то, что раньше было на дашборде), `/categories`
и `/stats` — рестайлятся/наполняются в той же палитре. Auth-страницы
(`/login`, `/register`) не трогаем — они не используют `AppHeader`.

## Дизайн-токены

Палитра (заменяет значения в `:root`, имена shadcn-переменных не менять —
`bg-card`/`text-primary`/`border-border` и т.п. используются по всему коду):

```
--background: #F6F5F2   (canvas, тёплый off-white)
--foreground: #12131A   (ink)
--card: #FFFFFF
--card-foreground: #12131A
--popover: #FFFFFF
--popover-foreground: #12131A
--primary: #12131A      (ink — кнопки, сайдбар, тёмные панели)
--primary-foreground: #F6F5F2
--secondary: #EFEEEA
--secondary-foreground: #12131A
--muted: #EFEEEA
--muted-foreground: #8A8D97  (slate)
--accent: #EFEEEA
--accent-foreground: #12131A
--destructive: #dc2626  (не меняем)
--border: #E7E5E0
--input: #E7E5E0
--ring: #12131A
--radius: 1.25rem       (новая переменная, сейчас отсутствует)
```

Плюс именованные акцентные цвета для пастельных карточек (новые, не входят в
стандартный shadcn-набор): `--color-mint: #D9F2DE`, `--color-sky: #DCE6FA`,
`--color-peach: #FBE2D3`. Прокинуть через `@theme inline` как
`--color-mint`/`--color-sky`/`--color-peach` (Tailwind 4 сам даст утилиты
`bg-mint`/`bg-sky`/`bg-peach`), и `--radius-lg`/`--radius-md`/`--radius-sm` от
базового `--radius`.

Убрать блок `@media (prefers-color-scheme: dark) { ... }` целиком.

Существующие насыщенные цвета категорий (`entities/category/lib/category-colors.ts`,
19 hex) и паттерн "сплошной цветной круг + белая lucide-иконка" в
`entities/category/ui/category-row.tsx` — **не менять**, уже соответствуют
референсу, переиспользовать в новых виджетах как есть.

Шрифты (`apps/web/src/app/layout.tsx`): заменить `Geist` на `Manrope`
(variable, weights 400–800, subsets `['latin', 'cyrillic']` как у текущего
Geist) — идёт в `--font-sans`/`--font-manrope`. `Geist_Mono` оставить как
есть, только для табличных цифр (суммы) через класс `font-mono` — эта
точечная механика уже используется в `TransactionRow`.

Радиус: `--radius: 1.25rem` даёт `rounded-lg` = 20px глобально для
shadcn-примитивов (card/dialog/input). Крупные stat-карточки и ink-панели —
точечно `rounded-3xl` в разметке конкретных компонентов. Кнопки: заменить
`rounded-md` на `rounded-full` в базовых классах `buttonVariants`
(`apps/web/src/shared/ui/button.tsx`, во всех местах, где встречается
`rounded-md`, включая `size` варианты `xs/sm/lg/icon-xs`) — референс использует
кнопки-пилюли, это глобальное изменение затронет все формы/диалоги, поэтому
делать в первую очередь вместе с токенами.

## Layout: sidebar + topbar

Сейчас `(dashboard)/layout.tsx` = только `<AppHeader />` (шапка с логотипом,
`NavLinks`, `UserMenu`) + `{children}`, без сайдбара. Переход:

1. **Новый виджет `apps/web/src/widgets/app-sidebar/`**
   (`index.ts`, `ui/app-sidebar.tsx`, `ui/sidebar-nav-links.tsx`) — тёмная
   (`bg-primary`/`bg-[#12131A]`) вертикальная панель: текстовый wordmark-логотип
   сверху (ассетов лого в проекте нет — `apps/web/public` пуст, кроме
   `favicon.ico`), список пунктов с lucide-иконками:
   - `/` Дашборд — `LayoutDashboard`
   - `/transactions` Операции — `Receipt` (**новый пункт** — сейчас в
     `NavLinks` его вообще нет, хотя роут существует)
   - `/categories` Категории — `Tags`
   - `/stats` Статистика — `PieChart`

   Активный пункт — `usePathname()`, логика 1:1 переносится из текущего
   `widgets/app-header/ui/nav-links.tsx`. Активная пилюля — светлая на тёмном
   фоне (`bg-white/10 text-white`), неактивная — `text-white/60
   hover:bg-white/5`. Логотип — ссылка на `/`.

   Пункт выхода в сайдбар не дублируем — `UserMenu` (email + `LogoutMenuItem`,
   `apps/web/src/features/auth/logout`) остаётся единственным местом выхода,
   переезжает в topbar (см. ниже), т.к. `LogoutMenuItem` жёстко завязан на
   `DropdownMenuItem`-контекст — трогать эту фичу не требуется.

2. **`widgets/app-header` → topbar.** Из `app-header.tsx` убрать `<header
   className="border-b">` обёртку и `<NavLinks />` (навигация переехала в
   сайдбар); оставить строку: поиск (`Input` shadcn с иконкой `Search`,
   декоративный, без обработчика в этой итерации), справа — иконки `Bell`,
   `Settings` (декоративные) + `UserMenu` (без изменений — не хардкодит цвета,
   перекрасится автоматически через токены). Удалить `nav-links.tsx` и его
   экспорт из `index.ts`.

3. **`(dashboard)/layout.tsx`** — grid из сайдбара и колонки
   topbar+content:
   ```tsx
   <div className="flex min-h-screen bg-background">
     <AppSidebar />
     <div className="flex flex-1 flex-col">
       <AppHeader />
       <main className="flex-1 px-8 py-6">{children}</main>
     </div>
   </div>
   ```
   Убрать `mx-auto max-w-4xl px-6 py-10` из каждой `page.tsx` — паддинги теперь
   в layout, контент — широкий dashboard-грид, а не узкая колонка.

## Дашборд (`(dashboard)/page.tsx`)

Новый виджет `apps/web/src/widgets/dashboard-summary/`:
- `ui/dashboard-summary.tsx` — композитный клиентский компонент, держит
  `useState<{month, year}>` (дефолт — текущие месяц/год), месяц-селектор,
  вызывает `useTransactionsSummary(month, year)` один раз и раздаёт данные
  дочерним presentational-компонентам пропсами (чтобы карточки/донат/панель не
  дублировали сетевой запрос и не рассинхронизировались по периоду):
  - `ui/summary-stat-cards.tsx` — 3 карточки `grid grid-cols-3 gap-4`: Баланс
    (`bg-sky`), Доходы (`bg-mint`), Расходы (`bg-peach`), каждая `rounded-3xl
    p-6`, круглый ink-бейдж с иконкой направления (`ArrowUpRight`/
    `ArrowDownRight`/`Equal` из lucide) сверху, подпись + сумма
    (`font-mono text-2xl font-bold`). Без спарклайнов — реальных
    дневных данных для тренда нет, выдумывать decorативные графики не нужно.
  - `ui/top-categories-panel.tsx` — тёмная ink-панель (`bg-primary text-white
    rounded-3xl p-6`), топ-5 категорий расходов из `byCategory` (сортировка по
    `total` desc), каждая строка — цветной круг+иконка категории (join
    `categoryId` из summary с `useCategories()` за цветом/иконкой, т.к. в
    `byCategory` их нет) + название + `font-mono` сумма.
  - `ui/recent-activities.tsx` — `useTransactions({ page: 1, limit: 5 })`
    (существующий хук), рендерит `TransactionRow` без пагинационных кнопок.
- `index.ts` — экспорт `DashboardSummary`, `RecentActivities`.

Донат-чарт по категориям — переиспользуется и на `/stats`, поэтому кладётся в
`entities/transaction/ui/category-donut-chart.tsx` (не в widget): чистый SVG
(`<circle>` с `stroke-dasharray`/`stroke-dashoffset` на сегмент, `-rotate-90`),
пропсы `{ data: { categoryId, label, value, color }[] }`, легенда — отдельный
список рядом (цветной кружок + название + `font-mono` сумма).

`(dashboard)/page.tsx` итог: заголовок "Дашборд" + `CreateTransactionDialog` в
одной строке → `<DashboardSummary />` (карточки + месяц-селектор + донат +
топ-категорий) → `<RecentActivities />`. `TransactionsList` (полный
пагинируемый список) с дашборда убирается — переезжает на `/transactions`.

## React Query хук

`apps/web/src/entities/transaction/model/use-transactions-summary.ts` — по
паттерну существующего `use-transactions.ts`:
```ts
export function useTransactionsSummary({ month, year }: { month: number; year: number }) {
  return useQuery({
    queryKey: transactionKeys.summary({ month, year }),
    queryFn: () => api.get<TransactionSummary>(`/transactions/summary?${new URLSearchParams({ month: String(month), year: String(year) })}`),
  });
}
```
В `model/query-keys.ts` добавить `summary: (params) => [...transactionKeys.all, 'summary', params] as const`.
Экспортировать хук и `CategoryDonutChart` из `entities/transaction/index.ts`.
Формула денег: т.к. `income`/`expense`/`balance` в `TransactionSummary` — строки
без разделения по валюте (см. комментарий в `transaction.schema.ts`), завести
`entities/transaction/lib/format-money.ts` с простым `formatMoney(value: string)`
(разбивка разрядов), не путать с существующим `formatTransactionAmount`
(тот заточен под одну операцию с `type`).

## `/transactions` — полный список (сейчас заглушка)

`(dashboard)/transactions/page.tsx`: заменить заглушку на то, что раньше было
на дашборде — `<TransactionsList />` + `<CreateTransactionDialog />`.
`widgets/transactions-list/ui/transactions-list.tsx` — логику пагинации/join
категорий не трогать, только обернуть в `rounded-3xl bg-card p-6` карточку.

## `/categories` — рестайлинг без изменения структуры

`entities/category/ui/category-row.tsx` — не менять структурно (уже
соответствует референсу). `widgets/categories-list/ui/categories-list.tsx` —
обернуть секции "Расходы"/"Доходы" в `rounded-3xl bg-card p-6` контейнеры.
`(dashboard)/categories/page.tsx` — убрать `max-w-4xl`, заголовок
`text-3xl font-extrabold` для консистентности с дашбордом.

## `/stats` — наполнить реальными данными (сейчас заглушка)

Новый виджет `apps/web/src/widgets/stats-overview/`
(`ui/stats-overview.tsx`, `ui/income-expense-bars.tsx`):
- Месяц-селектор через `useSearchParams`/`router.replace` (не локальный
  `useState`, в отличие от дашборда) — это отдельная детальная страница,
  ссылка на конкретный месяц должна быть шарибельной.
- Крупный `CategoryDonutChart` (переиспользуется из `entities/transaction/ui`)
  + полная легенда всех категорий из `byCategory` с суммой и % от общего
  расхода (не top-5, как на дашборде).
- `income-expense-bars.tsx` — сравнение доход/расход простыми CSS-полосами
  (`bg-mint`/`bg-peach`, ширина пропорциональна значению относительно
  `Math.max(income, expense)`), без новых зависимостей.
- Пустое состояние "Нет операций за выбранный период" по аналогии с
  существующими empty-state текстами (`Транзакций пока нет.`).

Месяц-селектор — переиспользуемый UI, выделить как
`entities/transaction/ui/month-picker.tsx` (используется и в
`dashboard-summary`, и в `stats-overview`).

## Порядок выполнения

1. Токены (`globals.css`) + шрифты (`layout.tsx`) + `rounded-full` в
   `button.tsx` — самый рискованный шаг (ошибка ломает всё приложение).
   Проверить: `pnpm --filter web typecheck`, `pnpm --filter web lint`,
   визуально открыть `/login` (не должен был сломаться косвенно).
2. Layout: `widgets/app-sidebar` (новый), правки `widgets/app-header`,
   `(dashboard)/layout.tsx`. Проверить на всех 4 dashboard-роутах: сайдбар и
   topbar рендерятся, активный пункт подсвечивается, `UserMenu`/logout
   работает.
3. `use-transactions-summary` + `query-keys.ts` — проверить через React Query
   Devtools (уже подключены), что эндпоинт отдаёт данные за текущий месяц.
4. `CategoryDonutChart` (entities/transaction/ui) — изолированно.
5. `widgets/dashboard-summary/*` + обновлённый `(dashboard)/page.tsx`.
6. `/transactions` — перенос `TransactionsList` со старого дашборда.
7. `/categories` — точечный рестайлинг (низкий риск, можно в любой момент
   после шага 1).
8. `widgets/stats-overview/*` + обновлённый `(dashboard)/stats/page.tsx`.
9. Обновить/переписать тесты, которые проверяют структуру, изменившуюся в
   ходе редизайна:
   - `widgets/app-header/ui/app-header.test.tsx` — тест на подсветку активной
     ссылки (`Транзакции`/`Категории`) нужно перенести в новый
     `widgets/app-sidebar/ui/app-sidebar.test.tsx` (навигация там); в
     `app-header.test.tsx` остаются только тесты профиля/logout.
   - Прогнать `pnpm --filter web test` целиком — проверить, не ловят ли
     `categories-list.test.tsx`/`transactions-list.test.tsx` конкретные классы
     разметки (маловероятно, RTL обычно проверяет текст/роли).

## Верификация

- `pnpm --filter web typecheck` и `pnpm --filter web lint` после каждого
  крупного шага.
- `pnpm --filter web test` (учесть переписанный `app-header.test.tsx` /
  новый `app-sidebar.test.tsx`).
- `pnpm --filter web dev`, визуальный проход по `/`, `/transactions`,
  `/categories`, `/stats`, `/login`, `/register` — проверить, что: сайдбар и
  topbar на месте, метрики на дашборде совпадают с реальными операциями,
  донат-чарт и топ-категорий корректно отражают `/transactions/summary` за
  текущий и произвольный месяц, пагинация на `/transactions` работает,
  создание/редактирование/удаление операций и категорий не сломано новыми
  стилями кнопок/диалогов, auth-страницы не пострадали от глобальных токенов.

## Критичные файлы

- `apps/web/src/app/globals.css`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/shared/ui/button.tsx`
- `apps/web/src/app/(dashboard)/layout.tsx`
- `apps/web/src/widgets/app-header/ui/app-header.tsx`,
  `nav-links.tsx` (удаляется)
- `apps/web/src/widgets/app-sidebar/*` (новое)
- `apps/web/src/app/(dashboard)/page.tsx`,
  `(dashboard)/transactions/page.tsx`, `(dashboard)/stats/page.tsx`,
  `(dashboard)/categories/page.tsx`
- `apps/web/src/widgets/dashboard-summary/*`, `widgets/stats-overview/*` (новые)
- `apps/web/src/entities/transaction/model/use-transactions-summary.ts` (новое),
  `query-keys.ts`, `ui/category-donut-chart.tsx` (новое),
  `ui/month-picker.tsx` (новое), `lib/format-money.ts` (новое)
- `packages/shared/src/schemas/transaction.schema.ts` (только читаем, схема
  уже готова, не меняем)
- `apps/web/src/widgets/app-header/ui/app-header.test.tsx` (правки)
