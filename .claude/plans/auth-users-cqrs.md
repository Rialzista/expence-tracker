# Авторизация в API: модули `users` и `auth` (JWT) поверх CQRS

## Context

Сейчас в `apps/api` авторизации нет. Модуль `auth` — заготовка: `AuthService.register/login/me`
бросают `NotImplementedException`, стратегия лежит закомментированной в
`apps/api/src/auth/jwt.strategy.ts.todo`, а все три контроллера (`auth`, `categories`,
`transactions`) используют захардкоженную константу `DEMO_USER_ID`. Модуля `users` не
существует вовсе — работать с пользователем неоткуда.

Задача: завести модуль пользователя с репозиторием и сервисом, реализовать регистрацию и
вход через JWT, закрыть остальные эндпоинты гвардом и получать идентификатор пользователя
из токена вместо `DEMO_USER_ID`. **Взаимодействие между модулями строится через CQRS**:
`auth` не инжектит `UsersService`, а отправляет команды и запросы в шину — модуль `users`
публикует наружу только классы команд/запросов, а не свои сервисы.

Что уже готово и переиспользуется без изменений:

- **Контракты** в `packages/shared/src/schemas/auth.schema.ts` — `registerSchema`,
  `loginSchema`, `userResponseSchema`, `authResponseSchema` (`{ accessToken, user }`).
  Ровно под схему «только access-токен». **Менять `packages/shared` не нужно.**
- **Зависимости** уже в `apps/api/package.json`: `@nestjs/jwt`, `@nestjs/passport`,
  `passport`, `passport-jwt`, `argon2`, `@types/passport-jwt`. Из нового ставим только
  `@nestjs/cqrs`.
- **Env** — `JWT_SECRET` (min 16) и `JWT_EXPIRES_IN` (default `15m`) уже валидируются
  в `apps/api/src/config/env.schema.ts`.
- **`ZodValidationPipe`** (`src/common/pipes/`) и **`HttpExceptionFilter`**
  (`src/common/filters/`, глобальный через `APP_FILTER`) — 401/409 автоматически лягут
  в общий формат ответа. Исключение, бро́шенное внутри хендлера, пролетает через
  `CommandBus.execute()` наружу как обычный `throw` и доходит до фильтра.
- **`PrismaModule`** объявлен `@Global()`, поэтому `PrismaService` инжектится в
  `UsersRepository` без импорта модуля.

Решения, согласованные с пользователем: только access-токен (без refresh); слой репозитория
вводим **только** в `users`, `categories`/`transactions` не трогаем; глобальный `JwtAuthGuard`
включаем сразу; `User.passwordHash` делаем обязательным.

---

## 0. Новая зависимость: `@nestjs/cqrs`

```bash
pnpm --filter @expense-tracker/api add @nestjs/cqrs@^12.0.0
```

Проверено перед планированием — совместимость чистая, ловушки уровня `nestjs-zod` тут нет:

- `@nestjs/cqrs@12.0.0` объявляет peer `@nestjs/common ^12.0.0`, `@nestjs/core ^12.0.0`,
  `rxjs ^7.2.0` — совпадает с Nest 12.0.1 и rxjs 7.8.1 в проекте;
- пакет ESM (`"type": "module"`, `exports` с ветками `import`/`require`) — импортируется
  из `"type": "module"` пакета `apps/api` без прослоек;
- postinstall-скриптов нет → **правка `allowBuilds` в `pnpm-workspace.yaml` не требуется**;
- есть типизированные базовые классы `Command<TResult>` / `Query<TResult>`: тогда
  `commandBus.execute(new CreateUserCommand(...))` выводит тип результата сам, без
  дженерика на месте вызова.

## 1. Схема БД

**`apps/api/prisma/schema.prisma`** — в модели `User` заменить

```prisma
  // Заполняется, когда будет реализована авторизация (argon2-хеш).
  passwordHash String?
```

на

```prisma
  // argon2id-хеш пароля. Записывается только обработчиком CreateUserCommand.
  passwordHash String
```

Затем `pnpm db:migrate` (создаст миграцию рядом с существующей
`prisma/migrations/20260828135645_init/`) и `pnpm db:generate` — генерируемый клиент лежит
в `apps/api/src/generated/prisma` и должен быть пересобран после смены схемы.

> Таблица `users` пустая (init-миграция единственная), поэтому `NOT NULL` применится без
> конфликтов. Если в локальной БД успели появиться строки — `prisma migrate dev` предложит
> reset; это ожидаемо.

## 2. Подключение CQRS

