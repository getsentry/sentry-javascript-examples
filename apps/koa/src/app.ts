import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';

dotenv.config({ path: './../../.env' });

Sentry.init({
  environment: 'qa', // dynamic sampling bias to keep transactions
  dsn: process.env.SENTRY_DSN,
  includeLocalVariables: true,
  debug: true,
  tunnel: `http://localhost:3031/`, // proxy server
  tracesSampleRate: 1,
});

import Koa from 'koa';
import Router from '@koa/router';
import { stripUrlQueryAndFragment } from '@sentry/utils';

declare global {
  namespace globalThis {
    var transactionIds: string[];
  }
}

const router = new Router();
const app = new Koa();

router.get('/test-success', ctx => {
  ctx.body = { version: 'v1' };
});

router.get('/test-error', async ctx => {
  const exceptionId = Sentry.captureException(new Error('This is an error'));

  Sentry.flush(2000);

  ctx.body = { exceptionId };
});

router.get('/test-param-success/:param', ctx => {
  ctx.body = { paramWas: ctx.params.param };
});

router.get('/test-param-error/:param', async ctx => {
  const exceptionId = Sentry.captureException(new Error('This is an error'));

  Sentry.flush(2000);

  ctx.body = { exceptionId, paramWas: ctx.params.param };
});

router.get('/test-success-manual', async ctx => {
  Sentry.startSpan({ name: 'test-transaction', op: 'e2e-test' }, () => {
    Sentry.startSpan({ name: 'test-span' }, () => undefined);
  });

  Sentry.flush();

  ctx.body = {
    transactionIds: global.transactionIds || [],
  };
});

router.get('/test-error-manual', async ctx => {
  Sentry.startSpan({ name: 'test-transaction', op: 'e2e-test' }, () => {
    Sentry.startSpan({ name: 'test-span' }, () => {
      Sentry.captureException(new Error('This is an error'));
    });
  });

  Sentry.flush();

  ctx.body = {
    transactionIds: global.transactionIds || [],
  };
});

router.get('/test-local-variables-uncaught', ctx => {
  const randomVariableToRecord = 'LOCAL VARIABLE';
  throw new Error(`Uncaught Local Variable Error - ${JSON.stringify({ randomVariableToRecord })}`);
});

router.get('/test-local-variables-caught', ctx => {
  const randomVariableToRecord = 'LOCAL VARIABLE';

  let exceptionId: string;
  try {
    throw new Error('Local Variable Error');
  } catch (e) {
    exceptionId = Sentry.captureException(e);
  }

  ctx.body = { exceptionId, randomVariableToRecord };
});

Sentry.setupKoaErrorHandler(app);

app.on('error', (err, ctx) => {
  console.log('error', err);

  ctx.body({
    error: err.message,
    status: ctx.status,
  });
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3030);
