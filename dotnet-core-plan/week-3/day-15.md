# День 15 — EF Core basics: DbContext, DbSet

**Неделя:** 3 — Данные (EF Core)
**Цель дня:** освоить базовую модель EF Core — если раньше был EF6, синтаксис в основном похож, но конфигурация другая.

## Темы
- `DbContext`, `DbSet<T>` — что это и как регистрируется через DI (`AddDbContext`)
- Способы конфигурации моделей: Data Annotations vs Fluent API (`OnModelCreating`)
- Отличия от EF6: кроссплатформенность, `DbContextOptions`, отказ от `EDMX`/Designer-подхода

## Практика
- [ ] Установить пакет `Microsoft.EntityFrameworkCore` + провайдер (SQLite для начала)
- [ ] Создать `DbContext` с одним `DbSet<T>` (например, `TaskItem` из недели 1/2)
- [ ] Зарегистрировать `DbContext` через `AddDbContext` в DI
- [ ] Настроить пару полей через Fluent API в `OnModelCreating` (например, `MaxLength`, required)

## Что должно получиться к концу дня
Рабочий `DbContext`, зарегистрированный через DI, с одной моделью, настроенной через Fluent API.

## Заметки
