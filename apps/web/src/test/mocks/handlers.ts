import { http, HttpResponse } from 'msw';

import type { AuthResponse, CategoryResponse } from '@expense-tracker/shared';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const testUser: AuthResponse['user'] = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'demo@example.com',
  name: 'Demo',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const handlers = [
  http.get(`${BASE_URL}/categories`, () =>
    HttpResponse.json<CategoryResponse[]>([
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Продукты',
        type: 'EXPENSE',
        icon: null,
        color: '#22c55e',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]),
  ),
  http.post(`${BASE_URL}/auth/login`, () =>
    HttpResponse.json<AuthResponse>({ accessToken: 'test-token', user: testUser }),
  ),
  http.post(`${BASE_URL}/auth/register`, () =>
    HttpResponse.json<AuthResponse>({ accessToken: 'test-token', user: testUser }, { status: 201 }),
  ),
];
