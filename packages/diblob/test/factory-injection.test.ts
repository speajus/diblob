/**
 * Factory function dependency injection tests
 * Tests that factory functions can receive blob dependencies as parameters
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createBlob, createContainer, Lifecycle } from '../src';

describe('Factory Injection - Basic', () => {
  it('should inject single blob dependency into factory', () => {
    interface Logger {
      log(msg: string): string;
    }
    
    interface Service {
      doWork(): string;
    }
    
    const logger = createBlob<Logger>();
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(logger, () => ({
      log: (msg: string) => `[LOG] ${msg}`
    }));
    
    container.register(service, (log: Logger) => ({
      doWork: () => log.log('working')
    }), logger);
    
    assert.strictEqual(service.doWork(), '[LOG] working');
  });

  it('should inject multiple blob dependencies into factory', () => {
    interface Logger {
      log(msg: string): string;
    }
    
    interface Config {
      getEnv(): string;
    }
    
    interface Service {
      start(): string;
    }
    
    const logger = createBlob<Logger>();
    const config = createBlob<Config>();
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(logger, () => ({
      log: (msg: string) => `[LOG] ${msg}`
    }));
    
    container.register(config, () => ({
      getEnv: () => 'production'
    }));
    
    container.register(service, (log: Logger, cfg: Config) => ({
      start: () => log.log(`Starting in ${cfg.getEnv()}`)
    }), logger, config);
    
    assert.strictEqual(service.start(), '[LOG] Starting in production');
  });

  it('should inject mixed blob and plain value dependencies', () => {
    interface Logger {
      log(msg: string): string;
    }
    
    interface Service {
      getMessage(): string;
    }
    
    const logger = createBlob<Logger>();
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(logger, () => ({
      log: (msg: string) => `[LOG] ${msg}`
    }));
    
    container.register(service, (log: Logger, env: string, port: number) => ({
      getMessage: () => log.log(`${env}:${port}`)
    }), logger, 'production', 8080);
    
    assert.strictEqual(service.getMessage(), '[LOG] production:8080');
  });

  it('should work with factory returning class instance', () => {
    interface Logger {
      log(msg: string): void;
    }
    
    interface Service {
      doWork(): void;
    }
    
    const logs: string[] = [];
    
    class ServiceImpl implements Service {
      constructor(private logger: Logger) {}
      doWork() {
        this.logger.log('working');
      }
    }
    
    const logger = createBlob<Logger>();
    const service = createBlob<Service>();
    const container = createContainer();
    
    container.register(logger, () => ({
      log: (msg: string) => logs.push(msg)
    }));
    
    container.register(service, (log: Logger) => new ServiceImpl(log), logger);
    
    service.doWork();
    assert.deepStrictEqual(logs, ['working']);
  });
});

describe('Factory Injection - Async', () => {
  it('should inject blob into async factory', async () => {
    interface Logger {
      log(msg: string): string;
    }

    interface Service {
      work(): string;
    }

    const logger = createBlob<Logger>();
    const service = createBlob<Service>();
    const container = createContainer();

    container.register(logger, () => ({
      log: (msg: string) => `[LOG] ${msg}`
    }));

    container.register(service, async (log: Logger) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { work: () => log.log('async work') };
    }, logger);

    const instance = await container.resolve(service);
    assert.strictEqual(instance.work(), '[LOG] async work');
  });

  it('should inject async blob into factory', async () => {
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
      return { log: (msg: string) => `[ASYNC LOG] ${msg}` };
    });

    container.register(service, (log: Logger) => ({
      work: () => log.log('working')
    }), logger);

    const instance = await container.resolve(service);
    assert.strictEqual(instance.work(), '[ASYNC LOG] working');
  });

  it('should inject async blob into async factory', async () => {
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
      return { log: (msg: string) => `[ASYNC] ${msg}` };
    });

    container.register(service, async (log: Logger) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { work: () => log.log('async work') };
    }, logger);

    const instance = await container.resolve(service);
    assert.strictEqual(instance.work(), '[ASYNC] async work');
  });

  it('should handle deep async dependency chains in factories', async () => {
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
});

describe('Factory Injection - Lifecycle', () => {
  it('should work with transient lifecycle', () => {
    interface Logger {
      id: number;
    }

    interface Service {
      getLoggerId(): number;
    }

    let loggerCounter = 0;
    let serviceCounter = 0;

    const logger = createBlob<Logger>();
    const service = createBlob<Service>();
    const container = createContainer();

    container.register(logger, () => ({
      id: ++loggerCounter
    }), { lifecycle: Lifecycle.Transient });

    container.register(service, (log: Logger) => ({
      getLoggerId: () => {
        serviceCounter++;
        return log.id;
      }
    }), logger, { lifecycle: Lifecycle.Transient });

    const instance1 = service.getLoggerId();
    const instance2 = service.getLoggerId();

    // Each call creates new instances
    assert.strictEqual(instance1, 1);
    assert.strictEqual(instance2, 2);
    assert.strictEqual(serviceCounter, 2);
  });

  it('should cache singleton dependencies in factory', () => {
    interface Logger {
      id: number;
    }

    interface Service {
      getLoggerId(): number;
    }

    let counter = 0;

    const logger = createBlob<Logger>();
    const service = createBlob<Service>();
    const container = createContainer();

    container.register(logger, () => ({
      id: ++counter
    })); // Singleton by default

    container.register(service, (log: Logger) => ({
      getLoggerId: () => log.id
    }), logger);

    const id1 = service.getLoggerId();
    const id2 = service.getLoggerId();

    // Same logger instance used
    assert.strictEqual(id1, 1);
    assert.strictEqual(id2, 1);
    assert.strictEqual(counter, 1);
  });
});

describe('Factory Injection - Edge Cases', () => {
  it('should handle factory with no dependencies', () => {
    interface Service {
      getValue(): string;
    }

    const service = createBlob<Service>();
    const container = createContainer();

    container.register(service, () => ({
      getValue: () => 'no deps'
    }));

    assert.strictEqual(service.getValue(), 'no deps');
  });

  it('should handle factory with only plain value dependencies', () => {
    interface Service {
      getMessage(): string;
    }

    const service = createBlob<Service>();
    const container = createContainer();

    container.register(service, (env: string, port: number) => ({
      getMessage: () => `${env}:${port}`
    }), 'production', 8080);

    assert.strictEqual(service.getMessage(), 'production:8080');
  });

  it('should throw error if dependency not registered', () => {
    interface Logger {
      log(msg: string): void;
    }

    interface Service {
      work(): void;
    }

    const logger = createBlob<Logger>();
    const service = createBlob<Service>();
    const container = createContainer();

    // Register service but not logger
    container.register(service, (log: Logger) => ({
      work: () => log.log('test')
    }), logger);

    assert.throws(
      () => service.work(),
      /Blob not registered/
    );
  });

  it('should handle re-registration with factory injection', () => {
    interface Logger {
      log(msg: string): string;
    }

    interface Service {
      work(): string;
    }

    const logger = createBlob<Logger>();
    const service = createBlob<Service>();
    const container = createContainer();

    container.register(logger, () => ({
      log: (msg: string) => `[V1] ${msg}`
    }));

    container.register(service, (log: Logger) => ({
      work: () => log.log('working')
    }), logger);

    assert.strictEqual(service.work(), '[V1] working');

    // Re-register logger
    container.register(logger, () => ({
      log: (msg: string) => `[V2] ${msg}`
    }));

    // Service should use new logger
    assert.strictEqual(service.work(), '[V2] working');
  });
});

describe('Factory Injection - Complex Scenarios', () => {
  it('should handle factory creating instances with injected dependencies', () => {
    interface Logger {
      log(msg: string): void;
    }

    interface Database {
      query(sql: string): string;
    }

    interface Repository {
      findUser(id: number): string;
    }

    const logs: string[] = [];

    class RepositoryImpl implements Repository {
      constructor(
        private logger: Logger,
        private db: Database
      ) {}

      findUser(id: number): string {
        this.logger.log(`Finding user ${id}`);
        return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
      }
    }

    const logger = createBlob<Logger>();
    const database = createBlob<Database>();
    const repository = createBlob<Repository>();
    const container = createContainer();

    container.register(logger, () => ({
      log: (msg: string) => logs.push(msg)
    }));

    container.register(database, () => ({
      query: (sql: string) => `Result: ${sql}`
    }));

    container.register(repository, (log: Logger, db: Database) => {
      return new RepositoryImpl(log, db);
    }, logger, database);

    const result = repository.findUser(123);

    assert.strictEqual(result, 'Result: SELECT * FROM users WHERE id = 123');
    assert.deepStrictEqual(logs, ['Finding user 123']);
  });

  it('should handle factory with conditional logic based on dependencies', () => {
    interface Config {
      isDevelopment(): boolean;
    }

    interface Logger {
      log(msg: string): string;
    }

    const config = createBlob<Config>();
    const logger = createBlob<Logger>();
    const container = createContainer();

    container.register(config, () => ({
      isDevelopment: () => true
    }));

    container.register(logger, (cfg: Config) => {
      if (cfg.isDevelopment()) {
        return { log: (msg: string) => `[DEV] ${msg}` };
      } else {
        return { log: (msg: string) => `[PROD] ${msg}` };
      }
    }, config);

    assert.strictEqual(logger.log('test'), '[DEV] test');
  });

  it('should handle multiple services depending on same factory-created dependency', () => {
    interface Logger {
      log(msg: string): string;
    }

    interface ServiceA {
      workA(): string;
    }

    interface ServiceB {
      workB(): string;
    }

    const logger = createBlob<Logger>();
    const serviceA = createBlob<ServiceA>();
    const serviceB = createBlob<ServiceB>();
    const container = createContainer();

    let factoryCallCount = 0;

    container.register(logger, () => {
      factoryCallCount++;
      return { log: (msg: string) => `[LOG] ${msg}` };
    });

    container.register(serviceA, (log: Logger) => ({
      workA: () => log.log('A working')
    }), logger);

    container.register(serviceB, (log: Logger) => ({
      workB: () => log.log('B working')
    }), logger);

    assert.strictEqual(serviceA.workA(), '[LOG] A working');
    assert.strictEqual(serviceB.workB(), '[LOG] B working');

    // Logger factory should only be called once (singleton)
    assert.strictEqual(factoryCallCount, 1);
  });
});

