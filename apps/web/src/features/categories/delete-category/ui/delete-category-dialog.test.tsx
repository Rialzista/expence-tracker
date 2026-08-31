import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type { CategoryResponse } from '@expense-tracker/shared';

import { server } from '@/test/mocks/server';

import { DeleteCategoryDialog } from './delete-category-dialog';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const testCategory: CategoryResponse = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Продукты',
  type: 'EXPENSE',
  icon: null,
  color: '#22c55e',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderDialog(onOpenChange = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return {
    onOpenChange,
    ...render(
      <QueryClientProvider client={queryClient}>
        <DeleteCategoryDialog category={testCategory} open onOpenChange={onOpenChange} />
      </QueryClientProvider>,
    ),
  };
}

describe('DeleteCategoryDialog', () => {
  it('подтверждение удаляет категорию и закрывает диалог', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Удалить' }));

    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('показывает ошибку и не закрывает диалог при гонке (категория уже удалена)', async () => {
    server.use(
      http.delete(`${BASE_URL}/categories/${testCategory.id}`, () =>
        HttpResponse.json({ statusCode: 404, message: 'Категория не найдена' }, { status: 404 }),
      ),
    );
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Удалить' }));

    expect(await screen.findByText('Категория не найдена')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
