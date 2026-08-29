# Frontend логина и регистрации (FSD + shadcn/ui)

## Контекст

Бэкенд-модуль авторизации (`apps/api/src/auth`) уже полностью реализован: `POST /api/auth/register`,
`POST /api/auth/login` (оба `@Public()`, возвращают `{ accessToken, user }`), `GET /api/auth/me`.
JWT — только access-токен (15 мин, без refresh), передаётся строго как `Authorization: Bearer <token>`,
без cookie. Zod-контракты (`registerSchema`, `loginSchema`, `authResponseSchema`, `apiErrorSchema`) уже
экспортированы из `@expense-tracker/shared`.

На фронтенде (`apps/web`) страницы `app/(auth)/login` и `app/(auth)/register` сейчас — статичные заглушки
("форма появится вместе с модулем авторизации в API"), хотя API уже готов. Нужно реализовать реальные формы
на компонентах shadcn/ui, и сделать это в архитектуре Feature-Sliced Design — это первый FSD-код в проекте,
пока применяется только к новому auth-функционалу.

Решения, зафиксированные с пользователем:
1. **FSD вводится только для нового кода** (`entities/session`, `features/auth/*`, `shared/ui`).
   Существующие `src/lib/*` и `src/stores/ui-store.ts` не переносятся и не трогаются — это осознанный
   технический долг, который явно фиксируется в CLAUDE.md, а не тихо оставляется как есть.
2. **Охват сессии ограничен формами**: после успешного логина/регистрации токен и пользователь кладутся
   в Zustand-стор с `persist` в `localStorage`, и происходит редирект на `/transactions`. Route guard
   (middleware), редирект уже авторизованных с `/login`, кнопка выхода — вне скоупа.

Все детали ниже сверены с реальным кодом (`components.json`, `api-client.ts`, `handlers.ts`, backend
`auth`/`users`).

## Порядок выполнения

1. `apps/web/components.json`: сменить `aliases.ui` с `"@/components/ui"` на `"@/shared/ui"`.
   `aliases.utils` остаётся `"@/lib/utils"` — `cn()` не переезжает, новые shadcn-компоненты будут
   импортировать его из существующего файла.
2. `cd apps/web && pnpm dlx shadcn add button input label form card` — создаст
   `src/shared/ui/{button,input,label,form,card}.tsx`, подтянет нужные `@radix-ui/*` в
   `apps/web/package.json`.
3. `pnpm install` в корне монорепо. Если у новых `@radix-ui/*` появится postinstall-скрипт — pnpm 11
   заблокирует его по умолчанию; тогда добавить явный `true`/`false` в `allowBuilds`
   (`pnpm-workspace.yaml`), как описано в CLAUDE.md.
4. Создать `entities/session` (стор сессии).
5. Создать `features/auth/login` (model + ui).
6. Создать `features/auth/register` (model + ui).
7. Переписать `app/(auth)/login/page.tsx` и `app/(auth)/register/page.tsx`.
8. Дополнить `src/test/mocks/handlers.ts` дефолтными happy-path хендлерами для `/auth/login` и `/auth/register`.
9. Добавить тесты `login-form.test.tsx`, `register-form.test.tsx`.
10. Обновить корневой `CLAUDE.md` новым разделом про FSD на фронтенде.
11. Удалить осиротевший `apps/web/src/components/ui/.gitkeep` (директория больше не используется алиасом).
12. Прогнать проверки (раздел ниже).

## Новые/изменяемые файлы

### `apps/web/components.json`
Только `aliases.ui` → `"@/shared/ui"`, остальное без изменений.

### `apps/web/src/entities/session/model/session-store.ts`
Zustand-стор с `persist` (ключ `auth-session`, `localStorage`):
```ts
interface SessionState {
  accessToken: string | null;
  user: UserResponse | null;
  setSession: (data: AuthResponse) => void;
  clearSession: () => void;
}
```
`setSession` вызывается после успешного логина/регистрации. `clearSession` добавляется для полноты
интерфейса стора, даже если logout-UI сейчас не строим.

### `apps/web/src/entities/session/index.ts`
Публичный API слоя — реэкспорт только `useSessionStore` (типы `UserResponse`/`AuthResponse` потребители
берут напрямую из `@expense-tracker/shared`, как везде в монорепо).

### `apps/web/src/features/auth/login/model/use-login.ts`
```ts
export function useLogin() {
  return useMutation({
    mutationFn: (dto: LoginDto) => api.post<AuthResponse>('/auth/login', dto),
  });
}
```

### `apps/web/src/features/auth/login/ui/login-form.tsx` (`'use client'`)
- `useForm<LoginDto>({ resolver: zodResolver(loginSchema) })`, поля `email`/`password` через
  `Form`/`FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage` из `@/shared/ui/form`,
  `Input` из `@/shared/ui/input`, `Button` из `@/shared/ui/button`.
