import { Command } from '@nestjs/cqrs';

/** Команда на удаление операции. */
export class DeleteTransactionCommand extends Command<void> {
  /**
   * @param userId - владелец удаляемой операции
   * @param id - идентификатор удаляемой операции
   */
  constructor(
    readonly userId: string,
    readonly id: string,
  ) {
    super();
  }
}
