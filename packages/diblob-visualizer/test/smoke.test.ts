import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { createSampleContainer } from '../src/examples/sample-container.js';
import { createVisualizerMiddleware } from '../src/server/index.js';

// Simple sanity check so the suite always runs
test('diblob-visualizer basic math still works', () => {
  assert.equal(1 + 1, 2);
});

test('visualizer middleware serves index.html from dist', async () => {
  const container = createSampleContainer();
  const middleware = createVisualizerMiddleware(container);

  const server = createServer((req, res) => middleware(req, res));
  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address() as AddressInfo | null;
  assert.ok(address && typeof address.port === 'number');

  const { statusCode, body } = await new Promise<{
    statusCode: number | undefined;
    body: string;
  }>((resolve, reject) => {
    const req = request(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path: '/',
        method: 'GET',
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body: data });
        });
      },
    );

    req.on('error', reject);
    req.end();
  });

  try {
    assert.equal(statusCode, 200);
    assert.ok(body.includes('@speajus/diblob-visualizer'));
    assert.ok(body.includes('<div id="app"'));
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('visualizer middleware exposes SSE /events endpoint', async () => {
  const container = createSampleContainer();
  const middleware = createVisualizerMiddleware(container, { updateInterval: 50 });

  const server = createServer((req, res) => middleware(req, res));
  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address() as AddressInfo | null;
  assert.ok(address && typeof address.port === 'number');

  const { statusCode, contentType, body } = await new Promise<{
    statusCode: number | undefined;
    contentType: string | undefined;
    body: string;
  }>((resolve, reject) => {
    const req = request(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path: '/events',
        method: 'GET',
      },
      (res) => {
        const header = res.headers['content-type'];
        const resolvedContentType = Array.isArray(header) ? header[0] : header;

        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
          // SSE messages are separated by a blank line; once we see one,
          // we know the endpoint is streaming correctly.
          if (data.includes('\n\n')) {
            resolve({
              statusCode: res.statusCode,
              contentType: resolvedContentType,
              body: data,
            });
            req.destroy();
          }
        });
      },
    );

    req.on('error', reject);
    req.end();
  });

  try {
    assert.equal(statusCode, 200);
    assert.ok( contentType?.startsWith('text/event-stream'));
    assert.ok(body.includes('data:'));
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
