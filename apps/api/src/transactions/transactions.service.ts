import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type {
  CategoryResponse,
  CategorySummary,
  CreateTransactionDto,
  Paginated,
  TransactionQuery,
  TransactionResponse,
  TransactionSummary,
  TransactionSummaryQuery,
  UpdateTransactionDto,
} from '@expense-tracker/shared';

import { GetCategoriesQuery, GetCategoryByIdQuery } from '../categories/queries/index.js';
import { Prisma } from '../generated/prisma/client.js';
import { TransactionsRepository } from './transactions.repository.js';
import { toTransactionResponse } from './transaction.mapper.js';

const ZERO = new Prisma.Decimal(0);

/**
 * Доменный слой операций. Не экспортируется из TransactionsModule —
 * вызывается только обработчиками команд/запросов этого же модуля.
 *
 * Категории живут в чужом модуле и напрямую сюда не импортируются:
 * общение идёт через QueryBus классами из categories/queries.
 */
@Injectable()
export class TransactionsService {
  /**
   * @param repository - доступ к операциям в БД
   * @param queryBus - для обращения к categories через CQRS
   */
  constructor(
    private readonly repository: TransactionsRepository,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Список операций пользователя с пагинацией и фильтрами.
   *
   * @param userId - идентификатор пользователя
   * @param query - фильтры и параметры страницы
   * @returns страница операций с общим количеством
   */
  async findAll(userId: string, query: TransactionQuery): Promise<Paginated<TransactionResponse>> {
    const [transactions, total] = await this.repository.findManyByUser(userId, query);

    return {
      items: transactions.map(toTransactionResponse),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  /**
   * Одна операция по id.
   *
   * @param userId - идентификатор пользователя, которому должна принадлежать операция
   * @param id - идентификатор операции
   * @returns операция в формате ответа API
   * @throws {NotFoundException} если операция с таким id не найдена у пользователя
   */
  async findOne(userId: string, id: string): Promise<TransactionResponse> {
    const transaction = await this.repository.findByIdForUser(id, userId);
    if (!transaction) {
      throw new NotFoundException('Операция не найдена');
    }

    return toTransactionResponse(transaction);
  }

  /**
   * Создать операцию.
   *
   * @param userId - владелец создаваемой операции
   * @param dto - данные операции
   * @returns созданная операция
   * @throws {NotFoundException} если указанная категория не найдена у пользователя
   */
  async create(userId: string, dto: CreateTransactionDto): Promise<TransactionResponse> {
    await this.assertCategoryBelongsToUser(userId, dto.categoryId);

    const transaction = await this.repository.create({
      userId,
      amount: dto.amount,
      currency: dto.currency,
      type: dto.type,
      date: new Date(dto.date),
      categoryId: dto.categoryId ?? null,
      note: dto.note ?? null,
    });

    return toTransactionResponse(transaction);
  }

  /**
   * Обновить операцию.
   *
   * @param userId - идентификатор пользователя, которому должна принадлежать операция
   * @param id - идентификатор обновляемой операции
   * @param dto - изменяемые поля
   * @returns обновлённая операция
   * @throws {NotFoundException} если операция не найдена или указанная категория не найдена у пользователя
   */
  async update(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponse> {
    const existing = await this.repository.findByIdForUser(id, userId);
    if (!existing) {
      throw new NotFoundException('Операция не найдена');
    }

    await this.assertCategoryBelongsToUser(userId, dto.categoryId);

    // Ключи, которых не было в теле запроса, Zod в результат не кладёт —
    // поэтому spread не затирает поля, а null у categoryId/note очищает их.
    const { date, ...rest } = dto;
    const transaction = await this.repository.update(id, {
      ...rest,
      ...(date ? { date: new Date(date) } : {}),
    });

    return toTransactionResponse(transaction);
  }

  /**
   * Удалить операцию.
   *
   * @param userId - идентификатор пользователя, которому должна принадлежать операция
   * @param id - идентификатор удаляемой операции
   * @returns ничего не возвращает
   * @throws {NotFoundException} если операция с таким id не найдена у пользователя
   */
  async remove(userId: string, id: string): Promise<void> {
    const count = await this.repository.remove(id, userId);
    if (count === 0) {
      throw new NotFoundException('Операция не найдена');
    }
  }

  /**
   * Сводка за календарный месяц: доход, расход, баланс и разбивка по категориям.
   *
   * Границы считаются в UTC — колонка date объявлена как Timestamptz(3), и
   * локальная зона процесса не должна сдвигать месяц.
   *
   * @param userId - идентификатор пользователя
   * @param month - месяц агрегируемого периода (1-12)
   * @param year - год агрегируемого периода
   * @returns сводка за указанный месяц
   */
  async getSummary(
    userId: string,
    { month, year }: TransactionSummaryQuery,
  ): Promise<TransactionSummary> {
    const from = new Date(Date.UTC(year, month - 1, 1));
    const to = new Date(Date.UTC(year, month, 1));

    const [byType, byCategory, categories] = await Promise.all([
      this.repository.sumByType(userId, from, to),
      this.repository.sumByCategory(userId, from, to),
      this.queryBus.execute<GetCategoriesQuery, CategoryResponse[]>(new GetCategoriesQuery(userId)),
    ]);

    const income = byType.find((row) => row.type === 'INCOME')?.total ?? ZERO;
    const expense = byType.find((row) => row.type === 'EXPENSE')?.total ?? ZERO;
    const names = new Map(categories.map((category) => [category.id, category.name]));

    return {
      month,
      year,
      income: income.toFixed(2),
      expense: expense.toFixed(2),
      balance: income.minus(expense).toFixed(2),
      byCategory: byCategory
        .map((row): CategorySummary => ({
          categoryId: row.categoryId,
          categoryName: row.categoryId ? (names.get(row.categoryId) ?? null) : null,
          type: row.type,
          total: (row.total ?? ZERO).toFixed(2),
        }))
        // Крупные суммы сверху — иначе порядок задаёт БД и он не воспроизводим.
        .sort((a, b) => Number(b.total) - Number(a.total)),
    };
  }

  /**
   * Проверяет, что categoryId (если передан) принадлежит пользователю.
   *
   * Чужой categoryId не должен доходить до FK: иначе вместо понятной ошибки
   * пользователь получит сырой P2003, а по коду ответа можно будет
   * перебирать существующие категории других пользователей.
   *
   * @param userId - идентификатор пользователя
   * @param categoryId - проверяемый идентификатор категории; `null`/`undefined` пропускается без проверки
   * @returns ничего не возвращает
   * @throws {NotFoundException} если категория с таким id не найдена у пользователя
   */
  private async assertCategoryBelongsToUser(
    userId: string,
    categoryId: string | null | undefined,
  ): Promise<void> {
    if (!categoryId) {
      return;
    }

    const category = await this.queryBus.execute<GetCategoryByIdQuery, CategoryResponse | null>(
      new GetCategoryByIdQuery(userId, categoryId),
    );

    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }
  }
}
