import { NotFoundException } from '@nestjs/common';
import type { QueryBus } from '@nestjs/cqrs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TransactionsService } from './transactions.service.js';
import type { TransactionsRepository } from './transactions.repository.js';
import { GetCategoriesQuery, GetCategoryByIdQuery } from '../categories/queries/index.js';
import { Prisma, type Transaction } from '../generated/prisma/client.js';

const userId = '00000000-0000-4000-8000-0000000000f0';
const categoryId = '00000000-0000-4000-8000-00000000000c';

function buildTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    userId,
    categoryId,
    amount: new Prisma.Decimal('123.45'),
    currency: 'USD',
    type: 'EXPENSE',
    date: new Date('2026-03-15T12:00:00.000Z'),
    note: 'Обед',
    createdAt: new Date('2026-03-15T12:00:00.000Z'),
    updatedAt: new Date('2026-03-15T12:00:00.000Z'),
    ...overrides,
  };
}

describe('TransactionsService', () => {
  let repository: {
    findManyByUser: ReturnType<typeof vi.fn>;
    findByIdForUser: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    sumByType: ReturnType<typeof vi.fn>;
    sumByCategory: ReturnType<typeof vi.fn>;
  };
  let queryBus: { execute: ReturnType<typeof vi.fn> };
  let service: TransactionsService;

  beforeEach(() => {
    repository = {
      findManyByUser: vi.fn(),
      findByIdForUser: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      sumByType: vi.fn(),
      sumByCategory: vi.fn(),
    };
    queryBus = { execute: vi.fn() };
    service = new TransactionsService(
      repository as unknown as TransactionsRepository,
      queryBus as unknown as QueryBus,
    );
  });

  describe('findAll', () => {
    it('возвращает страницу и маппит операции без userId', async () => {
      const transaction = buildTransaction();
      repository.findManyByUser.mockResolvedValue([[transaction], 42]);

      const result = await service.findAll(userId, { page: 2, limit: 20 });

      expect(repository.findManyByUser).toHaveBeenCalledWith(userId, { page: 2, limit: 20 });
      expect(result).toEqual({
        items: [
          {
            id: transaction.id,
            amount: '123.45',
            currency: 'USD',
            type: 'EXPENSE',
            date: transaction.date.toISOString(),
            note: 'Обед',
            categoryId,
            createdAt: transaction.createdAt.toISOString(),
            updatedAt: transaction.updatedAt.toISOString(),
          },
        ],
        total: 42,
        page: 2,
        limit: 20,
      });
      expect(result.items[0]).not.toHaveProperty('userId');
    });
  });

  describe('findOne', () => {
    it('бросает NotFoundException, если операция не найдена или чужая', async () => {
      repository.findByIdForUser.mockResolvedValue(null);

      await expect(service.findOne(userId, 'unknown-id')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('проверяет категорию через QueryBus и создаёт операцию', async () => {
      queryBus.execute.mockResolvedValue({ id: categoryId, name: 'Еда' });
      repository.create.mockResolvedValue(buildTransaction());

      const result = await service.create(userId, {
        amount: '123.45',
        currency: 'USD',
        type: 'EXPENSE',
        date: '2026-03-15T12:00:00.000Z',
        categoryId,
        note: 'Обед',
      });

      expect(queryBus.execute).toHaveBeenCalledWith(new GetCategoryByIdQuery(userId, categoryId));
      expect(repository.create).toHaveBeenCalledWith({
        userId,
        amount: '123.45',
        currency: 'USD',
        type: 'EXPENSE',
        date: new Date('2026-03-15T12:00:00.000Z'),
        categoryId,
        note: 'Обед',
      });
      expect(result.amount).toBe('123.45');
    });

    it('бросает NotFoundException, если категория чужая или не существует', async () => {
      queryBus.execute.mockResolvedValue(null);

      await expect(
        service.create(userId, {
          amount: '10.00',
          currency: 'USD',
          type: 'EXPENSE',
          date: '2026-03-15T12:00:00.000Z',
          categoryId,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('не ходит в QueryBus, если категория не передана', async () => {
      repository.create.mockResolvedValue(buildTransaction({ categoryId: null }));

      await service.create(userId, {
        amount: '10.00',
        currency: 'USD',
        type: 'INCOME',
        date: '2026-03-15T12:00:00.000Z',
      });

      expect(queryBus.execute).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: null, note: null }),
      );
    });
  });

  describe('update', () => {
    it('бросает NotFoundException, если операция не найдена или чужая', async () => {
      repository.findByIdForUser.mockResolvedValue(null);

      await expect(service.update(userId, 'unknown-id', { note: 'Новая' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('передаёт только пришедшие поля и приводит дату к Date', async () => {
      const existing = buildTransaction();
      repository.findByIdForUser.mockResolvedValue(existing);
      repository.update.mockResolvedValue(buildTransaction({ note: 'Ужин' }));

      const result = await service.update(userId, existing.id, {
        note: 'Ужин',
        date: '2026-04-01T00:00:00.000Z',
      });

      expect(repository.update).toHaveBeenCalledWith(existing.id, {
        note: 'Ужин',
        date: new Date('2026-04-01T00:00:00.000Z'),
      });
      expect(result.note).toBe('Ужин');
    });

    it('позволяет очистить категорию, не обращаясь к QueryBus', async () => {
      const existing = buildTransaction();
      repository.findByIdForUser.mockResolvedValue(existing);
      repository.update.mockResolvedValue(buildTransaction({ categoryId: null }));

      const result = await service.update(userId, existing.id, { categoryId: null });

      expect(queryBus.execute).not.toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith(existing.id, { categoryId: null });
      expect(result.categoryId).toBeNull();
    });
  });

  describe('remove', () => {
    it('бросает NotFoundException, если ничего не удалено', async () => {
      repository.remove.mockResolvedValue(0);

      await expect(service.remove(userId, 'unknown-id')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('успешно удаляет существующую операцию', async () => {
      repository.remove.mockResolvedValue(1);

      await expect(service.remove(userId, 'some-id')).resolves.toBeUndefined();
      expect(repository.remove).toHaveBeenCalledWith('some-id', userId);
    });
  });

  describe('getSummary', () => {
    it('считает баланс и подставляет названия категорий', async () => {
      repository.sumByType.mockResolvedValue([
        { type: 'INCOME', total: new Prisma.Decimal('1000.00') },
        { type: 'EXPENSE', total: new Prisma.Decimal('250.50') },
      ]);
      repository.sumByCategory.mockResolvedValue([
        { categoryId, type: 'EXPENSE', total: new Prisma.Decimal('250.50') },
        { categoryId: null, type: 'INCOME', total: new Prisma.Decimal('1000.00') },
      ]);
      queryBus.execute.mockResolvedValue([{ id: categoryId, name: 'Еда' }]);

      const result = await service.getSummary(userId, { month: 3, year: 2026 });

      // Границы месяца — в UTC, верхняя не включается.
      expect(repository.sumByType).toHaveBeenCalledWith(
        userId,
        new Date('2026-03-01T00:00:00.000Z'),
        new Date('2026-04-01T00:00:00.000Z'),
      );
      expect(queryBus.execute).toHaveBeenCalledWith(new GetCategoriesQuery(userId));
      expect(result).toEqual({
        month: 3,
        year: 2026,
        income: '1000.00',
        expense: '250.50',
        balance: '749.50',
        byCategory: [
          { categoryId: null, categoryName: null, type: 'INCOME', total: '1000.00' },
          { categoryId, categoryName: 'Еда', type: 'EXPENSE', total: '250.50' },
        ],
      });
    });

    it('отдаёт нули на месяце без операций', async () => {
      repository.sumByType.mockResolvedValue([]);
      repository.sumByCategory.mockResolvedValue([]);
      queryBus.execute.mockResolvedValue([]);

      const result = await service.getSummary(userId, { month: 12, year: 2026 });

      expect(result).toEqual({
        month: 12,
        year: 2026,
        income: '0.00',
        expense: '0.00',
        balance: '0.00',
        byCategory: [],
      });
    });

    it('декабрьский период не съезжает на следующий год', async () => {
      repository.sumByType.mockResolvedValue([]);
      repository.sumByCategory.mockResolvedValue([]);
      queryBus.execute.mockResolvedValue([]);

      await service.getSummary(userId, { month: 12, year: 2026 });

      expect(repository.sumByCategory).toHaveBeenCalledWith(
        userId,
        new Date('2026-12-01T00:00:00.000Z'),
        new Date('2027-01-01T00:00:00.000Z'),
      );
    });
  });
});
