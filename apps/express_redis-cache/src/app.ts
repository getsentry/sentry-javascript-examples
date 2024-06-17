import './instrument';

import * as Sentry from '@sentry/node';
import express from 'express';
import Redis from 'ioredis';
import {
  createClient,
  type RedisClientType,
  type RedisDefaultModules,
  type RedisModules,
  type RedisFunctions,
  type RedisScripts,
} from 'redis';
import dotenv from 'dotenv';

dotenv.config({ path: './../../.env' });

declare global {
  namespace globalThis {
    var transactionIds: string[];
  }
}

const app = express();
const port = 3030;

Sentry.setupExpressErrorHandler(app);

// IOREDIS -----------------------------------------------------
const redis = new Redis({
  port: 6379,
  host: 'localhost',
});

app.get('/ioredis-get', function (req, res) {
  redis.get('cache:1').then(value => {
    res.send({ 'cache:1': value });
  });
});

app.get('/ioredis-mget', function (req, res) {
  redis.mget(['cache:1', 'cache:2', 'cache:3']).then(value => {
    res.send({ 'cache:': value });
  });
});

app.get('/ioredis-set', async function (req, res) {
  await redis.set('cache:io1.2', 'example-value-1');
  await redis.set('cache:io2.2', 'example-value-2');
  await redis.set('cache:io3.2', 'example-value-3');

  res.send('Redis SET');
});

app.get('/ioredis-setex', async function (req, res) {
  await redis.set('cache:test-key-set-EX', 'test-value34', 'EX', 10);
  await redis.setex('cache:test-key-setex', 10, 'test-value434');

  res.send('Redis SET');
});

// REDIS -----------------------------------------------------
async function initializeClient() {
  return createClient().connect();
}

let redisClient: RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>;

(async function () {
  redisClient = await initializeClient();
})();

app.get('/redis-get', function (req, res) {
  redisClient.get('cache:1').then((value: any) => {
    res.send({ 'cache:1': value });
  });
});

app.get('/redis-mget', function (req, res) {
  redisClient
    .mGet(['redis-test-key', 'redis-cache:test-key', 'redis-cache:unavailable-data'])
    .then((value: any) => {
      res.send({ 'cache:': value });
    });
});

app.get('/redis-set', async function (req, res) {
  await redisClient.set('cache:1.2', 'example-value-1');
  await redisClient.set('cache:2.2', 'example-value-2');
  await redisClient.set('cache:3.2', 'example-value-3');

  res.send('Redis SET');
});

app.get('/redis-setex', async function (req, res) {
  await redisClient.set('cache:test-key-set-EX', 'test-value34', { EX: 10 });
  await redisClient.setEx('cache:test-key-setex', 10, 'test-value434');

  res.send('Redis SET');
});

// ----------------------------------------------------------

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
