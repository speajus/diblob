/**
 * Integration tests - complex real-world scenarios
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createBlob, createContainer } from '../src';

describe('Integration - Real World Scenarios', () => {
  it('should handle a complete application stack', async () => {
    // Define interfaces
    interface Logger {
      log(msg: string): void;
    }
    
    interface Database {
      query(sql: string): Promise<any[]>;
    }
    
    interface UserRepository {
      findById(id: number): Promise<{ id: number; name: string }>;
    }
    
    interface UserService {
      getUser(id: number): Promise<{ id: number; name: string }>;
    }
    
    // Create blobs
    const logger = createBlob<Logger>('logger');
    const database = createBlob<Database>('database');
    const userRepo = createBlob<UserRepository>('userRepo');
    const userService = createBlob<UserService>('userService');
    
    // Implementations
    const logs: string[] = [];
    
    class ConsoleLogger implements Logger {
      log(msg: string) {
        logs.push(msg);
      }
    }
    
    class PostgresDatabase implements Database {
      constructor(private log = logger) {}
      
      async query(sql: string): Promise<any[]> {
        this.log.log(`Executing: ${sql}`);
        await new Promise(resolve => setTimeout(resolve, 10));
        return [{ id: 1, name: 'Alice' }];
      }
    }
    
    class UserRepositoryImpl implements UserRepository {
      constructor(private db = database) {}
      
      async findById(id: number) {
        const results = await this.db.query(`SELECT * FROM users WHERE id = ${id}`);
        return results[0];
      }
    }
    
    class UserServiceImpl implements UserService {
      constructor(
        private repo = userRepo,
        private log = logger
      ) {}
      
      async getUser(id: number) {
        this.log.log(`Getting user ${id}`);
        return await this.repo.findById(id);
      }
    }
    
    // Setup container
    const container = createContainer();
    container.register(logger, ConsoleLogger);
    container.register(database, PostgresDatabase);
    container.register(userRepo, UserRepositoryImpl);
    container.register(userService, UserServiceImpl);
    
    // Use the service
    const user = await userService.getUser(1);
    
    assert.strictEqual(user.id, 1);
    assert.strictEqual(user.name, 'Alice');
    assert.deepStrictEqual(logs, [
      'Getting user 1',
      'Executing: SELECT * FROM users WHERE id = 1'
    ]);
  });

  it('should handle microservices architecture', () => {
    // Service A
    interface ServiceA {
      getName(): string;
    }
    
    // Service B depends on A
    interface ServiceB {
      getInfo(): string;
    }
    
    // Service C depends on B
    interface ServiceC {
      getFullInfo(): string;
    }
    
    const serviceA = createBlob<ServiceA>('serviceA');
    const serviceB = createBlob<ServiceB>('serviceB');
    const serviceC = createBlob<ServiceC>('serviceC');
    
    class ServiceAImpl implements ServiceA {
      getName() { return 'ServiceA'; }
    }
    
    class ServiceBImpl implements ServiceB {
      constructor(private a = serviceA) {}
      getInfo() { return `ServiceB uses ${this.a.getName()}`; }
    }
    
    class ServiceCImpl implements ServiceC {
      constructor(private b = serviceB) {}
      getFullInfo() { return `ServiceC -> ${this.b.getInfo()}`; }
    }
    
    const container = createContainer();
    container.register(serviceA, ServiceAImpl);
    container.register(serviceB, ServiceBImpl);
    container.register(serviceC, ServiceCImpl);
    
    assert.strictEqual(
      serviceC.getFullInfo(),
      'ServiceC -> ServiceB uses ServiceA'
    );
  });

  it('should handle plugin architecture', () => {
    interface Plugin {
      getName(): string;
      execute(): string;
    }
    
    interface PluginManager {
      runPlugin(name: string): string;
    }
    
    const plugin1 = createBlob<Plugin>('plugin1');
    const plugin2 = createBlob<Plugin>('plugin2');
    const manager = createBlob<PluginManager>('manager');
    
    class Plugin1 implements Plugin {
      getName() { return 'plugin1'; }
      execute() { return 'Plugin1 executed'; }
    }
    
    class Plugin2 implements Plugin {
      getName() { return 'plugin2'; }
      execute() { return 'Plugin2 executed'; }
    }
    
    class PluginManagerImpl implements PluginManager {
      constructor(
        private p1 = plugin1,
        private p2 = plugin2
      ) {}
      
      runPlugin(name: string) {
        if (name === 'plugin1') return this.p1.execute();
        if (name === 'plugin2') return this.p2.execute();
        return 'Unknown plugin';
      }
    }
    
    const container = createContainer();
    container.register(plugin1, Plugin1);
    container.register(plugin2, Plugin2);
    container.register(manager, PluginManagerImpl);
    
    assert.strictEqual(manager.runPlugin('plugin1'), 'Plugin1 executed');
    assert.strictEqual(manager.runPlugin('plugin2'), 'Plugin2 executed');
  });
});

