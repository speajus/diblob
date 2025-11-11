/**
 * Type-safe gRPC User Service implementation
 *
 * This implements the gRPC service handlers using generated TypeScript types,
 * delegating to the UserService which is injected via diblob.
 */

import * as grpc from '@grpc/grpc-js';

import type {
  CreateUserRequest,
  CreateUserResponse,
  DeleteUserRequest,
  DeleteUserResponse,
  GetUserRequest,
  GetUserResponse,
  ListUsersRequest,
  ListUsersResponse,
  UpdateUserRequest,
  UpdateUserResponse,
} from '../generated/user.js';
import { userService, type UserService } from '../services/user-service.js';

/**
 * Type-safe gRPC User Service implementation
 *
 * Note: We don't implement UserServiceServer directly due to index signature requirements,
 * but we maintain type compatibility for all methods.
 */
export class UserGrpcServiceTyped {
  constructor(private service: UserService = userService) {}

  /**
   * Get user by ID
   */
  getUser: grpc.handleUnaryCall<GetUserRequest, GetUserResponse> = async (
    call,
    callback
  ) => {
    try {
      const { id } = call.request;
      const user = await this.service.fetchUser(id);

      if (!user) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: `User with id ${id} not found`,
        } as grpc.ServiceError);
        return;
      }

      callback(null, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.getTime(),
        },
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error',
      } as grpc.ServiceError);
    }
  };

  /**
   * Create a new user
   */
  createUser: grpc.handleUnaryCall<CreateUserRequest, CreateUserResponse> = async (
    call,
    callback
  ) => {
    try {
      const { name, email } = call.request;
      const user = await this.service.createUser(name, email);

      callback(null, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.getTime(),
        },
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error',
      } as grpc.ServiceError);
    }
  };

  /**
   * List users with pagination
   */
  listUsers: grpc.handleUnaryCall<ListUsersRequest, ListUsersResponse> = async (
    call,
    callback
  ) => {
    try {
      const { limit = 10, offset = 0 } = call.request;
      const result = await this.service.listUsers(limit, offset);

      callback(null, {
        users: result.users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.getTime(),
        })),
        total: result.total,
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error',
      } as grpc.ServiceError);
    }
  };

  /**
   * Update user
   */
  updateUser: grpc.handleUnaryCall<UpdateUserRequest, UpdateUserResponse> = async (
    call,
    callback
  ) => {
    try {
      const { id, name, email } = call.request;
      const user = await this.service.updateUser(id, name, email);

      if (!user) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: `User with id ${id} not found`,
        } as grpc.ServiceError);
        return;
      }

      callback(null, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.getTime(),
        },
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error',
      } as grpc.ServiceError);
    }
  };

  /**
   * Delete user
   */
  deleteUser: grpc.handleUnaryCall<DeleteUserRequest, DeleteUserResponse> = async (
    call,
    callback
  ) => {
    try {
      const { id } = call.request;
      const success = await this.service.deleteUser(id);

      callback(null, { success });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error',
      } as grpc.ServiceError);
    }
  };
}

