import type { Control } from 'react-hook-form';

import { TRANSACTION_TYPES, type CreateCategoryDto } from '@expense-tracker/shared';

import { TRANSACTION_TYPE_LABELS } from '@/entities/transaction';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { DEFAULT_CATEGORY_COLOR } from '../lib/category-colors';
import { DEFAULT_CATEGORY_ICON } from '../lib/category-icons';
import { ColorPicker } from './color-picker';
import { IconPicker } from './icon-picker';

interface CategoryFormFieldsProps {
  control: Control<CreateCategoryDto>;
}

/** Разметка полей формы категории — общая для создания и редактирования. */
export function CategoryFormFields({ control }: CategoryFormFieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Название</FormLabel>
            <FormControl>
              <Input placeholder="Например, Продукты" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Тип</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {TRANSACTION_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {TRANSACTION_TYPE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Цвет</FormLabel>
            <FormControl>
              <ColorPicker value={field.value ?? DEFAULT_CATEGORY_COLOR} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="icon"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Иконка</FormLabel>
            <FormControl>
              <IconPicker value={field.value ?? DEFAULT_CATEGORY_ICON} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
