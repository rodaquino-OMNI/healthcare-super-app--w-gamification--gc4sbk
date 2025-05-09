import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from '../../src/prisma.service';
import { DatabaseModule } from '../../src/database.module';
import { ConnectionManager } from '../../src/connection/connection-manager';
import { ConnectionPool } from '../../src/connection/connection-pool';
import { ConnectionHealth } from '../../src/connection/connection-health';
import { ConnectionRetry } from '../../src/connection/connection-retry';
import { 
  ConnectionConfig, 
  DatabaseConnectionOptions 
} from '../../src/connection/connection-config';
import { 
  DatabaseErrorType, 
  DatabaseErrorSeverity, 
  DatabaseErrorRecoverability 
} from '../../src/errors/database-error.types';
import { ConnectionException } from '../../src/errors/database-error.exception';
import { HealthContext } from '../../src/contexts/health.context';
import { CareContext } from '../../src/contexts/care.context';
import { PlanContext } from '../../src/contexts/plan.context';
import { 
  databaseTestUtils, 
  createTestDatabase, 
  cleanupTestDatabase 
} from '../utils/database-test.utils';

/**
 * Integration test for the complete database connection lifecycle.
 * Tests the interactions between ConnectionManager, ConnectionPool, ConnectionHealth, 
 * and retry mechanisms throughout the application lifecycle.
 */
