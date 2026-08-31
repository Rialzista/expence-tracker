'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import type { CreateTransactionDto } from '@expense-tracker/shared';

import { useCategories } from '@/entities/category';
import {
  NO_CATEGORY,
  TransactionFormFields,
  todayDateInputValue,
  transactionFormSchema,
  type TransactionFormValues,
} from '@/entities/transaction';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/shared/ui/button';
import { Form } from '@/shared/ui/form';

import { useCreateTransaction } from '../model/use-create-transaction';

interface CreateTransactionFormProps {
  onSuccess?: () => void;
}

export function CreateTransactionForm({ onSuccess }: CreateTransactionFormProps) {
  const categories = useCategories();
  const createTransaction = useCreateTransaction();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: 'EXPENSE',
      amount: '',
      currency: 'USD',
      date: todayDateInputValue(),
      categoryId: NO_CATEGORY,
      note: '',
    },
  });

  const type = form.watch('type');

  const categoryOptions = (categories.data ?? []).filter((category) => category.type === type);

  const onSubmit = async (values: TransactionFormValues) => {
    const dto: CreateTransactionDto = {
      type: values.type,
      amount: values.amount,
      currency: values.currency,
      date: new Date(values.date).toISOString(),
      categoryId: values.categoryId === NO_CATEGORY ? undefined : values.categoryId,
      note: values.note ? values.note : undefined,
    };

    try {
      await createTransaction.mutateAsync(dto);
      form.reset({ ...form.getValues(), amount: '', note: '', categoryId: NO_CATEGORY });
      onSuccess?.();
    } catch (error) {
      form.setError('root', {
        message: getErrorMessage(error, 'Не удалось создать операцию'),
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <TransactionFormFields
          control={form.control}
          categoryOptions={categoryOptions}
          onTypeChange={() => form.setValue('categoryId', NO_CATEGORY)}
        />
        {form.formState.errors.root ? (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        ) : null}
        <Button type="submit" className="w-full" disabled={createTransaction.isPending}>
          {createTransaction.isPending ? 'Сохранение...' : 'Добавить операцию'}
        </Button>
      </form>
    </Form>
  );
}
