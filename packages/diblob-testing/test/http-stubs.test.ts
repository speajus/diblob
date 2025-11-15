import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createTestContainer, httpClientStub, httpServerStub } from '../src/index.js';

describe('HTTP Stubs', () => {
  describe('HttpClientStub', () => {
    test('should use queued responses', async () => {
      const container = createTestContainer();
      const client = await container.resolve(httpClientStub);
      
      // Queue responses
      client.queueResponse(new Response('First response'));
      client.queueResponse(new Response('Second response'));
      
      // Make requests
      const response1 = await client.fetch('https://example.com/1');
      const response2 = await client.fetch('https://example.com/2');
      
      assert.strictEqual(await response1.text(), 'First response');
      assert.strictEqual(await response2.text(), 'Second response');
      
      await container.dispose();
    });

    test('should record sent requests', async () => {
      const container = createTestContainer();
      const client = await container.resolve(httpClientStub);
      
      client.queueResponse(new Response('OK'));
      client.queueResponse(new Response('OK'));
      
      await client.fetch('https://example.com/1', { method: 'GET' });
      await client.fetch('https://example.com/2', { method: 'POST', body: 'data' });
      
      const requests = client.getSentRequests();
      assert.strictEqual(requests.length, 2);
      
      assert.strictEqual(requests[0].url, 'https://example.com/1');
      assert.strictEqual(requests[0].init?.method, 'GET');
      
      assert.strictEqual(requests[1].url, 'https://example.com/2');
      assert.strictEqual(requests[1].init?.method, 'POST');
      assert.strictEqual(requests[1].init?.body, 'data');
      
      await container.dispose();
    });

    test('should support response factories', async () => {
      const container = createTestContainer();
      const client = await container.resolve(httpClientStub);
      
      let counter = 0;
      client.queueResponse(() => new Response(`Response ${++counter}`));
      client.queueResponse(() => new Response(`Response ${++counter}`));
      
      const response1 = await client.fetch('https://example.com/1');
      const response2 = await client.fetch('https://example.com/2');
      
      assert.strictEqual(await response1.text(), 'Response 1');
      assert.strictEqual(await response2.text(), 'Response 2');
      
      await container.dispose();
    });

    test('should throw when no response queued', async () => {
      const container = createTestContainer();
      const client = await container.resolve(httpClientStub);
      
      await assert.rejects(
        () => client.fetch('https://example.com'),
        { message: 'No response queued for fetch request. Use queueResponse() to add responses.' }
      );
      
      await container.dispose();
    });

    test('should clear request history', async () => {
      const container = createTestContainer();
      const client = await container.resolve(httpClientStub);
      
      client.queueResponse(new Response('OK'));
      await client.fetch('https://example.com');
      
      assert.strictEqual(client.getSentRequests().length, 1);
      
      client.clearRequests();
      assert.strictEqual(client.getSentRequests().length, 0);
      
      await container.dispose();
    });
  });

  describe('HttpServerStub', () => {
    test('should use configured handler', async () => {
      const container = createTestContainer();
      const server = await container.resolve(httpServerStub);
      
      server.configure((request) => {
        return new Response(`Handled: ${request.url}`);
      });
      
      const request = new Request('https://example.com/test');
      const response = await server.handle(request);
      
      assert.strictEqual(await response.text(), 'Handled: https://example.com/test');
      
      await container.dispose();
    });

    test('should support async handlers', async () => {
      const container = createTestContainer();
      const server = await container.resolve(httpServerStub);
      
      server.configure(async (request) => {
        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, 1));
        return new Response(`Async handled: ${request.method}`);
      });
      
      const request = new Request('https://example.com/test', { method: 'POST' });
      const response = await server.handle(request);
      
      assert.strictEqual(await response.text(), 'Async handled: POST');
      
      await container.dispose();
    });

    test('should record handled requests', async () => {
      const container = createTestContainer();
      const server = await container.resolve(httpServerStub);
      
      server.configure(() => new Response('OK'));
      
      const request1 = new Request('https://example.com/1');
      const request2 = new Request('https://example.com/2', { method: 'POST' });
      
      await server.handle(request1);
      await server.handle(request2);
      
      const requests = server.getHandledRequests();
      assert.strictEqual(requests.length, 2);
      assert.strictEqual(requests[0].url, 'https://example.com/1');
      assert.strictEqual(requests[1].url, 'https://example.com/2');
      assert.strictEqual(requests[1].method, 'POST');
      
      await container.dispose();
    });

    test('should throw when no handler configured', async () => {
      const container = createTestContainer();
      const server = await container.resolve(httpServerStub);
      
      const request = new Request('https://example.com/test');
      
      await assert.rejects(
        () => server.handle(request),
        { message: 'No handler configured for server stub. Use configure() to set a handler.' }
      );
      
      await container.dispose();
    });

    test('should clear request history', async () => {
      const container = createTestContainer();
      const server = await container.resolve(httpServerStub);
      
      server.configure(() => new Response('OK'));
      
      const request = new Request('https://example.com/test');
      await server.handle(request);
      
      assert.strictEqual(server.getHandledRequests().length, 1);
      
      server.clearRequests();
      assert.strictEqual(server.getHandledRequests().length, 0);
      
      await container.dispose();
    });
  });
});
