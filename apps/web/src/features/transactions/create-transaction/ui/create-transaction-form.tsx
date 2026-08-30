'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  SUPPORTED_CURRENCIES,
  TRANSACTION_TYPES,
  moneySchema,
  transactionTypeSchema,
  type CreateTransactionDto,
} from '@expense-tracker/shared';

import { useCategories } from '@/entities/category';
import { TRANSACTION_TYPE_LABELS } from '@/entities/transaction';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/shared/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { useCreateTransaction } from '../model/use-create-transaction';

const NO_CATEGORY = 'none';

/**
 * Отдельная форменная схема, а не createTransactionSchema напрямую: HTML `<input type="date">`
 * отдаёт "YYYY-MM-DD", а не полный ISO 8601 с временем, который требует z.iso.datetime()
 * в createTransactionSchema — конвертация в ISO происходит в onSubmit. categoryId здесь —
 * не idSchema, а строка со значением-сентинелом NO_CATEGORY для пункта «Без категории».
 */
const createTransactionFormSchema = z.object({
  type: transactionTypeSchema,
  amount: moneySchema,
  currency: z.enum(SUPPORTED_CURRENCIES),
  date: z.string().min(1, 'Укажите дату'),
  categoryId: z.string(),
  note: z.string().trim().max(500).optional(),
});

type CreateTransactionFormValues = z.infer<typeof createTransactionFormSchema>;

/** Локальная календарная дата пользователя, а не UTC — toISOString() сдвигал бы её у полуночи. */
function today(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

interface CreateTransactionFormProps {
  onSuccess?: () => void;
}

export function CreateTransactionForm({ onSuccess }: CreateTransactionFormProps) {
  const categories = useCategories();
  const createTransaction = useCreateTransaction();

  const form = useForm<CreateTransactionFormValues>({
    resolver: zodResolver(createTransactionFormSchema),
    defaultValues: {
      type: 'EXPENSE',
      amount: '',
      currency: 'USD',
      date: today(),
      categoryId: NO_CATEGORY,
      note: '',
    },
  });

  const type = form.watch('type');

  const categoryOptions = (categories.data ?? []).filter((category) => category.type === type);

  const onSubmit = async (values: CreateTransactionFormValues) => {
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
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue('categoryId', NO_CATEGORY);
                }}
              >
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Сумма</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Валюта</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Дата</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Категория</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>Без категории</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
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
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Заметка</FormLabel>
              <FormControl>
                <Input placeholder="Необязательно" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
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
