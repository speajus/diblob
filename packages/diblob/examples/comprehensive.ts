/**
 * Comprehensive example demonstrating all diblob features
 */

import { createBlob, createContainer, Lifecycle } from '../src';

// Define interfaces
interface Logger {
  log(message: string): void;
}

interface Database {
  query(sql: string): Promise<unknown[]>;
}

interface UserService {
  getUser(id: number): Promise<{ id: number; name: string }>;
}

// Create blobs
const logger = createBlob<Logger>();
const database = createBlob<Database>();
const userService = createBlob<UserService>();

// Implementations
class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

class AsyncDatabase implements Database {
  async query(sql: string) {
    logger.log(`Executing: ${sql}`);
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 10));
    return [{ id: 1, name: 'Alice' }];
  }
}

class UserServiceImpl implements UserService {
  // Using blob as property initializer
  private db = database;
  private log = logger;

  async getUser(id: number) {
    this.log.log(`Fetching user ${id}`);
    const results = await this.db.query(`SELECT * FROM users WHERE id = ${id}`);
    return results[0] as { id: number; name: string };
  }
}

async function main() {
  console.log('=== Comprehensive diblob Demo ===\n');

  // Create parent container with shared services
  const parent = createContainer();
  parent.register(logger, ConsoleLogger);
  parent.register(database, AsyncDatabase);
  parent.register(userService, UserServiceImpl);

  console.log('1. Basic async usage:');
  const user1 = await userService.getUser(1);
  console.log('   User:', user1);

  // Create child container
  const child = createContainer(parent);

  console.log('\n2. Child container inherits logger and database:');
  const user2 = await userService.getUser(2);
  console.log('   User:', user2);

  // Demonstrate reactive dependencies
  console.log('\n3. Reactive dependencies - changing logger:');
  class PrefixLogger implements Logger {
    log(message: string): void {
      console.log(`>>> ${message}`);
    }
  }
  
  child.register(logger, PrefixLogger);
  const user3 = await userService.getUser(3);
  console.log('   User:', user3);

  // Demonstrate transient lifecycle
  console.log('\n4. Transient lifecycle:');
  const transientLogger = createBlob<Logger>();
  
  class CountingLogger implements Logger {
    private static count = 0;
    private id: number;
    
    constructor() {
      this.id = ++CountingLogger.count;
      console.log(`   Created logger instance #${this.id}`);
    }
    
    log(message: string): void {
      console.log(`   [Logger #${this.id}] ${message}`);
    }
  }
  
  const transientContainer = createContainer();
  transientContainer.register(
    transientLogger,
    CountingLogger,
    { lifecycle: Lifecycle.Transient }
  );
  
  transientLogger.log('First call');
  transientLogger.log('Second call');
  transientLogger.log('Third call');

  // Demonstrate container merging
  console.log('\n5. Container merging:');
  const c1 = createContainer();
  const c2 = createContainer();
  
  const blob1 = createBlob<Logger>();
  const blob2 = createBlob<Logger>();
  
  c1.register(blob1, () => {
    console.log('   From container 1');
    return new ConsoleLogger();
  });
  
  c2.register(blob2, () => {
    console.log('   From container 2');
    return new PrefixLogger();
  });
  
  const merged = createContainer(c1, c2);
  merged.resolve(blob1);
  merged.resolve(blob2);

  console.log('\n=== Demo Complete ===');
}

main().catch(console.error);

