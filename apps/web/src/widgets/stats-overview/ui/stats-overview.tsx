'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { useCategories } from '@/entities/category';
import { CategoryDonutChart, formatMoney, MonthPicker, useTransactionsSummary } from '@/entities/transaction';
import { getErrorMessage } from '@/lib/api-client';
import { Skeleton } from '@/shared/ui/skeleton';

import { IncomeExpenseBars } from './income-expense-bars';

function currentPeriod() {
  const now = new Date();

  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function StatsOverview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fallback = currentPeriod();

  const month = Number(searchParams.get('month')) || fallback.month;
  const year = Number(searchParams.get('year')) || fallback.year;

  const summary = useTransactionsSummary({ month, year });
  const categories = useCategories();

  const setPeriod = (period: { month: number; year: number }) => {
    router.replace(`/stats?month=${period.month}&year=${period.year}`);
  };

  if (summary.isPending) {
    return <Skeleton className="h-96 w-full rounded-3xl" />;
  }

  if (summary.isError) {
    return (
      <p className="rounded-3xl bg-card p-6 text-sm text-destructive">
        {getErrorMessage(summary.error, 'Не удалось загрузить сводку')}
      </p>
    );
  }

  const expenseByCategory = summary.data.byCategory.filter((entry) => entry.type === 'EXPENSE');
  const totalExpense = expenseByCategory.reduce((sum, entry) => sum + Number(entry.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <MonthPicker month={month} year={year} onChange={setPeriod} />
      </div>

      <div className="rounded-3xl bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Доходы и расходы за месяц</h2>
        <div className="mt-4">
          <IncomeExpenseBars income={summary.data.income} expense={summary.data.expense} />
        </div>
      </div>

      <div className="rounded-3xl bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Расходы по категориям</h2>
        {expenseByCategory.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Нет операций за выбранный период.</p>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
            <CategoryDonutChart
              size={240}
              data={expenseByCategory.map((entry) => {
                const category = categories.data?.find((item) => item.id === entry.categoryId);

                return {
                  categoryId: entry.categoryId,
                  label: entry.categoryName ?? 'Без категории',
                  value: Number(entry.total),
                  color: category?.color ?? '#94a3b8',
                };
              })}
            />
            <div className="flex w-full flex-col gap-3">
              {expenseByCategory
                .slice()
                .sort((a, b) => Number(b.total) - Number(a.total))
                .map((entry) => {
                  const category = categories.data?.find((item) => item.id === entry.categoryId);
                  const share = totalExpense > 0 ? (Number(entry.total) / totalExpense) * 100 : 0;

                  return (
                    <div key={entry.categoryId ?? 'none'} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: category?.color ?? '#94a3b8' }}
                        />
                        {entry.categoryName ?? 'Без категории'}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{share.toFixed(0)}%</span>
                        <span className="font-mono font-medium text-foreground">{formatMoney(entry.total)}</span>
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
