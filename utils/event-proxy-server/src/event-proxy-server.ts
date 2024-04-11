import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import type { AddressInfo } from 'net';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';
import * as zlib from 'zlib';
import type { Envelope } from '@sentry/types';
import { parseEnvelope } from '@sentry/utils';

const writeFile = util.promisify(fs.writeFile);

interface EventProxyServerOptions {
  /** Port to start the event proxy server at. */
  port: number;
  /** The name for the proxy server used for referencing it with listener functions */
  proxyServerName: string;
}

interface SentryRequestCallbackData {
  envelope: Envelope;
  rawProxyRequestBody: string;
  rawSentryResponseBody: string;
  sentryResponseStatusCode?: number;
}

/**
 * Starts an event proxy server that will proxy events to sentry when the `tunnel` option is used. Point the `tunnel`
 * option to this server (like this `tunnel: http://localhost:${port option}/`).
 *
 */
export async function startEventProxyServer(options: EventProxyServerOptions): Promise<void> {
  const eventCallbackListeners: Set<(data: string) => void> = new Set();

  const proxyServer = http.createServer((proxyRequest, proxyResponse) => {
    const proxyRequestChunks: Uint8Array[] = [];

    proxyRequest.addListener('data', (chunk: Buffer) => {
      proxyRequestChunks.push(chunk);
    });

    proxyRequest.addListener('error', err => {
      throw err;
    });

    proxyRequest.addListener('end', () => {
      const proxyRequestBody =
        proxyRequest.headers['content-encoding'] === 'gzip'
          ? zlib.gunzipSync(Buffer.concat(proxyRequestChunks)).toString()
          : Buffer.concat(proxyRequestChunks).toString();

      let envelopeHeader = JSON.parse(proxyRequestBody.split('\n')[0]);

      if (!envelopeHeader.dsn) {
        throw new Error(
          '[event-proxy-server] No dsn on envelope header. Please set tunnel option.',
        );
      }

      const { origin, pathname, host } = new URL(envelopeHeader.dsn);

      const projectId = pathname.substring(1);
      const sentryIngestUrl = `${origin}/api/${projectId}/envelope/`;

      proxyRequest.headers.host = host;

      const sentryResponseChunks: Uint8Array[] = [];

      const sentryRequest = https.request(
        sentryIngestUrl,
        { headers: proxyRequest.headers, method: proxyRequest.method },
        sentryResponse => {
          sentryResponse.addListener('data', (chunk: Buffer) => {
            proxyResponse.write(chunk, 'binary');
            sentryResponseChunks.push(chunk);
          });

          sentryResponse.addListener('end', () => {
            eventCallbackListeners.forEach(listener => {
              const rawSentryResponseBody = Buffer.concat(sentryResponseChunks).toString();

              const data: SentryRequestCallbackData = {
                envelope: parseEnvelope(proxyRequestBody, new TextEncoder(), new TextDecoder()),
                rawProxyRequestBody: proxyRequestBody,
                rawSentryResponseBody,
                sentryResponseStatusCode: sentryResponse.statusCode,
              };

              listener(Buffer.from(JSON.stringify(data)).toString('base64'));
            });
            proxyResponse.end();
          });

          sentryResponse.addListener('error', err => {
            throw err;
          });

          proxyResponse.writeHead(sentryResponse.statusCode || 500, sentryResponse.headers);
        },
      );

      sentryRequest.write(Buffer.concat(proxyRequestChunks), 'binary');
      sentryRequest.end();
    });
  });

  const proxyServerStartupPromise = new Promise<void>(resolve => {
    proxyServer.listen(options.port, () => {
      resolve();
    });
  });

  const eventCallbackServer = http.createServer((eventCallbackRequest, eventCallbackResponse) => {
    eventCallbackResponse.statusCode = 200;
    eventCallbackResponse.setHeader('connection', 'keep-alive');

    const callbackListener = (data: string): void => {
      eventCallbackResponse.write(data.concat('\n'), 'utf8');
    };

    eventCallbackListeners.add(callbackListener);

    eventCallbackRequest.on('close', () => {
      eventCallbackListeners.delete(callbackListener);
    });

    eventCallbackRequest.on('error', () => {
      eventCallbackListeners.delete(callbackListener);
    });
  });

  const eventCallbackServerStartupPromise = new Promise<void>(resolve => {
    eventCallbackServer.listen(0, () => {
      const port = String((eventCallbackServer.address() as AddressInfo).port);
      void registerCallbackServerPort(options.proxyServerName, port).then(resolve);
    });
  });

  await eventCallbackServerStartupPromise;
  await proxyServerStartupPromise;
  return;
}

const TEMP_FILE_PREFIX = 'event-proxy-server-';

async function registerCallbackServerPort(serverName: string, port: string): Promise<void> {
  const tmpFilePath = path.join(os.tmpdir(), `${TEMP_FILE_PREFIX}${serverName}`);
  await writeFile(tmpFilePath, port, { encoding: 'utf8' });
}
