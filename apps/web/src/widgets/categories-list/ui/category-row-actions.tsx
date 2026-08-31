'use client';

import { useState } from 'react';
import { MoreVertical } from 'lucide-react';

import type { CategoryResponse } from '@expense-tracker/shared';

import { DeleteCategoryDialog } from '@/features/categories/delete-category';
import { EditCategoryDialog } from '@/features/categories/update-category';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

interface CategoryRowActionsProps {
  category: CategoryResponse;
}

export function CategoryRowActions({ category }: CategoryRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Действия с категорией «${category.name}»`}>
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
      <EditCategoryDialog category={category} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteCategoryDialog category={category} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
