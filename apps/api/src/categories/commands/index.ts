import { CreateCategoryHandler } from './create-category.handler.js';
import { UpdateCategoryHandler } from './update-category.handler.js';
import { DeleteCategoryHandler } from './delete-category.handler.js';

export const CategoryCommandHandlers = [
  CreateCategoryHandler,
  UpdateCategoryHandler,
  DeleteCategoryHandler,
];

export { CreateCategoryCommand } from './create-category.command.js';
export { UpdateCategoryCommand } from './update-category.command.js';
export { DeleteCategoryCommand } from './delete-category.command.js';
