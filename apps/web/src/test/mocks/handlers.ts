import { http, HttpResponse } from 'msw';

import type {
  AuthResponse,
  CategoryResponse,
  CreateTransactionDto,
  Paginated,
  TransactionResponse,
} from '@expense-tracker/shared';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const testUser: AuthResponse['user'] = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'demo@example.com',
  name: 'Demo',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const testCategories: CategoryResponse[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Продукты',
    type: 'EXPENSE',
    icon: null,
    color: '#22c55e',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Зарплата',
    type: 'INCOME',
    icon: null,
    color: '#3b82f6',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const testTransactions: TransactionResponse[] = Array.from({ length: 12 }, (_, index) => {
  const isIncome = (index + 1) % 5 === 0;

  return {
    id: `44444444-4444-4444-8444-4444444444${index.toString().padStart(2, '0')}`,
    amount: isIncome ? '1000.00' : '25.50',
    currency: 'USD',
    type: isIncome ? 'INCOME' : 'EXPENSE',
    date: new Date(2026, 0, 12 - index).toISOString(),
    note: isIncome ? null : `Операция ${index + 1}`,
    categoryId: isIncome ? testCategories[1]!.id : testCategories[0]!.id,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
});

export const handlers = [
  http.get(`${BASE_URL}/categories`, () => HttpResponse.json<CategoryResponse[]>(testCategories)),
  http.get(`${BASE_URL}/transactions`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '20');
    const start = (page - 1) * limit;

    return HttpResponse.json<Paginated<TransactionResponse>>({
      items: testTransactions.slice(start, start + limit),
      total: testTransactions.length,
      page,
      limit,
    });
  }),
  http.post(`${BASE_URL}/transactions`, async ({ request }) => {
    const dto = (await request.json()) as CreateTransactionDto;

    return HttpResponse.json<TransactionResponse>(
      {
        id: '55555555-5555-4555-8555-555555555555',
        amount: dto.amount,
        currency: dto.currency,
        type: dto.type,
        date: dto.date,
        note: dto.note ?? null,
        categoryId: dto.categoryId ?? null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      { status: 201 },
    );
  }),
  http.post(`${BASE_URL}/auth/login`, () =>
    HttpResponse.json<AuthResponse>({ accessToken: 'test-token', user: testUser }),
  ),
  http.post(`${BASE_URL}/auth/register`, () =>
    HttpResponse.json<AuthResponse>({ accessToken: 'test-token', user: testUser }, { status: 201 }),
  ),
];
