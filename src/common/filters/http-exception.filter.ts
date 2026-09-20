import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const resBody = exception.getResponse();

    const errorCode = (exception as HttpException & { errorCode?: string })
      .errorCode;

    if (typeof resBody === 'object' && resBody !== null) {
      response.status(status).json({
        ...resBody,
        ...(errorCode ? { errorCode } : {}),
      });
      return;
    }

    response.status(status).json({
      statusCode: status,
      message: resBody,
      ...(errorCode ? { errorCode } : {}),
    });
  }
}
