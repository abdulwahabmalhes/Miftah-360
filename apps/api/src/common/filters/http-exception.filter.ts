import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiErrorResponse, StandardErrorCode } from '@miftah/contracts';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { correlationId?: string }>();

    const correlationId = request.correlationId || (request.headers['x-correlation-id'] as string) || uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = StandardErrorCode.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';
    let details: Record<string, unknown> | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, any>;
        message = obj.message || exception.message;
        code = obj.code || this.mapStatusToErrorCode(status);
        details = obj.details || (Array.isArray(obj.message) ? { validationErrors: obj.message } : undefined);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const payload: ApiErrorResponse = {
      error: {
        code,
        message: Array.isArray(message) ? message.join(', ') : message,
        details,
        correlation_id: correlationId,
      },
    };

    response.status(status).json(payload);
  }

  private mapStatusToErrorCode(status: number): StandardErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return StandardErrorCode.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return StandardErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return StandardErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return StandardErrorCode.NOT_FOUND;
      default:
        return StandardErrorCode.INTERNAL_SERVER_ERROR;
    }
  }
}

