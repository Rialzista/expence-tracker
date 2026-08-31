import { CreateTransactionDialog } from '@/features/transactions/create-transaction';
import { DashboardSummary, RecentActivities } from '@/widgets/dashboard-summary';

export default function Page() {
  return (
    <div className="flex-1 space-y-6 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-foreground">Дашборд</h1>
        <CreateTransactionDialog />
      </div>
      <DashboardSummary />
      <RecentActivities />
    </div>
  );
}
