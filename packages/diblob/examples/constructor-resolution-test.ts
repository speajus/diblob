/**
 * Test resolving unregistered classes with blob default parameters
 */

import { createBlob, createContainer } from '../src';

interface Logger {
  log(message: string): void;
}

interface Database {
  query(sql: string): Promise<any>;
}

const logger = createBlob<Logger>();
const database = createBlob<Database>();

class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

class AsyncDatabase implements Database {
  async query(sql: string) {
    logger.log(`Executing: ${sql}`);
    await new Promise(resolve => setTimeout(resolve, 10));
    return [{ id: 1, name: 'Alice' }];
  }
}

// Class with blob default parameters - NOT registered as a blob
class UserService {
  constructor(
    private log = logger,
    private db = database
  ) {
    this.log.log('UserService created');
  }

  async getUser(id: number) {
    this.log.log(`Fetching user ${id}`);
    const results = await this.db.query(`SELECT * FROM users WHERE id = ${id}`);
    return results[0];
  }
}

async function main() {
  console.log('=== Test: Resolve unregistered class with blob dependencies ===\n');

  const container = createContainer();
  
  // Register the blobs
  container.register(logger, ConsoleLogger);
  container.register(database, AsyncDatabase);

  console.log('1. Resolving UserService class (not registered as blob):');
  const service = await container.resolve(UserService);
  
  console.log('\n2. Using the resolved service:');
  const user = await service.getUser(123);
  console.log('   User:', user);

  console.log('\n=== Test Complete ===');
}

main().catch(console.error);

