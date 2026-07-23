import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { setDefaultResultOrder } from 'node:dns';
import { AppModule } from './app.module';

setDefaultResultOrder('ipv4first');

type CorsCallback = (error: Error | null, allow?: boolean) => void;

function parseAllowedOrigins(envValue?: string): string[] {
  if (!envValue) {
    return [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://evfeedback-frontend.vercel.app',
    ];
  }

  return envValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGINS);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: CorsCallback,
    ): void => {
      // Permite requisições sem Origin, como Postman, Swagger e chamadas internas.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen(port, host);

  console.log(`EvFeedback API executando em ${await app.getUrl()}`);
}

void bootstrap();