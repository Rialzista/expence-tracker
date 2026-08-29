# День 6 — .NET Framework vs .NET Core vs unified .NET

**Неделя:** 1 — Язык и экосистема
**Цель дня:** уложить в голове, что произошло с платформой за это время — концептуальная картина, без которой сложно ориентироваться в статьях/вакансиях.

## Темы
- .NET Framework (Windows-only) → .NET Core (кроссплатформенный) → унификация в .NET 5+ (Core и Framework больше не разделены)
- Отказ от `web.config`/`Global.asax`/`HttpModules` в пользу `appsettings.json` + middleware pipeline
- Kestrel как встроенный веб-сервер (вместо жёсткой привязки к IIS)
- LTS vs STS релизы — какую версию выбирать для реальных проектов

## Практика
- [ ] Прочитать официальный обзор миграции с .NET Framework на .NET (Microsoft Learn — "Overview of porting from .NET Framework to .NET")
- [ ] Составить для себя короткую таблицу-шпаргалку: "было / стало" (IIS→Kestrel, web.config→appsettings.json, HttpModules→middleware, Ninject/Unity→встроенный DI)

## Что должно получиться к концу дня
Ясная ментальная карта эволюции платформы — не нужно гадать, откуда что взялось, когда встретится в коде.

## Заметки
