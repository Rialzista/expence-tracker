import Link from 'next/link';

import { SidebarNavLinks } from './sidebar-nav-links';

export function AppSidebar() {
  return (
    <aside className="flex w-16 shrink-0 flex-col justify-between bg-primary px-2 py-6 lg:w-64 lg:px-4">
      <div className="flex flex-col gap-8">
        <Link
          href="/"
          className="px-2 text-lg font-extrabold tracking-tight text-primary-foreground"
        >
          <span className="lg:hidden">Т</span>
          <span className="hidden lg:inline">Трекер</span>
        </Link>
        <SidebarNavLinks />
      </div>
    </aside>
  );
}
