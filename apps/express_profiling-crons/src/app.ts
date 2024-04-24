import * as Sentry from '@sentry/node';
import express from 'express';
import dotenv from 'dotenv';
import { CronJob } from 'cron';
import cron from 'node-cron';
import * as schedule from 'node-schedule';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

dotenv.config({ path: './../../.env' });

const app = express();
const port = 3030;

Sentry.init({
  environment: 'qa', // dynamic sampling bias to keep transactions
  dsn: process.env.SENTRY_DSN,
  includeLocalVariables: true,
  debug: true,
  tunnel: `http://localhost:3031/`, // proxy server
  tracesSampleRate: 1,
  profilesSampleRate: 1,
  integrations: [new Sentry.Integrations.Express({ app }), nodeProfilingIntegration()],
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// cron
const CronJobWithCheckIn = Sentry.cron.instrumentCron(CronJob, 'cron_slug');

const job = CronJobWithCheckIn.from({
  cronTime: '7 * * * * *',
  onTick: () => {
    console.log('cron: Job is running every few seconds');
  },
});

job.start();

// node-cron
const cronWithCheckIn = Sentry.cron.instrumentNodeCron(cron);

cronWithCheckIn.schedule(
  '11 * * * * *',
  () => {
    console.log('node-cron: Job is running every few seconds');
  },
  { name: 'node-cron_slug' },
);

// node-schedule
const scheduleWithCheckIn = Sentry.cron.instrumentNodeSchedule(schedule);

scheduleWithCheckIn.scheduleJob('node-schedule_slug', '13 * * * * *', () => {
  console.log('node-schedule: Job is running every few seconds');
});

// profiling
app.get('/test-profiling-manual', async function (req, res) {
  Sentry.startSpan({ name: 'test-transaction', op: 'e2e-test' }, () => {
    Sentry.startSpan({ name: 'test-span' }, () => console.log('Did some work'));
  });

  await Sentry.flush();

  res.send({ profiling: 'manual' });
});

app.get('/test-profiling-auto', async function (req, res) {
  setTimeout(() => {
    console.log('Did some work');
  }, 1000);

  await Sentry.flush();

  res.send({ profiling: 'auto' });
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
