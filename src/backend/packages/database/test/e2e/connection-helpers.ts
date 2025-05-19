/**
 * Helper utilities for database connection management e2e tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import {
  ConnectionManager,
  ConnectionPool,
  ConnectionHealth,
  ConnectionRetry,
  ConnectionConfig,
} from '../../src/connection';

/**
 * Configuration options for test module
 */
export interface TestModuleConfig {
  databaseUrl: string;
  connectionPool?: {
    min?: number;
    max?: number;
    idle?: number;
    acquireTimeout?: number;
    drainTimeout?: number;
  };
  healthCheck?: {
    enabled?: boolean;
    interval?: number;
    timeout?: number;
  };
  retry?: {
    attempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    jitter?: boolean;
    circuitBreaker?: {
      enabled?: boolean;
      failureThreshold?: number;
      resetTimeout?: number;
    };
  };
}

/**
 * Creates a test module with database connection management components
 * 
 * @param config - Configuration for the test module
 * @returns A TestingModule with connection management components
 */
export async function createTestModule(config: TestModuleConfig): Promise<TestingModule> {
  @Module({
    providers: [
      {
        provide: ConnectionConfig,
        useFactory: () => {
          return new ConnectionConfig({
            database: {
              url: config.databaseUrl,
            },
            connectionPool: {
              min: config.connectionPool?.min ?? 2,
              max: config.connectionPool?.max ?? 10,
              idle: config.connectionPool?.idle ?? 5000,
              acquireTimeout: config.connectionPool?.acquireTimeout ?? 5000,
              drainTimeout: config.connectionPool?.drainTimeout ?? 5000,
            },
            healthCheck: {
              enabled: config.healthCheck?.enabled ?? true,
              interval: config.healthCheck?.interval ?? 10000,
              timeout: config.healthCheck?.timeout ?? 1000,
            },
            retry: {
              attempts: config.retry?.attempts ?? 3,
              initialDelay: config.retry?.initialDelay ?? 100,
              maxDelay: config.retry?.maxDelay ?? 1000,
              factor: config.retry?.factor ?? 2,
              jitter: config.retry?.jitter ?? true,
              circuitBreaker: {
                enabled: config.retry?.circuitBreaker?.enabled ?? true,
                failureThreshold: config.retry?.circuitBreaker?.failureThreshold ?? 5,
                resetTimeout: config.retry?.circuitBreaker?.resetTimeout ?? 30000,
              },
            },
          });
        },
      },
      ConnectionPool,
      ConnectionHealth,
      ConnectionRetry,
      ConnectionManager,
    ],
    exports: [
      ConnectionConfig,
      ConnectionPool,
      ConnectionHealth,
      ConnectionRetry,
      ConnectionManager,
    ],
  })
  class TestModule {}

  return Test.createTestingModule({
    imports: [TestModule],
  }).compile();
}

/**
 * Gets connection pool metrics
 * 
 * @param connectionPool - The ConnectionPool instance
 * @returns Metrics about the connection pool state
 */
export async function getConnectionMetrics(connectionPool: ConnectionPool): Promise<{
  total: number;
  active: number;
  idle: number;
  pending: number;
}> {
  return connectionPool.getMetrics();
}

/**
 * Simulates a network failure by temporarily disabling database connectivity
 * 
 * This is implementation-specific and may need to be adjusted based on the actual
 * implementation of the connection management system.
 */
export async function simulateNetworkFailure(): Promise<void> {
  // This is a mock implementation that sets a global flag
  // The actual implementation would depend on how connections are established
  (global as any).__SIMULATE_DB_NETWORK_FAILURE__ = true;
  
  // Hook into the PrismaClient constructor to simulate connection failures
  const originalPrismaClient = (global as any).__ORIGINAL_PRISMA_CLIENT__ || PrismaClient;
  
  if (!(global as any).__ORIGINAL_PRISMA_CLIENT__) {
    (global as any).__ORIGINAL_PRISMA_CLIENT__ = PrismaClient;
  }
  
  // Override PrismaClient to simulate connection failures
  (global as any).PrismaClient = function MockPrismaClient(...args: any[]) {
    const client = new originalPrismaClient(...args);
    
    // Override $connect to simulate failure
    const originalConnect = client.$connect.bind(client);
    client.$connect = async () => {
      if ((global as any).__SIMULATE_DB_NETWORK_FAILURE__) {
        throw new Error('ETIMEDOUT: Connection timed out');
      }
      return originalConnect();
    };
    
    // Override $queryRaw to simulate failure
    const originalQueryRaw = client.$queryRaw.bind(client);
    client.$queryRaw = async (...queryArgs: any[]) => {
      if ((global as any).__SIMULATE_DB_NETWORK_FAILURE__) {
        throw new Error('ETIMEDOUT: Connection timed out');
      }
      return originalQueryRaw(...queryArgs);
    };
    
    return client;
  };
}

/**
 * Restores network connection after simulating a failure
 */
export async function restoreNetworkConnection(): Promise<void> {
  // Reset the global flag
  (global as any).__SIMULATE_DB_NETWORK_FAILURE__ = false;
  
  // Restore original PrismaClient if it was overridden
  if ((global as any).__ORIGINAL_PRISMA_CLIENT__) {
    (global as any).PrismaClient = (global as any).__ORIGINAL_PRISMA_CLIENT__;
  }
}