**`apps/api/src/app.module.ts`** — `CqrsModule.forRoot()` **ровно один раз**, в `imports`:

```ts
CqrsModule.forRoot(),
```

`forRoot()` возвращает динамический модуль с `global: true`, поэтому `CommandBus`,
`QueryBus` и `EventBus` доступны в любом модуле без импортов, и шина гарантированно одна.
**Не вызывать `forRoot()` повторно в `UsersModule`/`AuthModule`** — это создало бы вторые
экземпляры шин, и команды перестали бы находить свои хендлеры.

Сами хендлеры остаются обычными провайдерами своих модулей — `ExplorerService` из
`@nestjs/cqrs` обходит дерево модулей на `onApplicationBootstrap` и регистрирует их
автоматически.

## 3. Новый модуль `apps/api/src/users/`

Структура:

```
src/users/
  users.module.ts
  users.repository.ts
  users.service.ts
  user.mapper.ts
  user-credentials.ts
  commands/
    create-user.command.ts
    create-user.handler.ts
    index.ts                 // export const UserCommandHandlers = [...]
  queries/
    get-user-by-id.query.ts
    get-user-by-id.handler.ts
    get-user-credentials-by-email.query.ts
    get-user-credentials-by-email.handler.ts
    index.ts                 // export const UserQueryHandlers = [...]
  events/
    user-registered.event.ts
    user-registered.handler.ts
    index.ts                 // export const UserEventHandlers = [...]
```

### `users.repository.ts` — `UsersRepository`

Единственное место в модуле, которое знает о Prisma. Инжектит `PrismaService`
(**value-импорт**, см. «Подводные камни»). Возвращает сырые модели Prisma (`User`).

| Метод | Реализация |
|---|---|
| `findById(id: string)` | `prisma.user.findUnique({ where: { id } })` |
| `findByEmail(email: string)` | `prisma.user.findUnique({ where: { email } })` — отдаёт запись **вместе с `passwordHash`** |
| `create(data: { email; name; passwordHash })` | `prisma.user.create({ data })` |

### `user.mapper.ts`

```ts
export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}
```

**Обязателен**: `userResponseSchema` объявляет `createdAt: z.iso.datetime()` — строку, а
Prisma отдаёт `Date`. Плюс это единственная гарантия, что `passwordHash` не утечёт в ответ.

### `user-credentials.ts`

Внутренний контракт бэкенда (в `packages/shared` ему не место — там только то, что видит
браузер):

```ts
export interface UserCredentials {
  user: UserResponse;
  passwordHash: string;
}
```

### `users.service.ts` — `UsersService`

Доменный слой: нормализация email, проверка уникальности, маппинг. Наружу из модуля
**не экспортируется** — его вызывают только хендлеры этого же модуля.

- `private normalizeEmail(email)` — `email.trim().toLowerCase()`. Вызывается и при создании,
  и при поиске по email, иначе `User@mail.ru` и `user@mail.ru` заведут два аккаунта, а
  `@@unique` на `email` их не поймает.
- `create(data): Promise<UserResponse>` — предварительная проверка `findByEmail` →
  `ConflictException('Пользователь с таким email уже существует')`. Дополнительно обернуть
  `repository.create` в `try/catch` и превратить Prisma-ошибку `P2002` в тот же
  `ConflictException` — проверка и вставка не атомарны, гонку закрывает только уникальный
  индекс.
- `findById(id): Promise<UserResponse | null>`
- `findCredentialsByEmail(email): Promise<UserCredentials | null>`

### Команда `CreateUserCommand`

```ts
export class CreateUserCommand extends Command<UserResponse> {
  constructor(
    readonly email: string,
    readonly name: string,
    readonly passwordHash: string,
  ) {
    super();
  }
}
```

Результат — `UserResponse`, а не модель Prisma: `passwordHash` физически не может уехать
в вызывающий модуль. `AuthService` берёт из результата `id` и `email` для payload токена.

`create-user.handler.ts`:

```ts
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly users: UsersService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserResponse> {
    const user = await this.users.create(command);
    this.eventBus.publish(new UserRegisteredEvent(user.id, user.email));
    return user;
  }
}
```

### Запросы

- `GetUserByIdQuery extends Query<UserResponse | null>` — используется `JwtStrategy.validate`
  и `GET /auth/me`.
- `GetUserCredentialsByEmailQuery extends Query<UserCredentials | null>` — только для входа.
  Имя намеренно называет вещи своими именами: по нему видно, что запрос отдаёт хеш, и
  случайно использовать его для «получить пользователя по email» никто не станет.

