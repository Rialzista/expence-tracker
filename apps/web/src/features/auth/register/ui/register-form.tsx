'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { registerSchema } from '@expense-tracker/shared';

import { useSessionStore } from '@/entities/session';
import { ApiRequestError } from '@/lib/api-client';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';

import { useRegister } from '../model/use-register';

const registerFormSchema = registerSchema.extend({
  agreedToTerms: z.boolean().refine((value) => value, {
    message: 'Нужно согласиться с условиями',
  }),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export function RegisterForm() {
  const router = useRouter();
  const setSession = useSessionStore((state) => state.setSession);
  const register = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: '', name: '', password: '', agreedToTerms: false },
  });

  const onSubmit = async ({ agreedToTerms: _agreedToTerms, ...dto }: RegisterFormValues) => {
    try {
      const data = await register.mutateAsync(dto);
      setSession(data);
      router.push('/transactions');
    } catch (error) {
      form.setError('root', {
        message: error instanceof ApiRequestError ? error.message : 'Не удалось выполнить регистрацию',
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
              <FormLabel>Имя</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пароль</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="agreedToTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Согласен с пользовательским соглашением и политикой обработки данных"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <span className="text-sm">
                  Согласен с{' '}
                  <Link href="/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    пользовательским соглашением
                  </Link>{' '}
                  и{' '}
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                  >
                    политикой обработки данных
                  </Link>
                </span>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        {form.formState.errors.root ? (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        ) : null}
        <Button type="submit" className="w-full" disabled={register.isPending}>
          {register.isPending ? 'Регистрация...' : 'Зарегистрироваться'}
        </Button>
      </form>
    </Form>
  );
}
