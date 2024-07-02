import './instrument';
import * as Sentry from '@sentry/node';
import Hapi from '@hapi/hapi';
import Boom from '@hapi/boom';

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
    path: '/favicon.ico',
    handler: (request, h) => {
      return h.response('MOCK FAVICON').type('image/x-icon').code(200);
    },
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
      throw new Error('This is a JS error (route)');
    },
  });

  server.route({
    method: 'GET',
    path: '/test-failure-boom-5xx',
    handler: async function (request, h) {
      throw Boom.notImplemented('5xx not implemented (route)');
    },
  });

  server.route({
    method: 'GET',
    path: '/test-failure-boom-4xx',
    handler: async function (request, h) {
      throw Boom.notFound('4xx not found (route)');
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

  server.ext('onPreResponse', (response, h) => {
    console.log('onPreResponse');
    // throw Boom.notFound("4xx not found (onPreResponse)");
    // throw Boom.gatewayTimeout("5xx not implemented (onPreResponse)");
    // throw Error("onPreResponse")
    return h.continue;
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

init();
