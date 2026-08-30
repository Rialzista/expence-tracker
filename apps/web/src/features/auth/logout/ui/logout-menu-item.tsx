'use client';

import { LogOut } from 'lucide-react';

import { DropdownMenuItem } from '@/shared/ui/dropdown-menu';

import { useLogout } from '../model/use-logout';

export function LogoutMenuItem() {
  const logout = useLogout();

  return (
    <DropdownMenuItem variant="destructive" onClick={logout}>
      <LogOut />
      Выйти
    </DropdownMenuItem>
  );
}
