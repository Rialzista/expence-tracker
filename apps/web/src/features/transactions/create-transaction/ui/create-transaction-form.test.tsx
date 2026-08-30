import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/test/mocks/server';

import { CreateTransactionForm } from './create-transaction-form';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

function renderForm(onSuccess = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return { onSuccess, ...render(
    <QueryClientProvider client={queryClient}>
      <CreateTransactionForm onSuccess={onSuccess} />
    </QueryClientProvider>,
  ) };
}

describe('CreateTransactionForm', () => {
  it('рендерит поля формы с значениями по умолчанию', () => {
    renderForm();

    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    expect(screen.getByLabelText('Сумма')).toBeInTheDocument();
    expect(screen.getByLabelText('Дата')).toHaveValue(localToday);
    expect(screen.getByRole('button', { name: 'Добавить операцию' })).toBeInTheDocument();
  });

  it('показывает ошибку валидации при некорректной сумме', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Сумма'), 'не число');
    await user.click(screen.getByRole('button', { name: 'Добавить операцию' }));

    expect(await screen.findByText('Ожидается сумма с не более чем двумя знаками после точки')).toBeInTheDocument();
  });

  it('после успешного создания вызывает onSuccess', async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderForm();

    await user.type(screen.getByLabelText('Сумма'), '42.50');
    await user.click(screen.getByRole('button', { name: 'Добавить операцию' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('показывает ошибку сервера', async () => {
    server.use(
      http.post(`${BASE_URL}/transactions`, () =>
        HttpResponse.json({ statusCode: 404, message: 'Категория не найдена' }, { status: 404 }),
      ),
    );
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Сумма'), '42.50');
    await user.click(screen.getByRole('button', { name: 'Добавить операцию' }));

    expect(await screen.findByText('Категория не найдена')).toBeInTheDocument();
  });
});
