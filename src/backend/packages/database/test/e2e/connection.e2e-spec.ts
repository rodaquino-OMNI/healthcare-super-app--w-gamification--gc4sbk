import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { setTimeout as sleep } from 'timers/promises';

// Import connection management classes
import {
  ConnectionManager,
  ConnectionPool,
  ConnectionHealth,
  ConnectionRetry,
  ConnectionConfig,
  DatabaseConnectionError,
  ConnectionTimeoutError,
  ConnectionPoolFullError,
  CircuitBreakerOpenError,
} from '../../src/connection';

// Import test utilities
import { setupTestDatabase, teardownTestDatabase, getTestDatabaseUrl } from '../utils/database-test.utils';
import { createTestModule, getConnectionMetrics, simulateNetworkFailure, restoreNetworkConnection } from './connection-helpers';

/**
 * End-to-end tests for database connection management functionality.
 * Tests connection pooling, health monitoring, retry mechanisms, and lifecycle management
 * against a real PostgreSQL database.
 */
describe('Database Connection Management (e2e)', () => {
  let app: INestApplication;
  let connectionManager: ConnectionManager;
  let connectionPool: ConnectionPool;
  let connectionHealth: ConnectionHealth;
  let connectionRetry: ConnectionRetry;
  let testDbUrl: string;
  
  // Setup test database before all tests
  beforeAll(async () => {
    // Set up a test database with unique identifier
    testDbUrl = await setupTestDatabase('connection-e2e-tests');
    
    // Create test module with real database connection
    const moduleFixture: TestingModule = await createTestModule({
      databaseUrl: testDbUrl,
      // Configure connection pool for testing
      connectionPool: {
        min: 2,
        max: 10,
        idle: 5000,
      },
      // Configure health checks for testing
      healthCheck: {
        enabled: true,
        interval: 1000,
        timeout: 500,
      },
      // Configure retry strategy for testing
      retry: {
        attempts: 3,
        initialDelay: 100,
        maxDelay: 1000,
        factor: 2,
        jitter: true,
      },
    });

    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Get connection management instances
    connectionManager = moduleFixture.get<ConnectionManager>(ConnectionManager);
    connectionPool = moduleFixture.get<ConnectionPool>(ConnectionPool);
    connectionHealth = moduleFixture.get<ConnectionHealth>(ConnectionHealth);
    connectionRetry = moduleFixture.get<ConnectionRetry>(ConnectionRetry);
  });
  
  // Clean up after all tests
  afterAll(async () => {
    await app?.close();
    await teardownTestDatabase('connection-e2e-tests');
  });
  
  // Reset connection pool between tests
  afterEach(async () => {
    // Restore network connection if it was simulated to be down
    await restoreNetworkConnection();
    
    // Reset connection pool to clean state
    await connectionPool.drain();
    await connectionPool.initialize();
    
    // Reset circuit breaker state
    await connectionRetry.resetCircuitBreaker();
  });

  /**
   * Tests for basic connection establishment and release
   */
  describe('Basic Connection Management', () => {
    it('should establish a connection to the database', async () => {
      // Get a connection from the pool
      const connection = await connectionManager.getConnection();
      
      // Verify connection is valid
      expect(connection).toBeDefined();
      expect(connection.provider).toBeDefined();
      
      // Execute a simple query to verify connection works
      const result = await connection.provider.$queryRaw`SELECT 1 as test`;
      expect(result).toEqual([{ test: 1 }]);
      
      // Release the connection back to the pool
      await connectionManager.releaseConnection(connection);
    });
    
    it('should release connections back to the pool', async () => {
      // Get initial pool metrics
      const initialMetrics = await getConnectionMetrics(connectionPool);
      
      // Get a connection from the pool
      const connection = await connectionManager.getConnection();
      
      // Verify active connections increased
      const activeMetrics = await getConnectionMetrics(connectionPool);
      expect(activeMetrics.active).toBe(initialMetrics.active + 1);
      
      // Release the connection
      await connectionManager.releaseConnection(connection);
      
      // Verify active connections decreased
      const finalMetrics = await getConnectionMetrics(connectionPool);
      expect(finalMetrics.active).toBe(initialMetrics.active);
    });
    
    it('should handle connection timeout', async () => {
      // Configure a very short timeout for this test
      const originalTimeout = connectionPool.getConfig().acquireTimeout;
      connectionPool.updateConfig({ acquireTimeout: 50 });
      
      // Acquire all available connections to force timeout
      const connections = [];
      for (let i = 0; i < connectionPool.getConfig().max; i++) {
        try {
          connections.push(await connectionManager.getConnection());
        } catch (error) {
          // Ignore errors, we just want to fill the pool
        }
      }
      
      // Try to get one more connection, which should timeout
      await expect(connectionManager.getConnection())
        .rejects
        .toThrow(ConnectionTimeoutError);
      
      // Release all connections
      for (const conn of connections) {
        await connectionManager.releaseConnection(conn);
      }
      
      // Restore original timeout
      connectionPool.updateConfig({ acquireTimeout: originalTimeout });
    });
  });

  /**
   * Tests for connection pooling under load
   */
  describe('Connection Pooling', () => {
    it('should reuse connections from the pool', async () => {
      // Get initial pool metrics
      const initialMetrics = await getConnectionMetrics(connectionPool);
      
      // Get and release a connection multiple times
      for (let i = 0; i < 5; i++) {
        const connection = await connectionManager.getConnection();
        await connectionManager.releaseConnection(connection);
      }
      
      // Verify total connections didn't increase by 5
      const finalMetrics = await getConnectionMetrics(connectionPool);
      expect(finalMetrics.total).toBeLessThan(initialMetrics.total + 5);
      expect(finalMetrics.total).toBeGreaterThanOrEqual(initialMetrics.total);
    });
    
    it('should create new connections up to max pool size', async () => {
      // Get initial pool metrics
      const initialMetrics = await getConnectionMetrics(connectionPool);
      
      // Get connections up to max pool size
      const connections = [];
      const maxConnections = connectionPool.getConfig().max;
      
      for (let i = 0; i < maxConnections; i++) {
        connections.push(await connectionManager.getConnection());
      }
      
      // Verify pool metrics
      const activeMetrics = await getConnectionMetrics(connectionPool);
      expect(activeMetrics.active).toBe(maxConnections);
      expect(activeMetrics.idle).toBe(0);
      
      // Release all connections
      for (const conn of connections) {
        await connectionManager.releaseConnection(conn);
      }
      
      // Verify all connections are now idle
      const finalMetrics = await getConnectionMetrics(connectionPool);
      expect(finalMetrics.active).toBe(0);
      expect(finalMetrics.idle).toBe(maxConnections);
    });
    
    it('should handle concurrent connection requests efficiently', async () => {
      // Request multiple connections concurrently
      const concurrentRequests = 5;
      const connectionPromises = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        connectionPromises.push(connectionManager.getConnection());
      }
      
      // Wait for all connections to be established
      const connections = await Promise.all(connectionPromises);
      
      // Verify all connections are valid
      for (const connection of connections) {
        expect(connection).toBeDefined();
        expect(connection.provider).toBeDefined();
      }
      
      // Release all connections
      await Promise.all(connections.map(conn => connectionManager.releaseConnection(conn)));
    });
    
    it('should clean up idle connections', async () => {
      // Get initial pool metrics
      const initialMetrics = await getConnectionMetrics(connectionPool);
      
      // Get and release multiple connections to create idle connections
      const connections = [];
      for (let i = 0; i < 5; i++) {
        connections.push(await connectionManager.getConnection());
      }
      
      // Release all connections
      for (const conn of connections) {
        await connectionManager.releaseConnection(conn);
      }
      
      // Verify idle connections increased
      const idleMetrics = await getConnectionMetrics(connectionPool);
      expect(idleMetrics.idle).toBeGreaterThan(initialMetrics.idle);
      
      // Force idle connection cleanup with short idle timeout
      const originalIdleTimeout = connectionPool.getConfig().idle;
      connectionPool.updateConfig({ idle: 100 });
      
      // Wait for idle connections to be cleaned up
      await sleep(200);
      
      // Verify idle connections decreased
      const finalMetrics = await getConnectionMetrics(connectionPool);
      expect(finalMetrics.idle).toBeLessThan(idleMetrics.idle);
      
      // Restore original idle timeout
      connectionPool.updateConfig({ idle: originalIdleTimeout });
    });
  });

  /**
   * Tests for connection health monitoring
   */
  describe('Connection Health Monitoring', () => {
    it('should detect and report healthy connections', async () => {
      // Get a connection from the pool
      const connection = await connectionManager.getConnection();
      
      // Check connection health
      const health = await connectionHealth.checkConnectionHealth(connection);
      
      // Verify connection is healthy
      expect(health.isHealthy).toBe(true);
      expect(health.responseTime).toBeDefined();
      expect(health.responseTime).toBeGreaterThan(0);
      
      // Release the connection
      await connectionManager.releaseConnection(connection);
    });
    
    it('should detect unhealthy connections', async () => {
      // Get a connection from the pool
      const connection = await connectionManager.getConnection();
      
      // Simulate connection becoming unhealthy by closing the underlying connection
      await connection.provider.$disconnect();
      
      // Check connection health
      const health = await connectionHealth.checkConnectionHealth(connection);
      
      // Verify connection is unhealthy
      expect(health.isHealthy).toBe(false);
      
      // Release the connection (should be removed from pool due to being unhealthy)
      await connectionManager.releaseConnection(connection);
    });
    
    it('should remove unhealthy connections from the pool', async () => {
      // Get initial pool metrics
      const initialMetrics = await getConnectionMetrics(connectionPool);
      
      // Get a connection from the pool
      const connection = await connectionManager.getConnection();
      
      // Simulate connection becoming unhealthy
      await connection.provider.$disconnect();
      
      // Release the connection (should be removed from pool)
      await connectionManager.releaseConnection(connection);
      
      // Verify total connections decreased
      const finalMetrics = await getConnectionMetrics(connectionPool);
      expect(finalMetrics.total).toBeLessThan(initialMetrics.total + 1);
    });
    
    it('should perform periodic health checks on idle connections', async () => {
      // Configure a short health check interval for this test
      const originalInterval = connectionHealth.getConfig().interval;
      connectionHealth.updateConfig({ interval: 200 });
      
      // Get and release multiple connections to create idle connections
      const connections = [];
      for (let i = 0; i < 3; i++) {
        connections.push(await connectionManager.getConnection());
      }
      
      // Release all connections
      for (const conn of connections) {
        await connectionManager.releaseConnection(conn);
      }
      
      // Get metrics after creating idle connections
      const idleMetrics = await getConnectionMetrics(connectionPool);
      
      // Simulate one connection becoming unhealthy
      // This is implementation-specific and may need to be adjusted
      const poolConnections = await connectionPool.getIdleConnections();
      if (poolConnections.length > 0) {
        await poolConnections[0].provider.$disconnect();
      }
      
      // Wait for health check to run
      await sleep(300);
      
      // Verify unhealthy connection was removed
      const finalMetrics = await getConnectionMetrics(connectionPool);
      expect(finalMetrics.idle).toBeLessThan(idleMetrics.idle);
      
      // Restore original health check interval
      connectionHealth.updateConfig({ interval: originalInterval });
    });
  });

  /**
   * Tests for retry mechanisms and circuit breaker
   */
  describe('Retry Mechanisms and Circuit Breaker', () => {
    it('should retry failed connection attempts', async () => {
      // Simulate network failure
      await simulateNetworkFailure();
      
      // Spy on retry method
      const retrySpy = jest.spyOn(connectionRetry, 'executeWithRetry');
      
      // Restore network after delay to allow retry to succeed
      setTimeout(async () => {
        await restoreNetworkConnection();
      }, 300);
      
      // Attempt to get a connection (should retry and eventually succeed)
      const connection = await connectionManager.getConnection();
      
      // Verify connection is valid
      expect(connection).toBeDefined();
      expect(connection.provider).toBeDefined();
      
      // Verify retry was called
      expect(retrySpy).toHaveBeenCalled();
      
      // Release the connection
      await connectionManager.releaseConnection(connection);
      
      // Restore spy
      retrySpy.mockRestore();
    });
    
    it('should implement exponential backoff for retries', async () => {
      // Simulate network failure
      await simulateNetworkFailure();
      
      // Mock Date.now to track timing between retries
      const originalNow = Date.now;
      const mockNow = jest.fn();
      const timestamps: number[] = [];
      
      mockNow.mockImplementation(() => {
        const time = originalNow();
        timestamps.push(time);
        return time;
      });
      
      global.Date.now = mockNow;
      
      // Configure retry with predictable backoff (no jitter)
      const originalRetryConfig = connectionRetry.getConfig();
      connectionRetry.updateConfig({
        attempts: 3,
        initialDelay: 100,
        maxDelay: 1000,
        factor: 2,
        jitter: false,
      });
      
      // Attempt to get a connection (should fail after retries)
      try {
        await connectionManager.getConnection();
        fail('Connection should have failed');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseConnectionError);
      }
      
      // Verify timestamps show exponential backoff
      // We expect at least 4 timestamps: initial + 3 retries
      expect(timestamps.length).toBeGreaterThanOrEqual(4);
      
      // Calculate delays between attempts
      const delays = [];
      for (let i = 1; i < timestamps.length; i++) {
        delays.push(timestamps[i] - timestamps[i - 1]);
      }
      
      // Verify delays follow exponential pattern (approximately)
      // First delay should be around 100ms
      // Second delay should be around 200ms
      // Third delay should be around 400ms
      expect(delays[0]).toBeGreaterThanOrEqual(90);
      expect(delays[1]).toBeGreaterThanOrEqual(180);
      expect(delays[2]).toBeGreaterThanOrEqual(360);
      
      // Restore original implementation
      global.Date.now = originalNow;
      connectionRetry.updateConfig(originalRetryConfig);
      await restoreNetworkConnection();
    });
    
    it('should open circuit breaker after consecutive failures', async () => {
      // Configure circuit breaker with low threshold for testing
      const originalCircuitConfig = connectionRetry.getConfig().circuitBreaker;
      connectionRetry.updateConfig({
        circuitBreaker: {
          enabled: true,
          failureThreshold: 3,
          resetTimeout: 1000,
        },
      });
      
      // Simulate network failure
      await simulateNetworkFailure();
      
      // Make multiple failed connection attempts to trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await connectionManager.getConnection();
          fail('Connection should have failed');
        } catch (error) {
          expect(error).toBeInstanceOf(DatabaseConnectionError);
        }
      }
      
      // Next attempt should fail immediately with circuit breaker error
      try {
        await connectionManager.getConnection();
        fail('Connection should have failed with circuit breaker error');
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitBreakerOpenError);
      }
      
      // Restore network connection
      await restoreNetworkConnection();
      
      // Wait for circuit breaker to reset
      await sleep(1100);
      
      // Connection should succeed after circuit breaker resets
      const connection = await connectionManager.getConnection();
      expect(connection).toBeDefined();
      await connectionManager.releaseConnection(connection);
      
      // Restore original circuit breaker config
      connectionRetry.updateConfig({ circuitBreaker: originalCircuitConfig });
    });
  });

  /**
   * Tests for connection lifecycle management
   */
  describe('Connection Lifecycle Management', () => {
    it('should initialize connection pool on application startup', async () => {
      // Create a new application instance
      const moduleFixture: TestingModule = await createTestModule({
        databaseUrl: testDbUrl,
        connectionPool: {
          min: 3, // Ensure minimum connections are created on startup
          max: 10,
          idle: 5000,
        },
      });
      
      const newApp = moduleFixture.createNestApplication();
      const newConnectionPool = moduleFixture.get<ConnectionPool>(ConnectionPool);
      
      // Initialize the application (should trigger connection pool initialization)
      await newApp.init();
      
      // Verify minimum connections were created
      const metrics = await getConnectionMetrics(newConnectionPool);
      expect(metrics.total).toBeGreaterThanOrEqual(3);
      
      // Clean up
      await newApp.close();
    });
    
    it('should drain connection pool on application shutdown', async () => {
      // Create a new application instance
      const moduleFixture: TestingModule = await createTestModule({
        databaseUrl: testDbUrl,
      });
      
      const newApp = moduleFixture.createNestApplication();
      const newConnectionPool = moduleFixture.get<ConnectionPool>(ConnectionPool);
      
      // Initialize the application
      await newApp.init();
      
      // Get some connections to populate the pool
      const newConnectionManager = moduleFixture.get<ConnectionManager>(ConnectionManager);
      const connections = [];
      for (let i = 0; i < 3; i++) {
        connections.push(await newConnectionManager.getConnection());
      }
      
      // Release connections
      for (const conn of connections) {
        await newConnectionManager.releaseConnection(conn);
      }
      
      // Verify pool has connections
      const metricsBeforeClose = await getConnectionMetrics(newConnectionPool);
      expect(metricsBeforeClose.total).toBeGreaterThan(0);
      
      // Close the application (should drain the pool)
      await newApp.close();
      
      // Verify pool was drained (this is implementation-specific)
      // We can't directly check metrics after close since the app is shut down
      // Instead, we can verify the pool's internal state if exposed, or
      // check that a new connection attempt fails
      try {
        await newConnectionManager.getConnection();
        fail('Connection should have failed after pool was drained');
      } catch (error) {
        // Expected error
        expect(error).toBeDefined();
      }
    });
    
    it('should handle graceful shutdown with active connections', async () => {
      // Create a new application instance
      const moduleFixture: TestingModule = await createTestModule({
        databaseUrl: testDbUrl,
        connectionPool: {
          drainTimeout: 500, // Short timeout for testing
        },
      });
      
      const newApp = moduleFixture.createNestApplication();
      const newConnectionManager = moduleFixture.get<ConnectionManager>(ConnectionManager);
      
      // Initialize the application
      await newApp.init();
      
      // Get a connection and keep it active
      const connection = await newConnectionManager.getConnection();
      
      // Start a long-running query in the background
      const queryPromise = connection.provider.$queryRaw`SELECT pg_sleep(1)`;
      
      // Close the application while query is running
      // This should wait for the drainTimeout before force closing
      const closePromise = newApp.close();
      
      // Both promises should resolve without errors
      await Promise.all([queryPromise, closePromise]);
    });
  });
});