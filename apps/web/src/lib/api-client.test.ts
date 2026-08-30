import { HttpResponse, http } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { useSessionStore } from '@/entities/session';
import { server } from '@/test/mocks/server';
import { ApiRequestError, api } from './api-client';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

describe('api-client', () => {
  afterEach(() => {
    useSessionStore.setState({ accessToken: null, user: null });
  });

  it('возвращает разобранное тело успешного ответа', async () => {
    const categories = await api.get<Array<{ name: string }>>('/categories');

    expect(categories[0]?.name).toBe('Продукты');
  });

  it('превращает ответ с ошибкой в ApiRequestError', async () => {
    server.use(
      http.get(`${BASE_URL}/categories`, () =>
        HttpResponse.json({ statusCode: 500, message: 'Всё сломалось' }, { status: 500 }),
      ),
    );

    await expect(api.get('/categories')).rejects.toThrowError(ApiRequestError);
  });

  it('подставляет Authorization, если в сессии есть токен', async () => {
    useSessionStore.setState({ accessToken: 'test-token', user: null });

    let receivedAuthHeader: string | null = null;
    server.use(
      http.get(`${BASE_URL}/categories`, ({ request }) => {
        receivedAuthHeader = request.headers.get('Authorization');
        return HttpResponse.json([]);
      }),
    );

    await api.get('/categories');

    expect(receivedAuthHeader).toBe('Bearer test-token');
  });

  it('не добавляет Authorization, если токена нет', async () => {
    let receivedAuthHeader: string | null = 'not-checked-yet';
    server.use(
      http.get(`${BASE_URL}/categories`, ({ request }) => {
        receivedAuthHeader = request.headers.get('Authorization');
        return HttpResponse.json([]);
      }),
    );

    await api.get('/categories');

    expect(receivedAuthHeader).toBeNull();
  });

  it('сбрасывает сессию при 401 от бэкенда', async () => {
    useSessionStore.setState({
      accessToken: 'expired-token',
      user: { id: '1', email: 'a@b.c', name: 'A', createdAt: '2026-01-01T00:00:00.000Z' },
    });
    server.use(
      http.get(`${BASE_URL}/categories`, () =>
        HttpResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 }),
      ),
    );

    await expect(api.get('/categories')).rejects.toThrowError(ApiRequestError);

    expect(useSessionStore.getState().accessToken).toBeNull();
    expect(useSessionStore.getState().user).toBeNull();
  });
});
