import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Приводит любые исключения к единому телу ответа, описанному
 * схемой apiErrorSchema в @expense-tracker/shared.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const { message, errors } = this.extractBody(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(errors ? { errors } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * getResponse() возвращает либо строку, либо объект — у ZodValidationPipe
   * это { message, errors }. Разбираем оба случая.
   */
  private extractBody(exception: unknown): { message: string; errors?: unknown } {
    if (!(exception instanceof HttpException)) {
      return { message: 'Внутренняя ошибка сервера' };
    }

    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return { message: payload };
    }

    const body = payload as { message?: unknown; errors?: unknown };
    const message = typeof body.message === 'string' ? body.message : exception.message;

    return { message, errors: body.errors };
  }
}
