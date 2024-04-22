import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import dotenv from 'dotenv';

dotenv.config({ path: './../../.env' });

async function bootstrap() {
  Sentry.init({
    environment: 'qa', // dynamic sampling bias to keep transactions
    dsn: process.env.SENTRY_DSN,
    tunnel: `http://localhost:3031/`, // proxy server
    tracesSampleRate: 1,
  });

  const app = await NestFactory.create(AppModule);
  // @ts-ignore
  Sentry.setupNestErrorHandler(app);

  await app.listen(3030);
}

bootstrap();
