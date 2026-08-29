import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CategoryResponse, CreateCategoryDto, UpdateCategoryDto } from '@expense-tracker/shared';

import { Prisma } from '../generated/prisma/client.js';
import { CategoriesRepository } from './categories.repository.js';
import { toCategoryResponse } from './category.mapper.js';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

/**
 * Доменный слой категорий. Не экспортируется из CategoriesModule —
 * вызывается только обработчиками команд/запросов этого же модуля.
 */
@Injectable()
export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository) {}

  async findAll(userId: string): Promise<CategoryResponse[]> {
    const categories = await this.repository.findManyByUser(userId);
    return categories.map(toCategoryResponse);
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryResponse> {
    try {
      const category = await this.repository.create({ userId, ...dto });
      return toCategoryResponse(category);
    } catch (error) {
      throw this.mapUniqueConstraintError(error);
    }
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<CategoryResponse> {
    const existing = await this.repository.findByIdForUser(id, userId);
    if (!existing) {
      throw new NotFoundException('Категория не найдена');
    }

    try {
      const category = await this.repository.update(id, dto);
      return toCategoryResponse(category);
    } catch (error) {
      throw this.mapUniqueConstraintError(error);
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    const count = await this.repository.remove(id, userId);
    if (count === 0) {
      throw new NotFoundException('Категория не найдена');
    }
  }

  private mapUniqueConstraintError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === UNIQUE_CONSTRAINT_VIOLATION
    ) {
      return new ConflictException('Категория с таким названием уже существует');
    }
    return error;
  }
}