Хендлеры — тонкие адаптеры над `UsersService`, по паттерну `CreateUserHandler`.

### Событие `UserRegisteredEvent`

`user-registered.event.ts` — `{ userId, email }`. `user-registered.handler.ts` (`@EventsHandler`)
пока только пишет в `Logger`. Это осознанная точка расширения: именно сюда позже встанет
создание набора категорий по умолчанию — и сделает это `CategoriesModule`, подписавшись на
то же событие, без единого прямого вызова между модулями. Ради этого CQRS тут и заводится.

### `users.module.ts`

```ts
@Module({
  providers: [
    UsersService,
    UsersRepository,
    ...UserCommandHandlers,
    ...UserQueryHandlers,
    ...UserEventHandlers,
  ],
})
export class UsersModule {}
```

`exports` пуст — **это главное следствие CQRS**. Публичный контракт модуля `users` — это
классы `CreateUserCommand`, `GetUserByIdQuery`, `GetUserCredentialsByEmailQuery` и тип
`UserResponse`, которые другие модули импортируют напрямую из файлов. Ни `UsersService`,
ни `UsersRepository` наружу не видны. Контроллера у модуля нет: профиль отдаёт
`GET /api/auth/me`.

## 4. Модуль `apps/api/src/auth/`

### `types/jwt-payload.ts`

```ts
export interface JwtPayload { sub: string; email: string }
export interface AuthenticatedUser { id: string; email: string }
```

### `jwt.strategy.ts`

Создать по образцу `jwt.strategy.ts.todo`, **но** `validate` ходит в `QueryBus`, а не в
`PrismaService`. После создания файл `jwt.strategy.ts.todo` удалить.

```ts
super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
});

async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
  const user = await this.queryBus.execute(new GetUserByIdQuery(payload.sub));
  if (!user) throw new UnauthorizedException();
  return { id: user.id, email: user.email };
}
```

Обращение к БД в `validate` оставляем осознанно: удалённый пользователь перестаёт
проходить с ещё не истёкшим токеном.

### `decorators/public.decorator.ts`

```ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### `decorators/current-user.decorator.ts`

`createParamDecorator`, поддерживает обе формы — `@CurrentUser()` (весь
`AuthenticatedUser`) и `@CurrentUser('id')` (одно поле):

```ts
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user;
    return field ? user[field] : user;
  },
);
```

### `guards/jwt-auth.guard.ts`

`extends AuthGuard('jwt')`; в `canActivate` через `Reflector.getAllAndOverride(IS_PUBLIC_KEY,
[handler, class])` пропускать публичные маршруты, иначе `super.canActivate(context)`.

### `auth.service.ts` — переписать заготовку

Фасад над шинами: инжектит `CommandBus`, `QueryBus` и `JwtService` (все — **value-импорты**),
`UsersService` не инжектит и о нём не знает.

- `private async issueToken(user: UserResponse): Promise<AuthResponse>` —
  `signAsync({ sub: user.id, email: user.email })` → `{ accessToken, user }`. Общая точка
  для `register` и `login`.
- `register(dto)` — `argon2.hash(dto.password, { type: argon2.argon2id })` →
  `commandBus.execute(new CreateUserCommand(dto.email, dto.name, passwordHash))` →
  `issueToken`. Конфликт email прилетает из хендлера как `ConflictException` (409).
- `login(dto)` — `queryBus.execute(new GetUserCredentialsByEmailQuery(dto.email))` →
  `argon2.verify(credentials.passwordHash, dto.password)` → `issueToken(credentials.user)`.
  **И «нет такого email», и «неверный пароль» отдают один и тот же
  `UnauthorizedException('Неверный email или пароль')`** — иначе по коду ответа перебирается
  список зарегистрированных адресов.
- `me(userId)` — `queryBus.execute(new GetUserByIdQuery(userId))` → `NotFoundException`,
  если `null`.

Пароль в открытом виде не логировать нигде.

### `auth.controller.ts`

- Удалить константу `DEMO_USER_ID`.
- `@Public()` на `register` и `login`; на `login` добавить `@HttpCode(HttpStatus.OK)` —
  по умолчанию `@Post` отдаёт 201, а вход ничего не создаёт.
- `me` — `@ApiBearerAuth()` + `me(@CurrentUser('id') userId: string)`.
- Контроллер остаётся тонким и в шину сам не ходит — обращается к `AuthService`, как сейчас.
  Валидация тел через существующий `ZodValidationPipe` не меняется.

### `auth.module.ts`

```ts
imports: [
  PassportModule,
  JwtModule.registerAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService<Env, true>) => ({
      secret: config.get('JWT_SECRET', { infer: true }),
      signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', { infer: true }) },
    }),
  }),
],
providers: [AuthService, JwtStrategy],
```

`UsersModule` в `imports` **не нужен** — связь идёт через глобальные шины. `CqrsModule`
тоже не импортируем: `forRoot()` в `AppModule` уже сделал его глобальным.

### `README.md`

Файл описывает несуществующий больше TODO-план. Переписать в короткое описание рабочего
модуля: маршруты, где лежит `@Public()`, что гвард глобальный и что общение с `users` идёт
через команды/запросы.

## 5. Подключение гварда и замена `DEMO_USER_ID`

**`app.module.ts`**: добавить `CqrsModule.forRoot()` и `UsersModule` в `imports`, а в
`providers`:

```ts
{ provide: APP_GUARD, useClass: JwtAuthGuard },
```

**`common/health.controller.ts`**: `@Public()` на `check()` — иначе глобальный гвард закроет
`/api/health` и уронит существующий `apps/api/test/app.e2e-spec.ts`.

**`categories/categories.controller.ts`** и **`transactions/transactions.controller.ts`** —
одинаковая правка в обоих: удалить константу `DEMO_USER_ID` и её TODO-комментарий, добавить
`@ApiBearerAuth()` на класс, в каждом обработчике заменить аргумент `DEMO_USER_ID` на
параметр `@CurrentUser('id') userId: string`. Сигнатуры сервисов (`findAll(userId)`,
`create(userId, dto)` и т. д.) уже принимают `userId` первым аргументом — `*.service.ts`
не меняем, они остаются заглушками, и CQRS в них пока не заводим.

## 6. Косметика конфигурации

- `apps/api/src/config/env.schema.ts` — убрать комментарий
  `// Используется модулем auth, который пока не реализован.`
