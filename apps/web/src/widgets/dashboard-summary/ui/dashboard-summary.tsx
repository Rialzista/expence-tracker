'use client';

import { useState } from 'react';

import { CategoryDonutChart, formatMoney, MonthPicker, useTransactionsSummary } from '@/entities/transaction';
import { useCategories } from '@/entities/category';
import { getErrorMessage } from '@/lib/api-client';
import { Skeleton } from '@/shared/ui/skeleton';

import { SummaryStatCards } from './summary-stat-cards';
import { TopCategoriesPanel } from './top-categories-panel';

function currentPeriod() {
  const now = new Date();

  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function DashboardSummary() {
  const [period, setPeriod] = useState(currentPeriod);
  const summary = useTransactionsSummary(period);
  const categories = useCategories();

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <MonthPicker month={period.month} year={period.year} onChange={setPeriod} />
      </div>

      {summary.isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-3xl" />
          ))}
        </div>
      ) : summary.isError ? (
        <p className="rounded-3xl bg-card p-6 text-sm text-destructive">
          {getErrorMessage(summary.error, 'Не удалось загрузить сводку')}
        </p>
      ) : (
        <>
          <SummaryStatCards income={summary.data.income} expense={summary.data.expense} balance={summary.data.balance} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 rounded-3xl bg-card p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-foreground">Расходы по категориям</h2>
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <CategoryDonutChart
                  data={summary.data.byCategory
                    .filter((entry) => entry.type === 'EXPENSE')
                    .map((entry) => {
                      const category = categories.data?.find((item) => item.id === entry.categoryId);

                      return {
                        categoryId: entry.categoryId,
                        label: entry.categoryName ?? 'Без категории',
                        value: Number(entry.total),
                        color: category?.color ?? '#94a3b8',
                      };
                    })}
                />
                <div className="flex w-full flex-col gap-2">
                  {summary.data.byCategory
                    .filter((entry) => entry.type === 'EXPENSE')
                    .map((entry) => {
                      const category = categories.data?.find((item) => item.id === entry.categoryId);

                      return (
                        <div key={entry.categoryId ?? 'none'} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <span
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: category?.color ?? '#94a3b8' }}
                            />
                            {entry.categoryName ?? 'Без категории'}
                          </span>
                          <span className="font-mono font-medium text-foreground">{formatMoney(entry.total)}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
            <TopCategoriesPanel byCategory={summary.data.byCategory} />
          </div>
        </>
      )}
    </div>
  );
}
