# День 17 — Реальная БД (SQLite), async CRUD

**Неделя:** 3 — Данные (EF Core)
**Цель дня:** подключить CRUD-эндпоинты недели 2 к реальной базе данных вместо in-memory списка.

## Темы
- Async-методы EF Core: `ToListAsync`, `FirstOrDefaultAsync`, `AddAsync`, `SaveChangesAsync`
- Инъекция `DbContext` в контроллер/сервис через конструктор (Scoped lifetime — почему именно Scoped)
- `Find` vs `FirstOrDefaultAsync` — разница в поведении

## Практика
- [ ] Заменить in-memory сервис из недели 2 на сервис, использующий `DbContext`
- [ ] Переписать все CRUD-операции на async-методы EF Core
- [ ] Проверить через Swagger, что данные реально сохраняются между перезапусками приложения

## Что должно получиться к концу дня
Todo API из недели 2 теперь работает на реальной SQLite-базе, все операции — async.

## Заметки
