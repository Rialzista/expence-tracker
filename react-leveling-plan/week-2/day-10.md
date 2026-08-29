# День 10 — Redux Toolkit

**Неделя:** 2 — State management и работа с данными
**Цель дня:** освоить RTK — до сих пор самый частый ответ в вакансиях на "какой state management используете", особенно в крупных командах.

## Темы
- Zачем нужен RTK поверх "чистого" Redux (сильно меньшеボйлерплейта, чем classic Redux)
- `createSlice` — reducers + actions одним куском, Immer под капотом (можно "мутировать" state прямо в reducer)
- `configureStore`, подключение через `Provider`
- `useSelector`/`useDispatch` (или typed-хуки `useAppSelector`/`useAppDispatch`)
- Коротко: RTK Query как альтернатива TanStack Query (день 11) — для контекста, не как основной инструмент этой недели

## Практика
- [ ] Переписать тот же store (список задач) с Zustand на Redux Toolkit — сравнить объём кода и подход
- [ ] Создать typed-хуки `useAppDispatch`/`useAppSelector` для строгой типизации
- [ ] Посмотреть в Redux DevTools на action log — сравнить опыт отладки с Zustand

## Что должно получиться к концу дня
Понимание сильных и слабых сторон RTK vs Zustand на одной и той же задаче — аргументированный выбор под конкретный проект вместо "просто по привычке".

## Заметки
