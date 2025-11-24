/**
 * User service implementation
 * 
 * This service demonstrates dependency injection with diblob,
 * using a Drizzle ORM-backed database client.
 */

import { create } from '@bufbuild/protobuf';
import { Code, ConnectError, type ServiceImpl } from '@connectrpc/connect';
import { trace } from '@opentelemetry/api';
import { type Blob, createBlob } from '@speajus/diblob';
import { type Logger, logger } from '@speajus/diblob-logger';
import { eq } from 'drizzle-orm';
import { type NewUser, type User, users } from './db/schema.js';
import { type DrizzleType, database } from './drizzle.js';
import { type CreateUserRequest, type CreateUserResponse, CreateUserResponseSchema, type DeleteUserRequest, type DeleteUserResponse,
  DeleteUserResponseSchema, type GetUserRequest, type GetUserResponse, GetUserResponseSchema, type ListUsersRequest,type ListUsersResponse, ListUsersResponseSchema, type UpdateUserRequest,type UpdateUserResponse, UpdateUserResponseSchema, UserSchema, type UserService } from './generated/user_pb.js';

/**
 * User service implementation
 */
export class UserServiceImpl implements ServiceImpl<typeof UserService> {
  private db: DrizzleType;
  private log: Logger;

  constructor(
    db: Blob<DrizzleType> | DrizzleType = database,
    log: Blob<Logger> | Logger = logger
  ) {
    // If passed a blob, access it to get the resolved value
    // If passed a direct value, use it as-is
    this.db = db as DrizzleType;
    this.log = log as Logger;
  }

  async getUser(request: GetUserRequest):Promise<GetUserResponse> {
    const span = trace.getTracer('example-grpc-server').startSpan('getUser');
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, request.id)
      });
    if (!user){
      throw new ConnectError(`user not found`, Code.NotFound);
    }
      return create(GetUserResponseSchema, {user:this.userToProto(user)});
    } finally {
      span.end();
    }
  }
  userToProto(user: User) {
    return create(UserSchema, {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: BigInt(user.createdAt?.getTime())
    });
  }
  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    this.log.info('Creating user', {request});
    const span = trace.getTracer('example-grpc-server').startSpan('createUser');
    try {
      const newUser: NewUser = {
        name: request.name,
        email: request.email,
        createdAt: new Date()
      };

      const [user] = await this.db.insert(users).values(newUser).returning();
      return create(CreateUserResponseSchema, {user:this.userToProto(user)});
    } finally {
      span.end();
    }
  }

  async listUsers(request: ListUsersRequest): Promise<ListUsersResponse> {
    const span = trace.getTracer('example-grpc-server').startSpan('listUsers');
    try {
      const limit = request.limit || 10;
      const offset = request.offset || 0;

      const userList = await this.db.select().from(users).limit(limit).offset(offset);
      const [{ count }] = await this.db.select({ count: users.id }).from(users);

      return create(ListUsersResponseSchema, {
        users: userList.map(this.userToProto),
        total: count
      });
    } finally {
      span.end();
    }
  }

  async updateUser(request: UpdateUserRequest): Promise<UpdateUserResponse>{

    const span = trace.getTracer('example-grpc-server').startSpan('updateUser');
    try {
      const [user] = await this.db
        .update(users)
        .set({ name: request.name, email: request.email })
        .where(eq(users.id, request.id))
        .returning();

      return create(UpdateUserResponseSchema, {user:this.userToProto(user)});
    } finally {
      span.end();
    }
  }

  async deleteUser(request: DeleteUserRequest): Promise<DeleteUserResponse> {

    const span = trace.getTracer('example-grpc-server').startSpan('deleteUser');
    try {
      const result = await this.db.delete(users).where(eq(users.id, request.id));
      return create(DeleteUserResponseSchema, {success:result.changes > 0});
    } finally {
      span.end();
    }
  }
}

// Create blob for the user service
export const userService = createBlob<ServiceImpl<typeof UserService>>('userService', {
  name: 'User Service',
  description: 'Service for managing users'
});

