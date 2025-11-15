/**
 * HTTP client and server stub implementations for testing.
 */

import type { HttpClientStub, HttpServerStub } from './blobs.js';

/**
 * Create an HTTP client stub that uses queued responses instead of making real requests.
 */
export function createHttpClientStub(): HttpClientStub {
  const queuedResponses: Array<Response | (() => Response)> = [];
  const sentRequests: Array<{ url: string | URL; init?: RequestInit }> = [];

  const client: HttpClientStub = {
    async fetch(url: string | URL, init?: RequestInit): Promise<Response> {
      // Record the request
      sentRequests.push({ url, init });

      // Get the next queued response
      const responseOrFactory = queuedResponses.shift();
      
      if (!responseOrFactory) {
        throw new Error('No response queued for fetch request. Use queueResponse() to add responses.');
      }

      // Return the response or call the factory
      if (typeof responseOrFactory === 'function') {
        return responseOrFactory();
      } else {
        return responseOrFactory;
      }
    },

    queueResponse(response: Response | (() => Response)): void {
      queuedResponses.push(response);
    },

    getSentRequests(): Array<{ url: string | URL; init?: RequestInit }> {
      return [...sentRequests]; // Return a copy to prevent external mutation
    },

    clearRequests(): void {
      sentRequests.length = 0;
    },
  };

  return client;
}

/**
 * Create an HTTP server stub that uses a configurable handler instead of real networking.
 */
export function createHttpServerStub(): HttpServerStub {
  let handler: ((request: Request) => Response | Promise<Response>) | null = null;
  const handledRequests: Request[] = [];

  const server: HttpServerStub = {
    async handle(request: Request): Promise<Response> {
      // Record the request
      handledRequests.push(request);

      if (!handler) {
        throw new Error('No handler configured for server stub. Use configure() to set a handler.');
      }

      return await handler(request);
    },

    configure(newHandler: (request: Request) => Response | Promise<Response>): void {
      handler = newHandler;
    },

    getHandledRequests(): Request[] {
      return [...handledRequests]; // Return a copy to prevent external mutation
    },

    clearRequests(): void {
      handledRequests.length = 0;
    },
  };

  return server;
}
