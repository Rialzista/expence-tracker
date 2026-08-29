import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { HealthController } from './common/health.controller.js';
import { validateEnv } from './config/env.schema.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // .env лежит в корне монорепо и общий для web и api.
      envFilePath: ['../../.env'],
      validate: validateEnv,
    }),
    // Ровно один вызов forRoot() на всё приложение — он global: true,
    // повторный вызов в другом модуле создал бы вторые CommandBus/QueryBus.
    CqrsModule.forRoot(),
    PrismaModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
