# День 13 — Конфигурация, Swagger/OpenAPI

**Неделя:** 2 — ASP.NET Core фундамент
**Цель дня:** освоить конфигурацию приложения (замена `web.config`) и автодокументацию API.

## Темы
- `appsettings.json` + `appsettings.{Environment}.json`, переменные окружения
- `IOptions<T>` / `IOptionsSnapshot<T>` — типизированный доступ к конфигу вместо `ConfigurationManager.AppSettings[...]`
- Встроенная поддержка Swagger/OpenAPI (`AddEndpointsApiExplorer`, `AddSwaggerGen`)
- Разделение конфигов по окружениям (Development/Production)

## Практика
- [ ] Добавить секцию в `appsettings.json`, замапить её на strongly-typed класс через `IOptions<T>`
- [ ] Внедрить этот класс в сервис через DI и использовать значение
- [ ] Подключить Swagger UI и открыть `/swagger` — убедиться, что все эндпоинты недели видны и тестируются прямо оттуда

## Что должно получиться к концу дня
Строго типизированная конфигурация + живая Swagger-документация по API.

## Заметки
