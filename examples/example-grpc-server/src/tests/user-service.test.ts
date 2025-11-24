/**
 * Unit tests for UserService using diblob-testing
 * 
 * These tests demonstrate comprehensive testing of the UserService class
 * using diblob-testing utilities with a real in-memory SQLite database.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { create } from '@bufbuild/protobuf';
import { createTestContainer, testLogger, withBlobOverride } from '@speajus/diblob-testing';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema.js';
import { users } from '../db/schema.js';
import { database } from '../drizzle.js';
import { CreateUserRequestSchema, DeleteUserRequestSchema, GetUserRequestSchema, ListUsersRequestSchema, UpdateUserRequestSchema } from '../generated/user_pb.js';
import { UserServiceImpl } from '../user-service.js';

describe('UserService Unit Tests', () => {
  // Helper to create a test database with schema
  const createTestDatabase = () => {
    const sqliteDb = new Database(':memory:');
    
    // Create the users table
    sqliteDb.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL
      )
    `);
    
    const db = drizzle(sqliteDb, { schema });
    
    return { sqliteDb, db };
  };

  test('should create a user successfully', async () => {
    const container = createTestContainer();
    const { sqliteDb, db } = createTestDatabase();

    try {
      await withBlobOverride(container, database, db, async (testContainer) => {
        // Get the test logger from the container
        const log = await testContainer.resolve(testLogger);

        // Create service with the resolved database and logger values
        const service = new UserServiceImpl(db, log);

        const request = create(CreateUserRequestSchema, {
          name: 'John Doe',
          email: 'john@example.com'
        });

        const response = await service.createUser(request);

        assert.ok(response.user);
        assert.strictEqual(response.user.name, 'John Doe');
        assert.strictEqual(response.user.email, 'john@example.com');
        assert.strictEqual(response.user.id, 1);
        assert.ok(response.user.createdAt);
      });
    } finally {
      sqliteDb.close();
    }
  });

  test('should get a user by id', async () => {
    const container = createTestContainer();
    const { sqliteDb, db } = createTestDatabase();

    try {
      // Pre-populate database
      await db.insert(users).values({
        name: 'Jane Doe',
        email: 'jane@example.com',
        createdAt: new Date()
      });

      await withBlobOverride(container, database, db, async (testContainer) => {
        const log = await testContainer.resolve(testLogger);
        const service = new UserServiceImpl(db, log);

        const request = create(GetUserRequestSchema, { id: 1 });
        const response = await service.getUser(request);

        assert.ok(response.user);
        assert.strictEqual(response.user.name, 'Jane Doe');
        assert.strictEqual(response.user.email, 'jane@example.com');
        assert.strictEqual(response.user.id, 1);
      });
    } finally {
      sqliteDb.close();
    }
  });

  test('should throw error when user not found', async () => {
    const container = createTestContainer();
    const { sqliteDb, db } = createTestDatabase();

    try {
      await withBlobOverride(container, database, db, async (testContainer) => {
        const log = await testContainer.resolve(testLogger);
        const service = new UserServiceImpl(db, log);

        const request = create(GetUserRequestSchema, { id: 999 });

        await assert.rejects(
          () => service.getUser(request),
          /user not found/
        );
      });
    } finally {
      sqliteDb.close();
    }
  });

  test('should list users with pagination', async () => {
    const container = createTestContainer();
    const { sqliteDb, db } = createTestDatabase();

    try {
      // Pre-populate with multiple users
      for (let i = 1; i <= 5; i++) {
        await db.insert(users).values({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          createdAt: new Date()
        });
      }

      await withBlobOverride(container, database, db, async (testContainer) => {
        const log = await testContainer.resolve(testLogger);
        const service = new UserServiceImpl(db, log);

        const request = create(ListUsersRequestSchema, { limit: 3, offset: 1 });
        const response = await service.listUsers(request);

        assert.strictEqual(response.users.length, 3);
        assert.strictEqual(response.users[0].name, 'User 2');
        assert.strictEqual(response.users[1].name, 'User 3');
        assert.strictEqual(response.users[2].name, 'User 4');
      });
    } finally {
      sqliteDb.close();
    }
  });

  test('should update a user successfully', async () => {
    const container = createTestContainer();
    const { sqliteDb, db } = createTestDatabase();

    try {
      // Pre-populate with a user
      await db.insert(users).values({
        name: 'Original Name',
        email: 'original@example.com',
        createdAt: new Date()
      });

      await withBlobOverride(container, database, db, async (testContainer) => {
        const log = await testContainer.resolve(testLogger);
        const service = new UserServiceImpl(db, log);

        const request = create(UpdateUserRequestSchema, {
          id: 1,
          name: 'Updated Name',
          email: 'updated@example.com'
        });

        const response = await service.updateUser(request);

        assert.ok(response.user);
        assert.strictEqual(response.user.name, 'Updated Name');
        assert.strictEqual(response.user.email, 'updated@example.com');
        assert.strictEqual(response.user.id, 1);
      });
    } finally {
      sqliteDb.close();
    }
  });

  test('should delete a user successfully', async () => {
    const container = createTestContainer();
    const { sqliteDb, db } = createTestDatabase();

    try {
      // Pre-populate with a user
      await db.insert(users).values({
        name: 'To Delete',
        email: 'delete@example.com',
        createdAt: new Date()
      });

      await withBlobOverride(container, database, db, async (testContainer) => {
        const log = await testContainer.resolve(testLogger);
        const service = new UserServiceImpl(db, log);

        const request = create(DeleteUserRequestSchema, { id: 1 });
        const response = await service.deleteUser(request);

        assert.strictEqual(response.success, true);
      });
    } finally {
      sqliteDb.close();
    }
  });

  test('should handle delete when user does not exist', async () => {
    const container = createTestContainer();
    const { sqliteDb, db } = createTestDatabase();

    try {
      await withBlobOverride(container, database, db, async (testContainer) => {
        const log = await testContainer.resolve(testLogger);
        const service = new UserServiceImpl(db, log);

        const request = create(DeleteUserRequestSchema, { id: 999 });
        const response = await service.deleteUser(request);

        assert.strictEqual(response.success, false);
      });
    } finally {
      sqliteDb.close();
    }
  });
});
