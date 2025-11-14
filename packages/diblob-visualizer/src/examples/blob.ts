import { createBlob } from '@speajus/diblob';

// Service interfaces used by the sample container

export interface Logger {
  log(message: string): void;
}

export interface Database {
  query(sql: string): unknown[];
}

export interface Cache {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}

export type User = { id: number; name: string; email: string };

export interface UserService {
  getUser(id: number): User;
}

export interface EmailService {
  sendEmail(to: string, subject: string): void;
}

export interface NotificationService {
  notify(userId: number, message: string): void;
}

export interface MetricsService {
  track(event: string): void;
}

// Lazy blob creation - only create when first accessed

export const logger = createBlob<Logger>('logger');
export const database = createBlob<Database>('database');
export const cache = createBlob<Cache>('cache');
export const userService = createBlob<UserService>('userService');
export const emailService = createBlob<EmailService>('emailService');
export const notificationService = createBlob<NotificationService>('notificationService');
export const metrics = createBlob<MetricsService>('metrics');

