import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';

async function bootstrap() {
  Sentry.init({
    environment: 'qa', // dynamic sampling bias to keep transactions
    dsn: process.env.E2E_TEST_DSN,
    includeLocalVariables: true,
    tunnel: `http://localhost:3031/`, // proxy server
    tracesSampleRate: 1,
  });

  const app = await NestFactory.create(AppModule);

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  // Uncaught exceptions are not sent as event in v7, in v8 they are sent as events and transactions
  app.use(Sentry.Handlers.errorHandler());

  await app.listen(3030);
}

bootstrap();
