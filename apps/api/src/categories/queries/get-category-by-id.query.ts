import { Query } from '@nestjs/cqrs';
import type { CategoryResponse } from '@expense-tracker/shared';

/**
 * Отдаёт null, а не бросает 404: вызывающая сторона сама решает, что значит
 * отсутствие категории. Для модуля transactions это «чужой или несуществующий
 * categoryId», и сообщение об ошибке там своё.
 */
export class GetCategoryByIdQuery extends Query<CategoryResponse | null> {
  constructor(
    readonly userId: string,
    readonly id: string,
  ) {
    super();
  }
}
