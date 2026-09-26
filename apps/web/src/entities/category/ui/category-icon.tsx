import { createElement } from 'react';

import { getCategoryIcon } from '../lib/category-icons';

interface CategoryIconProps {
  slug: string | null | undefined;
  className?: string;
}

export function CategoryIcon({ slug, className }: CategoryIconProps) {
  return createElement(getCategoryIcon(slug), { className });
}
