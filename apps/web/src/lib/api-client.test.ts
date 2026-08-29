import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/mocks/server';
import { ApiRequestError, api } from './api-client';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

describe('api-client', () => {
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
});
