import * as Sentry from '@sentry/node';

import dotenv from 'dotenv';

dotenv.config({ path: './../../.env' });

declare global {
  namespace globalThis {
    var transactionIds: string[];
  }
}

Sentry.init({
  environment: 'qa', // dynamic sampling bias to keep transactions
  dsn: 'https://eb90fdb87147dfc95899d3e63cc6ff20@o4506778646609920.ingest.us.sentry.io/4507168754761728',
  includeLocalVariables: true,
  debug: true,
  //tunnel: `http://localhost:3031/`, // proxy server
  tracesSampleRate: 1,
  integrations: [Sentry.experimental_redisIntegration({ client: 'ioredis' })],
});

import express from 'express';
import Redis from 'ioredis';

const app = express();
const port = 3030;

Sentry.setupExpressErrorHandler(app);

const redis = new Redis({
  port: 6379,
  host: 'localhost',
  password: '1234',
});

app.get('/redis-get', function (req, res) {
  redis.get('example-key').then(value => {
    res.send({ 'example-key': value });
  });
});

app.get('/redis-set', function (req, res) {
  redis.set('example-key', 'example-value');
  res.send('Redis SET');
});

app.get('/test-success', function (req, res) {
  res.send({ version: 'v1' });
});

app.get('/test-error', async function (req, res) {
  const exceptionId = Sentry.captureException(new Error('This is an error'));

  await Sentry.flush(2000);

  res.send({ exceptionId });
});

app.get('/test-param-success/:param', function (req, res) {
  res.send({ paramWas: req.params.param });
});

app.get('/test-param-error/:param', async function (req, res) {
  const exceptionId = Sentry.captureException(new Error('This is an error'));

  await Sentry.flush(2000);

  res.send({ exceptionId, paramWas: req.params.param });
});

app.get('/test-success-manual', async function (req, res) {
  Sentry.startSpan({ name: 'test-transaction', op: 'e2e-test' }, () => {
    Sentry.startSpan({ name: 'test-span' }, () => undefined);
  });

  await Sentry.flush();

  res.send({
    transactionIds: global.transactionIds || [],
  });
});

app.get('/test-error-manual', async function (req, res) {
  Sentry.startSpan({ name: 'test-transaction', op: 'e2e-test' }, () => {
    Sentry.startSpan({ name: 'test-span' }, () => {
      Sentry.captureException(new Error('This is an error'));
    });
  });

  await Sentry.flush(2000);

  res.send({
    transactionIds: global.transactionIds || [],
  });
});

app.get('/test-local-variables-uncaught', function (req, res) {
  const randomVariableToRecord = 'LOCAL VARIABLE';
  throw new Error(`Uncaught Local Variable Error - ${JSON.stringify({ randomVariableToRecord })}`);
});

app.get('/test-local-variables-caught', function (req, res) {
  const randomVariableToRecord = 'LOCAL VARIABLE';

  let exceptionId: string;
  try {
    throw new Error('Local Variable Error');
  } catch (e) {
    exceptionId = Sentry.captureException(e);
  }

  res.send({ exceptionId, randomVariableToRecord });
});

// @ts-ignore
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + '\n');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

Sentry.addEventProcessor(event => {
  global.transactionIds = global.transactionIds || [];

  if (event.type === 'transaction') {
    const eventId = event.event_id;

    if (eventId) {
      global.transactionIds.push(eventId);
    }
  }

  return event;
});
