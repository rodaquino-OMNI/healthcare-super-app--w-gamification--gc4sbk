/**
 * @file Database Connection Module
 * 
 * This module provides a comprehensive set of utilities for managing database connections
 * across the AUSTA SuperApp microservices architecture. It includes connection pooling,
 * health monitoring, retry mechanisms, and configuration interfaces.
 * 
 * The connection module is designed to work with PostgreSQL via Prisma ORM and provides
 * journey-specific optimizations for different microservices.
 */

// Configuration
export * from './connection-config';

// Core connection management
export { ConnectionManager } from './connection-manager';
export { ConnectionPool } from './connection-pool';

// Health and monitoring
export { ConnectionHealth } from './connection-health';

// Retry and resilience
export { ConnectionRetry } from './connection-retry';

/**
 * Re-export specific types to prevent circular dependencies
 * and provide a clean public API for consumers
 */

// Connection configuration types
export type {
  ConnectionConfig,
  ConnectionPoolConfig,
  ConnectionRetryConfig,
  ConnectionHealthConfig,
  DatabaseCredentials,
  EnvironmentConfig,
} from './connection-config';

// Connection manager types
export type {
  ConnectionOptions,
  ConnectionContext,
  JourneyConnectionContext,
} from './connection-manager';

// Connection pool types
export type {
  PooledConnection,
  ConnectionStats,
} from './connection-pool';

// Health monitoring types
export type {
  HealthStatus,
  HealthCheckResult,
  ConnectionMetrics,
} from './connection-health';

// Retry strategy types
export type {
  RetryStrategy,
  RetryOptions,
  RetryResult,
  BackoffStrategy,
} from './connection-retry';