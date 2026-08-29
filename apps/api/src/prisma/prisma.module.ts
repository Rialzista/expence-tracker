import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service.js';

/**
 * Глобальный модуль: PrismaService нужен почти каждому доменному модулю,
 * и импортировать его в каждый — лишний шум.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
