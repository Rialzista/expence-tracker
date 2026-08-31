import { Bell, Search, Settings } from 'lucide-react';

import { Input } from '@/shared/ui/input';

import { UserMenu } from './user-menu';

export function AppHeader() {
  return (
    <header className="flex items-center justify-between gap-4 px-4 py-6 sm:px-8">
      <div className="relative hidden w-full max-w-sm sm:block">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Поиск операций…" className="rounded-full bg-card pl-11" />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full bg-card text-muted-foreground hover:text-foreground"
        >
          <Bell className="size-4" />
        </button>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full bg-card text-muted-foreground hover:text-foreground"
        >
          <Settings className="size-4" />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
