/**
 * Type-safe User Service implementation for Connect-ES
 *
 * This implements RPC handlers using generated TypeScript types, delegating
 * to the UserService which is injected via diblob.
 */

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
		} from '../generated/user_pb.js';
import { userService, type UserService } from '../services/user-service.js';

/**
 * Type-safe User Service implementation for Connect.
 */
export class UserGrpcServiceTyped {
  constructor(private service: UserService = userService) {}

		  /**
		   * Get user by ID
		   */
		  async getUser(request: GetUserRequest): Promise<any> {
    const { id } = request;
    const user = await this.service.fetchUser(id);

    if (!user) {
      // Connect will map thrown errors to error responses. For simplicity we
      // throw a generic error here; you can add richer status mapping later.
      throw new Error(`User with id ${id} not found`);
    }

		    return {
		      user: {
		        id: user.id,
		        name: user.name,
		        email: user.email,
		        createdAt: BigInt(user.createdAt.getTime()),
		      },
		    };
  }

		  /**
		   * Create a new user
		   */
		  async createUser(request: CreateUserRequest): Promise<any> {
    const { name, email } = request;
    const user = await this.service.createUser(name, email);

	    return {
	      user: {
	        id: user.id,
	        name: user.name,
	        email: user.email,
	        createdAt: BigInt(user.createdAt.getTime()),
	      },
	    };
  }

		  /**
		   * List users with pagination
		   */
		  async listUsers(request: ListUsersRequest): Promise<any> {
    const { limit = 10, offset = 0 } = request;
    const result = await this.service.listUsers(limit, offset);

		    return {
		      users: result.users.map((user) => ({
		        id: user.id,
		        name: user.name,
		        email: user.email,
		        createdAt: BigInt(user.createdAt.getTime()),
		      })),
		      total: result.total,
		    };
  }

		  /**
		   * Update user
		   */
		  async updateUser(request: UpdateUserRequest): Promise<any> {
    const { id, name, email } = request;
    const user = await this.service.updateUser(id, name, email);

    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

	    return {
	      user: {
	        id: user.id,
	        name: user.name,
	        email: user.email,
	        createdAt: BigInt(user.createdAt.getTime()),
	      },
	    };
  }

		  /**
		   * Delete user
		   */
		  async deleteUser(request: DeleteUserRequest): Promise<any> {
    const { id } = request;
	    const success = await this.service.deleteUser(id);
	
	    return { success };
  }
}