- `.env.example` — заменить заголовок `# Авторизация — заготовка, пока не используется`
  на `# Авторизация`.
- `CLAUDE.md` — переписать абзац «**Авторизации нет.**»: гвард глобальный, публичные
  маршруты помечаются `@Public()`, идентификатор берётся из `@CurrentUser()`, доступ к
  таблице `users` идёт через `UsersRepository`, а межмодульное взаимодействие — через
  `CommandBus`/`QueryBus`/`EventBus`, при этом `CqrsModule.forRoot()` вызывается ровно
  один раз в `app.module.ts`.

## Вне объёма

`apps/web` не трогаем. Там сейчас нет ни хранения токена, ни заголовка `Authorization` —
`apiFetch` в `apps/web/src/lib/api-client.ts` ставит только `Content-Type`, а страницы
`(auth)/login` и `(auth)/register` — заглушки. Подключение фронта к работающему API
(хранилище токена, `Authorization: Bearer`, обработка 401) — отдельная задача.

`categories` и `transactions` на CQRS не переводим: их сервисы — заглушки, переписывать
несуществующую логику незачем. Паттерн задаётся модулем `users` как образец.

## Подводные камни

1. **`import type` ломает DI.** По `CLAUDE.md` правило
   `@typescript-eslint/consistent-type-imports` отключено в `packages/eslint-config/nest.js`
   именно поэтому. Все новые конструкторы (`UsersRepository`, `UsersService`, хендлеры,
   `AuthService`, `JwtStrategy`, `JwtAuthGuard`) обязаны импортировать свои зависимости
   (`PrismaService`, `UsersService`, `CommandBus`, `QueryBus`, `EventBus`, `JwtService`,
   `ConfigService`, `Reflector`) **value-импортом**. Классы команд и запросов в
   `@CommandHandler(...)`/`@QueryHandler(...)` — тоже value-импорты. Интерфейсы
   (`ICommandHandler`, `JwtPayload`) и типы DTO — по-прежнему `import type`.
2. **`CqrsModule.forRoot()` — строго один вызов**, в `AppModule`. Он `global: true`;
   повторный вызов в другом модуле создаст вторые `CommandBus`/`QueryBus`, и команды
   молча перестанут находить хендлеры.
3. **`argon2` — CommonJS без `exports`-мапы** (`"main": "argon2.cjs"`), а `apps/api` —
   `"type": "module"` с `moduleResolution: NodeNext`. Named-импорт
   `import { hash, verify } from 'argon2'` **не соберётся**. Писать
   `import argon2 from 'argon2';` (работает благодаря `esModuleInterop`) и вызывать
   `argon2.hash(...)` / `argon2.verify(...)`.
