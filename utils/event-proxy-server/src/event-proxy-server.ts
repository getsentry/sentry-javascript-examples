import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as util from 'util';
import * as zlib from 'zlib';
import type { Envelope, EnvelopeItem } from '@sentry/types';

// change to folder name of app to test
const APP = 'express';
const DIRECTORY = '../../payload-files';

const TEMPORARY_FILE_PATH = `${DIRECTORY}/${APP}/temporary.json`;

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

function isDateLikeString(str: string): boolean {
  // matches strings in the format "YYYY-MM-DD"
  const datePattern = /^\d{4}-\d{2}-\d{2}/;
  return datePattern.test(str);
}

function extractPathFromUrl(url: string): string {
  return url.replace('http://localhost:3030/', '');
}

function extractTransactionRoute(transactionName: string): string {
  return transactionName.replace('GET ', '');
}

function extractRelevantFileName(str: string): string {
  return extractPathFromUrl(extractTransactionRoute(str));
}

function addCommaAfterEachLine(data: string): string {
  const jsonData = data.trim().split('\n');

  const jsonDataWithCommas = jsonData.map((item, index) =>
    index < jsonData.length - 1 ? item + ',' : item,
  );

  return jsonDataWithCommas.join('\n');
}

// has to be an object to be able to pass by reference. Otherwise, the counter would not increase
type Counter = {
  value: number;
};

function recursivelyReplaceData(
  obj: any,
  idCounter: Counter,
  idMap: Map<string, string>,
  filenameCounter: Counter,
  filenameMap: Map<string, string>,
) {
  if (Array.isArray(obj)) {
    // some values are arrays with objects in it
    obj.forEach((item, index) => {
      if (typeof item === 'object' && item !== null) {
        recursivelyReplaceData(item, idCounter, idMap, filenameCounter, filenameMap);
      }
    });
  } else {
    for (let key in obj) {
      if (typeof obj[key] === 'string' && isDateLikeString(obj[key])) {
        obj[key] = `[[ISODateString]]`;
      } else if (key.includes('timestamp')) {
        obj[key] = `[[timestamp]]`;
      } else if (key.includes('timestamp')) {
        obj[key] = `[[timestamp]]`;
      } else if (typeof obj[key] === 'number' && obj[key] > 1000) {
        obj[key] = `[[highNumber]]`;
      } else if (key === 'if-none-match') {
        if (obj[key].startsWith('W/')) {
          obj[key] = `[[W/entityTagValue]]`;
        } else {
          obj[key] = `[[entityTagValue]]`;
        }
      } else if (key === 'user-agent') {
        obj[key] = `[[user-agent]]`;
      } else if (key.includes('_id')) {
        if (idMap.has(obj[key])) {
          // give the same ID replacement to the same value
          obj[key] = idMap.get(obj[key]);
        } else {
          const newId = `[[ID${idCounter.value++}]]`;
          idMap.set(obj[key], newId);
          obj[key] = newId;
        }
      } else if (key === 'filename') {
        if (filenameMap.has(obj[key])) {
          // give the same ID replacement to the same value
          obj[key] = filenameMap.get(obj[key]);
        } else {
          const newId = `[[FILENAME${filenameCounter.value++}]]`;
          filenameMap.set(obj[key], newId);
          obj[key] = newId;
        }
      }
      // recurse into object or array
      else if (typeof obj[key] === 'object' && obj[key] !== null) {
        recursivelyReplaceData(obj[key], idCounter, idMap, filenameCounter, filenameMap);
      }
    }
  }
}

function sortObjectKeys(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  return Object.keys(obj as Record<string, unknown>)
    .sort()
    .reduce((result: Record<string, unknown>, key: string) => {
      result[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
      return result;
    }, {});
}

function replaceDynamicValues(jsonData: object[]): object[] {
  recursivelyReplaceData(jsonData, { value: 1 }, new Map(), { value: 1 }, new Map());

  // change remaining dynamic values
  jsonData.forEach((item: any) => {
    if (item.trace?.public_key) {
      item.trace.public_key = '[[publicKey]]';
    }
    if (item.dsn) {
      item.dsn = '[[dsn]]';
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
    const sortedJSON = sortObjectKeys(JSON.parse(jsonData));
    const transformedJSON = replaceDynamicValues(sortedJSON as object[]);

    const type = (transformedJSON[1] as unknown as { type: string }).type; // transaction or event

    const objData = transformedJSON[2] as unknown as {
      request?: { url?: string };
      transaction?: string;
      contexts?: { trace?: { data?: { url?: string } } };
    };

    if ('request' in objData || 'contexts' in objData) {
      const transactionName = objData?.transaction;
      const url = objData?.request?.url || objData.contexts?.trace?.data?.url;

      // Change to `url` or `transactionName` depending on what you want to use as filename
      // Using transaction name as filename is useful when testing frameworks (such as Next.js) as the API routes are often called from the client and `url` would just be 'localhost:3030'
      const filename = url; // transactionName;

      if (filename) {
        const replaceForwardSlashes = (str: string) => str.split('/').join('_');

        const filepath = `${DIRECTORY}/${APP}/${replaceForwardSlashes(extractRelevantFileName(filename))}--${type}.json`;

        writeFile(filepath, JSON.stringify(transformedJSON, null, 2)).then(() => {
          console.log(`Successfully replaced data and saved file in ${filepath}`);

          unlink(TEMPORARY_FILE_PATH).then(() =>
            console.log(`Successfully deleted ${TEMPORARY_FILE_PATH}`),
          );
        });
      } else {
        console.warn('No url or transaction found in JSON');
      }
    }
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

      // save the JSON payload into a file
      try {
        writeFile(TEMPORARY_FILE_PATH, `[${proxyRequestBody}]`).then(() => {
          transformSavedJSON();
        });
      } catch (err) {
        console.error(`Error writing file ${TEMPORARY_FILE_PATH}`, err);
      }

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

      const sentryRequest = https.request(
        sentryIngestUrl,
        { headers: proxyRequest.headers, method: proxyRequest.method },
        sentryResponse => {
          sentryResponse.addListener('data', (chunk: Buffer) => {
            proxyResponse.write(chunk, 'binary');
          });

          sentryResponse.addListener('end', () => {
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

  await proxyServerStartupPromise;
  return;
}
