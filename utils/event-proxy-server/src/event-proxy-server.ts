import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import type { AddressInfo } from 'net';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';
import * as zlib from 'zlib';
import type { Envelope, EnvelopeItem } from '@sentry/types';
import { parseEnvelope } from '@sentry/utils';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);

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

const TEMPORARY_FILE_PATH = 'payload-files/temporary.json';

function isDateLikeString(str: string): boolean {
  // matches strings in the format "YYYY-MM-DD"
  const datePattern = /^\d{4}-\d{2}-\d{2}/;
  return datePattern.test(str);
}

function extractPathFromUrl(url: string): string {
  const localhost = 'http://localhost:3030/';
  return url.replace(localhost, '');
}

function addCommaAfterEachLine(data: string): string {
  const jsonData = data.trim().split('\n');

  const jsonDataWithCommas = jsonData.map((item, index) =>
    index < jsonData.length - 1 ? item + ',' : item,
  );

  return jsonDataWithCommas.join('\n');
}

function recursivelyReplaceData(obj: any) {
  for (let key in obj) {
    if (typeof obj[key] === 'string' && isDateLikeString(obj[key])) {
      obj[key] = `[[ISODateString]]`;
    } else if (key.includes('timestamp')) {
      obj[key] = `[[timestamp]]`;
    } else if (key.includes('_id')) {
      obj[key] = `[[ID]]`;
    } else if (typeof obj[key] === 'number' && obj[key] > 1000) {
      obj[key] = `[[highNumber]]`;
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      recursivelyReplaceData(obj[key]);
    }
  }
}

function replaceDynamicValues(data: string): string[] {
  const jsonData = JSON.parse(data);

  recursivelyReplaceData(jsonData);

  // change remaining dynamic values
  jsonData.forEach((item: any) => {
    if (item.trace?.public_key) {
      item.trace.public_key = '[[publicKey]]';
    }
  });

  return jsonData;
}

/** This function transforms all dynamic data (like timestamps) from the temporarily saved file.
 *  The new content is saved into a new file with the url as the filename.
 *  The temporary file is deleted in the end.
 */
async function transformSavedJSON() {
  try {
    const data = await readFile(TEMPORARY_FILE_PATH, 'utf8');

    const jsonData = addCommaAfterEachLine(data);
    const transformedJSON = replaceDynamicValues(jsonData);
    const objWithReq = transformedJSON[2] as unknown as { request: { url: string } };

    if ('request' in objWithReq) {
      const url = objWithReq.request.url;
      const filepath = `payload-files/${extractPathFromUrl(url)}.json`;

      await writeFile(filepath, JSON.stringify(transformedJSON, null, 2));
      console.log(`Successfully modified timestamp in ${filepath}`);
    }

    await unlink(TEMPORARY_FILE_PATH);
    console.log(`Successfully deleted ${TEMPORARY_FILE_PATH}`);
  } catch (err) {
    console.error('Error', err);
  }
}

/**
 * Starts an event proxy server that will proxy events to sentry when the `tunnel` option is used. Point the `tunnel`
 * option to this server (like this `tunnel: http://localhost:${port option}/`).
 *
 */
export async function startEventProxyServer(options: EventProxyServerOptions): Promise<void> {
  const eventCallbackListeners: Set<(data: string) => void> = new Set();

  console.log(`Proxy server "${options.proxyServerName}" running. Waiting for events...`);

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

      fs.writeFile(TEMPORARY_FILE_PATH, `[${proxyRequestBody}]`, err => {
        if (err) {
          console.error(`Error writing file ${TEMPORARY_FILE_PATH}`, err);
        } else {
          console.log(`Successfully wrote to ${TEMPORARY_FILE_PATH}`);
        }
      });

      transformSavedJSON();

      const envelopeHeader: EnvelopeItem[0] = JSON.parse(proxyRequestBody.split('\n')[0]);

      if (!envelopeHeader.dsn) {
        throw new Error(
          '[event-proxy-server] No dsn on envelope header. Please set tunnel option.',
        );
      }

      const { origin, pathname, host } = new URL(envelopeHeader.dsn as string);

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
