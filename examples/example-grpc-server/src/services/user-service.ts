/**
 * User service implementation
 * 
 * This service demonstrates dependency injection with diblob,
 * using the database client from diblob-drizzle.
 */

import { createBlob } from '@speajus/diblob';
import { databaseClient, type DatabaseClient } from '@speajus/diblob-drizzle';
import { eq } from 'drizzle-orm';
import { users, type User, type NewUser } from '../db/schema.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

/**
 * User service interface
 */
export interface UserService {
  fetchUser(id: number): Promise<User | null>;
  createUser(name: string, email: string): Promise<User>;
  listUsers(limit?: number, offset?: number): Promise<{ users: User[]; total: number }>;
  updateUser(id: number, name: string, email: string): Promise<User | null>;
  deleteUser(id: number): Promise<boolean>;
}

/**
 * User service implementation
 */
export class UserServiceImpl implements UserService {
  constructor(
    private db: DatabaseClient<BetterSQLite3Database> = databaseClient
  ) {}

  async fetchUser(id: number): Promise<User | null> {
    const db = this.db.getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async createUser(name: string, email: string): Promise<User> {
    const db = this.db.getDb();
    const newUser: NewUser = {
      name,
      email,
      createdAt: new Date()
    };
    
    const [user] = await db.insert(users).values(newUser).returning();
    return user;
  }

  async listUsers(limit: number = 10, offset: number = 0): Promise<{ users: User[]; total: number }> {
    const db = this.db.getDb();
    
    const userList = await db.select().from(users).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: users.id }).from(users);
    
    return {
      users: userList,
      total: count
    };
  }

  async updateUser(id: number, name: string, email: string): Promise<User | null> {
    const db = this.db.getDb();
    
    const [user] = await db
      .update(users)
      .set({ name, email })
      .where(eq(users.id, id))
      .returning();
    
    return user || null;
  }

  async deleteUser(id: number): Promise<boolean> {
    const db = this.db.getDb();
    
    const result = await db.delete(users).where(eq(users.id, id));
    return result.changes > 0;
  }
}

// Create blob for the user service
export const userService = createBlob<UserService>('userService', {
  name: 'User Service',
  description: 'Service for managing users'
});

