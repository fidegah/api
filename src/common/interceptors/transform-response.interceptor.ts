import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function isPaginatedResult(
  value: unknown,
): value is { data: unknown; pagination: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'pagination' in value
  );
}

function isMessageResult(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    Object.keys(value).length === 1
  );
}

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((result: unknown) => {
        if (isPaginatedResult(result)) {
          return result;
        }

        if (isMessageResult(result)) {
          return result;
        }

        return { data: result };
      }),
    );
  }
}
