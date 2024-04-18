import { startEventProxyServer } from './src/event-proxy-server';

const appName = process.env.APP_NAME;
const filenameOrigin = process.env.FILENAME_ORIGIN || 'url';

if (!appName) {
  throw new Error('You have to provide an APP_NAME environment variable.');
}

if (filenameOrigin !== 'url' && filenameOrigin !== 'transactionName') {
  throw new Error(
    "FILENAME_ORIGIN environment variable must be either 'url' or 'transactionName'.",
  );
}

startEventProxyServer({
  port: 3031,
  appName,
  filenameOrigin,
});
