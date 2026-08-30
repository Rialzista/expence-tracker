import Link from 'next/link';

import { NavLinks } from './nav-links';
import { UserMenu } from './user-menu';

export function AppHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold">
            Трекер расходов
          </Link>
          <NavLinks />
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
