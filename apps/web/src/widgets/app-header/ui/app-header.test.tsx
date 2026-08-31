import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/entities/session';

import { AppHeader } from './app-header';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/',
}));

const testUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'demo@example.com',
  name: 'Demo User',
  createdAt: '2026-01-01T00:00:00.000Z',
};

afterEach(() => {
  pushMock.mockClear();
  useSessionStore.setState({ accessToken: null, user: null });
});

describe('AppHeader', () => {
  it('не показывает профиль, если пользователь не залогинен', () => {
    render(<AppHeader />);

    expect(screen.getByRole('link', { name: 'Войти' })).toBeInTheDocument();
    expect(screen.queryByTestId('user-menu-trigger')).not.toBeInTheDocument();
  });

  it('показывает имя и email пользователя в меню профиля', async () => {
    useSessionStore.setState({ accessToken: 'test-token', user: testUser });
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByTestId('user-menu-trigger'));

    expect(await screen.findByText('Demo User')).toBeInTheDocument();
    expect(screen.getByText('demo@example.com')).toBeInTheDocument();
  });

  it('клик «Выйти» очищает сессию и делает редирект на /login', async () => {
    useSessionStore.setState({ accessToken: 'test-token', user: testUser });
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByTestId('user-menu-trigger'));
    await user.click(await screen.findByText('Выйти'));

    expect(pushMock).toHaveBeenCalledWith('/login');
    expect(useSessionStore.getState().accessToken).toBeNull();
  });
});
