# День 8 — Middleware pipeline

**Неделя:** 2 — ASP.NET Core фундамент
**Цель дня:** понять новую модель обработки HTTP-запросов — концептуальная замена `HttpModules`/`HttpHandlers`.

## Темы
- Что такое middleware pipeline, `app.Use(...)`, `app.Run(...)`
- Порядок регистрации middleware = порядок выполнения (важно!)
- Встроенные middleware: `UseRouting`, `UseAuthentication`, `UseAuthorization`, `UseStaticFiles`
- `RequestDelegate` и как middleware передаёт управление дальше (`next()`)

## Практика
- [ ] Создать проект: `dotnet new web -n PipelineDemo`
- [ ] Добавить 2-3 своих `app.Use(...)` с логированием в консоль (до/после `next()`) — увидеть порядок выполнения вживую
- [ ] Специально поменять порядок middleware местами и посмотреть, как меняется поведение
- [ ] Изучить, чем `app.Use` отличается от `app.Run` (terminal middleware)

## Что должно получиться к концу дня
Понимание, что каждый HTTP-запрос проходит через цепочку middleware, и вы управляете этой цепочкой явно.

## Заметки
