/**
 * Sample DI container setup for demonstration purposes
 */

import { createContainer, Lifecycle } from '@speajus/diblob';
import {
	  type Cache,
	  type Database,
	  type EmailService,
	  type Logger,
	  type MetricsService,
	  type NotificationService,
	  type User,
	  type UserService,
	  cache,
	  database,
	  emailService,
	  logger,
	  metrics,
	  notificationService,
	  userService,
} from './blob.js';

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
    return this.database.query(`SELECT * FROM users WHERE id = ${id}`)[0] as User;
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

/**
 * Create a sample container with multiple services
 */
export function createSampleContainer() {
	  // Create container and register
	  const container = createContainer();

	  container.register(logger, ConsoleLogger);
	  container.register(database, InMemoryDatabase);
	  container.register(cache, MemoryCache, { lifecycle: Lifecycle.Transient });
	  container.register(userService, UserServiceImpl, logger, database, cache);
	  container.register(emailService, EmailServiceImpl, logger);
	  container.register(
	    notificationService,
	    NotificationServiceImpl,
	    userService,
	    emailService,
	    logger,
	  );

	  return container;
}

/**
 * Add metrics service to an existing container
 */
export function addMetricsService(container: ReturnType<typeof createContainer>) {
	  container.register(metrics, MetricsServiceImpl, logger);
}

export function getLoggerBlob() {
	  return logger;
}

/**
 * Get the logger implementation for re-registration demos
 */
export function getLoggerImpl() {
	  return ConsoleLogger;
}
