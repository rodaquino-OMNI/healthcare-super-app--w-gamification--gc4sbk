/**
 * End-to-end tests for the enhanced PrismaService implementation.
 * 
 * These tests validate the PrismaService against a real database, ensuring that
 * connection management, query execution, transaction handling, and error recovery
 * functionality work correctly in a production-like environment.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma.service';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import { JourneyType } from '../../src/types/journey.types';
import { TransactionIsolationLevel } from '../../src/types/transaction.types';
import {
  createTestDatabase,
  destroyTestDatabase,
  TestDatabaseInfo,
  setupTestEnvironment,
  restoreEnvironment,
} from '../utils/database-test.utils';

// Test timeout increased for e2e tests that involve database operations
jest.setTimeout(30000);

describe('PrismaService (e2e)', () => {
  let app: INestApplication;
  let testDb: TestDatabaseInfo;
  let prismaService: PrismaService;
  let originalEnv: Record<string, string | undefined>;
  
  // Set up test environment before all tests
  beforeAll(async () => {
    // Save and set up environment variables
    originalEnv = setupTestEnvironment();
    
    // Create a test database
    testDb = await createTestDatabase({
      seedDatabase: true,
      enableLogging: true,
      journeyContext: 'all',
    });
    
    // Create a testing module with PrismaService
    @Module({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            database: {
              url: testDb.url,
              journeyType: JourneyType.HEALTH,
              enableLogging: true,
              enablePerformanceTracking: true,
              connectionPool: {
                minConnections: 2,
                maxConnections: 5,
                maxIdleConnections: 3,
                connectionTimeout: 3000,
              },
              retry: {
                maxRetries: 3,
                baseDelay: 50,
                maxDelay: 1000,
                useJitter: true,
              },
            },
          })],
        }),
      ],
      providers: [
        {
          provide: PrismaService,
          useFactory: (configService: ConfigService) => {
            const dbConfig = configService.get('database');
            return new PrismaService({
              datasources: {
                db: {
                  url: dbConfig.url,
                },
              },
              journeyType: dbConfig.journeyType,
              enableLogging: dbConfig.enableLogging,
              enablePerformanceTracking: dbConfig.enablePerformanceTracking,
              connectionPool: dbConfig.connectionPool,
              retry: dbConfig.retry,
            });
          },
          inject: [ConfigService],
        },
      ],
      exports: [PrismaService],
    })
    class TestModule {}
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Get the PrismaService instance
    prismaService = app.get<PrismaService>(PrismaService);
  });
  
  // Clean up after all tests
  afterAll(async () => {
    // Close the application
    await app?.close();
    
    // Destroy the test database
    if (testDb) {
      await destroyTestDatabase(testDb.schema);
    }
    
    // Restore environment variables
    restoreEnvironment(originalEnv);
  });
  
  /**
   * Tests for NestJS lifecycle integration
   */
  describe('NestJS Lifecycle Integration', () => {
    it('should initialize and connect to the database during onModuleInit', async () => {
      // Create a new instance for this test
      const service = new PrismaService({
        datasources: {
          db: {
            url: testDb.url,
          },
        },
      });
      
      // Initialize the service
      await service.onModuleInit();
      
      // Verify connection is established by executing a simple query
      const result = await service.$queryRaw`SELECT 1 as test`;
      expect(result).toEqual([{ test: 1 }]);
      
      // Clean up
      await service.onModuleDestroy();
    });
    
    it('should properly disconnect during onModuleDestroy', async () => {
      // Create a new instance for this test
      const service = new PrismaService({
        datasources: {
          db: {
            url: testDb.url,
          },
        },
      });
      
      // Initialize the service
      await service.onModuleInit();
      
      // Spy on the $disconnect method
      const disconnectSpy = jest.spyOn(service, '$disconnect');
      
      // Destroy the service
      await service.onModuleDestroy();
      
      // Verify $disconnect was called
      expect(disconnectSpy).toHaveBeenCalled();
      
      // Verify connection is closed by checking that queries now fail
      await expect(service.$queryRaw`SELECT 1 as test`).rejects.toThrow();
    });
  });
  
  /**
   * Tests for connection management and pooling
   */
  describe('Connection Management and Pooling', () => {
    it('should provide connection statistics', async () => {
      // Get connection stats
      const stats = prismaService.getConnectionStats();
      
      // Verify stats object structure
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('idle');
      expect(stats).toHaveProperty('waiting');
      
      // Verify stats are numbers
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.active).toBe('number');
      expect(typeof stats.idle).toBe('number');
      expect(typeof stats.waiting).toBe('number');
    });
    
    it('should handle multiple concurrent connections', async () => {
      // Create multiple concurrent queries
      const concurrentQueries = 5;
      const queries = Array(concurrentQueries).fill(0).map(() => 
        prismaService.$queryRaw`SELECT pg_sleep(0.1), 1 as test`
      );
      
      // Execute all queries concurrently
      const results = await Promise.all(queries);
      
      // Verify all queries succeeded
      results.forEach(result => {
        expect(result[0]).toHaveProperty('test', 1);
      });
      
      // Get connection stats after queries
      const stats = prismaService.getConnectionStats();
      
      // Verify connection pooling worked (should have at least some connections)
      expect(stats.total).toBeGreaterThan(0);
    });
    
    it('should check database health', async () => {
      // Check database health
      const health = await prismaService.checkHealth();
      
      // Verify health check succeeded
      expect(health).toHaveProperty('healthy', true);
    });
    
    it('should handle connection acquisition and release', async () => {
      // Get a connection from the pool
      const connection = await prismaService.getConnection();
      
      // Verify connection is valid
      expect(connection).toBeDefined();
      
      // Release the connection back to the pool
      prismaService.releaseConnection(connection);
      
      // Verify we can still execute queries after releasing
      const result = await prismaService.$queryRaw`SELECT 1 as test`;
      expect(result).toEqual([{ test: 1 }]);
    });
  });
  
  /**
   * Tests for error handling and transformation
   */
  describe('Error Handling and Transformation', () => {
    it('should transform Prisma errors into DatabaseExceptions', async () => {
      // Attempt to query a non-existent table
      try {
        await prismaService.$queryRaw`SELECT * FROM nonexistent_table`;
        fail('Query should have thrown an error');
      } catch (error) {
        // Verify error is a DatabaseException
        expect(error).toBeInstanceOf(DatabaseException);
        
        // Verify error properties
        const dbError = error as DatabaseException;
        expect(dbError.type).toBe(DatabaseErrorType.CONFIGURATION);
        expect(dbError.message).toContain('table');
      }
    });
    
    it('should handle unique constraint violations', async () => {
      // Create a user
      const email = `test-${Date.now()}@example.com`;
      await prismaService.user.create({
        data: {
          name: 'Test User',
          email,
          password: 'password',
        },
      });
      
      // Attempt to create another user with the same email
      try {
        await prismaService.user.create({
          data: {
            name: 'Another Test User',
            email, // Same email as before
            password: 'password',
          },
        });
        fail('Create should have thrown a unique constraint error');
      } catch (error) {
        // Verify error is a DatabaseException
        expect(error).toBeInstanceOf(DatabaseException);
        
        // Verify error properties
        const dbError = error as DatabaseException;
        expect(dbError.type).toBe(DatabaseErrorType.INTEGRITY);
        expect(dbError.code).toContain('INTEGRITY_UNIQUE_CONSTRAINT');
      }
    });
    
    it('should handle not found errors', async () => {
      // Attempt to find a non-existent user
      try {
        await prismaService.user.findUniqueOrThrow({
          where: {
            id: 'nonexistent-id',
          },
        });
        fail('Query should have thrown a not found error');
      } catch (error) {
        // Verify error is a DatabaseException
        expect(error).toBeInstanceOf(DatabaseException);
        
        // Verify error properties
        const dbError = error as DatabaseException;
        expect(dbError.type).toBe(DatabaseErrorType.QUERY);
        expect(dbError.message).toContain('not found');
      }
    });
  });
  
  /**
   * Tests for query execution with retry mechanisms
   */
  describe('Query Execution with Retry', () => {
    it('should execute queries with retry for transient errors', async () => {
      // Mock a function that fails twice then succeeds
      let attempts = 0;
      const mockOperation = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts <= 2) {
          // Simulate a connection error
          const error = new Error('connection reset');
          error.name = 'PrismaClientKnownRequestError';
          (error as any).code = 'P1001';
          throw error;
        }
        return [{ success: true }];
      });
      
      // Execute with retry
      const result = await prismaService.executeWithRetry(mockOperation, {
        maxRetries: 3,
        baseDelay: 10,
        maxDelay: 100,
      });
      
      // Verify retry worked
      expect(mockOperation).toHaveBeenCalledTimes(3);
      expect(result).toEqual([{ success: true }]);
    });
    
    it('should give up after max retries', async () => {
      // Mock a function that always fails
      const mockOperation = jest.fn().mockImplementation(async () => {
        // Simulate a connection error
        const error = new Error('connection reset');
        error.name = 'PrismaClientKnownRequestError';
        (error as any).code = 'P1001';
        throw error;
      });
      
      // Execute with retry
      try {
        await prismaService.executeWithRetry(mockOperation, {
          maxRetries: 2,
          baseDelay: 10,
          maxDelay: 100,
        });
        fail('Should have thrown after max retries');
      } catch (error) {
        // Verify error is a DatabaseException
        expect(error).toBeInstanceOf(DatabaseException);
        
        // Verify retry attempts
        expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
      }
    });
    
    it('should not retry permanent errors', async () => {
      // Mock a function that fails with a permanent error
      const mockOperation = jest.fn().mockImplementation(async () => {
        // Simulate a validation error
        const error = new Error('Invalid query arguments');
        error.name = 'PrismaClientValidationError';
        throw error;
      });
      
      // Execute with retry
      try {
        await prismaService.executeWithRetry(mockOperation, {
          maxRetries: 3,
          baseDelay: 10,
          maxDelay: 100,
        });
        fail('Should have thrown immediately');
      } catch (error) {
        // Verify error is a DatabaseException
        expect(error).toBeInstanceOf(DatabaseException);
        
        // Verify no retry attempts were made
        expect(mockOperation).toHaveBeenCalledTimes(1);
      }
    });
  });
  
  /**
   * Tests for transaction management
   */
  describe('Transaction Management', () => {
    it('should execute operations within a transaction', async () => {
      // Execute a transaction that creates a user
      const email = `transaction-test-${Date.now()}@example.com`;
      const user = await prismaService.$executeInTransaction(async (tx) => {
        return tx.user.create({
          data: {
            name: 'Transaction Test User',
            email,
            password: 'password',
          },
        });
      });
      
      // Verify user was created
      expect(user).toHaveProperty('email', email);
      
      // Verify user exists in the database
      const foundUser = await prismaService.user.findUnique({
        where: { email },
      });
      expect(foundUser).toHaveProperty('email', email);
    });
    
    it('should roll back transactions on error', async () => {
      // Execute a transaction that creates a user then fails
      const email = `rollback-test-${Date.now()}@example.com`;
      try {
        await prismaService.$executeInTransaction(async (tx) => {
          // Create a user
          await tx.user.create({
            data: {
              name: 'Rollback Test User',
              email,
              password: 'password',
            },
          });
          
          // Throw an error to trigger rollback
          throw new Error('Intentional error to trigger rollback');
        });
        fail('Transaction should have thrown an error');
      } catch (error) {
        // Verify error was propagated
        expect(error.message).toContain('Intentional error');
        
        // Verify user was not created (transaction was rolled back)
        const foundUser = await prismaService.user.findUnique({
          where: { email },
        });
        expect(foundUser).toBeNull();
      }
    });
    
    it('should support different isolation levels', async () => {
      // Execute a transaction with READ_COMMITTED isolation level
      const email = `isolation-test-${Date.now()}@example.com`;
      const user = await prismaService.$executeInTransaction(
        async (tx) => {
          return tx.user.create({
            data: {
              name: 'Isolation Test User',
              email,
              password: 'password',
            },
          });
        },
        { isolationLevel: TransactionIsolationLevel.READ_COMMITTED }
      );
      
      // Verify user was created
      expect(user).toHaveProperty('email', email);
    });
  });
  
  /**
   * Tests for query logging and performance tracking
   */
  describe('Query Logging and Performance Tracking', () => {
    it('should log database operations when enabled', async () => {
      // Create a service with logging enabled
      const service = new PrismaService({
        datasources: {
          db: {
            url: testDb.url,
          },
        },
        enableLogging: true,
      });
      
      // Initialize the service
      await service.onModuleInit();
      
      // Spy on console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Execute a query
      await service.$queryRaw`SELECT 1 as test`;
      
      // Clean up
      await service.onModuleDestroy();
      consoleSpy.mockRestore();
      
      // Note: We can't easily verify that logging occurred since it's handled internally
      // by Prisma and our middleware. This test mainly ensures the query executes without errors
      // when logging is enabled.
    });
    
    it('should track query performance when enabled', async () => {
      // Create a service with performance tracking enabled
      const service = new PrismaService({
        datasources: {
          db: {
            url: testDb.url,
          },
        },
        enablePerformanceTracking: true,
      });
      
      // Initialize the service
      await service.onModuleInit();
      
      // Execute a query
      await service.$queryRaw`SELECT pg_sleep(0.1), 1 as test`;
      
      // Clean up
      await service.onModuleDestroy();
      
      // Note: We can't easily verify that performance tracking occurred since it's handled
      // internally by our middleware. This test mainly ensures the query executes without errors
      // when performance tracking is enabled.
    });
  });
  
  /**
   * Tests for basic CRUD operations
   */
  describe('CRUD Operations', () => {
    it('should create records', async () => {
      // Create a user
      const email = `create-test-${Date.now()}@example.com`;
      const user = await prismaService.user.create({
        data: {
          name: 'Create Test User',
          email,
          password: 'password',
        },
      });
      
      // Verify user was created
      expect(user).toHaveProperty('email', email);
      expect(user).toHaveProperty('id');
    });
    
    it('should read records', async () => {
      // Create a user
      const email = `read-test-${Date.now()}@example.com`;
      const createdUser = await prismaService.user.create({
        data: {
          name: 'Read Test User',
          email,
          password: 'password',
        },
      });
      
      // Read the user
      const foundUser = await prismaService.user.findUnique({
        where: { id: createdUser.id },
      });
      
      // Verify user was found
      expect(foundUser).toHaveProperty('email', email);
      expect(foundUser).toHaveProperty('id', createdUser.id);
    });
    
    it('should update records', async () => {
      // Create a user
      const email = `update-test-${Date.now()}@example.com`;
      const createdUser = await prismaService.user.create({
        data: {
          name: 'Update Test User',
          email,
          password: 'password',
        },
      });
      
      // Update the user
      const updatedName = 'Updated Name';
      const updatedUser = await prismaService.user.update({
        where: { id: createdUser.id },
        data: { name: updatedName },
      });
      
      // Verify user was updated
      expect(updatedUser).toHaveProperty('name', updatedName);
      expect(updatedUser).toHaveProperty('id', createdUser.id);
    });
    
    it('should delete records', async () => {
      // Create a user
      const email = `delete-test-${Date.now()}@example.com`;
      const createdUser = await prismaService.user.create({
        data: {
          name: 'Delete Test User',
          email,
          password: 'password',
        },
      });
      
      // Delete the user
      await prismaService.user.delete({
        where: { id: createdUser.id },
      });
      
      // Verify user was deleted
      const foundUser = await prismaService.user.findUnique({
        where: { id: createdUser.id },
      });
      expect(foundUser).toBeNull();
    });
  });
  
  /**
   * Tests for journey-specific optimizations
   */
  describe('Journey-Specific Optimizations', () => {
    it('should apply journey-specific middleware for health journey', async () => {
      // Create a service with health journey type
      const service = new PrismaService({
        datasources: {
          db: {
            url: testDb.url,
          },
        },
        journeyType: JourneyType.HEALTH,
      });
      
      // Initialize the service
      await service.onModuleInit();
      
      // Execute a health-related query
      // This is just to verify the service works with journey-specific configuration
      const result = await service.$queryRaw`SELECT 1 as health_test`;
      expect(result).toEqual([{ health_test: 1 }]);
      
      // Clean up
      await service.onModuleDestroy();
    });
    
    it('should apply journey-specific middleware for care journey', async () => {
      // Create a service with care journey type
      const service = new PrismaService({
        datasources: {
          db: {
            url: testDb.url,
          },
        },
        journeyType: JourneyType.CARE,
      });
      
      // Initialize the service
      await service.onModuleInit();
      
      // Execute a care-related query
      // This is just to verify the service works with journey-specific configuration
      const result = await service.$queryRaw`SELECT 1 as care_test`;
      expect(result).toEqual([{ care_test: 1 }]);
      
      // Clean up
      await service.onModuleDestroy();
    });
    
    it('should apply journey-specific middleware for plan journey', async () => {
      // Create a service with plan journey type
      const service = new PrismaService({
        datasources: {
          db: {
            url: testDb.url,
          },
        },
        journeyType: JourneyType.PLAN,
      });
      
      // Initialize the service
      await service.onModuleInit();
      
      // Execute a plan-related query
      // This is just to verify the service works with journey-specific configuration
      const result = await service.$queryRaw`SELECT 1 as plan_test`;
      expect(result).toEqual([{ plan_test: 1 }]);
      
      // Clean up
      await service.onModuleDestroy();
    });
  });
});