import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  createCategorySchema,
  idSchema,
  updateCategorySchema,
  type CategoryResponse,
  type CreateCategoryDto,
  type UpdateCategoryDto,
} from '@expense-tracker/shared';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateCategoryCommand, DeleteCategoryCommand, UpdateCategoryCommand } from './commands/index.js';
import { GetCategoriesQuery } from './queries/index.js';

@ApiBearerAuth()
@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Список категорий текущего пользователя' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Список категорий' })
  findAll(@CurrentUser('id') userId: string): Promise<CategoryResponse[]> {
    return this.queryBus.execute(new GetCategoriesQuery(userId));
  }

  @Post()
  @ApiOperation({ summary: 'Создать категорию' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Категория создана' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Категория с таким названием уже существует' })
  create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createCategorySchema)) dto: CreateCategoryDto,
  ): Promise<CategoryResponse> {
    return this.commandBus.execute(new CreateCategoryCommand(userId, dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить категорию' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Категория обновлена' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Категория не найдена' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Категория с таким названием уже существует' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) dto: UpdateCategoryDto,
  ): Promise<CategoryResponse> {
    return this.commandBus.execute(new UpdateCategoryCommand(userId, id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить категорию' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Категория удалена' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Категория не найдена' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteCategoryCommand(userId, id));
  }
}
