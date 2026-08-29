import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Хелпер, которого ожидают компоненты shadcn/ui. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
