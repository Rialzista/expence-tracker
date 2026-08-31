import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type { TransactionResponse } from '@expense-tracker/shared';

import { server } from '@/test/mocks/server';

import { DeleteTransactionDialog } from './delete-transaction-dialog';

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

function renderDialog(onOpenChange = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return {
    onOpenChange,
    ...render(
      <QueryClientProvider client={queryClient}>
        <DeleteTransactionDialog transaction={testTransaction} open onOpenChange={onOpenChange} />
      </QueryClientProvider>,
    ),
  };
}

describe('DeleteTransactionDialog', () => {
  it('подтверждение удаляет операцию и закрывает диалог', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Удалить' }));

    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('показывает ошибку и не закрывает диалог при гонке (операция уже удалена)', async () => {
    server.use(
      http.delete(`${BASE_URL}/transactions/${testTransaction.id}`, () =>
        HttpResponse.json({ statusCode: 404, message: 'Операция не найдена' }, { status: 404 }),
      ),
    );
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Удалить' }));

    expect(await screen.findByText('Операция не найдена')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
