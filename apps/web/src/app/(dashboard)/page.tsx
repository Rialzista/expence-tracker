import { CreateTransactionDialog } from '@/features/transactions/create-transaction';
import { TransactionsList } from '@/widgets/transactions-list';

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Дашборд</h1>
        <CreateTransactionDialog />
      </div>
      <TransactionsList />
    </main>
  );
}
