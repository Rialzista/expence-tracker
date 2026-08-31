import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type { TransactionResponse, UpdateTransactionDto } from '@expense-tracker/shared';

import { server } from '@/test/mocks/server';

import { EditTransactionForm } from './edit-transaction-form';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const testTransaction: TransactionResponse = {
  id: '44444444-4444-4444-8444-444444444400',
  amount: '25.50',
  currency: 'USD',
  type: 'EXPENSE',
  date: '2026-01-05T00:00:00.000Z',
  note: 'Операция 1',
  categoryId: '11111111-1111-4111-8111-111111111111',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderForm(onSuccess = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return {
    onSuccess,
    ...render(
      <QueryClientProvider client={queryClient}>
        <EditTransactionForm transaction={testTransaction} onSuccess={onSuccess} />
      </QueryClientProvider>,
    ),
  };
}

describe('EditTransactionForm', () => {
  it('заполняет поля текущими значениями операции', async () => {
    renderForm();

    expect(screen.getByLabelText('Сумма')).toHaveValue('25.50');
    expect(screen.getByLabelText('Заметка')).toHaveValue('Операция 1');
    expect(await screen.findByLabelText('Дата')).toHaveValue('2026-01-05');
  });

  it('после успешного сохранения вызывает onSuccess', async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Сохранить изменения' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('очистка заметки и выбор «Без категории» отправляют null, а не undefined', async () => {
    let capturedDto: UpdateTransactionDto | undefined;
    server.use(
      http.patch(`${BASE_URL}/transactions/${testTransaction.id}`, async ({ request }) => {
        capturedDto = (await request.json()) as UpdateTransactionDto;

        return HttpResponse.json<TransactionResponse>({ ...testTransaction, ...capturedDto });
      }),
    );
    const user = userEvent.setup();
    renderForm();

    await user.clear(screen.getByLabelText('Заметка'));
    await user.click(screen.getByRole('combobox', { name: 'Категория' }));
    await user.click(await screen.findByRole('option', { name: 'Без категории' }));
    await user.click(screen.getByRole('button', { name: 'Сохранить изменения' }));

    await vi.waitFor(() => expect(capturedDto).toBeDefined());
    expect(capturedDto?.note).toBeNull();
    expect(capturedDto?.categoryId).toBeNull();
  });

  it('показывает ошибку сервера', async () => {
    server.use(
      http.patch(`${BASE_URL}/transactions/${testTransaction.id}`, () =>
        HttpResponse.json({ statusCode: 404, message: 'Операция не найдена' }, { status: 404 }),
      ),
    );
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Сохранить изменения' }));

    expect(await screen.findByText('Операция не найдена')).toBeInTheDocument();
  });
});
