/**
 * Example gRPC client using generated TypeScript types
 * This demonstrates type-safe gRPC calls with full IntelliSense support
 */

import * as grpc from '@grpc/grpc-js';

import {
  type CreateUserRequest,
  type CreateUserResponse,
  type DeleteUserRequest,
  type GetUserRequest,
  type ListUsersRequest,
  type UpdateUserRequest,
  UserServiceClient,
} from './generated/user.js';

async function main() {
  console.log('🧪 Testing gRPC User Service (Type-Safe)\n');

  // Create type-safe client
  const client = new UserServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  // Test 1: Create a user (fully type-safe)
  console.log('1️⃣  Creating a user...');
  const createRequest: CreateUserRequest = {
    name: 'John Doe',
    email: 'john@example.com',
  };

  const createResponse = await new Promise<CreateUserResponse>((resolve, reject) => {
    client.createUser(createRequest, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });
  console.log('   Created:', createResponse);

  // Test 2: Get the user (type-safe request and response)
  console.log('\n2️⃣  Fetching the user...');
  if (!createResponse.user) {
    throw new Error('User not created');
  }
  const getRequest: GetUserRequest = {
    id: createResponse.user.id,
  };

  const getResponse = await new Promise((resolve, reject) => {
    client.getUser(getRequest, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });
  console.log('   Fetched:', getResponse);

  // Test 3: Create another user
  console.log('\n3️⃣  Creating another user...');
  const createRequest2: CreateUserRequest = {
    name: 'Jane Smith',
    email: 'jane@example.com',
  };

  const createResponse2 = await new Promise((resolve, reject) => {
    client.createUser(createRequest2, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });
  console.log('   Created:', createResponse2);

  // Test 4: List users (type-safe pagination)
  console.log('\n4️⃣  Listing all users...');
  const listRequest: ListUsersRequest = {
    limit: 10,
    offset: 0,
  };

  const listResponse = await new Promise((resolve, reject) => {
    client.listUsers(listRequest, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });
  console.log('   Users:', listResponse);

  // Test 5: Update user (type-safe update)
  console.log('\n5️⃣  Updating user...');
  const updateRequest: UpdateUserRequest = {
    id: createResponse.user.id,
    name: 'John Updated',
    email: 'john.updated@example.com',
  };

  const updateResponse = await new Promise((resolve, reject) => {
    client.updateUser(updateRequest, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });
  console.log('   Updated:', updateResponse);

  // Test 6: Delete user (type-safe delete)
  console.log('\n6️⃣  Deleting user...');
  const deleteRequest: DeleteUserRequest = {
    id: createResponse.user.id,
  };

  const deleteResponse = await new Promise((resolve, reject) => {
    client.deleteUser(deleteRequest, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });
  console.log('   Deleted:', deleteResponse);

  console.log('\n✅ All tests completed!\n');

  // Close the client
  client.close();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

