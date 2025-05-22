import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import { PrismaService } from '../../src/prisma.service';
import { DatabaseModule } from '../../src/database.module';
import { 
  ConnectionManager,
  ConnectionPool,
  ConnectionHealth,
  ConnectionRetry,
  ConnectionConfig,
  JourneyType
} from '../../src/connection';
import { 
  setupTestDatabase,
  teardownTestDatabase,
  waitForDatabaseOperations
} from '../utils/database-test.utils';
import { 
  assertConnectionPoolSize,
  assertConnectionHealth,
  assertConnectionMetrics
} from '../utils/assertion.utils';
import { connectionPoolScenarios } from '../fixtures/scenarios/connection-pool-scenarios';
import { mockPrismaClient } from '../mocks/prisma-client.mock';

describe('Connection Lifecycle Integration', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let connectionManager: ConnectionManager;
  let connectionPool: ConnectionPool;
  let connectionHealth: ConnectionHealth;
  let connectionRetry: ConnectionRetry;
  
  beforeAll(async () => {
    // Setup test database with isolated schema
    await setupTestDatabase();
    
    // Create testing module with real implementations
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        DatabaseModule.forRoot({
          isGlobal: true,
          connectionPoolSize: 5,
          connectionTimeout: 5000,
          enableLogging: false,
          retryAttempts: 3,
          healthCheckInterval: 1000
        })
      ],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Get service instances
    prismaService = app.get<PrismaService>(PrismaService);
    connectionManager = app.get<ConnectionManager>(ConnectionManager);
    connectionPool = app.get<ConnectionPool>(ConnectionPool);
    connectionHealth = app.get<ConnectionHealth>(ConnectionHealth);
    connectionRetry = app.get<ConnectionRetry>(ConnectionRetry);
    
    // Ensure all services are initialized
    expect(prismaService).toBeDefined();
    expect(connectionManager).toBeDefined();
    expect(connectionPool).toBeDefined();
    expect(connectionHealth).toBeDefined();
    expect(connectionRetry).toBeDefined();
  });
  
  afterAll(async () => {
    // Gracefully close the application to test proper connection termination
    await app.close();
    
    // Teardown test database
    await teardownTestDatabase();
  });
  
  describe('Connection Initialization', () => {
    it('should initialize the connection pool with the configured size', async () => {
      // Verify the connection pool is initialized with the correct size
      const poolSize = await connectionPool.getPoolSize();
      expect(poolSize.max).toBe(5);
      expect(poolSize.min).toBe(1);
      expect(poolSize.current).toBeGreaterThanOrEqual(1);
    });
    
    it('should create connections with proper configuration', async () => {
      // Get the configuration used for connections
      const config = await connectionManager.getConnectionConfig();
      
      // Verify configuration properties
      expect(config.connectionTimeout).toBe(5000);
      expect(config.retryAttempts).toBe(3);
      expect(config.healthCheckInterval).toBe(1000);
      expect(config.enableLogging).toBe(false);
    });
    
    it('should register connections with the health monitor', async () => {
      // Verify that connections are registered with the health monitor
      const healthStatus = await connectionHealth.getHealthStatus();
      
      // Should have at least one connection being monitored
      expect(healthStatus.connectionsMonitored).toBeGreaterThanOrEqual(1);
      expect(healthStatus.lastCheckTimestamp).toBeDefined();
      expect(healthStatus.isHealthy).toBe(true);
    });
  });
  
  describe('Connection Pooling', () => {
    it('should reuse connections from the pool for multiple operations', async () => {
      // Track initial pool metrics
      const initialMetrics = await connectionPool.getMetrics();
      
      // Perform multiple database operations
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(prismaService.$queryRaw`SELECT 1 as result`);
      }
      
      // Wait for all operations to complete
      await Promise.all(operations);
      await waitForDatabaseOperations();
      
      // Get updated metrics
      const updatedMetrics = await connectionPool.getMetrics();
      
      // Verify connection reuse
      expect(updatedMetrics.totalConnectionsCreated - initialMetrics.totalConnectionsCreated)
        .toBeLessThan(10); // Should create fewer connections than operations
      expect(updatedMetrics.totalConnectionsReused - initialMetrics.totalConnectionsReused)
        .toBeGreaterThan(0); // Should reuse some connections
    });
    
    it('should scale the connection pool based on load', async () => {
      // Track initial pool size
      const initialSize = await connectionPool.getPoolSize();
      
      // Simulate high load with concurrent operations
      const operations = [];
      for (let i = 0; i < 20; i++) {
        operations.push(prismaService.$queryRaw`SELECT pg_sleep(0.1), ${i} as result`);
      }
      
      // Execute operations in parallel to create load
      await Promise.all(operations);
      await waitForDatabaseOperations();
      
      // Get updated pool size
      const updatedSize = await connectionPool.getPoolSize();
      
      // Verify pool scaled up under load
      expect(updatedSize.current).toBeGreaterThanOrEqual(initialSize.current);
      
      // Wait for pool to scale back down
      await new Promise(resolve => setTimeout(resolve, 2000));
      const finalSize = await connectionPool.getPoolSize();
      
      // Verify pool scaled down after load decreased
      expect(finalSize.current).toBeLessThanOrEqual(updatedSize.current);
    });
    
    it('should properly release connections back to the pool', async () => {
      // Track initial available connections
      const initialAvailable = await connectionPool.getAvailableConnections();
      
      // Perform a database operation
      await prismaService.$queryRaw`SELECT 1 as result`;
      await waitForDatabaseOperations();
      
      // Get updated available connections
      const updatedAvailable = await connectionPool.getAvailableConnections();
      
      // Verify connection was released back to the pool
      expect(updatedAvailable).toBeGreaterThanOrEqual(initialAvailable);
    });
  });
  
  describe('Health Monitoring', () => {
    it('should perform regular health checks on connections', async () => {
      // Get initial health check count
      const initialStatus = await connectionHealth.getHealthStatus();
      const initialCheckCount = initialStatus.totalChecksPerformed;
      
      // Wait for health check interval
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get updated health check count
      const updatedStatus = await connectionHealth.getHealthStatus();
      const updatedCheckCount = updatedStatus.totalChecksPerformed;
      
      // Verify health checks were performed
      expect(updatedCheckCount).toBeGreaterThan(initialCheckCount);
    });
    
    it('should detect and report unhealthy connections', async () => {
      // Mock an unhealthy connection
      const unhealthyConnection = await connectionPool.acquireConnection();
      await connectionHealth.markConnectionUnhealthy(unhealthyConnection.id);
      
      // Get health status
      const healthStatus = await connectionHealth.getHealthStatus();
      
      // Verify unhealthy connection is detected
      expect(healthStatus.unhealthyConnections).toBeGreaterThanOrEqual(1);
      
      // Release the connection to allow it to be replaced
      await connectionPool.releaseConnection(unhealthyConnection.id);
      
      // Wait for health check to replace the unhealthy connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get updated health status
      const updatedStatus = await connectionHealth.getHealthStatus();
      
      // Verify unhealthy connection was replaced
      expect(updatedStatus.unhealthyConnections).toBeLessThan(healthStatus.unhealthyConnections);
    });
    
    it('should track connection performance metrics', async () => {
      // Perform some database operations
      for (let i = 0; i < 5; i++) {
        await prismaService.$queryRaw`SELECT pg_sleep(0.01), ${i} as result`;
      }
      
      // Get performance metrics
      const metrics = await connectionHealth.getPerformanceMetrics();
      
      // Verify metrics are being tracked
      expect(metrics.averageQueryTime).toBeGreaterThan(0);
      expect(metrics.totalQueriesExecuted).toBeGreaterThan(0);
      expect(metrics.slowQueries).toBeDefined();
    });
  });
  
  describe('Retry Mechanisms', () => {
    it('should retry failed database operations with exponential backoff', async () => {
      // Mock a failing connection that will succeed after retries
      const mockFailingClient = {
        ...mockPrismaClient,
        $queryRaw: jest.fn()
          .mockRejectedValueOnce(new Error('Connection terminated unexpectedly'))
          .mockRejectedValueOnce(new Error('Connection terminated unexpectedly'))
          .mockResolvedValueOnce([{ result: 1 }])
      };
      
      // Create a retry tracker to monitor retry attempts
      const retryTracker = jest.fn();
      connectionRetry.onRetry(retryTracker);
      
      // Execute operation with retry
      const result = await connectionRetry.executeWithRetry(
        async () => mockFailingClient.$queryRaw`SELECT 1 as result`,
        { operation: 'test-query', maxRetries: 3 }
      );
      
      // Verify operation was retried and eventually succeeded
      expect(mockFailingClient.$queryRaw).toHaveBeenCalledTimes(3);
      expect(retryTracker).toHaveBeenCalledTimes(2); // Two retries
      expect(result).toEqual([{ result: 1 }]);
      
      // Verify exponential backoff was applied
      const firstRetryDelay = retryTracker.mock.calls[0][0].delay;
      const secondRetryDelay = retryTracker.mock.calls[1][0].delay;
      expect(secondRetryDelay).toBeGreaterThan(firstRetryDelay);
    });
    
    it('should apply different retry strategies based on error type', async () => {
      // Create mock clients with different error types
      const connectionError = new Error('Connection terminated unexpectedly');
      connectionError.code = 'P1001';
      
      const timeoutError = new Error('Query execution timeout');
      timeoutError.code = 'P1008';
      
      const mockConnectionErrorClient = {
        ...mockPrismaClient,
        $queryRaw: jest.fn().mockRejectedValue(connectionError)
      };
      
      const mockTimeoutErrorClient = {
        ...mockPrismaClient,
        $queryRaw: jest.fn().mockRejectedValue(timeoutError)
      };
      
      // Create retry trackers
      const connectionRetryTracker = jest.fn();
      const timeoutRetryTracker = jest.fn();
      
      // Register retry trackers
      connectionRetry.onRetry((info) => {
        if (info.error.code === 'P1001') connectionRetryTracker(info);
        if (info.error.code === 'P1008') timeoutRetryTracker(info);
      });
      
      // Execute operations with retry (will fail after max retries)
      try {
        await connectionRetry.executeWithRetry(
          async () => mockConnectionErrorClient.$queryRaw`SELECT 1 as result`,
          { operation: 'connection-error-query', maxRetries: 2 }
        );
      } catch (error) {
        // Expected to fail after max retries
      }
      
      try {
        await connectionRetry.executeWithRetry(
          async () => mockTimeoutErrorClient.$queryRaw`SELECT 1 as result`,
          { operation: 'timeout-error-query', maxRetries: 2 }
        );
      } catch (error) {
        // Expected to fail after max retries
      }
      
      // Verify different retry strategies were applied
      expect(connectionRetryTracker).toHaveBeenCalledTimes(2);
      expect(timeoutRetryTracker).toHaveBeenCalledTimes(2);
      
      // Verify connection errors have shorter retry delays than timeout errors
      const connectionRetryDelay = connectionRetryTracker.mock.calls[0][0].delay;
      const timeoutRetryDelay = timeoutRetryTracker.mock.calls[0][0].delay;
      
      // Connection errors should be retried more quickly than timeout errors
      expect(connectionRetryDelay).toBeLessThan(timeoutRetryDelay);
    });
  });
  
  describe('Journey-Specific Optimizations', () => {
    it('should create optimized connections for different journeys', async () => {
      // Get connections for different journeys
      const healthConnection = await connectionManager.getJourneyConnection(JourneyType.HEALTH);
      const careConnection = await connectionManager.getJourneyConnection(JourneyType.CARE);
      const planConnection = await connectionManager.getJourneyConnection(JourneyType.PLAN);
      
      // Verify journey-specific connections were created
      expect(healthConnection).toBeDefined();
      expect(healthConnection.journeyType).toBe(JourneyType.HEALTH);
      expect(careConnection).toBeDefined();
      expect(careConnection.journeyType).toBe(JourneyType.CARE);
      expect(planConnection).toBeDefined();
      expect(planConnection.journeyType).toBe(JourneyType.PLAN);
      
      // Verify connections have journey-specific optimizations
      expect(healthConnection.config.optimizations).toContain('time-series');
      expect(careConnection.config.optimizations).toContain('transaction-priority');
      expect(planConnection.config.optimizations).toContain('read-replica');
    });
    
    it('should apply journey-specific connection settings', async () => {
      // Get journey-specific connection configurations
      const healthConfig = await connectionManager.getJourneyConnectionConfig(JourneyType.HEALTH);
      const careConfig = await connectionManager.getJourneyConnectionConfig(JourneyType.CARE);
      const planConfig = await connectionManager.getJourneyConnectionConfig(JourneyType.PLAN);
      
      // Verify journey-specific configurations
      expect(healthConfig.statementTimeout).toBeGreaterThan(careConfig.statementTimeout);
      expect(careConfig.maxTransactions).toBeGreaterThan(planConfig.maxTransactions);
      expect(planConfig.readReplicaEnabled).toBe(true);
    });
    
    it('should prioritize connection reuse within the same journey', async () => {
      // Track initial metrics
      const initialMetrics = await connectionPool.getMetrics();
      
      // Perform operations within the same journey
      for (let i = 0; i < 5; i++) {
        await connectionManager.executeInJourney(
          JourneyType.HEALTH,
          async (client) => client.$queryRaw`SELECT ${i} as result`
        );
      }
      
      // Get updated metrics
      const updatedMetrics = await connectionPool.getMetrics();
      
      // Verify connection reuse within journey
      expect(updatedMetrics.journeyConnectionReuse[JourneyType.HEALTH])
        .toBeGreaterThan(initialMetrics.journeyConnectionReuse[JourneyType.HEALTH] || 0);
    });
  });
  
  describe('Graceful Termination', () => {
    it('should track active queries during shutdown', async () => {
      // Create a new app instance for shutdown testing
      const shutdownModuleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          DatabaseModule.forRoot({
            isGlobal: true,
            connectionPoolSize: 3,
            connectionTimeout: 5000,
            enableLogging: false,
            retryAttempts: 3,
            healthCheckInterval: 1000
          })
        ],
      }).compile();
      
      const shutdownApp = shutdownModuleFixture.createNestApplication();
      await shutdownApp.init();
      
      const shutdownPrismaService = shutdownApp.get<PrismaService>(PrismaService);
      const shutdownConnectionManager = shutdownApp.get<ConnectionManager>(ConnectionManager);
      
      // Start a long-running query
      const queryPromise = shutdownPrismaService.$queryRaw`SELECT pg_sleep(1), 'long-running' as result`;
      
      // Get active queries immediately
      const activeQueries = await shutdownConnectionManager.getActiveQueries();
      
      // Verify active query is tracked
      expect(activeQueries.length).toBeGreaterThanOrEqual(1);
      
      // Wait for query to complete
      await queryPromise;
      
      // Close the app
      await shutdownApp.close();
    });
    
    it('should wait for active transactions to complete during shutdown', async () => {
      // Create a new app instance for shutdown testing
      const shutdownModuleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          DatabaseModule.forRoot({
            isGlobal: true,
            connectionPoolSize: 3,
            connectionTimeout: 5000,
            enableLogging: false,
            retryAttempts: 3,
            healthCheckInterval: 1000
          })
        ],
      }).compile();
      
      const shutdownApp = shutdownModuleFixture.createNestApplication();
      await shutdownApp.init();
      
      const shutdownPrismaService = shutdownApp.get<PrismaService>(PrismaService);
      const shutdownConnectionManager = shutdownApp.get<ConnectionManager>(ConnectionManager);
      
      // Start a transaction
      const transactionPromise = shutdownPrismaService.$transaction(async (tx) => {
        // Perform some operations in transaction
        await tx.$queryRaw`SELECT pg_sleep(0.5), 'in-transaction' as result`;
        return { completed: true };
      });
      
      // Get active transactions
      const activeTransactions = await shutdownConnectionManager.getActiveTransactions();
      
      // Verify active transaction is tracked
      expect(activeTransactions.length).toBeGreaterThanOrEqual(1);
      
      // Wait for transaction to complete
      await transactionPromise;
      
      // Close the app
      await shutdownApp.close();
    });
    
    it('should release all connections during shutdown', async () => {
      // Create a new app instance for shutdown testing
      const shutdownModuleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          DatabaseModule.forRoot({
            isGlobal: true,
            connectionPoolSize: 3,
            connectionTimeout: 5000,
            enableLogging: false,
            retryAttempts: 3,
            healthCheckInterval: 1000
          })
        ],
      }).compile();
      
      const shutdownApp = shutdownModuleFixture.createNestApplication();
      await shutdownApp.init();
      
      const shutdownConnectionPool = shutdownApp.get<ConnectionPool>(ConnectionPool);
      
      // Get initial pool size
      const initialPoolSize = await shutdownConnectionPool.getPoolSize();
      expect(initialPoolSize.current).toBeGreaterThan(0);
      
      // Create a spy on the connection pool's releaseAllConnections method
      const releaseAllSpy = jest.spyOn(shutdownConnectionPool, 'releaseAllConnections');
      
      // Close the app
      await shutdownApp.close();
      
      // Verify releaseAllConnections was called
      expect(releaseAllSpy).toHaveBeenCalled();
    });
  });
});