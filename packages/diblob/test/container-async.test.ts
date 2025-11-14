/**
 * Async resolution tests
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createBlob, createContainer, Lifecycle } from '../src';

    interface DepC {
      getValue(): string;
    }

    interface DepB {
      process(value: string): string;
    }

    interface DepA {
      execute(): string;
    }

    const depC = createBlob<DepC>();
    const depB = createBlob<DepB>();
    const depA = createBlob<DepA>();

describe('Container - Async Resolution', () => {
  it('should resolve async factory', async () => {
    interface Service {
      getValue(): string;
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { getValue: () => 'async' };
    });
    
    const instance = await container.resolve(service);
    assert.strictEqual(instance.getValue(), 'async');
  });

  it('should use async blob directly', async () => {
    interface Service {
      getValue(): string;
    }

    const service = createBlob<Service>();
    const container = createContainer();

    container.register(service, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { getValue: () => 'async' };
    });

    // When accessing a method on an async blob, it returns a Promise
    // that resolves to the bound method
    const getValue = await service.getValue;
    const result = getValue();
    assert.strictEqual(result, 'async');
  });

  it('should handle async dependencies', async () => {
    interface Logger {
      log(msg: string): string;
    }
    
    interface Service {
      work(): string;
    }
    
    const logger = createBlob<Logger>();
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(logger, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { log: (msg: string) => `async: ${msg}` };
    });
    
    container.register(service, async (log: Logger) => {
      return { work: () => log.log('working') };
    }, logger);
    
    const instance = await container.resolve(service);
    assert.strictEqual(instance.work(), 'async: working');
  });

  it('should handle mixed sync and async dependencies', async () => {
    interface Logger {
      log(msg: string): string;
    }
    
    interface Config {
      getValue(): string;
    }
    
    interface Service {
      work(): string;
    }
    
    const logger = createBlob<Logger>();
    const config = createBlob<Config>();
    const service = createBlob<Service>();
    const container = createContainer();
    
    // Async logger
    container.register(logger, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { log: (msg: string) => `[LOG] ${msg}` };
    });
    
    // Sync config
    container.register(config, () => ({
      getValue: () => 'production'
    }));
    
    // Service with both
    container.register(service, (log: Logger, cfg: Config) => ({
      work: () => log.log(cfg.getValue())
    }), logger, config);
    
    const instance = await container.resolve(service);
    assert.strictEqual(instance.work(), '[LOG] production');
  });

  it('should handle async class constructor', async () => {
    interface Service {
      getValue(): string;
    }
    
    class ServiceImpl implements Service {
      private value: string;
      
      constructor() {
        this.value = 'constructed';
      }
      
      getValue() { return this.value; }
    }
    
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(service, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return new ServiceImpl();
    });
    
    const instance = await container.resolve(service);
    assert.strictEqual(instance.getValue(), 'constructed');
  });

  it('should handle deep async dependency chains', async () => {
    interface A { getValue(): string; }
    interface B { getValue(): string; }
    interface C { getValue(): string; }

    const a = createBlob<A>();
    const b = createBlob<B>();
    const c = createBlob<C>();
    const container = createContainer();

    container.register(a, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { getValue: () => 'A' };
    });

    container.register(b, async (aVal: A) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { getValue: () => `B(${aVal.getValue()})` };
    }, a);

    container.register(c, async (bVal: B) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { getValue: () => `C(${bVal.getValue()})` };
    }, b);

    const instance = await container.resolve(c);
    assert.strictEqual(instance.getValue(), 'C(B(A))');
  });

  it('should resolve async blob dependency when used as default parameter in another blob', async () => {
    interface BlobA {
      getValue(): string;
    }

    interface BlobB {
      getResult(): string;
    }

    const blobA = createBlob<BlobA>();
    const blobB = createBlob<BlobB>();
    const container = createContainer();

    // Register BlobA as an async blob
    container.register(blobA, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { getValue: () => 'async-value' };
    });

    // Register BlobB with BlobA as a dependency using default parameter
    class BlobBImpl implements BlobB {
      constructor(private depA: BlobA) {}
      getResult() {
        // Verify that depA is the resolved value, not a Promise
        return `Result: ${this.depA.getValue()}`;
      }
    }

    container.register(blobB, BlobBImpl, blobA);

    // Resolve BlobB - it should properly await BlobA's async resolution
    const instance = await container.resolve(blobB);

    // Verify that BlobB received the resolved value of BlobA
    assert.strictEqual(instance.getResult(), 'Result: async-value');

    // Also verify that accessing the blob directly works
    const getResult = await blobB.getResult;
    assert.strictEqual(getResult(), 'Result: async-value');
  });

  it('should handle dependency chain where async blob depends on sync blob in constructor', async () => {

    const container = createContainer();

    // Register DepC as an async blob
    container.register(depC, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { getValue: () => 'async-data' };
    });

    // Register DepB as a sync blob (no async factory)
    container.register(depB, (dpc: DepC) => ({
      process: (value: string) => `${dpc.getValue()}-processed-${value}`
    }), depC);

    // Register DepA with DepB as a dependency
    class DepAImpl implements DepA {
      constructor(private b = depB) {}
      execute() {
        // DepA uses DepB (sync), which should be resolved correctly
        return this.b.process('input');
      }
    }

    container.register(depA, DepAImpl);

    // Only resolve DepA - DepB and DepC should resolve transitively
    const instanceA = await container.resolve(depA);

    // Verify DepA works correctly - DepB should have resolved with DepC's async value
    assert.strictEqual(instanceA.execute(), 'async-data-processed-input');

  });

  it('should handle multiple async blobs as default parameters', async () => {
    interface AsyncService1 {
      getValue(): string;
    }

    interface AsyncService2 {
      getValue(): string;
    }

    interface Consumer {
      getCombined(): string;
    }

    const asyncService1 = createBlob<AsyncService1>();
    const asyncService2 = createBlob<AsyncService2>();
    const consumer = createBlob<Consumer>();
    const container = createContainer();

    // Register two async services
    container.register(asyncService1, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { getValue: () => 'async1' };
    });

    container.register(asyncService2, async () => {
      await new Promise(resolve => setTimeout(resolve, 15));
      return { getValue: () => 'async2' };
    });

    // Consumer uses both as default parameters
    class ConsumerImpl implements Consumer {
      constructor(
        private s1 = asyncService1,
        private s2 = asyncService2
      ) {}
      getCombined() {
        return `${this.s1.getValue()}-${this.s2.getValue()}`;
      }
    }

    container.register(consumer, ConsumerImpl);

    const instance = await container.resolve(consumer);
    assert.strictEqual(instance.getCombined(), 'async1-async2');
  });

  it('should handle deeply nested async dependencies with default parameters', async () => {
    interface Level4 {
      getValue(): string;
    }

    interface Level3 {
      getValue(): string;
    }

    interface Level2 {
      getValue(): string;
    }

    interface Level1 {
      getValue(): string;
    }

    const level4 = createBlob<Level4>();
    const level3 = createBlob<Level3>();
    const level2 = createBlob<Level2>();
    const level1 = createBlob<Level1>();
    const container = createContainer();

    // Level 4 - async
    container.register(level4, async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      return { getValue: () => 'L4' };
    });

    // Level 3 - sync, depends on async level 4
    class Level3Impl implements Level3 {
      constructor(private l4 = level4) {}
      getValue() {
        return `L3(${this.l4.getValue()})`;
      }
    }
    container.register(level3, Level3Impl);

    // Level 2 - async, depends on sync level 3 (which depends on async level 4)
    container.register(level2, async (l3: Level3) => {
      await new Promise(resolve => setTimeout(resolve, 5));
      return { getValue: () => `L2(${l3.getValue()})` };
    }, level3);

    // Level 1 - sync, depends on async level 2
    class Level1Impl implements Level1 {
      constructor(private l2 = level2) {}
      getValue() {
        return `L1(${this.l2.getValue()})`;
      }
    }
    container.register(level1, Level1Impl);

    const instance = await container.resolve(level1);
    assert.strictEqual(instance.getValue(), 'L1(L2(L3(L4)))');
  });

  it('should handle async blob stored but not accessed in constructor', async () => {
    interface AsyncData {
      getValue(): string;
    }

    interface Service {
      getData(): string;
    }

    const asyncData = createBlob<AsyncData>();
    const service = createBlob<Service>();
    const container = createContainer();

    container.register(asyncData, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { getValue: () => 'data' };
    });

    class ServiceImpl implements Service {
      constructor(private data = asyncData) {
        // Store the blob but don't access it during construction
      }

      getData() {
        // Access it later
        return this.data.getValue();
      }
    }

    container.register(service, ServiceImpl);

    const instance = await container.resolve(service);
    assert.strictEqual(instance.getData(), 'data');
  });

  it('should handle async blob with transient lifecycle', async () => {
    interface Service {
      id: number;
      getValue(): string;
    }

    const service = createBlob<Service>();
    const container = createContainer();

    let counter = 0;
    container.register(service, async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      counter++;
      const id = counter;
      return {
        id,
        getValue: () => `instance-${id}`
      };
    }, { lifecycle: Lifecycle.Transient });

    const instance1 = await container.resolve(service);
    const instance2 = await container.resolve(service);

    // With transient lifecycle, each resolve should create a new instance
    assert.notStrictEqual(instance1, instance2);
    assert.notStrictEqual(instance1.id, instance2.id);
  });

  it('should handle mixed async/sync dependencies with default parameters', async () => {
    interface SyncService {
      getValue(): string;
    }

    interface AsyncService {
      getValue(): string;
    }

    interface Consumer {
      getCombined(): string;
    }

    const syncService = createBlob<SyncService>();
    const asyncService = createBlob<AsyncService>();
    const consumer = createBlob<Consumer>();
    const container = createContainer();

    container.register(syncService, () => ({
      getValue: () => 'sync'
    }));

    container.register(asyncService, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { getValue: () => 'async' };
    });

    class ConsumerImpl implements Consumer {
      constructor(
        private sync = syncService,
        private async = asyncService
      ) {}
      getCombined() {
        return `${this.sync.getValue()}-${this.async.getValue()}`;
      }
    }

    container.register(consumer, ConsumerImpl);

    const instance = await container.resolve(consumer);
    assert.strictEqual(instance.getCombined(), 'sync-async');
  });

  it('should handle async blob re-registration and invalidation', async () => {
    interface Service {
      getValue(): string;
    }

    const service = createBlob<Service>();
    const container = createContainer();

    // Initial async registration
    container.register(service, async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      return { getValue: () => 'version1' };
    });

    const instance1 = await container.resolve(service);
    assert.strictEqual(instance1.getValue(), 'version1');

    // Re-register with different async implementation
    container.register(service, async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      return { getValue: () => 'version2' };
    });

    const instance2 = await container.resolve(service);
    assert.strictEqual(instance2.getValue(), 'version2');
    assert.notStrictEqual(instance1, instance2);
  });

  it('should handle async blob with dependent that gets invalidated', async () => {
    interface Base {
      getValue(): string;
    }

    interface Dependent {
      getResult(): string;
    }

    const base = createBlob<Base>();
    const dependent = createBlob<Dependent>();
    const container = createContainer();

    container.register(base, async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      return { getValue: () => 'base-v1' };
    });

    // Use factory with explicit dependency instead of default parameter
    container.register(dependent, async (b: Base) => {
      return {
        getResult: () => `result-${b.getValue()}`
      };
    }, base);

    const instance1 = await container.resolve(dependent);
    assert.strictEqual(instance1.getResult(), 'result-base-v1');

    // Re-register base - should invalidate dependent
    container.register(base, async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      return { getValue: () => 'base-v2' };
    });

    const instance2 = await container.resolve(dependent);
    assert.strictEqual(instance2.getResult(), 'result-base-v2');
    assert.notStrictEqual(instance1, instance2);
  });

  it('should handle sequential resolution of same async blob', async () => {
    interface Service {
      getValue(): string;
    }

    const service = createBlob<Service>();
    const container = createContainer();

    let constructionCount = 0;
    container.register(service, async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      constructionCount++;
      return { getValue: () => `instance-${constructionCount}` };
    });

    // Resolve the same blob multiple times sequentially
    const instance1 = await container.resolve(service);
    const instance2 = await container.resolve(service);
    const instance3 = await container.resolve(service);

    // All should be the same instance (singleton)
    assert.strictEqual(instance1, instance2);
    assert.strictEqual(instance2, instance3);
    assert.strictEqual(constructionCount, 1, 'Should only construct once');
    assert.strictEqual(instance1.getValue(), 'instance-1');
  });

  it('should handle async blob with complex object graph', async () => {
    interface Database {
      query(): string;
    }

    interface Cache {
      get(): string;
    }

    interface Logger {
      log(msg: string): string;
    }

    interface Service {
      execute(): string;
    }

    const database = createBlob<Database>();
    const cache = createBlob<Cache>();
    const logger = createBlob<Logger>();
    const service = createBlob<Service>();
    const container = createContainer();

    // All async dependencies
    container.register(database, async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      return { query: () => 'db-data' };
    });

    container.register(cache, async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      return { get: () => 'cached-data' };
    });

    container.register(logger, async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      return { log: (msg: string) => `[LOG] ${msg}` };
    });

    // Service depends on all three
    class ServiceImpl implements Service {
      constructor(
        private db = database,
        private c = cache,
        private l = logger
      ) {}
      execute() {
        const dbResult = this.db.query();
        const cacheResult = this.c.get();
        return this.l.log(`${dbResult}+${cacheResult}`);
      }
    }

    container.register(service, ServiceImpl);

    const instance = await container.resolve(service);
    assert.strictEqual(instance.execute(), '[LOG] db-data+cached-data');
  });

  it('should handle async blob that throws during construction', async () => {
    interface Service {
      getValue(): string;
    }

    const service = createBlob<Service>();
    const container = createContainer();

    container.register(service, async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      throw new Error('Construction failed');
    });

    await assert.rejects(
      async () => await container.resolve(service),
      { message: 'Construction failed' }
    );
  });

  it('should handle async blob with nested default parameters in multiple levels', async () => {
    interface Level3 {
      getValue(): string;
    }

    interface Level2 {
      getValue(): string;
    }

    interface Level1 {
      getValue(): string;
    }

    const level3 = createBlob<Level3>();
    const level2 = createBlob<Level2>();
    const level1 = createBlob<Level1>();
    const container = createContainer();

    // Level 3 - async
    container.register(level3, async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      return { getValue: () => 'L3' };
    });

    // Level 2 - class with default parameter
    class Level2Impl implements Level2 {
      constructor(private l3 = level3) {}
      getValue() {
        return `L2(${this.l3.getValue()})`;
      }
    }
    container.register(level2, Level2Impl);

    // Level 1 - class with default parameter
    class Level1Impl implements Level1 {
      constructor(private l2 = level2) {}
      getValue() {
        return `L1(${this.l2.getValue()})`;
      }
    }
    container.register(level1, Level1Impl);

    const instance = await container.resolve(level1);
    assert.strictEqual(instance.getValue(), 'L1(L2(L3))');
  });
});

