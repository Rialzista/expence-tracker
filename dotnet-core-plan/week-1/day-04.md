# День 4 — Records, top-level statements, async/await refresher

**Неделя:** 1 — Язык и экосистема
**Цель дня:** добавить в арсенал records и top-level statements, освежить async/await.

## Темы
- `record` — value-based equality, immutability, `with`-выражения
- Top-level statements (`Program.cs` без `class Program { static void Main() }`)
- Target-typed `new()`
- async/await: `Task`, `Task<T>`, `async Main`, разница между `Task.Run` и `async`-методом

## Практика
- [ ] Заменить пару DTO-классов на `record`, попробовать `with`
- [ ] Написать async-метод, возвращающий `Task<T>`, и вызвать его из `async Main`
- [ ] Понять разницу между CPU-bound (`Task.Run`) и I/O-bound (`await httpClient.GetAsync(...)`) асинхронностью

## Что должно получиться к концу дня
Уверенное использование records и понимание, когда и зачем ставить `await`.

## Заметки
