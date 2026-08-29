import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';
import type { Env } from './config/env.schema.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }),
    credentials: true,
  });

  // Nest'овский ValidationPipe требует class-validator/class-transformer в рантайме
  // независимо от того, используются ли их декораторы — а мы намеренно валидируем
  // тела запросов через ZodValidationPipe на уровне каждого обработчика,
  // без class-validator. Глобальный pipe здесь не нужен и не устанавливается.

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Expense Tracker API')
    .setDescription('REST API трекера расходов')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup('api/docs', app, () =>
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  const port = config.get('API_PORT', { infer: true });
  await app.listen(port);

  Logger.log(`API слушает http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(`Swagger доступен на http://localhost:${port}/api/docs`, 'Bootstrap');
}

void bootstrap();
