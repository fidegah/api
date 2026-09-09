import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { CorsOptions } from '@nestjs/common/internal';
import { IncomingMessage } from 'http';
import { ConfigService } from '@nestjs/config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  const rawPort = configService.get<string | number>('PORT', 3000);
  const port = typeof rawPort === 'string' ? parseInt(rawPort, 10) : rawPort;

  app.useLogger(app.get(Logger));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalInterceptors(new TransformResponseInterceptor());

  if (nodeEnv !== 'production') {
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const { apiReference } = await import('@scalar/nestjs-api-reference');

    const config = new DocumentBuilder()
      .setTitle('Fidegah')
      .setDescription('The Fidegah API description')
      .setVersion('1.0')
      .addTag('fidegah')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    app.use(
      '/docs',
      apiReference({
        spec: {
          content: document,
        },
        theme: 'kepler',
      }),
    );
  }

  app.enableCors(
    (
      req: IncomingMessage,
      callback: (err: Error | null, options: CorsOptions) => void,
    ) => {
      const url = req.url ?? '';
      let corsOptions: CorsOptions;

      if (url.startsWith('/v1') || url.startsWith('/portal')) {
        corsOptions = {
          origin: '*',
          methods: ['GET', 'POST', 'DELETE', 'PATCH'],
          allowedHeaders: [
            'Content-Type',
            'Authorization',
            'x-sdk-token',
            'x-api-key',
            'x-subdomain',
          ],
        };
      } else {
        corsOptions = {
          origin: ['https://fidegah.ir', 'http://localhost:5173'],
          methods: ['GET', 'POST', 'DELETE', 'PATCH'],
          allowedHeaders: ['Content-Type', 'Authorization', 'x-subdomain'],
          credentials: true,
        };
      }

      callback(null, corsOptions);
    },
  );

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
