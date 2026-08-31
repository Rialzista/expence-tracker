import { formatMoney } from '@/entities/transaction';

interface IncomeExpenseBarsProps {
  income: string;
  expense: string;
}

export function IncomeExpenseBars({ income, expense }: IncomeExpenseBarsProps) {
  const incomeValue = Number(income);
  const expenseValue = Number(expense);
  const max = Math.max(incomeValue, expenseValue, 1);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Доходы</span>
          <span className="font-mono font-semibold text-foreground">{formatMoney(income)}</span>
        </div>
        <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-mint" style={{ width: `${(incomeValue / max) * 100}%` }} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Расходы</span>
          <span className="font-mono font-semibold text-foreground">{formatMoney(expense)}</span>
        </div>
        <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-peach" style={{ width: `${(expenseValue / max) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
