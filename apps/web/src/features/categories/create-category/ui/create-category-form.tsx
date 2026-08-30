'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { TRANSACTION_TYPES, createCategorySchema, type CreateCategoryDto } from '@expense-tracker/shared';

import { ColorPicker, DEFAULT_CATEGORY_COLOR, DEFAULT_CATEGORY_ICON, IconPicker } from '@/entities/category';
import { TRANSACTION_TYPE_LABELS } from '@/entities/transaction';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/shared/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название</FormLabel>
              <FormControl>
                <Input placeholder="Например, Продукты" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TRANSACTION_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {TRANSACTION_TYPE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Цвет</FormLabel>
              <FormControl>
                <ColorPicker value={field.value ?? DEFAULT_CATEGORY_COLOR} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Иконка</FormLabel>
              <FormControl>
                <IconPicker value={field.value ?? DEFAULT_CATEGORY_ICON} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
