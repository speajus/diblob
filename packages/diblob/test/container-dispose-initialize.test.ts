/**
 * Container dispose and initialize lifecycle tests
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createBlob, createContainer, Lifecycle } from '../src';

describe('Container - Initialize', () => {
  it('should call initialize method after instance creation', async () => {
    interface Service {
      isInitialized: boolean;
      getValue(): string;
    }
    
    class ServiceImpl implements Service {
      isInitialized = false;
      
      initialize() {
        this.isInitialized = true;
      }
      
      getValue() {
        return this.isInitialized ? 'initialized' : 'not initialized';
      }
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, ServiceImpl, {lifecycle: Lifecycle.Singleton, initialize: 'initialize' });
    
    const instance = await container.resolve(service);
    assert.strictEqual(instance.isInitialized, true);
    assert.strictEqual(instance.getValue(), 'initialized');
  });

  it('should call initialize function after instance creation', async () => {
    interface Service {
      value: string;
    }

    let initCalled = false;
    let receivedInstance: Service | undefined;

    const service = createBlob<Service>();
    const container = createContainer();

    container.register(
      service,
      () => ({ value: 'test' }),
      {
        lifecycle: Lifecycle.Singleton,
        initialize: (instance: Service) => {
          initCalled = true;
          receivedInstance = instance;
        }
      }
    );

    const instance = await container.resolve(service);
    assert.strictEqual(initCalled, true);
    assert.strictEqual(receivedInstance, instance);
    assert.strictEqual(receivedInstance?.value, 'test');
  });

  it('should handle async initialize method', async () => {
    interface Service {
      isInitialized: boolean;
    }
    
    class ServiceImpl implements Service {
      isInitialized = false;
      
      async initialize() {
        await new Promise(resolve => setTimeout(resolve, 10));
        this.isInitialized = true;
      }
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, ServiceImpl, {lifecycle: Lifecycle.Singleton, initialize: 'initialize' });
    
    const instance = await container.resolve(service);
    assert.strictEqual(instance.isInitialized, true);
  });

  it('should handle async initialize function', async () => {
    interface Service {
      value: string;
    }

    let initValue = '';
    let receivedInstance: Service | undefined;

    const service = createBlob<Service>();
    const container = createContainer();

    container.register(
      service,
      () => ({ value: 'test' }),
      {
        lifecycle: Lifecycle.Singleton,
        initialize: async (instance: Service) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          initValue = 'initialized';
          receivedInstance = instance;
        }
      }
    );

    const instance = await container.resolve(service);
    assert.strictEqual(initValue, 'initialized');
    assert.strictEqual(receivedInstance, instance);
    assert.strictEqual(receivedInstance?.value, 'test');
  });

  it('should call initialize for each transient instance', async () => {
    interface Service {
      id: number;
    }
    
    let initCount = 0;
    let instanceCount = 0;
    
    class ServiceImpl implements Service {
      id: number;
      
      constructor() {
        this.id = ++instanceCount;
      }
      
      initialize() {
        initCount++;
      }
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(
      service,
      ServiceImpl,
      { lifecycle: Lifecycle.Transient, initialize: 'initialize' }
    );
    
    await container.resolve(service);
    await container.resolve(service);
    await container.resolve(service);
    
    assert.strictEqual(instanceCount, 3);
    assert.strictEqual(initCount, 3);
  });
});

describe('Container - Dispose', () => {
  it('should call dispose method when instance is invalidated', async () => {
    interface Service {
      isDisposed: boolean;
      dispose(): void;
    }

    class ServiceImpl implements Service {
      isDisposed = false;

      dispose() {
        this.isDisposed = true;
      }
    }

    const service = createBlob<Service>();
    const container = createContainer();

    container.register(service, ServiceImpl, { lifecycle: Lifecycle.Singleton, dispose: 'dispose' });

    // Resolve to get the actual instance
    const instance1 = await container.resolve(service);
    assert.strictEqual(instance1.isDisposed, false);

    // Re-register to trigger dispose
    container.register(service, ServiceImpl, { lifecycle: Lifecycle.Singleton, dispose: 'dispose' });

    // The old instance should have been disposed
    assert.strictEqual(instance1.isDisposed, true);
  });

  it('should call dispose function when instance is invalidated', () => {
    interface Service {
      value: string;
    }

    let disposeCalled = false;
    let disposedInstance: Service | undefined;

    const service = createBlob<Service>();
    const container = createContainer();

    container.register(
      service,
      () => ({ value: 'test' }),
      {
        lifecycle: Lifecycle.Singleton,
        dispose: (instance: Service) => {
          disposeCalled = true;
          disposedInstance = instance;
        }
      }
    );

    // Access the service to create instance
    const originalValue = service.value;

    // Re-register to trigger dispose
    container.register(service, () => ({ value: 'test2' }));

    assert.strictEqual(disposeCalled, true);
    assert.strictEqual(disposedInstance?.value, originalValue);
  });

  it('should handle async dispose method', async () => {
    interface Service {
      isDisposed: boolean;
      dispose(): Promise<void>;
    }

    class ServiceImpl implements Service {
      isDisposed = false;

      async dispose() {
        await new Promise(resolve => setTimeout(resolve, 10));
        this.isDisposed = true;
      }
    }

    const service = createBlob<Service>();
    const container = createContainer();

    container.register(service, ServiceImpl, { lifecycle: Lifecycle.Singleton,dispose: 'dispose' });

    // Resolve to get the actual instance
    const instance1 = await container.resolve(service);

    // Re-register to trigger dispose
    container.register(service, ServiceImpl, { lifecycle: Lifecycle.Singleton, dispose: 'dispose' });

    // Wait a bit for async dispose to complete
    await new Promise(resolve => setTimeout(resolve, 20));

    assert.strictEqual(instance1.isDisposed, true);
  });

  it('should handle async dispose function with instance parameter', async () => {
    interface Service {
      value: string;
      cleanup?: boolean;
    }

    let disposeCalled = false;
    let disposedInstance: Service | undefined;

    const service = createBlob<Service>();
    const container = createContainer();

    container.register(
      service,
      () => ({ value: 'test' }),
      {
        lifecycle: Lifecycle.Singleton,
        dispose: async (instance: Service) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          disposeCalled = true;
          disposedInstance = instance;
        }
      }
    );

    // Access the service to create instance
    const originalValue = service.value;

    // Re-register to trigger dispose
    container.register(service, () => ({ value: 'test2' }));

    // Wait a bit for async dispose to complete
    await new Promise(resolve => setTimeout(resolve, 20));

    assert.strictEqual(disposeCalled, true);
    assert.strictEqual(disposedInstance?.value, originalValue);
  });

  it('should dispose dependents when a blob is invalidated', async () => {
    interface Logger {
      isDisposed: boolean;
      dispose(): void;
    }

    interface Service {
      isDisposed: boolean;
      dispose(): void;
    }

    class LoggerImpl implements Logger {
      isDisposed = false;
      dispose() {
        this.isDisposed = true;
      }
    }

    class ServiceImpl implements Service {
      isDisposed = false;
      dispose() {
        this.isDisposed = true;
      }
    }

    const logger = createBlob<Logger>();
    const service = createBlob<Service>();
    const container = createContainer();

    container.register(logger, LoggerImpl, { lifecycle: Lifecycle.Singleton,dispose: 'dispose' });
    container.register(service, ServiceImpl, logger, { lifecycle: Lifecycle.Singleton,dispose: 'dispose' });

    // Resolve both to create instances
    const loggerInstance = await container.resolve(logger);
    const serviceInstance = await container.resolve(service);

    // Re-register logger - should dispose both logger and service
    container.register(logger, LoggerImpl, { lifecycle: Lifecycle.Singleton,dispose: 'dispose' });

    assert.strictEqual(loggerInstance.isDisposed, true);
    assert.strictEqual(serviceInstance.isDisposed, true);
  });

  it('should dispose deep dependency chains', async () => {
    interface A {
      isDisposed: boolean;
      dispose(): void;
    }

    interface B {
      isDisposed: boolean;
      dispose(): void;
    }

    interface C {
      isDisposed: boolean;
      dispose(): void;
    }

    class AImpl implements A {
      isDisposed = false;
      dispose() { this.isDisposed = true; }
    }

    class BImpl implements B {
      isDisposed = false;
      dispose() { this.isDisposed = true; }
    }

    class CImpl implements C {
      isDisposed = false;
      dispose() { this.isDisposed = true; }
    }

    const a = createBlob<A>();
    const b = createBlob<B>();
    const c = createBlob<C>();
    const container = createContainer();

    container.register(a, AImpl, {lifecycle: Lifecycle.Singleton, dispose: 'dispose' });
    container.register(b, BImpl, a, {lifecycle: Lifecycle.Singleton, dispose: 'dispose' });
    container.register(c, CImpl, b, {lifecycle: Lifecycle.Singleton, dispose: 'dispose' });

    // Resolve all to create instances
    const aInstance = await container.resolve(a);
    const bInstance = await container.resolve(b);
    const cInstance = await container.resolve(c);

    // Re-register A - should dispose A, B, and C
    container.register(a, AImpl, { lifecycle: Lifecycle.Singleton, dispose: 'dispose' });

    assert.strictEqual(aInstance.isDisposed, true);
    assert.strictEqual(bInstance.isDisposed, true);
    assert.strictEqual(cInstance.isDisposed, true);
  });
});

describe('Container - Container Dispose', () => {
	it('should dispose all instantiated singletons when container is disposed', async () => {
		interface Service {
			isDisposed: boolean;
			dispose(): void;
		}

		class ServiceImpl implements Service {
			isDisposed = false;
			dispose() {
				this.isDisposed = true;
			}
		}

		const a = createBlob<Service>();
		const b = createBlob<Service>();
		const container = createContainer();

		container.register(a, ServiceImpl, { lifecycle: Lifecycle.Singleton, dispose: 'dispose' });
		container.register(b, ServiceImpl, { lifecycle: Lifecycle.Singleton, dispose: 'dispose' });

		const aInstance = await container.resolve(a);
		const bInstance = await container.resolve(b);

		await container.dispose();

		assert.strictEqual(aInstance.isDisposed, true);
		assert.strictEqual(bInstance.isDisposed, true);
		assert.strictEqual(container.has(a), false);
		assert.strictEqual(container.has(b), false);
	});

	it('should wait for async dispose methods before completing container.dispose', async () => {
		interface AsyncService {
			isDisposed: boolean;
			dispose(): Promise<void>;
		}

		class AsyncServiceImpl implements AsyncService {
			isDisposed = false;

			async dispose(): Promise<void> {
				await new Promise((resolve) => setTimeout(resolve, 10));
				this.isDisposed = true;
			}
		}

		const service = createBlob<AsyncService>();
		const container = createContainer();

		container.register(service, AsyncServiceImpl, { lifecycle: Lifecycle.Singleton, dispose: 'dispose' });

		const instance = await container.resolve(service);

		await container.dispose();

		assert.strictEqual(instance.isDisposed, true);
	});
});

