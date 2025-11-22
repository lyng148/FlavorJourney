import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const payload = exception.getResponse() as any;

    // Support both shapes: { message: [...] } or { errors: [...] }
    const messages = Array.isArray(payload?.message)
      ? payload.message
      : Array.isArray(payload?.errors)
      ? payload.errors
      : undefined;

    if (messages) {
      return res.status(status).json({
        statusCode: status,
        message: messages,
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
      });
    }

    // Fallback
    return res.status(status).json({
      statusCode: status,
      message: payload?.message || exception.message || 'Bad Request',
      error: 'Bad Request',
      timestamp: new Date().toISOString(),
    });
  }
}