describe('Connection Lifecycle Integration', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let prismaService: PrismaService;
  let connectionManager: ConnectionManager;
  let connectionPool: ConnectionPool;
  let connectionHealth: ConnectionHealth;
  let connectionRetry: ConnectionRetry;
  let configService: ConfigService;
  let healthContext: HealthContext;
  let careContext: CareContext;
  let planContext: PlanContext;
  
  // Mock logger to prevent console noise during tests
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn()
  } as unknown as Logger;

  // Test database configuration
  const testDbConfig: DatabaseConnectionOptions = {
    maxConnections: 5,
    minConnections: 1,
    connectionIdleTimeout: 10000,
    connectionTimeout: 5000,
    healthCheckInterval: 5000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableLogging: false
  };

  beforeAll(async () => {
    // Create test database
    await createTestDatabase();

    // Create testing module with database module
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ database: testDbConfig })]
        }),
        DatabaseModule.forRoot({
          isGlobal: true
        })
      ],
      providers: [
        {
          provide: Logger,
          useValue: mockLogger
        }
      ]
    }).compile();

    // Create NestJS application
    app = moduleRef.createNestApplication();
    await app.init();

    // Get service instances
    prismaService = moduleRef.get<PrismaService>(PrismaService);
    connectionManager = moduleRef.get<ConnectionManager>(ConnectionManager);
    connectionPool = moduleRef.get<ConnectionPool>(ConnectionPool);
    connectionHealth = moduleRef.get<ConnectionHealth>(ConnectionHealth);
    connectionRetry = moduleRef.get<ConnectionRetry>(ConnectionRetry);
    configService = moduleRef.get<ConfigService>(ConfigService);
    healthContext = moduleRef.get<HealthContext>(HealthContext);
    careContext = moduleRef.get<CareContext>(CareContext);
    planContext = moduleRef.get<PlanContext>(PlanContext);
  });

  afterAll(async () => {
    // Clean up test database
    await cleanupTestDatabase();
    
    // Close application
    await app.close();
  });

  describe('Connection Initialization', () => {
    it('should initialize ConnectionManager with proper configuration', () => {
      // Verify ConnectionManager is initialized
      expect(connectionManager).toBeDefined();
      
      // Verify configuration is loaded correctly
      const config = connectionManager['config'] as ConnectionConfig;
      expect(config).toBeDefined();
      expect(config.maxConnections).toBe(testDbConfig.maxConnections);
      expect(config.minConnections).toBe(testDbConfig.minConnections);
      expect(config.connectionIdleTimeout).toBe(testDbConfig.connectionIdleTimeout);
    });

    it('should initialize ConnectionPool with minimum connections', async () => {
      // Verify ConnectionPool is initialized
      expect(connectionPool).toBeDefined();
      
      // Verify minimum connections are created
      const activeConnections = await connectionPool.getActiveConnectionCount();
      expect(activeConnections).toBeGreaterThanOrEqual(testDbConfig.minConnections);
    });

    it('should initialize ConnectionHealth with health check interval', () => {
      // Verify ConnectionHealth is initialized
      expect(connectionHealth).toBeDefined();
      
      // Verify health check interval is set correctly
      const healthCheckInterval = connectionHealth['healthCheckInterval'];
      expect(healthCheckInterval).toBe(testDbConfig.healthCheckInterval);
    });

    it('should initialize ConnectionRetry with retry configuration', () => {
      // Verify ConnectionRetry is initialized
      expect(connectionRetry).toBeDefined();
      
      // Verify retry configuration is set correctly
      const retryAttempts = connectionRetry['retryAttempts'];
      const retryDelay = connectionRetry['retryDelay'];
      expect(retryAttempts).toBe(testDbConfig.retryAttempts);
      expect(retryDelay).toBe(testDbConfig.retryDelay);
    });
  });

  describe('Connection Pooling', () => {
    it('should acquire connection from pool for database operations', async () => {
      // Spy on connection pool's acquire method
      const acquireSpy = jest.spyOn(connectionPool, 'acquireConnection');
      
      // Perform a simple database operation
      await prismaService.$queryRaw`SELECT 1 as result`;
      
      // Verify connection was acquired from pool
      expect(acquireSpy).toHaveBeenCalled();
    });

    it('should release connection back to pool after operation completes', async () => {
      // Spy on connection pool's release method
      const releaseSpy = jest.spyOn(connectionPool, 'releaseConnection');
      
      // Perform a simple database operation
      await prismaService.$queryRaw`SELECT 1 as result`;
      
      // Verify connection was released back to pool
      expect(releaseSpy).toHaveBeenCalled();
    });

    it('should reuse existing connections for multiple operations', async () => {
      // Get initial connection count
      const initialCount = await connectionPool.getActiveConnectionCount();
      
      // Perform multiple database operations
      await Promise.all([
        prismaService.$queryRaw`SELECT 1 as result`,
        prismaService.$queryRaw`SELECT 2 as result`,
        prismaService.$queryRaw`SELECT 3 as result`
      ]);
      
      // Get final connection count
      const finalCount = await connectionPool.getActiveConnectionCount();
      
      // Verify connection count didn't increase by the number of operations
      // This indicates connection reuse
      expect(finalCount - initialCount).toBeLessThan(3);
    });

    it('should create new connections when pool is exhausted up to max limit', async () => {
      // Get initial connection count
      const initialCount = await connectionPool.getActiveConnectionCount();
      
      // Create more concurrent operations than initial connections
      const operations = [];
      for (let i = 0; i < testDbConfig.maxConnections + 2; i++) {
        operations.push(prismaService.$queryRaw`SELECT ${i} as result`);
      }
      
      // Execute operations concurrently
      await Promise.all(operations);
      
      // Get final connection count
      const finalCount = await connectionPool.getActiveConnectionCount();
      
      // Verify connection count increased but didn't exceed max
      expect(finalCount).toBeGreaterThan(initialCount);
      expect(finalCount).toBeLessThanOrEqual(testDbConfig.maxConnections);
    });

    it('should clean up idle connections after timeout', async () => {
      // Force create connections
      const operations = [];
      for (let i = 0; i < testDbConfig.maxConnections; i++) {
        operations.push(prismaService.$queryRaw`SELECT ${i} as result`);
      }
      await Promise.all(operations);
      
      // Get connection count after operations
      const countAfterOperations = await connectionPool.getActiveConnectionCount();
      
      // Manually trigger idle connection cleanup with a short timeout
      connectionPool['connectionIdleTimeout'] = 100; // 100ms for test
      await connectionPool.cleanupIdleConnections();
      
      // Wait for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Get connection count after cleanup
      const countAfterCleanup = await connectionPool.getActiveConnectionCount();
      
      // Verify idle connections were cleaned up
      expect(countAfterCleanup).toBeLessThan(countAfterOperations);
      expect(countAfterCleanup).toBeGreaterThanOrEqual(testDbConfig.minConnections);
    });
  });

  describe('Connection Health Monitoring', () => {
    it('should validate connection health before providing it', async () => {
      // Spy on connection health's validate method
      const validateSpy = jest.spyOn(connectionHealth, 'validateConnection');
      
      // Perform a database operation
      await prismaService.$queryRaw`SELECT 1 as result`;
      
      // Verify connection was validated
      expect(validateSpy).toHaveBeenCalled();
    });

    it('should mark connection as unhealthy when validation fails', async () => {
      // Create a test connection
      const connection = await connectionPool.createConnection();
      
      // Mock validation to fail
      jest.spyOn(connectionHealth, 'validateConnection').mockImplementationOnce(async () => {
        throw new ConnectionException(
          'Connection validation failed',
          DatabaseErrorType.CONNECTION,
          DatabaseErrorSeverity.CRITICAL,
          DatabaseErrorRecoverability.TRANSIENT
        );
      });
      
      // Try to validate the connection
      let isHealthy = true;
      try {
        await connectionHealth.validateConnection(connection);
      } catch (error) {
        isHealthy = false;
      }
      
      // Verify connection is marked as unhealthy
      expect(isHealthy).toBe(false);
    });

    it('should perform periodic health checks on idle connections', async () => {
      // Spy on connection health's checkAllConnections method
      const checkSpy = jest.spyOn(connectionHealth, 'checkAllConnections');
      
      // Manually trigger health check
      await connectionHealth.checkAllConnections();
      
      // Verify health check was performed
      expect(checkSpy).toHaveBeenCalled();
    });

    it('should remove unhealthy connections from the pool', async () => {
      // Get initial connection count
      const initialCount = await connectionPool.getActiveConnectionCount();
      
      // Create a test connection
      const connection = await connectionPool.createConnection();
      
      // Add connection to pool
      connectionPool['connections'].push(connection);
      
      // Mock validation to fail for this specific connection
      const originalValidate = connectionHealth.validateConnection;
      jest.spyOn(connectionHealth, 'validateConnection').mockImplementation(async (conn) => {
        if (conn === connection) {
          throw new ConnectionException(
            'Connection validation failed',
            DatabaseErrorType.CONNECTION,
            DatabaseErrorSeverity.CRITICAL,
            DatabaseErrorRecoverability.TRANSIENT
          );
        }
        return originalValidate.call(connectionHealth, conn);
      });
      
      // Perform health check
      await connectionHealth.checkAllConnections();
      
      // Get final connection count
      const finalCount = await connectionPool.getActiveConnectionCount();
      
      // Verify unhealthy connection was removed
      expect(finalCount).toBeLessThanOrEqual(initialCount);
      
      // Restore original validation
      jest.spyOn(connectionHealth, 'validateConnection').mockRestore();
    });
  });

  describe('Connection Retry Mechanisms', () => {
    it('should retry failed connection attempts', async () => {
      // Spy on connection retry's retry method
      const retrySpy = jest.spyOn(connectionRetry, 'retryOperation');
      
      // Mock connection creation to fail once then succeed
      let attempts = 0;
      const originalCreate = connectionPool.createConnection;
      jest.spyOn(connectionPool, 'createConnection').mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw new ConnectionException(
            'Connection creation failed',
            DatabaseErrorType.CONNECTION,
            DatabaseErrorSeverity.CRITICAL,
            DatabaseErrorRecoverability.TRANSIENT
          );
        }
        return originalCreate.call(connectionPool);
      });
      
      // Attempt to acquire a connection
      await connectionManager.getConnection();
      
      // Verify retry was attempted
      expect(retrySpy).toHaveBeenCalled();
      expect(attempts).toBe(2);
      
      // Restore original implementation
      jest.spyOn(connectionPool, 'createConnection').mockRestore();
    });

    it('should use exponential backoff for retries', async () => {
      // Spy on setTimeout to verify backoff
      jest.useFakeTimers();
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      // Mock connection creation to always fail
      jest.spyOn(connectionPool, 'createConnection').mockImplementation(async () => {
        throw new ConnectionException(
          'Connection creation failed',
          DatabaseErrorType.CONNECTION,
          DatabaseErrorSeverity.CRITICAL,
          DatabaseErrorRecoverability.TRANSIENT
        );
      });
      
      // Attempt to acquire a connection (will fail after retries)
      try {
        const promise = connectionManager.getConnection();
        
        // Fast-forward through retries
        for (let i = 0; i < testDbConfig.retryAttempts; i++) {
          jest.runAllTimers();
        }
        
        await promise;
      } catch (error) {
        // Expected to fail
      }
      
      // Verify setTimeout was called with increasing delays
      const delays = setTimeoutSpy.mock.calls.map(call => call[1]);
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThan(delays[i-1]);
      }
      
      // Restore mocks
      jest.spyOn(connectionPool, 'createConnection').mockRestore();
      jest.useRealTimers();
    });

    it('should stop retrying after maximum attempts', async () => {
      // Mock connection creation to always fail
      jest.spyOn(connectionPool, 'createConnection').mockImplementation(async () => {
        throw new ConnectionException(
          'Connection creation failed',
          DatabaseErrorType.CONNECTION,
          DatabaseErrorSeverity.CRITICAL,
          DatabaseErrorRecoverability.TRANSIENT
        );
      });
      
      // Attempt to acquire a connection
      let error: any;
      try {
        await connectionManager.getConnection();
      } catch (e) {
        error = e;
      }
      
      // Verify error was thrown after max retries
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(ConnectionException);
      expect(error.message).toContain('Maximum retry attempts exceeded');
      
      // Restore original implementation
      jest.spyOn(connectionPool, 'createConnection').mockRestore();
    });
  });

  describe('Journey-Specific Connection Optimization', () => {
    it('should provide optimized connections for Health journey', async () => {
      // Spy on connection manager's getConnection method
      const getConnectionSpy = jest.spyOn(connectionManager, 'getConnection');
      
      // Perform a health journey operation
      await healthContext.getHealthMetrics({ userId: '1' });
      
      // Verify connection was acquired with health journey context
      expect(getConnectionSpy).toHaveBeenCalledWith(
        expect.objectContaining({ journey: 'health' })
      );
    });

    it('should provide optimized connections for Care journey', async () => {
      // Spy on connection manager's getConnection method
      const getConnectionSpy = jest.spyOn(connectionManager, 'getConnection');
      
      // Perform a care journey operation
      await careContext.getAppointments({ userId: '1' });
      
      // Verify connection was acquired with care journey context
      expect(getConnectionSpy).toHaveBeenCalledWith(
        expect.objectContaining({ journey: 'care' })
      );
    });

    it('should provide optimized connections for Plan journey', async () => {
      // Spy on connection manager's getConnection method
      const getConnectionSpy = jest.spyOn(connectionManager, 'getConnection');
      
      // Perform a plan journey operation
      await planContext.getInsurancePlans({ userId: '1' });
      
      // Verify connection was acquired with plan journey context
      expect(getConnectionSpy).toHaveBeenCalledWith(
        expect.objectContaining({ journey: 'plan' })
      );
    });

    it('should apply journey-specific optimizations to connections', async () => {
      // Spy on connection manager's optimizeConnection method
      const optimizeSpy = jest.spyOn(connectionManager, 'optimizeConnection');
      
      // Perform operations for different journeys
      await healthContext.getHealthMetrics({ userId: '1' });
      await careContext.getAppointments({ userId: '1' });
      await planContext.getInsurancePlans({ userId: '1' });
      
      // Verify optimization was applied for each journey
      expect(optimizeSpy).toHaveBeenCalledTimes(3);
      expect(optimizeSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ journey: 'health' })
      );
      expect(optimizeSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ journey: 'care' })
      );
      expect(optimizeSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ journey: 'plan' })
      );
    });
  });

  describe('Graceful Termination', () => {
    it('should close all connections during application shutdown', async () => {
      // Spy on connection pool's closeAllConnections method
      const closeAllSpy = jest.spyOn(connectionPool, 'closeAllConnections');
      
      // Create a new application instance for this test
      const testModuleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({ database: testDbConfig })]
          }),
          DatabaseModule.forRoot({
            isGlobal: true
          })
        ]
      }).compile();
      
      const testApp = testModuleRef.createNestApplication();
      await testApp.init();
      
      // Close the application
      await testApp.close();
      
      // Verify all connections were closed
      expect(closeAllSpy).toHaveBeenCalled();
    });

    it('should wait for active queries to complete before closing connections', async () => {
      // Create a new connection pool for this test
      const testPool = new ConnectionPool(
        new ConnectionConfig(testDbConfig),
        mockLogger
      );
      
      // Create a connection with a long-running query
      const connection = await testPool.createConnection();
      const queryPromise = new Promise<void>(resolve => {
        // Simulate a long-running query
        setTimeout(() => {
          resolve();
        }, 100);
      });
      
      // Mark connection as busy
      testPool['busyConnections'].set(connection, queryPromise);
      
      // Start connection closing
      const closePromise = testPool.closeAllConnections();
      
      // Verify close promise doesn't resolve immediately
      const isResolved = await Promise.race([
        closePromise.then(() => true),
        new Promise(resolve => setTimeout(() => resolve(false), 50))
      ]);
      
      expect(isResolved).toBe(false);
      
      // Wait for close to complete
      await closePromise;
      
      // Verify connections were closed
      expect(testPool['connections'].length).toBe(0);
    });

    it('should release resources when PrismaService is destroyed', async () => {
      // Spy on PrismaService's onModuleDestroy method
      const onModuleDestroySpy = jest.spyOn(prismaService, 'onModuleDestroy');
      
      // Create a new application instance for this test
      const testModuleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({ database: testDbConfig })]
          }),
          DatabaseModule.forRoot({
            isGlobal: true
          })
        ]
      }).compile();
      
      const testApp = testModuleRef.createNestApplication();
      await testApp.init();
      
      // Get PrismaService instance
      const testPrismaService = testModuleRef.get<PrismaService>(PrismaService);
      
      // Close the application
      await testApp.close();
      
      // Verify onModuleDestroy was called
      expect(onModuleDestroySpy).toHaveBeenCalled();
    });
  });
});