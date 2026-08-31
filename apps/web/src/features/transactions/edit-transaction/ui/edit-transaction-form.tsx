'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import type { Currency, TransactionResponse, UpdateTransactionDto } from '@expense-tracker/shared';

import { useCategories } from '@/entities/category';
import {
  NO_CATEGORY,
  TransactionFormFields,
  dateInputValueFromIso,
  transactionFormSchema,
  type TransactionFormValues,
} from '@/entities/transaction';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/shared/ui/button';
import { Form } from '@/shared/ui/form';

import { useUpdateTransaction } from '../model/use-update-transaction';

interface EditTransactionFormProps {
  transaction: TransactionResponse;
  onSuccess?: () => void;
}

export function EditTransactionForm({ transaction, onSuccess }: EditTransactionFormProps) {
  const categories = useCategories();
  const updateTransaction = useUpdateTransaction();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: transaction.type,
      amount: transaction.amount,
      // Бэкенд гарантирует валидную валюту при создании — TransactionResponse.currency
      // типизирован как обычный string, чтобы не тянуть SUPPORTED_CURRENCIES в ответ API.
      currency: transaction.currency as Currency,
      date: dateInputValueFromIso(transaction.date),
      categoryId: transaction.categoryId ?? NO_CATEGORY,
      note: transaction.note ?? '',
    },
  });

  const type = form.watch('type');

  const categoryOptions = (categories.data ?? []).filter((category) => category.type === type);

  const onSubmit = async (values: TransactionFormValues) => {
    // undefined в PATCH означало бы "не менять поле" — очистка категории/заметки
    // требует явного null, в отличие от создания операции.
    const dto: UpdateTransactionDto = {
      type: values.type,
      amount: values.amount,
      currency: values.currency,
      date: new Date(values.date).toISOString(),
      categoryId: values.categoryId === NO_CATEGORY ? null : values.categoryId,
      note: values.note ? values.note : null,
    };

    try {
      await updateTransaction.mutateAsync({ id: transaction.id, dto });
      onSuccess?.();
    } catch (error) {
      form.setError('root', {
        message: getErrorMessage(error, 'Не удалось сохранить операцию'),
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
        <Button type="submit" className="w-full" disabled={updateTransaction.isPending}>
          {updateTransaction.isPending ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </form>
    </Form>
  );
}
