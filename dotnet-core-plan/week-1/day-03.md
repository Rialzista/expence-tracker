# День 3 — Nullable reference types, pattern matching

**Неделя:** 1 — Язык и экосистема
**Цель дня:** освоить главные синтаксические новшества C#, изменившие стиль кода с "до Core" эпохи.

## Темы
- Nullable reference types: `string?` vs `string`, `#nullable enable`, предупреждения компилятора
- Pattern matching: `switch` expressions, `is`/`when`, deconstruction
- Null-conditional и null-coalescing операторы (`?.`, `??`, `??=`) — если давно не использовали

## Практика
- [ ] Включить `<Nullable>enable</Nullable>` в проекте и пройтись по warnings
- [ ] Переписать пару if/else цепочек через `switch` expression
- [ ] Написать функцию с pattern matching по типу объекта (`is SomeType t`)
- [ ] Потренировать `??=` и `?.` на паре примеров

## Что должно получиться к концу дня
Код читается и пишется в современном стиле C#, nullable-warnings понятны и не пугают.

## Заметки
