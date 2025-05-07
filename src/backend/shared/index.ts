/**
 * @austa/shared
 * 
 * This is the main barrel file for the @austa/shared package that provides a clean,
 * standardized entry point for all shared utilities. It re-exports all modules from
 * their respective paths, enabling consistent imports across microservices.
 * 
 * Usage examples:
 * 
 * ```typescript
 * // Import specific modules
 * import { Logger } from '@austa/shared/logging';
 * import { PrismaService } from '@austa/shared/database';
 * import { KafkaProducer } from '@austa/shared/kafka';
 * 
 * // Or import from the main package
 * import { Logger, PrismaService, KafkaProducer } from '@austa/shared';
 * ```
 *
 * @packageDocumentation
 */

// Re-export all modules from their respective paths

/**
 * Logging module provides standardized logging utilities with structured logging,
 * correlation IDs, and journey context for better observability.
 * 
 * Features:
 * - Structured logging with JSON format
 * - Correlation ID tracking across service boundaries
 * - Journey-specific context for better debugging
 * - Configurable log levels based on environment
 * - Integration with monitoring systems
 */
export * from './logging';

/**
 * Exceptions module provides a comprehensive error framework with journey-specific
 * error classification, standardized error responses, and error propagation.
 * 
 * Features:
 * - Journey-specific error classification (Health, Care, Plan)
 * - Standardized error responses with error codes and messages
 * - Error serialization for cross-service error propagation
 * - Integration with monitoring for error tracking
 * - Client-friendly error messages with context
 */
export * from './exceptions';

/**
 * Kafka module provides utilities for event streaming with type-safe event schemas,
 * reliable processing, and standardized event handling patterns.
 * 
 * Features:
 * - Type-safe event schemas with validation
 * - Reliable event processing with retries
 * - Dead letter queues for failed events
 * - Event versioning for backward compatibility
 * - Journey-specific event routing
 */
export * from './kafka';

/**
 * Redis module provides caching utilities, distributed locks, and pub/sub mechanisms
 * for efficient data access and real-time communication.
 * 
 * Features:
 * - Caching with automatic invalidation
 * - Distributed locks for concurrent operations
 * - Pub/sub for real-time communication
 * - Rate limiting implementation
 * - Session storage for authentication
 */
export * from './redis';

/**
 * Tracing module provides distributed tracing utilities for request tracking across
 * services, performance monitoring, and debugging.
 * 
 * Features:
 * - Distributed tracing with OpenTelemetry
 * - Request context propagation
 * - Performance monitoring for critical paths
 * - Integration with monitoring systems
 * - Correlation with logs for better debugging
 */
export * from './tracing';

/**
 * Database module provides enhanced Prisma service with connection pooling, transaction
 * management, and journey-specific database contexts.
 * 
 * Features:
 * - Connection pooling and optimization
 * - Transaction management across services
 * - Journey-specific database contexts
 * - Error handling and retry logic
 * - Query performance monitoring
 */
export * from './database';

/**
 * Utils module provides general utility functions for HTTP requests, error handling,
 * and other common operations used across services.
 * 
 * Features:
 * - Secure HTTP client with SSRF protection
 * - Error handling utilities with retry logic
 * - Circuit breaker implementation
 * - Request context propagation
 * - Journey-specific utilities
 */
export * from './utils';

/**
 * Prisma module provides database utilities for schema management, migrations,
 * and seeding with standardized patterns across all journeys.
 * 
 * Features:
 * - Schema management practices
 * - Migration workflows
 * - Seeding procedures
 * - Transaction management
 * - Environment-specific configurations
 */
export * from './prisma';

// Define module interfaces for better type safety

/**
 * Interface for the logging module
 */
export interface LoggingModule {
  Logger: any;
  createLogger: (options: any) => any;
  LogLevel: any;
}

/**
 * Interface for the exceptions module
 */
export interface ExceptionsModule {
  BaseException: any;
  JourneyException: any;
  ErrorCategory: any;
  createError: (options: any) => any;
}

/**
 * Interface for the kafka module
 */
export interface KafkaModule {
  KafkaProducer: any;
  KafkaConsumer: any;
  EventSchema: any;
  createProducer: (options: any) => any;
  createConsumer: (options: any) => any;
}

/**
 * Interface for the redis module
 */
export interface RedisModule {
  RedisClient: any;
  createClient: (options: any) => any;
  CacheManager: any;
  DistributedLock: any;
}

/**
 * Interface for the tracing module
 */
export interface TracingModule {
  Tracer: any;
  createTracer: (options: any) => any;
  SpanKind: any;
  TraceContext: any;
}

/**
 * Interface for the database module
 */
export interface DatabaseModule {
  PrismaService: any;
  createPrismaService: (options: any) => any;
  TransactionManager: any;
}

/**
 * Interface for the utils module
 */
export interface UtilsModule {
  HttpClient: any;
  ErrorHandler: any;
  CircuitBreaker: any;
}

/**
 * Interface for the prisma module
 */
export interface PrismaModule {
  SchemaManager: any;
  MigrationManager: any;
  SeedManager: any;
}

// Export default object for CommonJS compatibility
const sharedModules = {
  logging: {} as LoggingModule,
  exceptions: {} as ExceptionsModule,
  kafka: {} as KafkaModule,
  redis: {} as RedisModule,
  tracing: {} as TracingModule,
  database: {} as DatabaseModule,
  utils: {} as UtilsModule,
  prisma: {} as PrismaModule,
};

// Dynamically load modules if they exist
try { Object.assign(sharedModules.logging, require('./logging')); } catch (e) { /* Module not yet implemented */ }
try { Object.assign(sharedModules.exceptions, require('./exceptions')); } catch (e) { /* Module not yet implemented */ }
try { Object.assign(sharedModules.kafka, require('./kafka')); } catch (e) { /* Module not yet implemented */ }
try { Object.assign(sharedModules.redis, require('./redis')); } catch (e) { /* Module not yet implemented */ }
try { Object.assign(sharedModules.tracing, require('./tracing')); } catch (e) { /* Module not yet implemented */ }
try { Object.assign(sharedModules.database, require('./database')); } catch (e) { /* Module not yet implemented */ }
try { Object.assign(sharedModules.utils, require('./utils')); } catch (e) { /* Module not yet implemented */ }
try { Object.assign(sharedModules.prisma, require('./prisma')); } catch (e) { /* Module not yet implemented */ }

export default sharedModules;