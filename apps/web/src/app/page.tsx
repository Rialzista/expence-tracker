import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold">Трекер расходов</h1>
      <p className="text-balance opacity-70">
        Заготовка монорепозитория: Next.js на фронтенде, NestJS и Prisma на бэкенде.
      </p>
      <Link
        href="/transactions"
        className="w-fit rounded-md border px-4 py-2 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      >
        К операциям
      </Link>
    </main>
  );
}
