import type { ReactNode } from 'react';

import { AppHeader } from '@/widgets/app-header';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
