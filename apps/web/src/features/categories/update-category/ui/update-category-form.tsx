'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { createCategorySchema, type CategoryResponse, type CreateCategoryDto } from '@expense-tracker/shared';

import { CategoryFormFields, DEFAULT_CATEGORY_COLOR, DEFAULT_CATEGORY_ICON } from '@/entities/category';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/shared/ui/button';
import { Form } from '@/shared/ui/form';

import { useUpdateCategory } from '../model/use-update-category';

interface UpdateCategoryFormProps {
  category: CategoryResponse;
  onSuccess?: () => void;
}

export function UpdateCategoryForm({ category, onSuccess }: UpdateCategoryFormProps) {
  const updateCategory = useUpdateCategory();

  const form = useForm<CreateCategoryDto>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: category.name,
      type: category.type,
      color: category.color ?? DEFAULT_CATEGORY_COLOR,
      icon: category.icon ?? DEFAULT_CATEGORY_ICON,
    },
  });

  const onSubmit = async (values: CreateCategoryDto) => {
    try {
      await updateCategory.mutateAsync({ id: category.id, dto: values });
      onSuccess?.();
    } catch (error) {
      form.setError('root', {
        message: getErrorMessage(error, 'Не удалось сохранить категорию'),
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <CategoryFormFields control={form.control} />
        {form.formState.errors.root ? (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        ) : null}
        <Button type="submit" className="w-full" disabled={updateCategory.isPending}>
          {updateCategory.isPending ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </form>
    </Form>
  );
}
