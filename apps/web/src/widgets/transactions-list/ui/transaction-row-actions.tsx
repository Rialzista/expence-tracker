'use client';

import { useState } from 'react';
import { MoreVertical } from 'lucide-react';

import type { TransactionResponse } from '@expense-tracker/shared';

import { DeleteTransactionDialog } from '@/features/transactions/delete-transaction';
import { EditTransactionDialog } from '@/features/transactions/edit-transaction';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

interface TransactionRowActionsProps {
  transaction: TransactionResponse;
}

export function TransactionRowActions({ transaction }: TransactionRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Действия с операцией">
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>Редактировать</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditTransactionDialog transaction={transaction} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteTransactionDialog transaction={transaction} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
