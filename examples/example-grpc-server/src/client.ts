/**
 * Example gRPC client to test the server
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // Load proto file
  const PROTO_PATH = join(__dirname, '../proto/user.proto');
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
  const UserService = protoDescriptor.user.UserService;

  // Create client
  const client = new UserService(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  console.log('🧪 Testing gRPC User Service\n');

  // Test 1: Create a user
  console.log('1️⃣  Creating a user...');
  const createResponse = await new Promise((resolve, reject) => {
    client.createUser(
      { name: 'John Doe', email: 'john@example.com' },
      (error: any, response: any) => {
        if (error) reject(error);
        else resolve(response);
      }
    );
  });
  console.log('   Created:', createResponse);

  // Test 2: Get the user
  console.log('\n2️⃣  Fetching the user...');
  const getResponse = await new Promise((resolve, reject) => {
    client.getUser(
      { id: (createResponse as any).user.id },
      (error: any, response: any) => {
        if (error) reject(error);
        else resolve(response);
      }
    );
  });
  console.log('   Fetched:', getResponse);

  // Test 3: Create another user
  console.log('\n3️⃣  Creating another user...');
  const createResponse2 = await new Promise((resolve, reject) => {
    client.createUser(
      { name: 'Jane Smith', email: 'jane@example.com' },
      (error: any, response: any) => {
        if (error) reject(error);
        else resolve(response);
      }
    );
  });
  console.log('   Created:', createResponse2);

  // Test 4: List users
  console.log('\n4️⃣  Listing all users...');
  const listResponse = await new Promise((resolve, reject) => {
    client.listUsers(
      { limit: 10, offset: 0 },
      (error: any, response: any) => {
        if (error) reject(error);
        else resolve(response);
      }
    );
  });
  console.log('   Users:', listResponse);

  // Test 5: Update user
  console.log('\n5️⃣  Updating user...');
  const updateResponse = await new Promise((resolve, reject) => {
    client.updateUser(
      {
        id: (createResponse as any).user.id,
        name: 'John Updated',
        email: 'john.updated@example.com'
      },
      (error: any, response: any) => {
        if (error) reject(error);
        else resolve(response);
      }
    );
  });
  console.log('   Updated:', updateResponse);

  // Test 6: Delete user
  console.log('\n6️⃣  Deleting user...');
  const deleteResponse = await new Promise((resolve, reject) => {
    client.deleteUser(
      { id: (createResponse as any).user.id },
      (error: any, response: any) => {
        if (error) reject(error);
        else resolve(response);
      }
    );
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

