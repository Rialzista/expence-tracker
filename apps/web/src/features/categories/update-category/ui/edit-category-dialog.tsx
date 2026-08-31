'use client';

import type { CategoryResponse } from '@expense-tracker/shared';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

import { UpdateCategoryForm } from './update-category-form';

interface EditCategoryDialogProps {
  category: CategoryResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCategoryDialog({ category, open, onOpenChange }: EditCategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать категорию</DialogTitle>
        </DialogHeader>
        <UpdateCategoryForm category={category} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
