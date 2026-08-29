'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { loginSchema, type LoginDto } from '@expense-tracker/shared';

import { useSessionStore } from '@/entities/session';
import { ApiRequestError } from '@/lib/api-client';
import { Button } from '@/shared/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';

import { useLogin } from '../model/use-login';

export function LoginForm() {
  const router = useRouter();
  const setSession = useSessionStore((state) => state.setSession);
  const login = useLogin();

  const form = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (dto: LoginDto) => {
    try {
      const data = await login.mutateAsync(dto);
      setSession(data);
      router.push('/transactions');
    } catch (error) {
      form.setError('root', {
        message: error instanceof ApiRequestError ? error.message : 'Не удалось выполнить вход',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root ? (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        ) : null}
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'Вход...' : 'Войти'}
        </Button>
      </form>
    </Form>
  );
}
