# Новая функциональность - Создать модуль транзакций

## Контектс
Проект: Nest.js + Next + PostgreSQL + Prisma
Что уже есть: User, авторизация JWT, модуль категорий + frontend Авторизация

## Задача
Создай TransactionModule - центральный модуль приложения для учета доходов и расходов

## Модель данных
Добавь модель Transaction в schema-prisma:

- id (String, uuid, @default(uuid()))
- amount (Decimal)
- type (Enum: INCOME, EXPENSE)
- description (String, nullable)
- date (DateTime)
- categoryId (String, связь с Category)
- userId (String, связь с User)
- createdAt (DateTime, @default (now()))

Обнови модели User и Category - добавь обратные связи transactions Transaction I]

После изменения схемы создай и примени миграцию:
npx prisma migrate dev --name add-transactions

## Контроллер
- POST /transactions: создать транзакцию
- GET /transactions: список с query параметрами dateFrom, dateTo, type, categoryId (по пользователю)
- GET /transactions/summary: агрегация, query параметры month и year (оба обязательные)
- GET /transactions/:id: одна транзакция
- PATCH /transactions/:id: обновить
- DELETE /transactions/:id: удалить

## Паттерн
Используй @apps/api/src/categories как образец структуры для backend

## Ограничения
- Не добавлять зависимости если не указано в задаче
- После реализации собрай проект