# CLAUDE.md — apps/api

Контекст для Claude Code при работе с NestJS-бэкендом. Общая структура монорепо,
команды запуска, git-флоу, конвенции коммитов и устройство `packages/shared` —
в `CLAUDE.md` в корне монорепозитория, этот файл их не дублирует.

## Что нужно знать при правке apps/api

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

## Актуализация документации

После изменения любых методов необходимо актуализировать или добавить JSDoc.
А для методов контроллеров — актуализировать декораторы Swagger
(`@ApiOperation`/`@ApiResponse`). DTO в проекте — это `z.infer` от Zod-схем,
а не классы, поэтому вешать на них `@ApiProperty` некуда — это правило
их не касается (см. «`nestjs-zod` не используется» выше).
