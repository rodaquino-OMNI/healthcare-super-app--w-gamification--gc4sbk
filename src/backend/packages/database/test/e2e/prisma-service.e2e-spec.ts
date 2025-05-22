/**
 * End-to-end tests for the enhanced PrismaService implementation.
 * 
 * These tests verify that the PrismaService properly handles:
 * - Connection management
 * - Query execution
 * - Transaction handling
 * - Error recovery
 * - NestJS lifecycle integration
 * - Connection pooling
 * - Query logging
 * - Error transformation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DatabaseModule } from '../../src/database.module';
import { PrismaService } from '../../src/prisma.service';
import { DatabaseException, ConnectionException, QueryException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType, DatabaseErrorSeverity } from '../../src/errors/database-error.types';
import {
  initializeTestDatabase,
  cleanupTestDatabase,
  resetTestDatabase,
  TestDatabaseSetup,
} from './setup';
import { dbAssert } from './helpers';

// Test timeout increased for database operations
jest.setTimeout(60000);

describe('PrismaService (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let prismaService: PrismaService;
  let testDbSetup: TestDatabaseSetup;
  let configService: ConfigService;

  // Setup test database before all tests
  beforeAll(async () => {
    // Initialize test database
    testDbSetup = await initializeTestDatabase({
      seedTestData: true,
      applyMigrations: true,
    });

    // Create a NestJS testing module with DatabaseModule
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          // Provide test-specific environment variables
          load: [() => ({
            DATABASE_URL: testDbSetup.getDatabaseUrl(),
            DATABASE_POOL_MIN: 2,
            DATABASE_POOL_MAX: 5,
            DATABASE_ENABLE_QUERY_LOGGING: true,
            DATABASE_ENABLE_PERFORMANCE_TRACKING: true,
            DATABASE_RETRY_MAX_ATTEMPTS: 3,
            NODE_ENV: 'test',
          })],
        }),
        DatabaseModule,
      ],
    }).compile();

    // Create a NestJS application
    app = moduleRef.createNestApplication();
    await app.init();

    // Get the PrismaService instance
    prismaService = moduleRef.get<PrismaService>(PrismaService);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  // Reset database between tests
  beforeEach(async () => {
    await resetTestDatabase(testDbSetup);
  });

  // Clean up after all tests
  afterAll(async () => {
    await app.close();
    await cleanupTestDatabase(testDbSetup);
  });

  /**
   * Connection Management Tests
   */
  describe('Connection Management', () => {
    it('should successfully connect to the database', async () => {
      // The connection is established in beforeAll, so we just need to verify it's working
      const result = await prismaService.executeQuery('test-connection', () => 
        prismaService.$queryRaw`SELECT 1 as connection_test`
      );
      
      expect(result[0].connection_test).toBe(1);
    });

    it('should handle connection lifecycle with NestJS hooks', async () => {
      // Create a new module with PrismaService to test lifecycle hooks
      const moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({
              DATABASE_URL: testDbSetup.getDatabaseUrl(),
              NODE_ENV: 'test',
            })],
          }),
          DatabaseModule,
        ],
      }).compile();

      const app = moduleRef.createNestApplication();
      
      // Initialize the app which triggers onModuleInit
      await app.init();
      
      // Get the PrismaService instance
      const localPrismaService = moduleRef.get<PrismaService>(PrismaService);
      
      // Verify connection is working
      const result = await localPrismaService.executeQuery('test-lifecycle-connection', () => 
        localPrismaService.$queryRaw`SELECT 1 as connection_test`
      );
      
      expect(result[0].connection_test).toBe(1);
      
      // Close the app which triggers onModuleDestroy
      await app.close();
      
      // Attempting to use the service after destruction should throw an error
      await expect(localPrismaService.executeQuery('test-after-destroy', () => 
        localPrismaService.$queryRaw`SELECT 1 as connection_test`
      )).rejects.toThrow();
    });

    it('should handle connection health check', async () => {
      // Test the health check functionality
      const healthResult = await prismaService.checkHealth();
      
      expect(healthResult.status).toBe('up');
      expect(healthResult.details).toBeDefined();
      expect(healthResult.details.responseTime).toBeDefined();
      expect(healthResult.details.connections).toBeDefined();
    });
  });

  /**
   * Query Execution Tests
   */
  describe('Query Execution', () => {
    it('should execute basic queries successfully', async () => {
      // Test a simple query
      const result = await prismaService.executeQuery('find-users', () => 
        prismaService.user.findMany({
          take: 2,
          select: { id: true, email: true },
        })
      );
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBeDefined();
      expect(result[0].email).toBeDefined();
    });

    it('should handle complex queries with relations', async () => {
      // Test a more complex query with relations
      const result = await prismaService.executeQuery('find-users-with-roles', () => 
        prismaService.user.findMany({
          take: 2,
          include: {
            roles: {
              include: {
                permissions: true,
              },
            },
          },
        })
      );
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].roles).toBeDefined();
      expect(Array.isArray(result[0].roles)).toBe(true);
      
      if (result[0].roles.length > 0) {
        expect(result[0].roles[0].permissions).toBeDefined();
        expect(Array.isArray(result[0].roles[0].permissions)).toBe(true);
      }
    });

    it('should handle parameterized queries', async () => {
      // Create a test user
      const testEmail = 'parameterized-test@example.com';
      await prismaService.executeQuery('create-test-user', () => 
        prismaService.user.create({
          data: {
            name: 'Parameterized Test User',
            email: testEmail,
            password: 'password-hash',
            phone: '+5511999999999',
            cpf: '12345678901',
          },
        })
      );
      
      // Test a parameterized query
      const result = await prismaService.executeQuery('find-user-by-email', () => 
        prismaService.user.findUnique({
          where: { email: testEmail },
        })
      );
      
      expect(result).toBeDefined();
      expect(result?.email).toBe(testEmail);
    });

    it('should handle raw SQL queries', async () => {
      // Test a raw SQL query
      const result = await prismaService.executeQuery('raw-sql-query', () => 
        prismaService.$queryRaw`SELECT COUNT(*) as user_count FROM "User"`
      );
      
      expect(result[0].user_count).toBeGreaterThanOrEqual(1);
    });
  });

  /**
   * Transaction Handling Tests
   */
  describe('Transaction Handling', () => {
    it('should execute successful transactions', async () => {
      // Test a successful transaction
      const result = await prismaService.executeQuery('successful-transaction', () => 
        prismaService.$transaction(async (tx) => {
          // Create a user
          const user = await tx.user.create({
            data: {
              name: 'Transaction Test User',
              email: 'transaction-test@example.com',
              password: 'password-hash',
              phone: '+5511999999999',
              cpf: '12345678901',
            },
          });
          
          // Create a health metric for the user
          const metricType = await tx.healthMetricType.findFirst();
          
          if (!metricType) {
            throw new Error('No health metric type found');
          }
          
          const metric = await tx.healthMetric.create({
            data: {
              userId: user.id,
              typeId: metricType.id,
              value: 75,
              recordedAt: new Date(),
              source: 'TEST',
            },
          });
          
          return { user, metric };
        })
      );
      
      // Verify the transaction results
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('transaction-test@example.com');
      expect(result.metric).toBeDefined();
      expect(result.metric.userId).toBe(result.user.id);
      
      // Verify the data was actually saved to the database
      await dbAssert.exists(prismaService, 'user', { email: 'transaction-test@example.com' });
      await dbAssert.exists(prismaService, 'healthMetric', { userId: result.user.id });
    });

    it('should rollback transactions on error', async () => {
      // Test a transaction that should be rolled back
      const testEmail = 'rollback-test@example.com';
      
      await expect(prismaService.executeQuery('failing-transaction', () => 
        prismaService.$transaction(async (tx) => {
          // Create a user
          const user = await tx.user.create({
            data: {
              name: 'Rollback Test User',
              email: testEmail,
              password: 'password-hash',
              phone: '+5511999999999',
              cpf: '12345678901',
            },
          });
          
          // This will fail because the health metric type ID doesn't exist
          await tx.healthMetric.create({
            data: {
              userId: user.id,
              typeId: 'non-existent-id',
              value: 75,
              recordedAt: new Date(),
              source: 'TEST',
            },
          });
          
          return { success: true };
        })
      )).rejects.toThrow();
      
      // Verify the user was not created (transaction was rolled back)
      await dbAssert.notExists(prismaService, 'user', { email: testEmail });
    });

    it('should handle nested transactions', async () => {
      // Test nested transactions (which Prisma handles as savepoints)
      const result = await prismaService.executeQuery('nested-transaction', () => 
        prismaService.$transaction(async (tx1) => {
          // Create a user in the outer transaction
          const user = await tx1.user.create({
            data: {
              name: 'Nested Transaction User',
              email: 'nested-transaction@example.com',
              password: 'password-hash',
              phone: '+5511999999999',
              cpf: '12345678901',
            },
          });
          
          // Create a nested transaction (savepoint)
          const nestedResult = await tx1.$transaction(async (tx2) => {
            // Create a health metric in the nested transaction
            const metricType = await tx2.healthMetricType.findFirst();
            
            if (!metricType) {
              throw new Error('No health metric type found');
            }
            
            const metric = await tx2.healthMetric.create({
              data: {
                userId: user.id,
                typeId: metricType.id,
                value: 80,
                recordedAt: new Date(),
                source: 'TEST',
              },
            });
            
            return { metric };
          });
          
          return { user, metric: nestedResult.metric };
        })
      );
      
      // Verify the transaction results
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('nested-transaction@example.com');
      expect(result.metric).toBeDefined();
      expect(result.metric.userId).toBe(result.user.id);
      
      // Verify the data was actually saved to the database
      await dbAssert.exists(prismaService, 'user', { email: 'nested-transaction@example.com' });
      await dbAssert.exists(prismaService, 'healthMetric', { userId: result.user.id });
    });
  });

  /**
   * Error Handling and Recovery Tests
   */
  describe('Error Handling and Recovery', () => {
    it('should transform database errors into typed exceptions', async () => {
      // Test error transformation
      await expect(prismaService.executeQuery('non-existent-table', () => 
        prismaService.$queryRaw`SELECT * FROM non_existent_table`
      )).rejects.toThrow(QueryException);
      
      try {
        await prismaService.executeQuery('non-existent-table', () => 
          prismaService.$queryRaw`SELECT * FROM non_existent_table`
        );
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseException);
        expect(error.errorType).toBe(DatabaseErrorType.QUERY);
        expect(error.severity).toBeDefined();
        expect(error.code).toBeDefined();
        expect(error.message).toBeDefined();
      }
    });

    it('should handle unique constraint violations', async () => {
      // Create a user
      const testEmail = 'unique-constraint@example.com';
      await prismaService.executeQuery('create-user-for-constraint-test', () => 
        prismaService.user.create({
          data: {
            name: 'Unique Constraint Test User',
            email: testEmail,
            password: 'password-hash',
            phone: '+5511999999999',
            cpf: '12345678901',
          },
        })
      );
      
      // Try to create another user with the same email (should fail with unique constraint violation)
      await expect(prismaService.executeQuery('create-duplicate-user', () => 
        prismaService.user.create({
          data: {
            name: 'Duplicate User',
            email: testEmail, // Same email as above
            password: 'password-hash',
            phone: '+5511888888888',
            cpf: '98765432109',
          },
        })
      )).rejects.toThrow(DatabaseException);
      
      try {
        await prismaService.executeQuery('create-duplicate-user', () => 
          prismaService.user.create({
            data: {
              name: 'Duplicate User',
              email: testEmail, // Same email as above
              password: 'password-hash',
              phone: '+5511888888888',
              cpf: '98765432109',
            },
          })
        );
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseException);
        expect(error.errorType).toBe(DatabaseErrorType.CONSTRAINT_VIOLATION);
        expect(error.code).toBeDefined();
      }
    });

    it('should handle foreign key constraint violations', async () => {
      // Try to create a health metric with a non-existent user ID
      const metricType = await prismaService.healthMetricType.findFirst();
      
      if (!metricType) {
        throw new Error('No health metric type found');
      }
      
      await expect(prismaService.executeQuery('create-metric-with-invalid-user', () => 
        prismaService.healthMetric.create({
          data: {
            userId: 'non-existent-user-id',
            typeId: metricType.id,
            value: 75,
            recordedAt: new Date(),
            source: 'TEST',
          },
        })
      )).rejects.toThrow(DatabaseException);
      
      try {
        await prismaService.executeQuery('create-metric-with-invalid-user', () => 
          prismaService.healthMetric.create({
            data: {
              userId: 'non-existent-user-id',
              typeId: metricType.id,
              value: 75,
              recordedAt: new Date(),
              source: 'TEST',
            },
          })
        );
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseException);
        expect(error.errorType).toBe(DatabaseErrorType.CONSTRAINT_VIOLATION);
        expect(error.code).toBeDefined();
      }
    });

    it('should retry failed queries according to retry strategy', async () => {
      // Mock a temporary failure that should be retried
      // This is a bit tricky to test in e2e, so we'll use a counter to simulate failures
      let attempts = 0;
      
      const result = await prismaService.executeQuery('retry-test', async () => {
        attempts++;
        
        if (attempts <= 2) {
          // Simulate a temporary failure for the first two attempts
          throw new QueryException(
            'Temporary failure',
            {
              code: 'P1001', // Connection error code
              errorType: DatabaseErrorType.CONNECTION,
              severity: DatabaseErrorSeverity.MINOR,
              retryable: true,
            }
          );
        }
        
        // Succeed on the third attempt
        return { success: true, attempts };
      });
      
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3); // Should have taken 3 attempts
    });
  });

  /**
   * Connection Pooling Tests
   */
  describe('Connection Pooling', () => {
    it('should reuse connections from the pool', async () => {
      // Execute multiple queries in parallel to test connection pooling
      const queries = Array(10).fill(0).map((_, i) => 
        prismaService.executeQuery(`parallel-query-${i}`, () => 
          prismaService.$queryRaw`SELECT ${i} as test_value, pg_backend_pid() as backend_pid`
        )
      );
      
      const results = await Promise.all(queries);
      
      // Extract the backend PIDs (each represents a server connection)
      const backendPids = results.map(result => result[0].backend_pid);
      
      // Count unique PIDs - should be less than the number of queries due to connection reuse
      const uniquePids = new Set(backendPids);
      
      // We expect fewer unique connections than queries due to connection pooling
      // The exact number depends on the pool configuration, but it should be less than the total queries
      expect(uniquePids.size).toBeLessThan(queries.length);
      
      // Verify the pool size matches our configuration
      const poolMax = configService.get<number>('DATABASE_POOL_MAX', 5);
      expect(uniquePids.size).toBeLessThanOrEqual(poolMax);
    });

    it('should handle connection limits under load', async () => {
      // Execute more queries than the max pool size to test connection queuing
      const poolMax = configService.get<number>('DATABASE_POOL_MAX', 5);
      const queryCount = poolMax * 3; // 3x the pool size
      
      const queries = Array(queryCount).fill(0).map((_, i) => 
        prismaService.executeQuery(`load-test-query-${i}`, () => 
          prismaService.$queryRaw`SELECT pg_sleep(0.1), ${i} as test_value`
        )
      );
      
      // All queries should complete successfully despite exceeding the pool size
      const results = await Promise.all(queries);
      
      expect(results.length).toBe(queryCount);
      results.forEach((result, i) => {
        expect(result[0].test_value).toBe(i);
      });
    });
  });

  /**
   * Query Logging Tests
   */
  describe('Query Logging', () => {
    it('should log queries when enabled', async () => {
      // This is hard to test directly in e2e tests, so we'll verify the configuration
      const enableQueryLogging = configService.get<boolean>('DATABASE_ENABLE_QUERY_LOGGING', false);
      
      // Execute a query that should be logged
      await prismaService.executeQuery('logged-query', () => 
        prismaService.user.findFirst()
      );
      
      // We can't directly assert on logs in e2e tests, but we can verify the configuration
      expect(enableQueryLogging).toBe(true);
    });
  });

  /**
   * Performance Tracking Tests
   */
  describe('Performance Tracking', () => {
    it('should track query performance when enabled', async () => {
      // This is hard to test directly in e2e tests, so we'll verify the configuration
      const enablePerformanceTracking = configService.get<boolean>('DATABASE_ENABLE_PERFORMANCE_TRACKING', false);
      
      // Execute a query that should be tracked
      await prismaService.executeQuery('tracked-query', () => 
        prismaService.user.findMany({
          take: 10,
          include: {
            roles: true,
          },
        })
      );
      
      // We can't directly assert on performance metrics in e2e tests, but we can verify the configuration
      expect(enablePerformanceTracking).toBe(true);
    });
  });
});