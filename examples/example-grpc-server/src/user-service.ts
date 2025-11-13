/**
 * User service implementation
 * 
 * This service demonstrates dependency injection with diblob,
 * using the database client from diblob-drizzle.
 */

import { create } from '@bufbuild/protobuf';
import type { ServiceImpl } from '@connectrpc/connect';
import { createBlob } from '@speajus/diblob';
import { type DatabaseClient, databaseClient } from '@speajus/diblob-drizzle';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { type NewUser, type User, users } from './db/schema.js';
import { type CreateUserRequest, type CreateUserResponse, CreateUserResponseSchema, type DeleteUserRequest, type DeleteUserResponse, 
  DeleteUserResponseSchema, type GetUserResponse, GetUserResponseSchema, type ListUsersRequest,type ListUsersResponse, ListUsersResponseSchema, type UpdateUserRequest,type UpdateUserResponse, UpdateUserResponseSchema, UserSchema, type UserService } from './generated/user_pb.js';

/**
 * User service implementation
 */
export class UserServiceImpl implements ServiceImpl<typeof UserService> {
  constructor(
    private db: DatabaseClient<BetterSQLite3Database> = databaseClient
  ) {}

  async getUser({id}:{id: number}):Promise<GetUserResponse> {
    const db = this.db.getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user){
      throw new Error(`user not found`);
    }
    return create(GetUserResponseSchema, {user:this.userToProto(user)});
  }
  userToProto(user: User) {
    return create(UserSchema, {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: BigInt(user.createdAt?.getTime())
    });
  }
  async createUser({name, email}:CreateUserRequest): Promise<CreateUserResponse> {
    const db = this.db.getDb();
    const newUser: NewUser = {
      name,
      email,
      createdAt: new Date()
    };
    
    const [user] = await db.insert(users).values(newUser).returning();
    return create(CreateUserResponseSchema, {user:this.userToProto(user)});
  }

  async listUsers({limit = 10, offset = 0}:ListUsersRequest): Promise<ListUsersResponse> {
    const db = this.db.getDb();
    
    const userList = await db.select().from(users).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: users.id }).from(users);
    
    return create(ListUsersResponseSchema, {
      users: userList.map(this.userToProto),
      total: count
    });
  }

  async updateUser({id, name, email}:UpdateUserRequest): Promise<UpdateUserResponse>{
    const db = this.db.getDb();
    
    const [user] = await db
      .update(users)
      .set({ name, email })
      .where(eq(users.id, id))
      .returning();
    
    return create(UpdateUserResponseSchema, {user:this.userToProto(user)});
  }

  async deleteUser({id}:DeleteUserRequest): Promise<DeleteUserResponse> {
    const db = this.db.getDb();
    
    const result = await db.delete(users).where(eq(users.id, id));
    return create(DeleteUserResponseSchema, {success:result.changes > 0});
  }
}

// Create blob for the user service
export const userService = createBlob<ServiceImpl<typeof UserService>>('userService', {
  name: 'User Service',
  description: 'Service for managing users'
});

