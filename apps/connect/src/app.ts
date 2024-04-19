import * as Sentry from '@sentry/node';
import connect from 'connect';
import dotenv from 'dotenv';

dotenv.config({ path: './../../.env' });

declare global {
  namespace globalThis {
    var transactionIds: string[];
  }
}

const app = connect();
const port = 3030;

Sentry.init({
  environment: 'qa', // dynamic sampling bias to keep transactions
  dsn: process.env.SENTRY_DSN,
  includeLocalVariables: true,
  debug: true,
  tunnel: `http://localhost:3031/`, // proxy server
  tracesSampleRate: 1,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

const stringify = (obj: any) => JSON.stringify(obj, null, 2);

app.use('/test-success', function (req, res) {
  res.end(stringify({ version: 'v1' }));
});

app.use('/test-error', async function (req, res) {
  const exceptionId = Sentry.captureException(new Error('This is an error'));

  await Sentry.flush(2000);

  res.end(stringify({ exceptionId }));
});

app.use('/test-param-success/', function (req, res) {
  const param = req.url?.replace('/', '');
  res.end(stringify({ paramWas: param }));
});

app.use('/test-param-error/', async function (req, res) {
  const param = req.url?.replace('/', '');

  const exceptionId = Sentry.captureException(new Error('This is an error'));

  await Sentry.flush(2000);

  res.end(stringify({ exceptionId, paramWas: param }));
});

app.use('/test-success-manual', async function (req, res) {
  Sentry.startSpan({ name: 'test-transaction', op: 'e2e-test' }, () => {
    Sentry.startSpan({ name: 'test-span' }, () => undefined);
  });

  await Sentry.flush();

  res.end(
    stringify({
      transactionIds: global.transactionIds || [],
    }),
  );
});

app.use('/test-error-manual', async function (req, res) {
  Sentry.startSpan({ name: 'test-transaction', op: 'e2e-test' }, () => {
    Sentry.startSpan({ name: 'test-span' }, () => {
      Sentry.captureException(new Error('This is an error'));
    });
  });

  await Sentry.flush(2000);

  res.end(
    stringify({
      transactionIds: global.transactionIds || [],
    }),
  );
});

app.use('/test-local-variables-uncaught', function (req, res) {
  const randomVariableToRecord = 'LOCAL VARIABLE';
  throw new Error(`Uncaught Local Variable Error - ${stringify({ randomVariableToRecord })}`);
});

app.use('/test-local-variables-caught', function (req, res) {
  const randomVariableToRecord = 'LOCAL VARIABLE';

  let exceptionId: string;
  try {
    throw new Error('Local Variable Error');
  } catch (e) {
    exceptionId = Sentry.captureException(e);
  }

  res.end(stringify({ exceptionId, randomVariableToRecord }));
});

app.use(Sentry.Handlers.errorHandler());

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
