import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { TransactionResponse } from '@expense-tracker/shared';

import { EditTransactionDialog } from './edit-transaction-dialog';

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

function renderDialog(open: boolean) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <EditTransactionDialog transaction={testTransaction} open={open} onOpenChange={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe('EditTransactionDialog', () => {
  it('не рендерит форму, когда закрыт', () => {
    renderDialog(false);

    expect(screen.queryByLabelText('Сумма')).not.toBeInTheDocument();
  });

  it('показывает форму с текущими значениями операции, когда открыт', () => {
    renderDialog(true);

    expect(screen.getByLabelText('Сумма')).toHaveValue('25.50');
  });
});
