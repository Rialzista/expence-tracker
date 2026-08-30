import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui/button';

import { CATEGORY_ICON_OPTIONS } from '../lib/category-icons';

interface IconPickerProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange, className, ...props }: IconPickerProps) {
  return (
    <div
      role="group"
      aria-label="Иконка категории"
      className={cn('grid grid-cols-6 gap-2', className)}
      {...props}
    >
      {CATEGORY_ICON_OPTIONS.map(({ slug, label, Icon }) => (
        <Button
          key={slug}
          type="button"
          variant={value === slug ? 'default' : 'outline'}
          size="icon-sm"
          aria-label={label}
          aria-pressed={value === slug}
          onClick={() => onChange(slug)}
        >
          <Icon />
        </Button>
      ))}
    </div>
  );
}
