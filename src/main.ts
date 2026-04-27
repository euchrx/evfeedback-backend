import dns from 'dns';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

dns.setDefaultResultOrder('ipv4first');

type CorsCallback = (err: Error | null, allow?: boolean) => void;

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

async function bootstrap() {
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
    origin: (origin: string | undefined, callback: CorsCallback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port);
}

bootstrap();