4. **Расширения `.js` в относительных импортах** — проект ESM (`"type": "module"`),
   весь существующий код пишет `./auth.service.js`. Соблюдать, включая новые
   `./commands/create-user.command.js` и подобные.
5. **`class-validator` / Nest `ValidationPipe` не использовать** — пакеты намеренно не
   установлены, валидация только Zod.
6. **`pnpm db:generate` после правки схемы** — иначе тип `User` не получит обязательный
   `passwordHash`, и `tsc` пропустит ошибку.
7. **`tsc --noEmit` не проверяет тесты** — `apps/api/tsconfig.json` исключает `test/` и
   `**/*.spec.ts`. Типовые ошибки в новых спеках всплывут только при `vitest run`.

## Тесты

Юнит (`vitest run`, БД не нужна, паттерн — `src/common/health.controller.spec.ts` с
`Test.createTestingModule`):

- **`src/auth/auth.service.spec.ts`** — `CommandBus`, `QueryBus` и `JwtService` подменяются
  через `useValue` с `vi.fn()`; `argon2` настоящий. Кейсы:
  - `register` шлёт в `CommandBus` именно `CreateUserCommand` с уже **захешированным**
    паролем (проверить `argon2.verify(command.passwordHash, 'исходный пароль')` → `true`,
    и что `command` — `instanceof CreateUserCommand`);
  - `register` возвращает `accessToken` и `user` **без** `passwordHash`;
  - `register` пробрасывает `ConflictException`, если шина его бросила;
  - `login` с верным паролем возвращает токен;
  - `login` с неверным паролем → `UnauthorizedException`;
  - `login`, когда запрос вернул `null` → **тот же** `UnauthorizedException` с тем же
    сообщением (защита от перебора).
- **`src/users/commands/create-user.handler.spec.ts`** — хендлер зовёт `UsersService.create`
  и публикует `UserRegisteredEvent` в `EventBus`; при `ConflictException` из сервиса событие
  **не** публикуется.
- **`src/users/users.service.spec.ts`** — `toUserResponse` отдаёт ISO-строку в `createdAt`
  и не содержит ключа `passwordHash`; `create` при уже существующем email кидает
  `ConflictException`; email нормализуется к нижнему регистру.

E2E (`apps/api/test/auth.e2e-spec.ts`, требует `pnpm db:up` — поднимает весь `AppModule`
с реальным `$connect()`), уникальный email на прогон (`auth-${Date.now()}@test.local`).
Заодно это сквозная проверка, что шины подняты и хендлеры зарегистрированы:

- `POST /api/auth/register` → 201, в теле `accessToken` и `user`, `passwordHash` отсутствует;
- повторный `register` с тем же email → 409;
- `POST /api/auth/login` с верными данными → 200 и токен; с неверным паролем → 401;
- `GET /api/auth/me` без заголовка → 401, с `Bearer <token>` → 200 и тот же `user.id`;
- `GET /api/categories` без токена → 401;
- существующий `app.e2e-spec.ts` (`GET /api/health` → 200) продолжает проходить — это и есть
  проверка, что `@Public()` на health-контроллере не забыт.

## Verification

```bash
pnpm --filter @expense-tracker/api add @nestjs/cqrs@^12.0.0
pnpm db:up
pnpm db:migrate                 # применит NOT NULL на users.passwordHash
pnpm --filter @expense-tracker/api exec prisma generate

pnpm --filter @expense-tracker/api typecheck
pnpm --filter @expense-tracker/api lint
cd apps/api && pnpm exec vitest run          # юнит
cd apps/api && pnpm test:e2e                 # e2e, нужна поднятая БД
```

Ручная проверка на живом приложении (`pnpm dev`, Swagger — <http://localhost:3001/api/docs>,
кнопка Authorize уже настроена через `addBearerAuth()` в `main.ts`):

```bash
# 401 — гвард включён
curl -i http://localhost:3001/api/categories

# 200 — health остался публичным
curl -i http://localhost:3001/api/health

TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","name":"Demo","password":"supersecret"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])')

curl -s http://localhost:3001/api/auth/me -H "Authorization: Bearer $TOKEN"
curl -i http://localhost:3001/api/categories -H "Authorization: Bearer $TOKEN"
# ожидаем НЕ 401, а 404 «Ещё не реализовано» из заглушки CategoriesService —
# это и есть признак, что userId дошёл из токена до сервиса
```

В логах при старте должна появиться строка от `UserRegisteredHandler` после регистрации —
подтверждение, что `EventBus` работает и точка расширения для `categories` жива.
