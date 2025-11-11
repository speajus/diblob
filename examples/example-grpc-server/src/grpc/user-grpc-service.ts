/**
 * gRPC User Service implementation
 *
 * This implements the gRPC service handlers, delegating to the UserService
 * which is injected via diblob.
 */

import * as grpc from '@grpc/grpc-js';
import { userService, type UserService } from '../services/user-service.js';

/**
 * gRPC User Service implementation
 */
export class UserGrpcService {
  constructor(private service: UserService = userService) {}

  /**
   * Get user by ID
   */
  getUser = async (
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { id } = call.request;
      const user = await this.service.fetchUser(id);

      if (!user) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: `User with id ${id} not found`
        } as grpc.ServiceError);
        return;
      }

      callback(null, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.createdAt.getTime()
        }
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error'
      } as grpc.ServiceError);
    }
  };

  /**
   * Create a new user
   */
  createUser = async (
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { name, email } = call.request;
      const user = await this.service.createUser(name, email);

      callback(null, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.createdAt.getTime()
        }
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error'
      } as grpc.ServiceError);
    }
  };

  /**
   * List users with pagination
   */
  listUsers = async (
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { limit = 10, offset = 0 } = call.request;
      const result = await this.service.listUsers(limit, offset);

      callback(null, {
        users: result.users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.createdAt.getTime()
        })),
        total: result.total
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error'
      } as grpc.ServiceError);
    }
  };

  /**
   * Update user
   */
  updateUser = async (
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { id, name, email } = call.request;
      const user = await this.service.updateUser(id, name, email);

      if (!user) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: `User with id ${id} not found`
        } as grpc.ServiceError);
        return;
      }

      callback(null, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.createdAt.getTime()
        }
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error'
      } as grpc.ServiceError);
    }
  };

  /**
   * Delete user
   */
  deleteUser = async (
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> => {
    try {
      const { id } = call.request;
      const success = await this.service.deleteUser(id);

      callback(null, { success });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal error'
      } as grpc.ServiceError);
    }
  };
}

