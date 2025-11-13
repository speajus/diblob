/**
 * Sample DI container setup for demonstration purposes
 */

import { createBlob, createContainer, Lifecycle } from '@speajus/diblob';

// Define interfaces
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

export interface UserService {
  getUser(id: number): { id: number; name: string; email: string };
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

// Implementations
export class ConsoleLogger implements Logger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

export class InMemoryDatabase implements Database {
  query(_sql: string) {
    return [];
  }
}

export class MemoryCache implements Cache {
  private data = new Map();
  get(key: string) { return this.data.get(key); }
  set(key: string, value: unknown) { this.data.set(key, value); }
}

export class UserServiceImpl implements UserService {
  constructor(private logger: Logger, private database: Database, _cache: Cache) {}
  getUser(id: number) {
    this.logger.log(`Getting user ${id}`);
    return this.database.query(`SELECT * FROM users WHERE id = ${id}`)[0];
  }
}

export class EmailServiceImpl implements EmailService {
  constructor(private logger: Logger) {}
  sendEmail(to: string, subject: string) {
    this.logger.log(`Sending email to ${to}: ${subject}`);
  }
}

export class NotificationServiceImpl implements NotificationService {
  constructor(
    private userService: UserService,
    private emailService: EmailService,
    private logger: Logger
  ) {}
  notify(userId: number, message: string) {
    this.logger.log(`Notifying user ${userId}: ${message}`);
    const user = this.userService.getUser(userId);
    this.emailService.sendEmail(user?.email || 'unknown', message);
  }
}

export class MetricsServiceImpl implements MetricsService {
  constructor(private logger: Logger) {}
  track(event: string) {
    this.logger.log(`Tracking: ${event}`);
  }
}

// Lazy blob creation - only create when first accessed

function getBlobs() {
  return {
    logger: createBlob<Logger>('logger'),
    database: createBlob<Database>('database'),
    cache: createBlob<Cache>('cache'),
    userService: createBlob<UserService>('userService'),
    emailService: createBlob<EmailService>('emailService'),
    notificationService: createBlob<NotificationService>('notificationService'),
    metrics: createBlob<MetricsService>('metrics')
  };
}

/**
 * Create a sample container with multiple services
 */
export function createSampleContainer() {
  const blobs = getBlobs();

  // Create container and register
  const container = createContainer();

  container.register(blobs.logger, ConsoleLogger);
  container.register(blobs.database, InMemoryDatabase);
  container.register(blobs.cache, MemoryCache, { lifecycle: Lifecycle.Transient });
  container.register(blobs.userService, UserServiceImpl, blobs.logger, blobs.database, blobs.cache);
  container.register(blobs.emailService, EmailServiceImpl, blobs.logger);
  container.register(blobs.notificationService, NotificationServiceImpl, blobs.userService, blobs.emailService, blobs.logger);

  return container;
}

/**
 * Add metrics service to an existing container
 */
export function addMetricsService(container: ReturnType<typeof createContainer>) {
  const blobs = getBlobs();
  container.register(blobs.metrics, MetricsServiceImpl, blobs.logger);
}

/**
 * Get the logger blob for re-registration demos
 */
export function getLoggerBlob() {
  return getBlobs().logger;
}

/**
 * Get the logger implementation for re-registration demos
 */
export function getLoggerImpl() {
  return ConsoleLogger;
}

