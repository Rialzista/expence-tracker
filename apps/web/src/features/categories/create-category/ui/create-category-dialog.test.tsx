import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { CreateCategoryDialog } from './create-category-dialog';

function renderDialog() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CreateCategoryDialog />
    </QueryClientProvider>,
  );
}

describe('CreateCategoryDialog', () => {
  it('открывает форму создания категории по клику на кнопку', async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(screen.queryByLabelText('Название')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Добавить категорию' }));

    expect(await screen.findByLabelText('Название')).toBeInTheDocument();
  });
});
