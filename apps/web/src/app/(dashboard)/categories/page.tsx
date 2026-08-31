import { CreateCategoryDialog } from '@/features/categories/create-category';
import { CategoriesList } from '@/widgets/categories-list';

export default function Page() {
  return (
    <div className="flex-1 space-y-6 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Категории</h1>
          <p className="mt-1 text-sm text-muted-foreground">Справочник категорий доходов и расходов.</p>
        </div>
        <CreateCategoryDialog />
      </div>
      <CategoriesList />
    </div>
  );
}
