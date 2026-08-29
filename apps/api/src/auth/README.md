# Модуль авторизации

JWT-авторизация на access-токене (без refresh). `JwtAuthGuard` подключён
глобально в `app.module.ts` через `APP_GUARD` — все маршруты закрыты по
умолчанию, кроме помеченных `@Public()`.

## Маршруты

- `POST /api/auth/register` — `@Public()`. Хеширует пароль через `argon2id`,
  создаёт пользователя командой `CreateUserCommand` (модуль `users`),
  возвращает `{ accessToken, user }`.
- `POST /api/auth/login` — `@Public()`, `200` (не `201` — вход ничего не
  создаёт). Проверяет пароль через `argon2.verify`, отдаёт тот же
  `{ accessToken, user }`. «Нет такого email» и «неверный пароль» дают
  одинаковый `401`, чтобы по коду ответа нельзя было перебирать
  зарегистрированные адреса.
- `GET /api/auth/me` — требует `Bearer`-токен, идентификатор пользователя
  берётся декоратором `@CurrentUser('id')` из `req.user`, который кладёт
  туда `JwtStrategy.validate`.

## Как получить пользователя в контроллере

```ts
@Get()
findAll(@CurrentUser('id') userId: string) { ... }

@Get('me')
me(@CurrentUser() user: AuthenticatedUser) { ... }
```

Публичный маршрут — `@Public()` на хендлере или на всём контроллере
(так помечен `HealthController`).

## Связь с модулем `users`

`auth` не импортирует `UsersModule` и не знает о `UsersService` —
взаимодействие идёт через глобальные `CommandBus`/`QueryBus`
(`CqrsModule.forRoot()` вызван один раз в `app.module.ts`):

- `CreateUserCommand` — регистрация;
- `GetUserCredentialsByEmailQuery` — вход, отдаёт `passwordHash`;
- `GetUserByIdQuery` — `GET /auth/me` и `JwtStrategy.validate`.

Классы команд/запросов — единственный публичный контракт модуля `users`;
сам `UsersService`/`UsersRepository` наружу не экспортируются.
