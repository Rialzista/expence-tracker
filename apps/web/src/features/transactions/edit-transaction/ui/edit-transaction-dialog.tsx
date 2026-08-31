'use client';

import type { TransactionResponse } from '@expense-tracker/shared';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

import { EditTransactionForm } from './edit-transaction-form';

interface EditTransactionDialogProps {
  transaction: TransactionResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialog({ transaction, open, onOpenChange }: EditTransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать операцию</DialogTitle>
        </DialogHeader>
        <EditTransactionForm transaction={transaction} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
