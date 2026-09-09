import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { CorsOptions } from '@nestjs/common/internal';
import { IncomingMessage } from 'http';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

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

  app.enableCors(
    (
      req: IncomingMessage,
      callback: (err: Error | null, options: CorsOptions) => void,
    ) => {
      const url: string = req.url ?? '';
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

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
