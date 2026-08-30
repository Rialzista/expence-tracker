import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { CreateTransactionDialog } from './create-transaction-dialog';

function renderDialog() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CreateTransactionDialog />
    </QueryClientProvider>,
  );
}

describe('CreateTransactionDialog', () => {
  it('открывает форму создания операции по клику на кнопку', async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(screen.queryByLabelText('Сумма')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Добавить операцию' }));

    expect(await screen.findByLabelText('Сумма')).toBeInTheDocument();
  });
});
