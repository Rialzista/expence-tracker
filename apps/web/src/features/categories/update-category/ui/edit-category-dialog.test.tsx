import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { CategoryResponse } from '@expense-tracker/shared';

import { EditCategoryDialog } from './edit-category-dialog';

const testCategory: CategoryResponse = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Продукты',
  type: 'EXPENSE',
  icon: null,
  color: '#22c55e',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderDialog(open: boolean) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <EditCategoryDialog category={testCategory} open={open} onOpenChange={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe('EditCategoryDialog', () => {
  it('не рендерит форму, когда закрыт', () => {
    renderDialog(false);

    expect(screen.queryByLabelText('Название')).not.toBeInTheDocument();
  });

  it('показывает форму с текущими значениями категории, когда открыт', () => {
    renderDialog(true);

    expect(screen.getByLabelText('Название')).toHaveValue('Продукты');
  });
});
