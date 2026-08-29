# День 2 — Структура проекта, .csproj, шаблоны

**Неделя:** 1 — Язык и экосистема
**Цель дня:** понять, из чего состоит .NET-проект, и что заменяет старый `.csproj`-формат из Framework-эпохи.

## Темы
- Новый SDK-style `.csproj` (сравнить с verbose-форматом старого Framework)
- `dotnet new list` — какие шаблоны есть из коробки (console, classlib, webapi, mvc, blazor и т.д.)
- NuGet через CLI: `dotnet add package`, `dotnet restore`
- Solution-файлы: `dotnet new sln`, `dotnet sln add`

## Практика
- [ ] Открыть `.csproj` и разобрать, за что отвечает каждая секция (TargetFramework, PackageReference и т.д.)
- [ ] Создать solution с двумя проектами (например, `class library` + `console`), связать их через `dotnet add reference`
- [ ] Добавить NuGet-пакет через CLI (например, `Newtonsoft.Json` или любой другой) и использовать в коде
- [ ] Сравнить мысленно со старым `.csproj` — что упростилось

## Что должно получиться к концу дня
Уверенное понимание структуры multi-project solution и работы с зависимостями через CLI.

## Заметки
