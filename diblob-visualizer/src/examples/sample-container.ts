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
  getUser(id: number): unknown;
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
  constructor(private logger: Logger, private database: Database, private cache: Cache) {}
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
    this.emailService.sendEmail((user as any)?.email || 'unknown', message);
  }
}

export class MetricsServiceImpl implements MetricsService {
  constructor(private logger: Logger) {}
  track(event: string) {
    this.logger.log(`Tracking: ${event}`);
  }
}

// Lazy blob creation - only create when first accessed
let _logger: ReturnType<typeof createBlob<Logger>> | null = null;
let _database: ReturnType<typeof createBlob<Database>> | null = null;
let _cache: ReturnType<typeof createBlob<Cache>> | null = null;
let _userService: ReturnType<typeof createBlob<UserService>> | null = null;
let _emailService: ReturnType<typeof createBlob<EmailService>> | null = null;
let _notificationService: ReturnType<typeof createBlob<NotificationService>> | null = null;
let _metrics: ReturnType<typeof createBlob<MetricsService>> | null = null;

function getBlobs() {
  if (!_logger) {
    _logger = createBlob<Logger>('logger');
    _database = createBlob<Database>('database');
    _cache = createBlob<Cache>('cache');
    _userService = createBlob<UserService>('userService');
    _emailService = createBlob<EmailService>('emailService');
    _notificationService = createBlob<NotificationService>('notificationService');
    _metrics = createBlob<MetricsService>('metrics');
  }
  return {
    logger: _logger,
    database: _database!,
    cache: _cache!,
    userService: _userService!,
    emailService: _emailService!,
    notificationService: _notificationService!,
    metrics: _metrics!
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

