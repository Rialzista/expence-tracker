import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

import { CATEGORY_COLORS } from '../lib/category-colors';

interface ColorPickerProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ value, onChange, className, ...props }: ColorPickerProps) {
  return (
    <div
      role="group"
      aria-label="Цвет категории"
      className={cn('flex flex-wrap gap-2', className)}
      {...props}
    >
      {CATEGORY_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          aria-label={color.label}
          aria-pressed={value === color.value}
          onClick={() => onChange(color.value)}
          style={{ backgroundColor: color.value }}
          className={cn(
            'size-8 rounded-full border-2 border-transparent transition-colors',
            value === color.value && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
          )}
        />
      ))}
    </div>
  );
}
