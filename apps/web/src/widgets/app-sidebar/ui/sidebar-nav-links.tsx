'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PieChart, Receipt, Tags } from 'lucide-react';

import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/transactions', label: 'Операции', icon: Receipt },
  { href: '/categories', label: 'Категории', icon: Tags },
  { href: '/stats', label: 'Статистика', icon: PieChart },
];

export function SidebarNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            title={link.label}
            className={cn(
              'flex items-center justify-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors lg:justify-start lg:px-4',
              isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white',
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="hidden lg:inline">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
