import assert from 'node:assert/strict';
import test from 'node:test';
import { createBlob, createContainer } from '@speajus/diblob';
import { AsyncLocalStorageContext } from '../src/index.js';

interface RequestContext {
	requestId: string;
	userId?: string;
	tenantId?: string;
}

const requestContext = createBlob<RequestContext>('requestContext');

test('requestContext blob exposes RequestContext within runWithContext', async () => {
  const container = createContainer();
  const asyncContext = new AsyncLocalStorageContext(container);
  asyncContext.registerWithContext(requestContext);

  const context: RequestContext = { requestId: 'req-1' };

  await asyncContext.runWithContext(context, async () => {
    assert.equal(requestContext.requestId, 'req-1');
    assert.equal(requestContext.userId, undefined);

    // Mutate via the blob proxy and observe the change immediately.
    requestContext.userId = 'user-123';
    assert.equal(requestContext.userId, 'user-123');
  });

  // Outside the async context, accessing the blob should fail fast.
  assert.throws(
    () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = requestContext.requestId;
    },
    /outside of an active async context/i,
  );
});

test('concurrent contexts remain isolated', async () => {
  const container = createContainer();
  const asyncContext = new AsyncLocalStorageContext(container);
  asyncContext.registerWithContext(requestContext);

  const first: RequestContext = { requestId: 'req-1' };
  const second: RequestContext = { requestId: 'req-2' };

  await Promise.all([
    asyncContext.runWithContext(first, async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      assert.equal(requestContext.requestId, 'req-1');
    }),
    asyncContext.runWithContext(second, async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      assert.equal(requestContext.requestId, 'req-2');
    }),
  ]);
});

test('nested runWithContext scopes override and then restore the previous context', async () => {
  const container = createContainer();
  const asyncContext = new AsyncLocalStorageContext(container);
  asyncContext.registerWithContext(requestContext);

  const outer: RequestContext = { requestId: 'outer' };
  const inner: RequestContext = { requestId: 'inner' };

  await asyncContext.runWithContext(outer, async () => {
    assert.equal(requestContext.requestId, 'outer');

    await asyncContext.runWithContext(inner, async () => {
      assert.equal(requestContext.requestId, 'inner');
    });

    // After inner scope completes, outer context is visible again.
    assert.equal(requestContext.requestId, 'outer');
  });
});

test('context is visible across multiple async hops in a single request', async () => {
  const container = createContainer();
  const asyncContext = new AsyncLocalStorageContext(container);
  asyncContext.registerWithContext(requestContext);

  const ctx: RequestContext = { requestId: 'async-hops' };

  async function hopTwo() {
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(requestContext.requestId, 'async-hops');
  }

  async function hopOne() {
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(requestContext.requestId, 'async-hops');
    await hopTwo();
  }

  await asyncContext.runWithContext(ctx, async () => {
    assert.equal(requestContext.requestId, 'async-hops');
    await hopOne();
  });
});

test('requestContext can be injected into other blobs via Container', async () => {
  const container = createContainer();
  const asyncContext = new AsyncLocalStorageContext(container);
  asyncContext.registerWithContext(requestContext);

  interface ContextAwareService {
    getRequestId(): string;
    setUser(userId: string): void;
    getUser(): string | undefined;
  }

  const contextAwareService = createBlob<ContextAwareService>('contextAwareService');

  container.register(
    contextAwareService,
    (ctx: RequestContext): ContextAwareService => {
      return {
        getRequestId() {
          return ctx.requestId;
        },
        setUser(userId: string) {
          ctx.userId = userId;
        },
        getUser() {
          return ctx.userId;
        },
      };
    },
    requestContext,
  );

  const context: RequestContext = { requestId: 'svc-1' };

  await asyncContext.runWithContext(context, async () => {
    const svc = container.resolve(contextAwareService);
    assert.equal(svc.getRequestId(), 'svc-1');
    assert.equal(svc.getUser(), undefined);

    svc.setUser('user-from-service');
    assert.equal(requestContext.userId, 'user-from-service');
    assert.equal(svc.getUser(), 'user-from-service');
  });

  // Outside of any context, the service should still resolve, but
  // using it will throw when it touches the underlying requestContext
  // (via the proxy).
  const svcOutside = container.resolve(contextAwareService);
  assert.throws(() => {
    svcOutside.getRequestId();
  }, /outside of an active async context/i);
});

test('AsyncLocalStorageContext can manage arbitrary context types', async () => {
	  const container = createContainer();
	  interface TaskContext {
	    taskName: string;
	    attempts: number;
	  }

	  const taskContextBlob = createBlob<TaskContext>('taskContext');
	  const asyncContext = new AsyncLocalStorageContext<TaskContext>(container);
	  asyncContext.registerWithContext(taskContextBlob);

	  const initial: TaskContext = { taskName: 'example', attempts: 0 };

	  await asyncContext.runWithContext(initial, async () => {
	    assert.equal(taskContextBlob.taskName, 'example');
	    assert.equal(taskContextBlob.attempts, 0);

	    taskContextBlob.attempts += 1;
	    assert.equal(taskContextBlob.attempts, 1);
	  });
});

