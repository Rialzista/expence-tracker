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
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Список операций с фильтрами по периоду, типу и категории' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Страница операций' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(transactionQuerySchema)) query: TransactionQuery,
  ): Promise<Paginated<TransactionResponse>> {
    return this.queryBus.execute(new GetTransactionsQuery(userId, query));
  }

  /**
   * Объявлен до @Get(':id') намеренно: Nest матчит маршруты по порядку
   * объявления, и ниже 'summary' попал бы в :id и не прошёл бы idSchema.
   */
  @Get('summary')
  @ApiOperation({ summary: 'Сводка за месяц: доход, расход, баланс и разбивка по категориям' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Сводка за месяц' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Не переданы month и year' })
  getSummary(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(transactionSummaryQuerySchema)) query: TransactionSummaryQuery,
  ): Promise<TransactionSummary> {
    return this.queryBus.execute(new GetTransactionsSummaryQuery(userId, query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Одна операция' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Операция' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Операция не найдена' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
  ): Promise<TransactionResponse> {
    return this.queryBus.execute(new GetTransactionQuery(userId, id));
  }

  @Post()
  @ApiOperation({ summary: 'Создать операцию' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Операция создана' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Категория не найдена' })
  create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createTransactionSchema)) dto: CreateTransactionDto,
  ): Promise<TransactionResponse> {
    return this.commandBus.execute(new CreateTransactionCommand(userId, dto));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить операцию' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Операция обновлена' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Операция или категория не найдена' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateTransactionSchema)) dto: UpdateTransactionDto,
  ): Promise<TransactionResponse> {
    return this.commandBus.execute(new UpdateTransactionCommand(userId, id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить операцию' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Операция удалена' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Операция не найдена' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteTransactionCommand(userId, id));
  }
}
