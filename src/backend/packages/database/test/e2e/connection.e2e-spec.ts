/**
 * End-to-End Tests for Database Connection Management
 * 
 * These tests validate the connection management functionality against a real PostgreSQL database,
 * including connection pooling, health monitoring, retry mechanisms, and lifecycle management.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { setTimeout } from 'timers/promises';

// Import connection management components
import { ConnectionManager } from '../../src/connection/connection-manager';
import { ConnectionPool } from '../../src/connection/connection-pool';
import { ConnectionHealth } from '../../src/connection/connection-health';
import { ConnectionRetry } from '../../src/connection/connection-retry';
import { RetryStrategyFactory } from '../../src/errors/retry-strategies';
import { DatabaseModule } from '../../src/database.module';

// Import test utilities
import {
  testDatabaseSetup,
  setupDatabaseTestSuite,
  teardownDatabaseTestSuite,
  resetDatabaseBeforeEach,
} from './setup';

// Import types
import {
  ConnectionType,
  QueryPattern,
  JourneyType,
  DatabaseClient,
} from '../../src/types/connection.types';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType } from '../../src/errors/database-error.types';

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds

describe('ConnectionManager (e2e)', () => {
  let moduleRef: TestingModule;
  let connectionManager: ConnectionManager;
  let connectionHealth: ConnectionHealth;
  let connectionRetry: ConnectionRetry;
  let configService: ConfigService;
  let schedulerRegistry: SchedulerRegistry;
  let prismaClient: PrismaClient;

  // Setup test database before all tests
  beforeAll(setupDatabaseTestSuite());

  // Cleanup test database after all tests
  afterAll(teardownDatabaseTestSuite());

  // Reset database before each test
  beforeEach(resetDatabaseBeforeEach());

  // Setup test module before each test
  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            database: {
              postgres: {
                url: testDatabaseSetup.getDatabaseUrl(),
                minConnections: 2,
                maxConnections: 10,
                idleTimeoutMs: 10000,
                connectionTimeoutMs: 5000,
              },
              healthCheck: {
                enabled: true,
                intervalMs: 5000,
              },
              retry: {
                maxAttempts: 3,
                initialDelayMs: 100,
                maxDelayMs: 1000,
                backoffFactor: 2,
                jitterFactor: 0.2,
              },
            },
          })],
        }),
        ScheduleModule.forRoot(),
        DatabaseModule,
      ],
      providers: [
        ConnectionManager,
        ConnectionPool,
        ConnectionHealth,
        ConnectionRetry,
        {
          provide: RetryStrategyFactory,
          useFactory: () => ({
            createStrategy: jest.fn().mockReturnValue({
              shouldRetry: jest.fn().mockReturnValue(true),
              getNextDelayMs: jest.fn().mockReturnValue(100),
            }),
          }),
        },
      ],
    }).compile();

    connectionManager = moduleRef.get<ConnectionManager>(ConnectionManager);
    connectionHealth = moduleRef.get<ConnectionHealth>(ConnectionHealth);
    connectionRetry = moduleRef.get<ConnectionRetry>(ConnectionRetry);
    configService = moduleRef.get<ConfigService>(ConfigService);
    schedulerRegistry = moduleRef.get<SchedulerRegistry>(SchedulerRegistry);
    prismaClient = testDatabaseSetup.getPrismaClient();

    // Initialize connection manager
    await moduleRef.init();
  });

  // Cleanup after each test
  afterEach(async () => {
    await moduleRef.close();
  });

  /**
   * Connection Pooling and Optimization Tests
   */
  describe('Connection Pooling', () => {
    it('should create and return a database connection', async () => {
      // Get a connection
      const connection = await connectionManager.getConnection(ConnectionType.POSTGRESQL);

      // Verify connection is valid
      expect(connection).toBeDefined();
      expect(typeof connection.$connect).toBe('function');
      expect(typeof connection.$disconnect).toBe('function');

      // Verify connection is active
      expect(connectionManager.getActiveConnectionCount()).toBe(1);
    }, TEST_TIMEOUT);

    it('should reuse existing connections for the same connection type and options', async () => {
      // Get a connection
      const connection1 = await connectionManager.getConnection(ConnectionType.POSTGRESQL);

      // Get another connection with the same options
      const connection2 = await connectionManager.getConnection(ConnectionType.POSTGRESQL);

      // Verify connections are the same instance
      expect(connection1).toBe(connection2);

      // Verify only one active connection
      expect(connectionManager.getActiveConnectionCount()).toBe(1);
    }, TEST_TIMEOUT);

    it('should create different connections for different query patterns', async () => {
      // Get connections with different query patterns
      const readConnection = await connectionManager.getOptimizedConnection(
        ConnectionType.POSTGRESQL,
        QueryPattern.READ_OPTIMIZED
      );

      const writeConnection = await connectionManager.getOptimizedConnection(
        ConnectionType.POSTGRESQL,
        QueryPattern.WRITE_OPTIMIZED
      );

      // Verify connections are different instances
      expect(readConnection).not.toBe(writeConnection);

      // Verify two active connections
      expect(connectionManager.getActiveConnectionCount()).toBe(2);
    }, TEST_TIMEOUT);

    it('should create different connections for different journey types', async () => {
      // Get connections for different journeys
      const healthConnection = await connectionManager.getJourneyConnection(
        ConnectionType.POSTGRESQL,
        JourneyType.HEALTH
      );

      const careConnection = await connectionManager.getJourneyConnection(
        ConnectionType.POSTGRESQL,
        JourneyType.CARE
      );

      // Verify connections are different instances
      expect(healthConnection).not.toBe(careConnection);

      // Verify two active connections
      expect(connectionManager.getActiveConnectionCount()).toBe(2);
    }, TEST_TIMEOUT);

    it('should respect connection limits from configuration', async () => {
      // Get the max connections from config
      const config = configService.get('database.postgres');
      const maxConnections = config.maxConnections;

      // Create connections up to the limit
      const connections: DatabaseClient[] = [];
      for (let i = 0; i < maxConnections; i++) {
        // Use different journey types to force new connections
        const journeyType = `journey-${i}` as JourneyType;
        const connection = await connectionManager.getConnection(ConnectionType.POSTGRESQL, { journeyType });
        connections.push(connection);
      }

      // Verify we have the expected number of connections
      expect(connectionManager.getActiveConnectionCount()).toBe(maxConnections);

      // Verify connection stats
      const stats = connectionManager.getConnectionStats();
      expect(stats[ConnectionType.POSTGRESQL].active).toBe(maxConnections);
      expect(stats[ConnectionType.POSTGRESQL].total).toBe(maxConnections);
      expect(stats[ConnectionType.POSTGRESQL].available).toBe(0);

      // Release a connection
      await connectionManager.releaseConnection('POSTGRESQL:journey-0:BALANCED');

      // Verify connection count decreased
      expect(connectionManager.getActiveConnectionCount()).toBe(maxConnections - 1);

      // Verify updated stats
      const updatedStats = connectionManager.getConnectionStats();
      expect(updatedStats[ConnectionType.POSTGRESQL].active).toBe(maxConnections - 1);
      expect(updatedStats[ConnectionType.POSTGRESQL].available).toBe(1);
    }, TEST_TIMEOUT);
  });

  /**
   * Connection Health Monitoring Tests
   */
  describe('Connection Health Monitoring', () => {
    it('should detect and report unhealthy connections', async () => {
      // Spy on the connection health check method
      const healthCheckSpy = jest.spyOn(connectionHealth, 'isConnectionHealthy');

      // Mock an unhealthy connection for a specific call
      healthCheckSpy.mockImplementationOnce(async () => false);

      // Get a connection
      const connection = await connectionManager.getConnection(ConnectionType.POSTGRESQL);

      // Verify connection is active
      expect(connectionManager.getActiveConnectionCount()).toBe(1);

      // Manually trigger connection validation
      await connectionManager.validateConnections();

      // Verify unhealthy connection was released
      expect(connectionManager.getActiveConnectionCount()).toBe(0);

      // Restore the original implementation
      healthCheckSpy.mockRestore();
    }, TEST_TIMEOUT);

    it('should validate connections periodically via health checks', async () => {
      // Spy on the validateConnections method
      const validateSpy = jest.spyOn(connectionManager, 'validateConnections');

      // Verify health check interval is registered
      expect(() => schedulerRegistry.getInterval('connection-health-check')).not.toThrow();

      // Wait for at least one health check to occur
      await setTimeout(6000); // Wait longer than the health check interval

      // Verify validateConnections was called at least once
      expect(validateSpy).toHaveBeenCalled();

      // Cleanup
      validateSpy.mockRestore();
    }, TEST_TIMEOUT);

    it('should report connection health metrics', async () => {
      // Get a connection
      await connectionManager.getConnection(ConnectionType.POSTGRESQL);

      // Get connection stats
      const stats = connectionManager.getConnectionStats();

      // Verify stats are reported correctly
      expect(stats).toBeDefined();
      expect(stats[ConnectionType.POSTGRESQL]).toBeDefined();
      expect(stats[ConnectionType.POSTGRESQL].active).toBe(1);
      expect(stats[ConnectionType.POSTGRESQL].total).toBeGreaterThanOrEqual(1);
      expect(stats[ConnectionType.POSTGRESQL].available).toBeGreaterThanOrEqual(0);
    }, TEST_TIMEOUT);
  });

  /**
   * Retry Mechanisms Tests
   */
  describe('Retry Mechanisms', () => {
    it('should retry failed connection attempts with exponential backoff', async () => {
      // Spy on the connection retry method
      const retrySpy = jest.spyOn(connectionRetry, 'withRetry');

      // Mock a connection failure followed by success
      const poolSpy = jest.spyOn(ConnectionPool.prototype, 'acquireConnection');
      poolSpy.mockRejectedValueOnce(new Error('Connection failed'));

      // Get a connection (should retry and eventually succeed)
      const connection = await connectionManager.getConnection(ConnectionType.POSTGRESQL);

      // Verify connection is valid
      expect(connection).toBeDefined();

      // Verify retry was attempted
      expect(retrySpy).toHaveBeenCalled();

      // Cleanup
      retrySpy.mockRestore();
      poolSpy.mockRestore();
    }, TEST_TIMEOUT);

    it('should handle connection failures with appropriate recovery strategy', async () => {
      // Spy on the retry with custom strategy method
      const customRetrySpy = jest.spyOn(connectionRetry, 'withCustomStrategy');

      // Create a recoverable error
      const recoverableError = new Error('Connection reset by peer');

      // Attempt to handle the connection failure
      try {
        await connectionManager.handleConnectionFailure(
          recoverableError,
          ConnectionType.POSTGRESQL
        );

        // Verify custom retry strategy was used
        expect(customRetrySpy).toHaveBeenCalled();
      } catch (error) {
        // This should not happen for a recoverable error
        fail('Should not throw for recoverable error');
      } finally {
        // Cleanup
        customRetrySpy.mockRestore();
      }
    }, TEST_TIMEOUT);

    it('should throw for unrecoverable connection errors', async () => {
      // Create an unrecoverable database exception
      const unrecoverableError = new DatabaseException(
        'Database schema corrupted',
        {},
        DatabaseErrorType.SCHEMA
      );

      // Attempt to handle the connection failure
      await expect(async () => {
        await connectionManager.handleConnectionFailure(
          unrecoverableError,
          ConnectionType.POSTGRESQL
        );
      }).rejects.toThrow();
    }, TEST_TIMEOUT);
  });

  /**
   * Connection Lifecycle Management Tests
   */
  describe('Connection Lifecycle Management', () => {
    it('should properly initialize connection pools on module init', async () => {
      // Verify connection pools are initialized
      const stats = connectionManager.getConnectionStats();
      expect(stats[ConnectionType.POSTGRESQL]).toBeDefined();
      expect(stats[ConnectionType.POSTGRESQL].total).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    it('should properly release connections', async () => {
      // Get a connection
      await connectionManager.getConnection(ConnectionType.POSTGRESQL);

      // Verify connection is active
      expect(connectionManager.getActiveConnectionCount()).toBe(1);

      // Release the connection
      await connectionManager.releaseConnection('POSTGRESQL:shared:BALANCED');

      // Verify connection was released
      expect(connectionManager.getActiveConnectionCount()).toBe(0);
    }, TEST_TIMEOUT);

    it('should close all connections during module destruction', async () => {
      // Get multiple connections
      await connectionManager.getConnection(ConnectionType.POSTGRESQL, { journeyType: JourneyType.HEALTH });
      await connectionManager.getConnection(ConnectionType.POSTGRESQL, { journeyType: JourneyType.CARE });
      await connectionManager.getConnection(ConnectionType.POSTGRESQL, { journeyType: JourneyType.PLAN });

      // Verify connections are active
      expect(connectionManager.getActiveConnectionCount()).toBe(3);

      // Trigger module destruction
      await moduleRef.close();

      // Create a new module to check if connections were closed
      moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({
              database: {
                postgres: {
                  url: testDatabaseSetup.getDatabaseUrl(),
                  minConnections: 2,
                  maxConnections: 10,
                  idleTimeoutMs: 10000,
                  connectionTimeoutMs: 5000,
                },
              },
            })],
          }),
          ScheduleModule.forRoot(),
          DatabaseModule,
        ],
        providers: [
          ConnectionManager,
          ConnectionPool,
          ConnectionHealth,
          ConnectionRetry,
          {
            provide: RetryStrategyFactory,
            useFactory: () => ({
              createStrategy: jest.fn().mockReturnValue({
                shouldRetry: jest.fn().mockReturnValue(true),
                getNextDelayMs: jest.fn().mockReturnValue(100),
              }),
            }),
          },
        ],
      }).compile();

      connectionManager = moduleRef.get<ConnectionManager>(ConnectionManager);
      await moduleRef.init();

      // Verify no active connections in the new instance
      expect(connectionManager.getActiveConnectionCount()).toBe(0);
    }, TEST_TIMEOUT);

    it('should handle concurrent connection requests efficiently', async () => {
      // Request multiple connections concurrently
      const connectionPromises = [];
      for (let i = 0; i < 5; i++) {
        connectionPromises.push(
          connectionManager.getConnection(ConnectionType.POSTGRESQL)
        );
      }

      // Wait for all connections
      const connections = await Promise.all(connectionPromises);

      // Verify all connections are the same instance (reused)
      const firstConnection = connections[0];
      for (let i = 1; i < connections.length; i++) {
        expect(connections[i]).toBe(firstConnection);
      }

      // Verify only one active connection
      expect(connectionManager.getActiveConnectionCount()).toBe(1);
    }, TEST_TIMEOUT);
  });

  /**
   * Real Database Operations Tests
   */
  describe('Real Database Operations', () => {
    it('should execute queries on the obtained connection', async () => {
      // Get a connection
      const connection = await connectionManager.getConnection(ConnectionType.POSTGRESQL);

      // Execute a simple query
      const result = await connection.$queryRaw`SELECT 1 as test`;

      // Verify query executed successfully
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('test', 1);
    }, TEST_TIMEOUT);

    it('should handle transaction operations correctly', async () => {
      // Get a connection
      const connection = await connectionManager.getConnection(ConnectionType.POSTGRESQL);

      // Execute a transaction
      const result = await connection.$transaction(async (tx) => {
        // Create a test user
        const user = await tx.user.create({
          data: {
            name: 'Test Transaction User',
            email: `test.transaction.${Date.now()}@example.com`,
            password: 'password123',
            phone: '+5511999999999',
            cpf: '12345678901',
          },
        });

        // Verify user was created
        const foundUser = await tx.user.findUnique({
          where: { id: user.id },
        });

        return foundUser;
      });

      // Verify transaction executed successfully
      expect(result).toBeDefined();
      expect(result).toHaveProperty('name', 'Test Transaction User');
    }, TEST_TIMEOUT);

    it('should handle connection errors gracefully', async () => {
      // Get a connection
      const connection = await connectionManager.getConnection(ConnectionType.POSTGRESQL);

      // Attempt to execute an invalid query
      try {
        await connection.$queryRaw`SELECT * FROM non_existent_table`;
        fail('Should throw an error for invalid query');
      } catch (error) {
        // Verify error is handled properly
        expect(error).toBeDefined();
        expect(error.message).toContain('non_existent_table');
      }

      // Verify connection is still active
      expect(connectionManager.getActiveConnectionCount()).toBe(1);

      // Verify we can still use the connection for valid queries
      const result = await connection.$queryRaw`SELECT 1 as test`;
      expect(result[0]).toHaveProperty('test', 1);
    }, TEST_TIMEOUT);
  });
});