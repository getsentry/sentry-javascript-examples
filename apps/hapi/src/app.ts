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

import Hapi from '@hapi/hapi';

dotenv.config({ path: './../../.env' });

declare global {
  namespace globalThis {
    var transactionIds: string[];
  }
}

const init = async () => {
  const server = Hapi.server({
    port: 3030,
    host: 'localhost',
  });

  server.route({
    method: 'GET',
    path: '/test-success',
    handler: function (request, h) {
      return { version: 'v1' };
    },
  });

  server.route({
    method: 'GET',
    path: '/test-error',
    handler: async function (request, h) {
      const exceptionId = Sentry.captureException(new Error('This is an error'));

      await Sentry.flush(2000);

      return { exceptionId };
    },
  });

  server.route({
    method: 'GET',
    path: '/test-failure-uncaught',
    handler: async function (request, h) {
      throw new Error('This is an error');
    },
  });

  server.route({
    method: 'GET',
    path: '/test-param-success/{param}',
    handler: function (request, h) {
      return { paramWas: request.params.param };
    },
  });

  server.route({
    method: 'GET',
    path: '/test-param-error/{param}',
    handler: async function (request, h) {
      const exceptionId = Sentry.captureException(new Error('This is an error'));

      await Sentry.flush(2000);

      return { exceptionId, paramWas: request.params.param };
    },
  });

  server.route({
    method: 'GET',
    path: '/test-success-manual',
    handler: async function (request, h) {
      Sentry.startSpan({ name: 'test-transaction', op: 'e2e-test' }, () => {
        Sentry.startSpan({ name: 'test-span' }, () => undefined);
      });

      await Sentry.flush();

      return {
        transactionIds: global.transactionIds || [],
      };
    },
  });

  server.route({
    method: 'GET',
    path: '/test-error-manual',
    handler: async function (request, h) {
      Sentry.startSpan({ name: 'test-transaction', op: 'e2e-test' }, () => {
        Sentry.startSpan({ name: 'test-span' }, () => {
          Sentry.captureException(new Error('This is an error'));
        });
      });

      await Sentry.flush(2000);

      return {
        transactionIds: global.transactionIds || [],
      };
    },
  });

  server.route({
    method: 'GET',
    path: '/test-local-variables-uncaught',
    handler: function (request, h) {
      const randomVariableToRecord = 'LOCAL VARIABLE';
      throw new Error(
        `Uncaught Local Variable Error - ${JSON.stringify({ randomVariableToRecord })}`,
      );
    },
  });

  server.route({
    method: 'GET',
    path: '/test-local-variables-caught',
    handler: function (request, h) {
      const randomVariableToRecord = 'LOCAL VARIABLE';

      let exceptionId: string;
      try {
        throw new Error('Local Variable Error');
      } catch (e) {
        exceptionId = Sentry.captureException(e);
      }

      return { exceptionId };
    },
  });

  // @ts-ignore
  await Sentry.setupHapiErrorHandler(server);
  await server.start();
  console.log('Server running on %s', server.info.uri);
};

init();
