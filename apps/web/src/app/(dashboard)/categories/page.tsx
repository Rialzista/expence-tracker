import { CreateCategoryDialog } from '@/features/categories/create-category';
import { CategoriesList } from '@/widgets/categories-list';

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Категории</h1>
          <p className="mt-2 text-sm opacity-70">Справочник категорий доходов и расходов.</p>
        </div>
        <CreateCategoryDialog />
      </div>
      <CategoriesList />
    </main>
  );
}
