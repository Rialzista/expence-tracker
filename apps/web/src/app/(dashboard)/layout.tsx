import type { ReactNode } from 'react';

import { AuthGuard } from '@/entities/session';
import { AppHeader } from '@/widgets/app-header';
import { AppSidebar } from '@/widgets/app-sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 px-4 pb-10 sm:px-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
