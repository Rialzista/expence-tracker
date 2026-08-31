import type { ComponentType } from 'react';
import { ArrowDownRight, ArrowUpRight, Equal } from 'lucide-react';

import { formatMoney } from '@/entities/transaction';
import { cn } from '@/lib/utils';

interface SummaryStatCardsProps {
  income: string;
  expense: string;
  balance: string;
}

const CARDS: {
  key: keyof SummaryStatCardsProps;
  label: string;
  bg: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { key: 'balance', label: 'Баланс', bg: 'bg-sky', Icon: Equal },
  { key: 'income', label: 'Доходы', bg: 'bg-mint', Icon: ArrowUpRight },
  { key: 'expense', label: 'Расходы', bg: 'bg-peach', Icon: ArrowDownRight },
];

export function SummaryStatCards(props: SummaryStatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {CARDS.map(({ key, label, bg, Icon }) => (
        <div key={key} className={cn('rounded-3xl p-6', bg)}>
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Icon className="size-4" />
          </span>
          <p className="mt-6 text-sm text-foreground/70">{label}</p>
          <p className="mt-1 font-mono text-2xl font-bold text-foreground">{formatMoney(props[key])}</p>
        </div>
      ))}
    </div>
  );
}
