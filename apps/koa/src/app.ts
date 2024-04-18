import Koa from 'koa';
import Router from '@koa/router';
import * as Sentry from '@sentry/node';
import { stripUrlQueryAndFragment } from '@sentry/utils';
import dotenv from 'dotenv';

dotenv.config({ path: './../../.env' });

declare global {
  namespace globalThis {
    var transactionIds: string[];
  }
}

const router = new Router();
const app = new Koa();

Sentry.init({
  environment: 'qa', // dynamic sampling bias to keep transactions
  dsn: process.env.SENTRY_DSN,
  includeLocalVariables: true,
  debug: true,
  tunnel: `http://localhost:3031/`, // proxy server
  tracesSampleRate: 1,
  integrations: [...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations()],
});

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

const requestHandler = (ctx: { request: Sentry.PolymorphicRequest }, next: () => void) => {
  Sentry.runWithAsyncContext(() => {
    const scope = Sentry.getCurrentScope();
    scope.addEventProcessor(event =>
      Sentry.addRequestDataToEvent(event, ctx.request, {
        include: {
          user: false,
        },
      }),
    );

    next();
  });
};

// this tracing middleware creates a transaction per request
const tracingMiddleWare = (ctx: any, next: () => void) => {
  const reqMethod = (ctx.method || '').toUpperCase();
  const reqUrl = ctx.url && stripUrlQueryAndFragment(ctx.url);

  // connect to trace of upstream app
  let traceparentData;
  if (ctx.request.get('sentry-trace')) {
    traceparentData = Sentry.extractTraceparentData(ctx.request.get('sentry-trace'));
  }

  const transaction = Sentry.startTransaction({
    name: `${reqMethod} ${reqUrl}`,
    op: 'http.server',
    ...traceparentData,
  });

  ctx.__sentry_transaction = transaction;

  // We put the transaction on the scope so users can attach children to it
  Sentry.getCurrentScope().setSpan(transaction);

  ctx.res.on('finish', () => {
    // Push `transaction.finish` to the next event loop so open spans have a chance to finish before the transaction closes
    setImmediate(() => {
      // if using koa router, a nicer way to capture transaction using the matched route
      if (ctx._matchedRoute) {
        const mountPath = ctx.mountPath || '';
        transaction.setName(`${reqMethod} ${mountPath}${ctx._matchedRoute}`);
      }
      transaction.setHttpStatus(ctx.status);
      transaction.finish();
    });
  });

  next();
};

app.use(requestHandler);
app.use(tracingMiddleWare);

app.on('error', (err, ctx) => {
  Sentry.withScope(scope => {
    scope.setSDKProcessingMetadata({ request: ctx.request });
    Sentry.captureException(err);
  });
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3030);
