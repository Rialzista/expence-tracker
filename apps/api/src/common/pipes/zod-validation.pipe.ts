import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import { z, type ZodType } from 'zod';

/**
 * Замена nestjs-zod: на момент создания проекта та библиотека объявляет
 * peer-зависимость только до @nestjs/common ^11 и с Nest 12 не ставится.
 *
 * Применяется точечно на параметре обработчика:
 *   @Body(new ZodValidationPipe(createTransactionSchema)) dto: CreateTransactionDto
 */
@Injectable()
export class ZodValidationPipe<T extends ZodType> implements PipeTransform<unknown, z.infer<T>> {
  /** @param schema - Zod-схема, которой должно соответствовать входное значение */
  constructor(private readonly schema: T) {}

  /**
   * Валидирует входное значение по схеме.
   *
   * @param value - сырое значение параметра запроса (body/query/param)
   * @returns значение, приведённое к типу схемы
   * @throws {BadRequestException} если значение не проходит валидацию схемой
   */
  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Ошибка валидации',
        errors: z.treeifyError(result.error),
      });
    }

    return result.data;
  }
}
