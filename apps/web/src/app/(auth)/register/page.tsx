import Link from 'next/link';

import { RegisterForm } from '@/features/auth/register';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Регистрация</CardTitle>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <p className="mt-4 text-center text-sm opacity-70">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="underline underline-offset-4">
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
