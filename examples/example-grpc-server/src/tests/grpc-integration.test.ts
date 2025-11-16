/**
 * gRPC integration tests using diblob-testing
 * 
 * These tests demonstrate integration testing of gRPC service handlers
 * with real database but isolated containers.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { create } from '@bufbuild/protobuf';
import { createClient, createRouterTransport } from '@connectrpc/connect';
import { registerGrpcBlobs } from '@speajus/diblob-connect';
import { setupEachTestContainer } from '@speajus/diblob-testing';
import { sqlite } from '../drizzle.js';
import { CreateUserRequestSchema, DeleteUserRequestSchema, GetUserRequestSchema, ListUsersRequestSchema, UpdateUserRequestSchema, UserService } from '../generated/user_pb.js';
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

  // Helper to create a test client with in-memory transport
  async function createUserServiceClient(container: ReturnType<typeof getContainer>) {
    const serviceImpl = await container.resolve(userService);

    const transport = createRouterTransport(({ service }) => {
      service(UserService, serviceImpl);
    });

    return createClient(UserService, transport);
  }

  test('should create and retrieve a user through service', async () => {
    const container = getContainer();
    registerDrizzleBlobs(container, ':memory:');
    await createSchema(container);
    registerGrpcBlobs(container, { host: '0.0.0.0', port: 50053 });
    registerUserService(container);

    const client = await createUserServiceClient(container);

    // Create a user
    const createRequest = create(CreateUserRequestSchema, {
      name: 'Integration Test User',
      email: 'integration@test.com'
    });
    const createResponse = await client.createUser(createRequest);

    assert.ok(createResponse.user);
    assert.strictEqual(createResponse.user.name, 'Integration Test User');
    assert.strictEqual(createResponse.user.email, 'integration@test.com');

    // Retrieve the user
    const getRequest = create(GetUserRequestSchema, { id: createResponse.user.id });
    const getResponse = await client.getUser(getRequest);

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

    const client = await createUserServiceClient(container);

    // Create a user
    const createRequest = create(CreateUserRequestSchema, {
      name: 'Original Name',
      email: 'original@test.com'
    });
    const createResponse = await client.createUser(createRequest);

    assert.ok(createResponse.user);

    // Update the user
    const updateRequest = create(UpdateUserRequestSchema, {
      id: createResponse.user.id,
      name: 'Updated Name',
      email: 'updated@test.com'
    });
    const updateResponse = await client.updateUser(updateRequest);

    assert.ok(updateResponse.user);
    assert.strictEqual(updateResponse.user.name, 'Updated Name');
    assert.strictEqual(updateResponse.user.email, 'updated@test.com');

    // Verify the update persisted
    const getRequest = create(GetUserRequestSchema, { id: createResponse.user.id });
    const getResponse = await client.getUser(getRequest);

    assert.ok(getResponse.user);
    assert.strictEqual(getResponse.user.name, 'Updated Name');
    assert.strictEqual(getResponse.user.email, 'updated@test.com');
  });

  test('should delete a user through service', async () => {
    const container = getContainer();
    registerDrizzleBlobs(container, ':memory:');
    await createSchema(container);
    registerGrpcBlobs(container, { host: '0.0.0.0', port: 50055 });
    registerUserService(container);

    const client = await createUserServiceClient(container);

    // Create a user
    const createRequest = create(CreateUserRequestSchema, {
      name: 'To Delete',
      email: 'delete@test.com'
    });
    const createResponse = await client.createUser(createRequest);

    assert.ok(createResponse.user);

    // Delete the user
    const deleteRequest = create(DeleteUserRequestSchema, { id: createResponse.user.id });
    const deleteResponse = await client.deleteUser(deleteRequest);

    assert.strictEqual(deleteResponse.success, true);

    // Verify the user is deleted
    const getRequest = create(GetUserRequestSchema, { id: createResponse.user.id });
    await assert.rejects(
      async () => await client.getUser(getRequest),
      /user not found/
    );
  });

  test('should list users with pagination through service', async () => {
    const container = getContainer();
    registerDrizzleBlobs(container, ':memory:');
    await createSchema(container);
    registerGrpcBlobs(container, { host: '0.0.0.0', port: 50056 });
    registerUserService(container);

    const client = await createUserServiceClient(container);

    // Create multiple users
    for (let i = 1; i <= 10; i++) {
      const createRequest = create(CreateUserRequestSchema, {
        name: `User ${i}`,
        email: `user${i}@test.com`
      });
      await client.createUser(createRequest);
    }

    // List first page
    const listRequest1 = create(ListUsersRequestSchema, { limit: 5, offset: 0 });
    const listResponse1 = await client.listUsers(listRequest1);

    assert.ok(listResponse1.users);
    assert.strictEqual(listResponse1.users.length, 5);
    assert.strictEqual(listResponse1.users[0].name, 'User 1');
    assert.strictEqual(listResponse1.users[4].name, 'User 5');

    // List second page
    const listRequest2 = create(ListUsersRequestSchema, { limit: 5, offset: 5 });
    const listResponse2 = await client.listUsers(listRequest2);

    assert.ok(listResponse2.users);
    assert.strictEqual(listResponse2.users.length, 5);
    assert.strictEqual(listResponse2.users[0].name, 'User 6');
    assert.strictEqual(listResponse2.users[4].name, 'User 10');
  });
});
