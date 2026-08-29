import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CategoriesService } from './categories.service.js';
import type { CategoriesRepository } from './categories.repository.js';
import { Prisma, type Category } from '../generated/prisma/client.js';

function buildCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    userId: '00000000-0000-4000-8000-0000000000f0',
    name: 'Продукты',
    type: 'EXPENSE',
    icon: null,
    color: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function buildUniqueConstraintError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '7.10.0',
  });
}

describe('CategoriesService', () => {
  let repository: {
    findManyByUser: ReturnType<typeof vi.fn>;
    findByIdForUser: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let service: CategoriesService;
  const userId = '00000000-0000-4000-8000-0000000000f0';

  beforeEach(() => {
    repository = {
      findManyByUser: vi.fn(),
      findByIdForUser: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    service = new CategoriesService(repository as unknown as CategoriesRepository);
  });

  describe('findAll', () => {
    it('маппит список в CategoryResponse без userId', async () => {
      const category = buildCategory();
      repository.findManyByUser.mockResolvedValue([category]);

      const result = await service.findAll(userId);

      expect(repository.findManyByUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual([
        {
          id: category.id,
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color,
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
        },
      ]);
      expect(result[0]).not.toHaveProperty('userId');
    });
  });

  describe('create', () => {
    it('создаёт категорию и возвращает CategoryResponse', async () => {
      const category = buildCategory();
      repository.create.mockResolvedValue(category);

      const result = await service.create(userId, { name: 'Продукты', type: 'EXPENSE' });

      expect(repository.create).toHaveBeenCalledWith({
        userId,
        name: 'Продукты',
        type: 'EXPENSE',
      });
      expect(result.id).toBe(category.id);
    });

    it('бросает ConflictException при нарушении уникальности имени', async () => {
      repository.create.mockRejectedValue(buildUniqueConstraintError());

      await expect(
        service.create(userId, { name: 'Продукты', type: 'EXPENSE' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('пробрасывает прочие ошибки без изменений', async () => {
      const otherError = new Error('boom');
      repository.create.mockRejectedValue(otherError);

      await expect(service.create(userId, { name: 'Продукты', type: 'EXPENSE' })).rejects.toBe(
        otherError,
      );
    });
  });

  describe('update', () => {
    it('бросает NotFoundException, если категория не найдена или чужая', async () => {
      repository.findByIdForUser.mockResolvedValue(null);

      await expect(service.update(userId, 'unknown-id', { name: 'Новое имя' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('обновляет существующую категорию', async () => {
      const existing = buildCategory();
      const updated = buildCategory({ name: 'Новое имя' });
      repository.findByIdForUser.mockResolvedValue(existing);
      repository.update.mockResolvedValue(updated);

      const result = await service.update(userId, existing.id, { name: 'Новое имя' });

      expect(repository.update).toHaveBeenCalledWith(existing.id, { name: 'Новое имя' });
      expect(result.name).toBe('Новое имя');
    });

    it('бросает ConflictException при переименовании в занятое имя', async () => {
      const existing = buildCategory();
      repository.findByIdForUser.mockResolvedValue(existing);
      repository.update.mockRejectedValue(buildUniqueConstraintError());

      await expect(
        service.update(userId, existing.id, { name: 'Занято' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('remove', () => {
    it('бросает NotFoundException, если ничего не удалено', async () => {
      repository.remove.mockResolvedValue(0);

      await expect(service.remove(userId, 'unknown-id')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('успешно удаляет существующую категорию', async () => {
      repository.remove.mockResolvedValue(1);

      await expect(service.remove(userId, 'some-id')).resolves.toBeUndefined();
      expect(repository.remove).toHaveBeenCalledWith('some-id', userId);
    });
  });
});
