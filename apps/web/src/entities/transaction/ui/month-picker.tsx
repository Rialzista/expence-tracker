'use client';

import { useMemo } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

interface MonthPickerProps {
  month: number;
  year: number;
  onChange: (value: { month: number; year: number }) => void;
}

const MONTH_LABELS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

function buildOptions() {
  const now = new Date();
  const options: { value: string; month: number; year: number; label: string }[] = [];

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    options.push({ value: `${year}-${month}`, month, year, label: `${MONTH_LABELS[date.getMonth()]} ${year}` });
  }

  return options;
}

export function MonthPicker({ month, year, onChange }: MonthPickerProps) {
  const options = useMemo(() => buildOptions(), []);

  return (
    <Select
      value={`${year}-${month}`}
      onValueChange={(value) => {
        const option = options.find((item) => item.value === value);

        if (option) {
          onChange({ month: option.month, year: option.year });
        }
      }}
    >
      <SelectTrigger className="rounded-full bg-card">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
