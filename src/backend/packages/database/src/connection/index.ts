/**
 * @file Connection Module Barrel Export
 * @description Exports all database connection-related components, providing a clean, organized API
 * for other modules to import connection management utilities without needing to know the internal
 * file structure.
 */

// Export configuration interfaces and utilities first to prevent circular dependencies
export {
  ConnectionConfig,
  ConnectionConfigOptions,
  ConnectionEnvironmentConfig,
  ConnectionTimeoutConfig,
  ConnectionPoolConfig,
  ConnectionRetryConfig,
  ConnectionHealthConfig,
  createConnectionConfig,
  mergeConnectionConfigs,
  validateConnectionConfig,
  getEnvironmentSpecificConfig,
} from './connection-config';

// Export retry-related components
export {
  ConnectionRetry,
  RetryOptions,
  RetryResult,
  RetryStatus,
  RetryStrategy,
  createRetryStrategy,
} from './connection-retry';

// Export health-related components
export {
  ConnectionHealth,
  HealthCheckOptions,
  HealthCheckResult,
  HealthStatus,
  ConnectionMetrics,
  createHealthCheck,
} from './connection-health';

// Export pool-related components
export {
  ConnectionPool,
  PoolOptions,
  PoolStatus,
  PoolMetrics,
  ConnectionAcquisitionOptions,
  createConnectionPool,
} from './connection-pool';

// Export the main connection manager as the primary entry point
export {
  ConnectionManager,
  ConnectionOptions,
  ConnectionType,
  ConnectionStatus,
  createConnection,
  getConnection,
  releaseConnection,
  closeAllConnections,
} from './connection-manager';

/**
 * @module ConnectionModule
 * @description
 * This module provides a comprehensive set of utilities for managing database connections
 * in a NestJS application. It includes connection configuration, pooling, health monitoring,
 * retry strategies, and centralized connection management.
 * 
 * The module is designed to work with various database technologies including PostgreSQL,
 * Redis, and TimescaleDB, providing consistent connection management patterns across all
 * journey services.
 * 
 * Example usage:
 * ```typescript
 * import { ConnectionManager, ConnectionOptions } from '@austa/database/connection';
 * 
 * // Create a connection manager with journey-specific options
 * const options: ConnectionOptions = {
 *   journeyContext: 'health',
 *   poolSize: 10,
 *   timeout: 5000,
 *   retryAttempts: 3
 * };
 * 
 * const connectionManager = new ConnectionManager(options);
 * const connection = await connectionManager.getConnection();
 * 
 * try {
 *   // Use the connection
 *   const result = await connection.query('SELECT * FROM health_metrics');
 *   return result;
 * } finally {
 *   // Always release the connection back to the pool
 *   await connectionManager.releaseConnection(connection);
 * }
 * ```
 */