import { Injectable } from '@nestjs/common';
import type { TransactionQuery } from '@expense-tracker/shared';

import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, type Transaction } from '../generated/prisma/client.js';

/** Результат groupBy по типу операции: сумма может быть null на пустой выборке. */
export interface TypeTotal {
  type: Transaction['type'];
  total: Prisma.Decimal | null;
}

/** Результат groupBy по категории и типу. categoryId null — операции без категории. */
export interface CategoryTotal {
  categoryId: string | null;
  type: Transaction['type'];
  total: Prisma.Decimal | null;
}

/**
 * Единственное место в модуле transactions, которое обращается к Prisma.
 * Возвращает сырые модели — маппинг в DTO делает TransactionsService.
 *
 * Все методы принимают userId и фильтруют по нему на уровне запроса —
 * where: { id } без userId нигде не используется, иначе чужая операция
 * стала бы доступна по прямому UUID.
 */
@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Список и общее количество считаются в одной транзакции — иначе между
   * findMany и count может вклиниться запись, и total не сойдётся со страницей.
   */
  findManyByUser(userId: string, query: TransactionQuery): Promise<[Transaction[], number]> {
    const where = this.buildWhere(userId, query);

    return this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);
  }

  findByIdForUser(id: string, userId: string): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({ where: { id, userId } });
  }

  create(data: {
    userId: string;
    amount: string;
    currency: string;
    type: Transaction['type'];
    date: Date;
    categoryId?: string | null;
    note?: string | null;
  }): Promise<Transaction> {
    return this.prisma.transaction.create({ data });
  }

  update(
    id: string,
    data: {
      amount?: string;
      currency?: string;
      type?: Transaction['type'];
      date?: Date;
      categoryId?: string | null;
      note?: string | null;
    },
  ): Promise<Transaction> {
    return this.prisma.transaction.update({ where: { id }, data });
  }

  async remove(id: string, userId: string): Promise<number> {
    const result = await this.prisma.transaction.deleteMany({ where: { id, userId } });
    return result.count;
  }

  /** Суммы за период по типу операции — доход и расход. */
  async sumByType(userId: string, from: Date, to: Date): Promise<TypeTotal[]> {
    const rows = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: this.buildPeriodWhere(userId, from, to),
      _sum: { amount: true },
    });

    return rows.map((row) => ({ type: row.type, total: row._sum.amount }));
  }

  /**
   * Суммы за период в разрезе категории и типа. Названия категорий здесь
   * не добираются: категории — чужой модуль, их список TransactionsService
   * берёт через GetCategoriesQuery.
   */
  async sumByCategory(userId: string, from: Date, to: Date): Promise<CategoryTotal[]> {
    const rows = await this.prisma.transaction.groupBy({
      by: ['categoryId', 'type'],
      where: this.buildPeriodWhere(userId, from, to),
      _sum: { amount: true },
    });

    return rows.map((row) => ({
      categoryId: row.categoryId,
      type: row.type,
      total: row._sum.amount,
    }));
  }

  private buildWhere(userId: string, query: TransactionQuery): Prisma.TransactionWhereInput {
    const { from, to, type, categoryId } = query;

    return {
      userId,
      ...(type ? { type } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };
  }

  /** Полуинтервал [from, to): верхняя граница месяца — первое число следующего. */
  private buildPeriodWhere(userId: string, from: Date, to: Date): Prisma.TransactionWhereInput {
    return { userId, date: { gte: from, lt: to } };
  }
}
