'use client';

import { useState } from 'react';

import type { CategoryResponse } from '@expense-tracker/shared';

import { getErrorMessage } from '@/lib/api-client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';

import { useDeleteCategory } from '../model/use-delete-category';

interface DeleteCategoryDialogProps {
  category: CategoryResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCategoryDialog({ category, open, onOpenChange }: DeleteCategoryDialogProps) {
  const deleteCategory = useDeleteCategory();
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleDelete = async () => {
    try {
      await deleteCategory.mutateAsync(category.id);
      handleOpenChange(false);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Не удалось удалить категорию'));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить категорию «{category.name}»?</AlertDialogTitle>
          <AlertDialogDescription>
            Операции с этой категорией останутся, но потеряют привязку к ней. Действие необратимо.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteCategory.isPending}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteCategory.isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
          >
            {deleteCategory.isPending ? 'Удаление...' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
