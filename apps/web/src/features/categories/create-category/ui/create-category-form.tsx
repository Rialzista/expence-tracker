'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { createCategorySchema, type CreateCategoryDto } from '@expense-tracker/shared';

import { CategoryFormFields, DEFAULT_CATEGORY_COLOR, DEFAULT_CATEGORY_ICON } from '@/entities/category';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/shared/ui/button';
import { Form } from '@/shared/ui/form';

import { useCreateCategory } from '../model/use-create-category';

interface CreateCategoryFormProps {
  onSuccess?: () => void;
}

export function CreateCategoryForm({ onSuccess }: CreateCategoryFormProps) {
  const createCategory = useCreateCategory();

  const form = useForm<CreateCategoryDto>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      type: 'EXPENSE',
      color: DEFAULT_CATEGORY_COLOR,
      icon: DEFAULT_CATEGORY_ICON,
    },
  });

  const onSubmit = async (values: CreateCategoryDto) => {
    try {
      await createCategory.mutateAsync(values);
      form.reset();
      onSuccess?.();
    } catch (error) {
      form.setError('root', {
        message: getErrorMessage(error, 'Не удалось создать категорию'),
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
        <Button type="submit" className="w-full" disabled={createCategory.isPending}>
          {createCategory.isPending ? 'Сохранение...' : 'Добавить категорию'}
        </Button>
      </form>
    </Form>
  );
}
