/**
 * Example Connect client to test the server.
 */

import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-node';

import { UserService } from './generated/user_pb.js';

async function main() {
  const transport = createConnectTransport({
	    baseUrl: 'http://localhost:50051',
	    httpVersion: '1.1',
	  });

	  const client = createClient(UserService, transport);

  console.log('🧪 Testing User Service over Connect');

  // Use a unique suffix on each run so the example remains idempotent
  // even when using a persistent SQLite DB with UNIQUE(email).
  const runSuffix = Date.now().toString(36);

  // Test 1: Create a user
  console.log('1️⃣  Creating a user...');
  const createResponse = await client.createUser({
    name: 'John Doe',
    email: `john+${runSuffix}@example.com`,
  });
  console.log('   Created:', createResponse);

  if (!createResponse.user) {
    throw new Error('User not created');
  }

  // Test 2: Get the user
  console.log('\n2️⃣  Fetching the user...');
  const getResponse = await client.getUser({ id: createResponse.user.id });
  console.log('   Fetched:', getResponse);

  // Test 3: Create another user
  console.log('\n3️⃣  Creating another user...');
  const createResponse2 = await client.createUser({
    name: 'Jane Smith',
    email: `jane+${runSuffix}@example.com`,
  });
  console.log('   Created:', createResponse2);

  // Test 4: List users
  console.log('\n4️⃣  Listing all users...');
  const listResponse = await client.listUsers({ limit: 10, offset: 0 });
  console.log('   Users:', listResponse);

  // Test 5: Update user
  console.log('\n5️⃣  Updating user...');
  const updateResponse = await client.updateUser({
    id: createResponse.user.id,
    name: 'John Updated',
    email: 'john.updated@example.com',
  });
  console.log('   Updated:', updateResponse);

  // Test 6: Delete user
  console.log('\n6️⃣  Deleting user...');
  const deleteResponse = await client.deleteUser({
    id: createResponse.user.id,
  });
  console.log('   Deleted:', deleteResponse);

  console.log('\n✅ All tests completed!\n');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
