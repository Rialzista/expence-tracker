import Link from 'next/link';

import { LoginForm } from '@/features/auth/login';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Вход</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-4 text-center text-sm opacity-70">
            Нет аккаунта?{' '}
            <Link href="/register" className="underline underline-offset-4">
              Зарегистрироваться
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
