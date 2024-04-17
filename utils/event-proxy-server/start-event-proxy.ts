import { startEventProxyServer } from './src/event-proxy-server';

startEventProxyServer({
  port: 3031,
  appName: 'express',
  filenameOrigin: 'url',
});
