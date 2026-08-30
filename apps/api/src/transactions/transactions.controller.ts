import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  createTransactionSchema,
  idSchema,
  transactionQuerySchema,
  transactionSummaryQuerySchema,
  updateTransactionSchema,
  type CreateTransactionDto,
  type Paginated,
  type TransactionQuery,
  type TransactionResponse,
  type TransactionSummary,
  type TransactionSummaryQuery,
  type UpdateTransactionDto,
} from '@expense-tracker/shared';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import {
  CreateTransactionCommand,
  DeleteTransactionCommand,
  UpdateTransactionCommand,
} from './commands/index.js';
import {
  GetTransactionQuery,
  GetTransactionsQuery,
  GetTransactionsSummaryQuery,
} from './queries/index.js';

@ApiBearerAuth()
@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  /**
   * @param commandBus - шина команд CQRS
   * @param queryBus - шина запросов CQRS
   */
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Список операций пользователя с пагинацией и фильтрами по периоду, типу и категории.
   *
   * @param userId - идентификатор текущего пользователя
   * @param query - фильтры и параметры страницы, провалидированные transactionQuerySchema
   * @returns страница операций с общим количеством
   * @throws {BadRequestException} если query не проходит transactionQuerySchema
   */
  @Get()
  @ApiOperation({ summary: 'Список операций с фильтрами по периоду, типу и категории' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Страница операций' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Невалидные фильтры или параметры пагинации',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Не авторизован' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(transactionQuerySchema)) query: TransactionQuery,
  ): Promise<Paginated<TransactionResponse>> {
    return this.queryBus.execute(new GetTransactionsQuery(userId, query));
  }

  /**
   * Сводка за календарный месяц: доход, расход, баланс и разбивка по категориям.
   *
   * Объявлен до @Get(':id') намеренно: Nest матчит маршруты по порядку
   * объявления, и ниже 'summary' попал бы в :id и не прошёл бы idSchema.
   *
   * @param userId - идентификатор текущего пользователя
   * @param query - month/year, провалидированные transactionSummaryQuerySchema
   * @returns агрегированная сводка за указанный месяц
   * @throws {BadRequestException} если month/year не переданы или невалидны
   */
  @Get('summary')
  @ApiOperation({ summary: 'Сводка за месяц: доход, расход, баланс и разбивка по категориям' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Сводка за месяц' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Не переданы month и year' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Не авторизован' })
  getSummary(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(transactionSummaryQuerySchema)) query: TransactionSummaryQuery,
  ): Promise<TransactionSummary> {
    return this.queryBus.execute(new GetTransactionsSummaryQuery(userId, query));
  }

  /**
   * Одна операция по id.
   *
   * @param userId - идентификатор текущего пользователя
   * @param id - идентификатор операции
   * @returns операция в формате ответа API
   * @throws {BadRequestException} если id не проходит idSchema
   * @throws {NotFoundException} если операция с таким id не найдена у пользователя
   */
  @Get(':id')
  @ApiOperation({ summary: 'Одна операция' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Операция' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Невалидный id операции' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Не авторизован' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Операция не найдена' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
  ): Promise<TransactionResponse> {
    return this.queryBus.execute(new GetTransactionQuery(userId, id));
  }

  /**
   * Создать операцию.
   *
   * @param userId - владелец создаваемой операции
   * @param dto - данные операции, провалидированные createTransactionSchema
   * @returns созданная операция
   * @throws {BadRequestException} если dto не проходит createTransactionSchema
   * @throws {NotFoundException} если указанная категория не найдена у пользователя
   */
  @Post()
  @ApiOperation({ summary: 'Создать операцию' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Операция создана' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Невалидное тело запроса' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Не авторизован' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Категория не найдена' })
  create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createTransactionSchema)) dto: CreateTransactionDto,
  ): Promise<TransactionResponse> {
    return this.commandBus.execute(new CreateTransactionCommand(userId, dto));
  }

  /**
   * Обновить операцию.
   *
   * @param userId - идентификатор текущего пользователя
   * @param id - идентификатор обновляемой операции
   * @param dto - изменяемые поля, провалидированные updateTransactionSchema
   * @returns обновлённая операция
   * @throws {BadRequestException} если id или dto не проходят валидацию
   * @throws {NotFoundException} если операция или указанная категория не найдены
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Обновить операцию' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Операция обновлена' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Невалидный id или тело запроса' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Не авторизован' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Операция или категория не найдена' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateTransactionSchema)) dto: UpdateTransactionDto,
  ): Promise<TransactionResponse> {
    return this.commandBus.execute(new UpdateTransactionCommand(userId, id, dto));
  }

  /**
   * Удалить операцию.
   *
   * @param userId - идентификатор текущего пользователя
   * @param id - идентификатор удаляемой операции
   * @returns ничего не возвращает (204 No Content)
   * @throws {BadRequestException} если id не проходит idSchema
   * @throws {NotFoundException} если операция с таким id не найдена у пользователя
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить операцию' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Операция удалена' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Невалидный id операции' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Не авторизован' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Операция не найдена' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteTransactionCommand(userId, id));
  }
}
