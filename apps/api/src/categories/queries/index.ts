import { GetCategoriesHandler } from './get-categories.handler.js';
import { GetCategoryByIdHandler } from './get-category-by-id.handler.js';

export const CategoryQueryHandlers = [GetCategoriesHandler, GetCategoryByIdHandler];

export { GetCategoriesQuery } from './get-categories.query.js';
export { GetCategoryByIdQuery } from './get-category-by-id.query.js';
