import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type { CategoryResponse } from '@expense-tracker/shared';

import { server } from '@/test/mocks/server';

import { UpdateCategoryForm } from './update-category-form';

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

function renderForm(onSuccess = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return {
    onSuccess,
    ...render(
      <QueryClientProvider client={queryClient}>
        <UpdateCategoryForm category={testCategory} onSuccess={onSuccess} />
      </QueryClientProvider>,
    ),
  };
}

describe('UpdateCategoryForm', () => {
  it('заполняет поля текущими значениями категории', () => {
    renderForm();

    expect(screen.getByLabelText('Название')).toHaveValue('Продукты');
    expect(screen.getByRole('button', { name: 'Зелёный' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Сохранить изменения' })).toBeInTheDocument();
  });

  it('после успешного сохранения вызывает onSuccess', async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderForm();

    await user.clear(screen.getByLabelText('Название'));
    await user.type(screen.getByLabelText('Название'), 'Еда');
    await user.click(screen.getByRole('button', { name: 'Сохранить изменения' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('показывает конфликт имени при дублировании названия', async () => {
    server.use(
      http.patch(`${BASE_URL}/categories/${testCategory.id}`, () =>
        HttpResponse.json(
          { statusCode: 409, message: 'Категория с таким названием уже существует' },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderForm();

    await user.clear(screen.getByLabelText('Название'));
    await user.type(screen.getByLabelText('Название'), 'Зарплата');
    await user.click(screen.getByRole('button', { name: 'Сохранить изменения' }));

    expect(await screen.findByText('Категория с таким названием уже существует')).toBeInTheDocument();
  });
});
