import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/test/mocks/server';

import { CreateCategoryForm } from './create-category-form';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

function renderForm(onSuccess = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return {
    onSuccess,
    ...render(
      <QueryClientProvider client={queryClient}>
        <CreateCategoryForm onSuccess={onSuccess} />
      </QueryClientProvider>,
    ),
  };
}

describe('CreateCategoryForm', () => {
  it('рендерит поля формы с значениями по умолчанию', () => {
    renderForm();

    expect(screen.getByLabelText('Название')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Зелёный' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Прочее' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Добавить категорию' })).toBeInTheDocument();
  });

  it('показывает ошибку валидации при пустом названии', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Добавить категорию' }));

    expect(await screen.findByText('Название обязательно')).toBeInTheDocument();
  });

  it('после успешного создания вызывает onSuccess', async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderForm();

    await user.type(screen.getByLabelText('Название'), 'Развлечения');
    await user.click(screen.getByRole('button', { name: 'Добавить категорию' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('показывает ошибку сервера', async () => {
    server.use(
      http.post(`${BASE_URL}/categories`, () =>
        HttpResponse.json({ statusCode: 500, message: 'Не удалось создать категорию' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Название'), 'Развлечения');
    await user.click(screen.getByRole('button', { name: 'Добавить категорию' }));

    expect(await screen.findByText('Не удалось создать категорию')).toBeInTheDocument();
  });
});
