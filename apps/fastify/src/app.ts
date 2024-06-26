import './instrument';

import * as Sentry from '@sentry/node';
import { fastify } from 'fastify';

declare global {
  namespace globalThis {
    var transactionIds: string[];
  }
}

// Make sure fastify is imported after Sentry is initialized
const app = fastify();

Sentry.setupFastifyErrorHandler(app);

app.get('/test-success', function (_req, res) {
  res.send({ version: 'v1' });
});

app.get('/test-error', async function (req, res) {
  const exceptionId = Sentry.captureException(new Error('This is an error'));

  await Sentry.flush(2000);

  res.send({ exceptionId });
});

app.get<{ Params: { param: string } }>('/test-param-success/:param', function (req, res) {
  res.send({ paramWas: req.params.param });
});

app.get<{ Params: { param: string } }>('/test-param-error/:param', async function (req, res) {
  const exceptionId = Sentry.captureException(new Error('This is an error'));

  await Sentry.flush(2000);

  res.send({ exceptionId, paramWas: req.params.param });
});

app.get('/test-success-manual', async function (req, res) {
  Sentry.startSpan({ name: 'test-span' }, () => {
    Sentry.startSpan({ name: 'child-span' }, () => {});
  });

  await Sentry.flush();

  res.send({
    transactionIds: global.transactionIds || [],
  });
});

app.get('/test-error-manual', async function (req, res) {
  Sentry.startSpan({ name: 'test-span' }, () => {
    Sentry.startSpan({ name: 'child-span' }, () => {
      Sentry.captureException(new Error('This is an error'));
    });
  });

  await Sentry.flush(2000);

  res.send({
    transactionIds: global.transactionIds || [],
  });
});

app.get('/test-local-variables-uncaught', function (req, res) {
  const randomVariableToRecord = 'LOCAL_VARIABLE';
  throw new Error(`Uncaught Local Variable Error - ${JSON.stringify({ randomVariableToRecord })}`);
});

app.get('/test-local-variables-caught', function (req, res) {
  const randomVariableToRecord = 'LOCAL_VARIABLE';

  let exceptionId: string;
  try {
    throw new Error('Local Variable Error');
  } catch (e) {
    exceptionId = Sentry.captureException(e);
  }

  res.send({ exceptionId, randomVariableToRecord });
});

app.listen({ port: 3030 });
