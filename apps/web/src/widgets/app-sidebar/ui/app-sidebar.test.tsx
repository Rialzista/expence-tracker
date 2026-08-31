import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppSidebar } from './app-sidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/transactions',
}));

describe('AppSidebar', () => {
  it('подсвечивает активную ссылку по текущему pathname', () => {
    render(<AppSidebar />);

    expect(screen.getByRole('link', { name: /Операции/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Категории/ })).not.toHaveAttribute('aria-current');
  });
});
