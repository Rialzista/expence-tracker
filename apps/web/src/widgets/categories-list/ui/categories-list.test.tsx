import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/mocks/server';

import { CategoriesList } from './categories-list';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

function renderCategoriesList() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CategoriesList />
    </QueryClientProvider>,
  );
}

describe('CategoriesList', () => {
  it('группирует категории по типу', async () => {
    renderCategoriesList();

    expect(await screen.findByText('Продукты')).toBeInTheDocument();
    expect(screen.getByText('Зарплата')).toBeInTheDocument();
    expect(screen.getByText('Расходы')).toBeInTheDocument();
    expect(screen.getByText('Доходы')).toBeInTheDocument();
  });

  it('показывает сообщение о пустом списке', async () => {
    server.use(http.get(`${BASE_URL}/categories`, () => HttpResponse.json([])));
    renderCategoriesList();

    expect(await screen.findByText('Категорий пока нет.')).toBeInTheDocument();
  });

  it('показывает сообщение об ошибке при сбое сервера', async () => {
    server.use(
      http.get(`${BASE_URL}/categories`, () =>
        HttpResponse.json({ statusCode: 500, message: 'Не удалось загрузить категории' }, { status: 500 }),
      ),
    );
    renderCategoriesList();

    expect(await screen.findByText('Не удалось загрузить категории')).toBeInTheDocument();
  });
});
