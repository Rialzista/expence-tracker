import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/entities/session';
import { server } from '@/test/mocks/server';

import { RegisterForm } from './register-form';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

function renderRegisterForm() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RegisterForm />
    </QueryClientProvider>,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Имя'), 'Demo');
  await user.type(screen.getByLabelText('Email'), 'demo@example.com');
  await user.type(screen.getByLabelText('Пароль'), 'password123');
  await user.click(screen.getByRole('checkbox'));
}

afterEach(() => {
  pushMock.mockClear();
  useSessionStore.setState({ accessToken: null, user: null });
  localStorage.clear();
});

describe('RegisterForm', () => {
  it('рендерит поля формы', () => {
    renderRegisterForm();

    expect(screen.getByLabelText('Имя')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Зарегистрироваться' })).toBeInTheDocument();
  });

  it('показывает ошибку валидации при слишком коротком пароле', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    await user.type(screen.getByLabelText('Имя'), 'Demo');
    await user.type(screen.getByLabelText('Email'), 'demo@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'short');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    expect(await screen.findByText('Минимум 8 символов')).toBeInTheDocument();
  });

  it('показывает ошибку валидации, если не отмечено согласие с условиями', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    await user.type(screen.getByLabelText('Имя'), 'Demo');
    await user.type(screen.getByLabelText('Email'), 'demo@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    expect(await screen.findByText('Нужно согласиться с условиями')).toBeInTheDocument();
  });

  it('после успешной регистрации сохраняет сессию и делает редирект', async () => {
    const user = userEvent.setup();
    renderRegisterForm();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'));
    expect(useSessionStore.getState().accessToken).toBe('test-token');
  });

  it('показывает ошибку сервера при занятом email', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/register`, () =>
        HttpResponse.json(
          { statusCode: 409, message: 'Пользователь с таким email уже существует' },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderRegisterForm();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    expect(await screen.findByText('Пользователь с таким email уже существует')).toBeInTheDocument();
  });
});
