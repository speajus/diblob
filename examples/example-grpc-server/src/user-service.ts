/**
 * User service implementation
 * 
 * This service demonstrates dependency injection with diblob,
 * using a Drizzle ORM-backed database client.
 */

import { create } from '@bufbuild/protobuf';
import type { ServiceImpl } from '@connectrpc/connect';
import { createBlob } from '@speajus/diblob';
import { eq } from 'drizzle-orm';
import { type NewUser, type User, users } from './db/schema.js';
import { type CreateUserRequest, type CreateUserResponse, CreateUserResponseSchema, type DeleteUserRequest, type DeleteUserResponse, 
  DeleteUserResponseSchema, type GetUserResponse, GetUserResponseSchema, type ListUsersRequest,type ListUsersResponse, ListUsersResponseSchema, type UpdateUserRequest,type UpdateUserResponse, UpdateUserResponseSchema, UserSchema, type UserService } from './generated/user_pb.js';
import { database } from './drizzle.js';

/**
 * User service implementation
 */
export class UserServiceImpl implements ServiceImpl<typeof UserService> {
  constructor(
    private db = database
  ) {}

  async getUser({id}:{id: number}):Promise<GetUserResponse> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id)
    });
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
    const newUser: NewUser = {
      name,
      email,
      createdAt: new Date()
    };
    
    const [user] = await this.db.insert(users).values(newUser).returning();
    return create(CreateUserResponseSchema, {user:this.userToProto(user)});
  }

  async listUsers({limit = 10, offset = 0}:ListUsersRequest): Promise<ListUsersResponse> {
    
    const userList = await this.db.select().from(users).limit(limit).offset(offset);
    const [{ count }] = await this.db.select({ count: users.id }).from(users);
    
    return create(ListUsersResponseSchema, {
      users: userList.map(this.userToProto),
      total: count
    });
  }

  async updateUser({id, name, email}:UpdateUserRequest): Promise<UpdateUserResponse>{
    
    const [user] = await this.db
      .update(users)
      .set({ name, email })
      .where(eq(users.id, id))
      .returning();
    
    return create(UpdateUserResponseSchema, {user:this.userToProto(user)});
  }

  async deleteUser({id}:DeleteUserRequest): Promise<DeleteUserResponse> {
    
    const result = await this.db.delete(users).where(eq(users.id, id));
    return create(DeleteUserResponseSchema, {success:result.changes > 0});
  }
}

// Create blob for the user service
export const userService = createBlob<ServiceImpl<typeof UserService>>('userService', {
  name: 'User Service',
  description: 'Service for managing users'
});

