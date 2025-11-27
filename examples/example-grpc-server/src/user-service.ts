/**
 * User service implementation
 * 
 * This service demonstrates dependency injection with diblob,
 * using a Drizzle ORM-backed database client.
 */

import { create } from '@bufbuild/protobuf';
import { Code, ConnectError, type ServiceImpl } from '@connectrpc/connect';
import { trace } from '@opentelemetry/api';
import { createBlob } from '@speajus/diblob';
import type { DiagnosticsRecorder } from '@speajus/diblob-diagnostics';
import type { Logger } from '@speajus/diblob-logger';
import { eq } from 'drizzle-orm';
import { type NewUser, type User, users } from './db/schema.js';
import type { DrizzleType } from './drizzle.js';
import { type CreateUserRequest, type CreateUserResponse, CreateUserResponseSchema, type DeleteUserRequest, type DeleteUserResponse,
  DeleteUserResponseSchema, type GetUserRequest, type GetUserResponse, GetUserResponseSchema, type ListUsersRequest,type ListUsersResponse, ListUsersResponseSchema, type UpdateUserRequest,type UpdateUserResponse, UpdateUserResponseSchema, UserSchema, type UserService } from './generated/user_pb.js';

/**
 * User service implementation
 */
export class UserServiceImpl implements ServiceImpl<typeof UserService> {
  private db: DrizzleType;
  private log: Logger;
  private diagnostics?: DiagnosticsRecorder;

  constructor(
	  db: DrizzleType,
	  log: Logger,
	  diagnostics?: DiagnosticsRecorder,
  ) {
    this.db = db;
    this.log = log;
	    this.diagnostics = diagnostics;
  }

  async getUser(request: GetUserRequest):Promise<GetUserResponse> {
	    const span = trace.getTracer('example-grpc-server').startSpan('getUser');
	    const startedAt = Date.now();
	    try {
	      const user = await this.db.query.users.findFirst({
	        where: eq(users.id, request.id)
	      });
	      if (!user){
	        throw new ConnectError(`user not found`, Code.NotFound);
	      }
	      const durationMs = Date.now() - startedAt;
	      this.recordDiagnostics('getUser', 'success', durationMs);
	      return create(GetUserResponseSchema, {user:this.userToProto(user)});
	    } catch (error) {
	      const durationMs = Date.now() - startedAt;
	      const message = error instanceof Error ? error.message : String(error);
	      this.recordDiagnostics('getUser', 'error', durationMs, message);
	      throw error;
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
	    const startedAt = Date.now();
	    try {
	      const newUser: NewUser = {
	        name: request.name,
	        email: request.email,
	        createdAt: new Date()
	      };

	      const [user] = await this.db.insert(users).values(newUser).returning();
	      const durationMs = Date.now() - startedAt;
	      this.recordDiagnostics('createUser', 'success', durationMs);
	      return create(CreateUserResponseSchema, {user:this.userToProto(user)});
	    } catch (error) {
	      const durationMs = Date.now() - startedAt;
	      const message = error instanceof Error ? error.message : String(error);
	      this.recordDiagnostics('createUser', 'error', durationMs, message);
	      throw error;
	    } finally {
	      span.end();
	    }
  }

	  async listUsers(request: ListUsersRequest): Promise<ListUsersResponse> {
	    const span = trace.getTracer('example-grpc-server').startSpan('listUsers');
	    const startedAt = Date.now();
	    try {
	      const limit = request.limit || 10;
	      const offset = request.offset || 0;

	      const userList = await this.db.select().from(users).limit(limit).offset(offset);
	      const [{ count }] = await this.db.select({ count: users.id }).from(users);

	      const durationMs = Date.now() - startedAt;
	      this.recordDiagnostics('listUsers', 'success', durationMs, undefined, {
	        limit,
	        offset,
	      });
	      return create(ListUsersResponseSchema, {
	        users: userList.map(this.userToProto),
	        total: count
	      });
	    } catch (error) {
	      const durationMs = Date.now() - startedAt;
	      const message = error instanceof Error ? error.message : String(error);
	      this.recordDiagnostics('listUsers', 'error', durationMs, message);
	      throw error;
	    } finally {
	      span.end();
	    }
  }

	  async updateUser(request: UpdateUserRequest): Promise<UpdateUserResponse>{

	    const span = trace.getTracer('example-grpc-server').startSpan('updateUser');
	    const startedAt = Date.now();
	    try {
	      const [user] = await this.db
	        .update(users)
	        .set({ name: request.name, email: request.email })
	        .where(eq(users.id, request.id))
	        .returning();

	      const durationMs = Date.now() - startedAt;
	      this.recordDiagnostics('updateUser', 'success', durationMs);
	      return create(UpdateUserResponseSchema, {user:this.userToProto(user)});
	    } catch (error) {
	      const durationMs = Date.now() - startedAt;
	      const message = error instanceof Error ? error.message : String(error);
	      this.recordDiagnostics('updateUser', 'error', durationMs, message);
	      throw error;
	    } finally {
	      span.end();
	    }
  }

	  async deleteUser(request: DeleteUserRequest): Promise<DeleteUserResponse> {

	    const span = trace.getTracer('example-grpc-server').startSpan('deleteUser');
	    const startedAt = Date.now();
	    try {
	      const result = await this.db.delete(users).where(eq(users.id, request.id));
	      const success = result.changes > 0;
	      const durationMs = Date.now() - startedAt;
	      this.recordDiagnostics('deleteUser', success ? 'success' : 'error', durationMs);
	      return create(DeleteUserResponseSchema, {success});
	    } catch (error) {
	      const durationMs = Date.now() - startedAt;
	      const message = error instanceof Error ? error.message : String(error);
	      this.recordDiagnostics('deleteUser', 'error', durationMs, message);
	      throw error;
	    } finally {
	      span.end();
	    }
  }

	  private recordDiagnostics(
	    method: string,
	    outcome: 'success' | 'error',
	    durationMs: number,
	    errorMessage?: string,
	    extraContext?: Record<string, unknown>,
	  ): void {
	    if (!this.diagnostics) return;
	    this.diagnostics.record({
	      blobName: 'userService',
	      message: errorMessage ?? `${method} completed`,
	      level: outcome === 'success' ? 'info' : 'error',
	      timestamp: Date.now(),
	      outcome,
	      durationMs,
	      context: {
	        method,
	        ...extraContext,
	      },
	    });
	  }
}

// Create blob for the user service
export const userService = createBlob<ServiceImpl<typeof UserService>>('userService', {
  name: 'User Service',
  description: 'Service for managing users'
});