- На успех: `useSessionStore().setSession(data)` → `router.push('/transactions')` (`useRouter` из
  `next/navigation`).
- На ошибку: `error instanceof ApiRequestError` → `form.setError('root', { message: error.message })`,
  рендер `form.formState.errors.root?.message` под формой. 401 "Неверный email или пароль" отображается
  как есть.
- Кнопка submit блокируется/меняет текст по `isPending` мутации.

### `apps/web/src/features/auth/login/index.ts`
Экспорт `LoginForm`.

### `apps/web/src/features/auth/register/model/use-register.ts`
Аналогично логину: `mutationFn: (dto: RegisterDto) => api.post<AuthResponse>('/auth/register', dto)`.

### `apps/web/src/features/auth/register/ui/register-form.tsx`
Поля `email`, `name`, `password` (`zodResolver(registerSchema)`), тот же паттерн ошибок через
`setError('root', ...)`. Конфликт email при регистрации бэкенд отдаёт как `409 Пользователь с таким
email уже существует` (`users.service.ts` → `ConflictException`) — обрабатывается той же веткой
`ApiRequestError`, отдельный код не нужен. На успех — `setSession` + редирект на `/transactions`.

### `apps/web/src/features/auth/register/index.ts`
Экспорт `RegisterForm`.

### `apps/web/src/app/(auth)/login/page.tsx`
Заменить заглушку на страницу с `Card` (shadcn) вокруг `<LoginForm />` и ссылкой `next/link` на
`/register` ("Нет аккаунта? Зарегистрироваться").

### `apps/web/src/app/(auth)/register/page.tsx`
Зеркально: `Card` + `<RegisterForm />` + ссылка на `/login` ("Уже есть аккаунт? Войти").

### `apps/web/src/test/mocks/handlers.ts`
Добавить дефолтные happy-path хендлеры `POST /auth/login` и `POST /auth/register`, возвращающие
`AuthResponse` с тестовым `accessToken`/`user` (по образцу существующего хендлера `/categories`).
Ошибочные сценарии (401/409) переопределяются точечно через `server.use(...)` в самих тестах.

### `apps/web/src/features/auth/login/ui/login-form.test.tsx`
- рендер полей email/пароль и кнопки;
- невалидный email → после submit виден `FormMessage` с текстом ошибки zod;
- успешный submit → `useSessionStore.getState().accessToken` устанавливается, замоканный
  `useRouter().push` вызван с `'/transactions'` (`vi.mock('next/navigation', ...)`);
- `server.use(...)` с 401 → под формой виден текст "Неверный email или пароль";
- `afterEach` сбрасывает стор сессии (`useSessionStore.setState({ accessToken: null, user: null })`).

### `apps/web/src/features/auth/register/ui/register-form.test.tsx`
Аналогично + тест на 409 ("Пользователь с таким email уже существует").

### `CLAUDE.md`
Новый раздел про FSD на фронтенде:
- Auth-функционал (`entities/session`, `features/auth/*`, `shared/ui`) — первый FSD-код в `apps/web`;
  остальное (`src/lib/*`, `src/stores/ui-store.ts`, `(dashboard)/*`) FSD-слоями не является и **умышленно
  не мигрировано** — явный технический долг, а не недосмотр.
- Расположение: `entities/session` (стор), `features/auth/login|register` (`model/` — мутация,
  `ui/` — форма), `shared/ui` (shadcn-примитивы, `components.json#aliases.ui` теперь `@/shared/ui`,
  `aliases.utils` не менялся).
- Явные границы: нет middleware/guard для dashboard-роутов, нет редиректа авторизованных с
  `/login`/`/register`, нет logout — токен только access (15 мин), после входа кладётся в стор, но
  запросы к защищённым эндпоинтам пока не проставляют `Authorization` автоматически.
- Обновить устаревшую фразу "shadcn/ui настроен..., компонентов ещё нет" — компоненты
  `button/input/label/form/card` уже добавлены.

## Проверка

```bash
pnpm --filter @expense-tracker/web typecheck
pnpm --filter @expense-tracker/web test
pnpm --filter @expense-tracker/web lint

pnpm db:up && pnpm db:migrate
pnpm dev   # web :3000, api :3001
```

В браузере на `http://localhost:3000/login` и `/register` проверить: валидацию пустой формы/некорректного
email, успешную регистрацию нового email → редирект на `/transactions` + `localStorage['auth-session']`
заполнен, повторную регистрацию тем же email → "Пользователь с таким email уже существует", логин с
неверным паролем → "Неверный email или пароль", переходы по ссылкам между страницами.
