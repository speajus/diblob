/**
 * gRPC integration tests using diblob-testing
 * 
 * These tests demonstrate integration testing of gRPC service handlers
 * with real database but isolated containers.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { create } from '@bufbuild/protobuf';
import { createContainer } from '@speajus/diblob';
import { registerGrpcBlobs } from '@speajus/diblob-connect';
import { setupEachTestContainer } from '@speajus/diblob-testing';
import { database, sqlite } from '../drizzle.js';
import { CreateUserRequestSchema, DeleteUserRequestSchema, GetUserRequestSchema, ListUsersRequestSchema, UpdateUserRequestSchema } from '../generated/user_pb.js';
import { registerDrizzleBlobs, registerUserService } from '../register.js';
import { userService } from '../user-service.js';

describe('gRPC Service Integration Tests', () => {
  const { getContainer } = setupEachTestContainer();

  // Helper to create database schema
  async function createSchema(container: ReturnType<typeof getContainer>) {
    const db = await container.resolve(sqlite);
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL
      )
    `);
  }

  test('should create and retrieve a user through service', async () => {
    const container = getContainer();
    registerDrizzleBlobs(container, ':memory:');
    await createSchema(container);
    registerGrpcBlobs(container, { host: '0.0.0.0', port: 50053 });
    registerUserService(container);

    const service = await container.resolve(userService);

    // Create a user
    const createRequest = create(CreateUserRequestSchema, {
      name: 'Integration Test User',
      email: 'integration@test.com'
    });
    const createResponse = await service.createUser(createRequest);

    assert.ok(createResponse.user);
    assert.strictEqual(createResponse.user.name, 'Integration Test User');
    assert.strictEqual(createResponse.user.email, 'integration@test.com');

    // Retrieve the user
    const getRequest = create(GetUserRequestSchema, { id: createResponse.user.id });
    const getResponse = await service.getUser(getRequest);

    assert.ok(getResponse.user);
    assert.strictEqual(getResponse.user.id, createResponse.user.id);
    assert.strictEqual(getResponse.user.name, 'Integration Test User');
    assert.strictEqual(getResponse.user.email, 'integration@test.com');
  });

  test('should update a user through service', async () => {
    const container = getContainer();
    registerDrizzleBlobs(container, ':memory:');
    await createSchema(container);
    registerGrpcBlobs(container, { host: '0.0.0.0', port: 50054 });
    registerUserService(container);

    const service = await container.resolve(userService);

    // Create a user
    const createRequest = create(CreateUserRequestSchema, {
      name: 'Original Name',
      email: 'original@test.com'
    });
    const createResponse = await service.createUser(createRequest);

    // Update the user
    const updateRequest = create(UpdateUserRequestSchema, {
      id: createResponse.user!.id,
      name: 'Updated Name',
      email: 'updated@test.com'
    });
    const updateResponse = await service.updateUser(updateRequest);

    assert.ok(updateResponse.user);
    assert.strictEqual(updateResponse.user.name, 'Updated Name');
    assert.strictEqual(updateResponse.user.email, 'updated@test.com');

    // Verify the update persisted
    const getRequest = create(GetUserRequestSchema, { id: createResponse.user!.id });
    const getResponse = await service.getUser(getRequest);

    assert.strictEqual(getResponse.user!.name, 'Updated Name');
    assert.strictEqual(getResponse.user!.email, 'updated@test.com');
  });

  test('should delete a user through service', async () => {
    const container = getContainer();
    registerDrizzleBlobs(container, ':memory:');
    await createSchema(container);
    registerGrpcBlobs(container, { host: '0.0.0.0', port: 50055 });
    registerUserService(container);

    const service = await container.resolve(userService);

    // Create a user
    const createRequest = create(CreateUserRequestSchema, {
      name: 'To Delete',
      email: 'delete@test.com'
    });
    const createResponse = await service.createUser(createRequest);

    // Delete the user
    const deleteRequest = create(DeleteUserRequestSchema, { id: createResponse.user!.id });
    const deleteResponse = await service.deleteUser(deleteRequest);

    assert.strictEqual(deleteResponse.success, true);

    // Verify the user is deleted
    const getRequest = create(GetUserRequestSchema, { id: createResponse.user!.id });
    await assert.rejects(
      () => service.getUser(getRequest),
      /user not found/
    );
  });

  test('should list users with pagination through service', async () => {
    const container = getContainer();
    registerDrizzleBlobs(container, ':memory:');
    await createSchema(container);
    registerGrpcBlobs(container, { host: '0.0.0.0', port: 50056 });
    registerUserService(container);

    const service = await container.resolve(userService);

    // Create multiple users
    for (let i = 1; i <= 10; i++) {
      const createRequest = create(CreateUserRequestSchema, {
        name: `User ${i}`,
        email: `user${i}@test.com`
      });
      await service.createUser(createRequest);
    }

    // List first page
    const listRequest1 = create(ListUsersRequestSchema, { limit: 5, offset: 0 });
    const listResponse1 = await service.listUsers(listRequest1);

    assert.strictEqual(listResponse1.users.length, 5);
    assert.strictEqual(listResponse1.users[0].name, 'User 1');
    assert.strictEqual(listResponse1.users[4].name, 'User 5');

    // List second page
    const listRequest2 = create(ListUsersRequestSchema, { limit: 5, offset: 5 });
    const listResponse2 = await service.listUsers(listRequest2);

    assert.strictEqual(listResponse2.users.length, 5);
    assert.strictEqual(listResponse2.users[0].name, 'User 6');
    assert.strictEqual(listResponse2.users[4].name, 'User 10');
  });
});
