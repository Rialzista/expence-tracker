import type { ApiError } from '@expense-tracker/shared';

import { useSessionStore } from '@/entities/session';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/**
 * Тонкая обёртка над fetch: axios здесь не нужен — нативный fetch в Next
 * умеет кешироваться и работает и в Server, и в Client Components.
 *
 * Токен читается через `useSessionStore.getState()` (не хук), т.к. это синхронный
 * доступ вне React-дерева. Стор персистится в localStorage — в Server Components
 * его ещё нет, поэтому там accessToken всегда null. Для этой задачи не критично:
 * защищённые данные грузятся из клиентских компонентов через TanStack Query.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { accessToken } = useSessionStore.getState();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;

    // Access-токен истёк или невалиден (без refresh-flow восстановить его нечем) —
    // сбрасываем сессию, чтобы UI сразу переключился на анонимное состояние.
    if (response.status === 401) {
      useSessionStore.getState().clearSession();
    }

    throw new ApiRequestError(
      response.status,
      body?.message ?? `Запрос завершился с кодом ${response.status}`,
      body?.errors,
    );
  }

  // 204 No Content — тела нет, разбирать нечего.
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** Текст ошибки для UI: сообщение бэкенда из ApiRequestError, иначе — fallback. */
export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiRequestError ? error.message : fallback;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => apiFetch<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, body: unknown, init?: RequestInit) =>
    apiFetch<T>(path, { ...init, method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown, init?: RequestInit) =>
    apiFetch<T>(path, { ...init, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, init?: RequestInit) => apiFetch<T>(path, { ...init, method: 'DELETE' }),
};
