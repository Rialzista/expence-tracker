import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/mocks/server';

import { TransactionsList } from './transactions-list';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

function renderTransactionsList() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <TransactionsList />
    </QueryClientProvider>,
  );
}

describe('TransactionsList', () => {
  it('рендерит список транзакций с именем категории из join', async () => {
    renderTransactionsList();

    expect(await screen.findByText('Операция 1')).toBeInTheDocument();
    expect(screen.getAllByText(/Продукты/).length).toBeGreaterThan(0);
  });

  it('рендерит меню действий для каждой операции', async () => {
    renderTransactionsList();

    await screen.findByText('Операция 1');
    expect(screen.getAllByRole('button', { name: 'Действия с операцией' }).length).toBeGreaterThan(0);
  });

  it('пагинация: «Назад» задизейблена на первой странице, «Вперёд» — грузит вторую', async () => {
    const user = userEvent.setup();
    renderTransactionsList();

    await screen.findByText('Операция 1');
    expect(screen.getByRole('button', { name: /Назад/ })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Вперёд/ }));

    await waitFor(() => expect(screen.getByText('Страница 2 из 2')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Вперёд/ })).toBeDisabled();
  });

  it('показывает сообщение о пустом списке', async () => {
    server.use(
      http.get(`${BASE_URL}/transactions`, () =>
        HttpResponse.json({ items: [], total: 0, page: 1, limit: 10 }),
      ),
    );
    renderTransactionsList();

    expect(await screen.findByText('Транзакций пока нет.')).toBeInTheDocument();
  });

  it('показывает сообщение об ошибке при сбое сервера', async () => {
    server.use(
      http.get(`${BASE_URL}/transactions`, () =>
        HttpResponse.json({ statusCode: 500, message: 'Не удалось загрузить операции' }, { status: 500 }),
      ),
    );
    renderTransactionsList();

    expect(await screen.findByText('Не удалось загрузить операции')).toBeInTheDocument();
  });

  it('сбой загрузки категорий не ломает список транзакций', async () => {
    server.use(
      http.get(`${BASE_URL}/categories`, () => HttpResponse.json({ message: 'Ошибка' }, { status: 500 })),
    );
    renderTransactionsList();

    const row = await screen.findByText('Операция 1');
    expect(within(row.closest('div')!).queryByText('Продукты')).not.toBeInTheDocument();
  });
});
