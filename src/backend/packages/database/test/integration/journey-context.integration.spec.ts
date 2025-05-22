/**
 * @file journey-context.integration.spec.ts
 * @description Integration tests for journey-specific database contexts, verifying the creation,
 * management, and optimization of database connections based on journey requirements.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma.service';
import { BaseJourneyContext } from '../../src/contexts/base-journey.context';
import { HealthContext } from '../../src/contexts/health.context';
import { CareContext } from '../../src/contexts/care.context';
import { PlanContext } from '../../src/contexts/plan.context';
import { ConnectionManager } from '../../src/connection/connection-manager';
import { DatabaseContextFactory } from '../../src/contexts/database-context.factory';
import { JourneyContextConfig } from '../../src/types/journey.types';
import { DatabaseOperationType, JourneyContext } from '../../src/middleware/middleware.interface';
import { DatabaseException } from '../../src/errors/database-error.exception';

/**
 * Mock implementation of PrismaClient for testing
 */
class MockPrismaClient {
  $queryRaw = jest.fn().mockResolvedValue([{ count: 1 }]);
  $queryRawUnsafe = jest.fn().mockResolvedValue([{ count: 1 }]);
  $transaction = jest.fn().mockImplementation(async (callback) => {
    return await callback(this);
  });
  $disconnect = jest.fn().mockResolvedValue(undefined);
  $connect = jest.fn().mockResolvedValue(undefined);
}

/**
 * Mock implementation of ConnectionManager for testing
 */
class MockConnectionManager {
  initialize = jest.fn().mockResolvedValue(undefined);
  shutdown = jest.fn().mockResolvedValue(undefined);
  getPoolStats = jest.fn().mockResolvedValue({
    active: 2,
    idle: 3,
    total: 5,
    max: 10,
  });
}

/**
 * Mock implementation of ConfigService for testing
 */
class MockConfigService {
  get(key: string, defaultValue?: any) {
    const config = {
      NODE_ENV: 'test',
      DATABASE_POOL_MIN: 2,
      DATABASE_POOL_MAX: 10,
      DATABASE_POOL_IDLE: 5000,
      DATABASE_MAX_CONNECTION_ATTEMPTS: 3,
      DATABASE_CONNECTION_TIMEOUT: 5000,
      DATABASE_QUERY_TIMEOUT: 10000,
      DATABASE_ENABLE_QUERY_LOGGING: true,
      DATABASE_ENABLE_PERFORMANCE_TRACKING: true,
      DATABASE_ENABLE_CIRCUIT_BREAKER: false,
      DATABASE_RETRY_BASE_DELAY: 50,
      DATABASE_RETRY_MAX_DELAY: 1000,
      DATABASE_RETRY_MAX_ATTEMPTS: 2,
      DATABASE_RETRY_JITTER_FACTOR: 0.1,
      DATABASE_HEALTH_CHECK_INTERVAL: 30000,
    };
    return config[key] || defaultValue;
  }
}

describe('Journey Context Integration Tests', () => {
  let module: TestingModule;
  let prismaService: PrismaService;
  let databaseContextFactory: DatabaseContextFactory;
  let healthContext: HealthContext;
  let careContext: CareContext;
  let planContext: PlanContext;
  
  beforeAll(async () => {
    // Create a testing module with mocked dependencies
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [
        {
          provide: ConfigService,
          useClass: MockConfigService,
        },
        {
          provide: PrismaService,
          useFactory: (configService: ConfigService) => {
            const prismaService = new PrismaService(configService);
            // Replace the PrismaClient with our mock
            (prismaService as any)['prisma'] = new MockPrismaClient();
            // Replace the ConnectionManager with our mock
            (prismaService as any)['connectionManager'] = new MockConnectionManager();
            return prismaService;
          },
          inject: [ConfigService],
        },
        DatabaseContextFactory,
      ],
    }).compile();
    
    // Get the services from the testing module
    prismaService = module.get<PrismaService>(PrismaService);
    databaseContextFactory = module.get<DatabaseContextFactory>(DatabaseContextFactory);
    
    // Create journey contexts for testing
    healthContext = await databaseContextFactory.createHealthContext({
      journeyId: 'health',
      maxConnections: 5,
      enableLogging: true,
      transactionTimeout: 15000,
      maxRetryAttempts: 2,
    });
    
    careContext = await databaseContextFactory.createCareContext({
      journeyId: 'care',
      maxConnections: 5,
      enableLogging: true,
      transactionTimeout: 15000,
      maxRetryAttempts: 2,
    });
    
    planContext = await databaseContextFactory.createPlanContext({
      journeyId: 'plan',
      maxConnections: 5,
      enableLogging: true,
      transactionTimeout: 15000,
      maxRetryAttempts: 2,
    });
    
    // Initialize the contexts
    await healthContext.initialize();
    await careContext.initialize();
    await planContext.initialize();
  });
  
  afterAll(async () => {
    // Clean up resources
    await healthContext.dispose();
    await careContext.dispose();
    await planContext.dispose();
    await module.close();
  });
  
  describe('Context Creation and Initialization', () => {
    it('should create journey-specific contexts with correct metadata', () => {
      // Health context
      expect(healthContext).toBeInstanceOf(HealthContext);
      expect(healthContext.getJourneyId()).toBe('health');
      expect(healthContext.getJourneyMetadata().name).toBe('Minha Saúde');
      
      // Care context
      expect(careContext).toBeInstanceOf(CareContext);
      expect(careContext.getJourneyId()).toBe('care');
      expect(careContext.getJourneyMetadata().name).toBe('Cuidar-me Agora');
      
      // Plan context
      expect(planContext).toBeInstanceOf(PlanContext);
      expect(planContext.getJourneyId()).toBe('plan');
      expect(planContext.getJourneyMetadata().name).toBe('Meu Plano & Benefícios');
    });
    
    it('should initialize contexts with correct configuration', () => {
      // Health context
      const healthConfig = healthContext.getConfig();
      expect(healthConfig.journeyId).toBe('health');
      expect(healthConfig.maxConnections).toBe(5);
      expect(healthConfig.enableLogging).toBe(true);
      expect(healthConfig.transactionTimeout).toBe(15000);
      expect(healthConfig.maxRetryAttempts).toBe(2);
      
      // Care context
      const careConfig = careContext.getConfig();
      expect(careConfig.journeyId).toBe('care');
      expect(careConfig.maxConnections).toBe(5);
      expect(careConfig.enableLogging).toBe(true);
      expect(careConfig.transactionTimeout).toBe(15000);
      expect(careConfig.maxRetryAttempts).toBe(2);
      
      // Plan context
      const planConfig = planContext.getConfig();
      expect(planConfig.journeyId).toBe('plan');
      expect(planConfig.maxConnections).toBe(5);
      expect(planConfig.enableLogging).toBe(true);
      expect(planConfig.transactionTimeout).toBe(15000);
      expect(planConfig.maxRetryAttempts).toBe(2);
    });
    
    it('should provide access to the database client', () => {
      expect(healthContext.getClient()).toBeDefined();
      expect(careContext.getClient()).toBeDefined();
      expect(planContext.getClient()).toBeDefined();
    });
  });
  
  describe('Query Execution within Contexts', () => {
    it('should execute raw queries with journey context', async () => {
      // Mock the executeRaw method
      const mockExecuteRaw = jest.spyOn(healthContext, 'executeRaw');
      mockExecuteRaw.mockResolvedValueOnce([{ count: 5 }]);
      
      // Execute a query
      const result = await healthContext.executeRaw('SELECT COUNT(*) as count FROM "HealthMetric"');
      
      // Verify the result
      expect(result).toEqual([{ count: 5 }]);
      expect(mockExecuteRaw).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM "HealthMetric"');
    });
    
    it('should execute queries with middleware processing', async () => {
      // Mock the executeWithMiddleware method
      const mockExecuteWithMiddleware = jest.spyOn(careContext, 'executeWithMiddleware');
      mockExecuteWithMiddleware.mockImplementationOnce(async (operationName, operation, context) => {
        return await operation();
      });
      
      // Mock the operation function
      const mockOperation = jest.fn().mockResolvedValueOnce({ id: '123', name: 'Test Provider' });
      
      // Execute with middleware
      const result = await careContext.executeWithMiddleware(
        'findProvider',
        mockOperation,
        {
          operationType: DatabaseOperationType.QUERY,
          journeyContext: JourneyContext.CARE,
          model: 'Provider',
          operation: 'findUnique',
          args: { where: { id: '123' } },
        }
      );
      
      // Verify the result
      expect(result).toEqual({ id: '123', name: 'Test Provider' });
      expect(mockExecuteWithMiddleware).toHaveBeenCalled();
      expect(mockOperation).toHaveBeenCalled();
    });
    
    it('should handle errors during query execution', async () => {
      // Mock the executeWithMiddleware method to throw an error
      const mockExecuteWithMiddleware = jest.spyOn(planContext, 'executeWithMiddleware');
      mockExecuteWithMiddleware.mockImplementationOnce(async (operationName, operation, context) => {
        throw new DatabaseException('Query execution failed', {
          operationName,
          context,
        });
      });
      
      // Mock the operation function
      const mockOperation = jest.fn().mockResolvedValueOnce({ id: '123', name: 'Test Plan' });
      
      // Execute with middleware and expect it to throw
      await expect(planContext.executeWithMiddleware(
        'findPlan',
        mockOperation,
        {
          operationType: DatabaseOperationType.QUERY,
          journeyContext: JourneyContext.PLAN,
          model: 'Plan',
          operation: 'findUnique',
          args: { where: { id: '123' } },
        }
      )).rejects.toThrow(DatabaseException);
      
      // Verify the mock was called
      expect(mockExecuteWithMiddleware).toHaveBeenCalled();
      expect(mockOperation).not.toHaveBeenCalled();
    });
  });
  
  describe('Journey-Specific Optimizations', () => {
    it('should apply health journey optimizations for time-series data', async () => {
      // Mock the findHealthMetrics method
      const mockFindHealthMetrics = jest.fn().mockResolvedValueOnce([
        { id: '1', type: 'HEART_RATE', value: 75, timestamp: new Date() },
        { id: '2', type: 'HEART_RATE', value: 78, timestamp: new Date() },
      ]);
      
      // Replace the implementation
      healthContext.findHealthMetrics = mockFindHealthMetrics;
      
      // Execute the query
      const result = await healthContext.findHealthMetrics({
        metricTypes: ['HEART_RATE'],
        dateRangeStart: new Date('2023-01-01'),
        dateRangeEnd: new Date('2023-01-31'),
        userId: 'user123',
      });
      
      // Verify the result
      expect(result).toHaveLength(2);
      expect(mockFindHealthMetrics).toHaveBeenCalledWith({
        metricTypes: ['HEART_RATE'],
        dateRangeStart: expect.any(Date),
        dateRangeEnd: expect.any(Date),
        userId: 'user123',
      });
    });
    
    it('should apply care journey optimizations for appointment scheduling', async () => {
      // Mock the findAppointments method
      const mockFindAppointments = jest.fn().mockResolvedValueOnce([
        { id: '1', providerId: 'provider1', status: 'SCHEDULED', date: new Date() },
        { id: '2', providerId: 'provider2', status: 'SCHEDULED', date: new Date() },
      ]);
      
      // Replace the implementation
      careContext.findAppointments = mockFindAppointments;
      
      // Execute the query
      const result = await careContext.findAppointments({
        appointmentStatus: ['SCHEDULED'],
        appointmentDateStart: new Date('2023-01-01'),
        appointmentDateEnd: new Date('2023-01-31'),
        userId: 'user123',
      });
      
      // Verify the result
      expect(result).toHaveLength(2);
      expect(mockFindAppointments).toHaveBeenCalledWith({
        appointmentStatus: ['SCHEDULED'],
        appointmentDateStart: expect.any(Date),
        appointmentDateEnd: expect.any(Date),
        userId: 'user123',
      });
    });
    
    it('should apply plan journey optimizations for claim processing', async () => {
      // Mock the submitClaim method
      const mockSubmitClaim = jest.fn().mockResolvedValueOnce({
        id: 'claim123',
        status: 'SUBMITTED',
        amount: 150.0,
        submittedAt: new Date(),
      });
      
      // Replace the implementation
      planContext.submitClaim = mockSubmitClaim;
      
      // Execute the operation
      const result = await planContext.submitClaim({
        type: 'MEDICAL_CONSULTATION',
        amount: 150.0,
        date: new Date(),
        providerId: 'provider123',
        documents: ['doc1', 'doc2'],
      }, 'user123');
      
      // Verify the result
      expect(result).toEqual({
        id: 'claim123',
        status: 'SUBMITTED',
        amount: 150.0,
        submittedAt: expect.any(Date),
      });
      expect(mockSubmitClaim).toHaveBeenCalledWith({
        type: 'MEDICAL_CONSULTATION',
        amount: 150.0,
        date: expect.any(Date),
        providerId: 'provider123',
        documents: ['doc1', 'doc2'],
      }, 'user123');
    });
  });
  
  describe('Transaction Management', () => {
    it('should execute transactions within journey context', async () => {
      // Mock the transaction method
      const mockTransaction = jest.spyOn(healthContext, 'transaction');
      mockTransaction.mockImplementationOnce(async (callback, options) => {
        return await callback(prismaService as any);
      });
      
      // Mock the callback function
      const mockCallback = jest.fn().mockResolvedValueOnce({ success: true });
      
      // Execute the transaction
      const result = await healthContext.transaction(mockCallback, {
        operationType: 'createHealthMetrics',
        isolationLevel: 'ReadCommitted',
        timeout: 10000,
        journeyContext: {
          userId: 'user123',
          sessionId: 'session456',
        },
      });
      
      // Verify the result
      expect(result).toEqual({ success: true });
      expect(mockTransaction).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalled();
    });
    
    it('should handle transaction errors', async () => {
      // Mock the transaction method to throw an error
      const mockTransaction = jest.spyOn(careContext, 'transaction');
      mockTransaction.mockImplementationOnce(async (callback, options) => {
        throw new DatabaseException('Transaction failed', {
          operationType: options?.operationType,
        });
      });
      
      // Mock the callback function
      const mockCallback = jest.fn().mockResolvedValueOnce({ success: true });
      
      // Execute the transaction and expect it to throw
      await expect(careContext.transaction(mockCallback, {
        operationType: 'createAppointment',
        isolationLevel: 'ReadCommitted',
        timeout: 10000,
      })).rejects.toThrow(DatabaseException);
      
      // Verify the mock was called
      expect(mockTransaction).toHaveBeenCalled();
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
  
  describe('Context Inheritance and Sharing', () => {
    it('should verify entity ownership across journeys', async () => {
      // Mock the belongsToJourney method for each context
      const mockHealthBelongsToJourney = jest.spyOn(healthContext, 'belongsToJourney');
      mockHealthBelongsToJourney.mockResolvedValueOnce(true);
      
      const mockCareBelongsToJourney = jest.spyOn(careContext, 'belongsToJourney');
      mockCareBelongsToJourney.mockResolvedValueOnce(false);
      
      // Check if an entity belongs to the health journey
      const healthResult = await healthContext.belongsToJourney('metric123', 'HealthMetric');
      expect(healthResult).toBe(true);
      expect(mockHealthBelongsToJourney).toHaveBeenCalledWith('metric123', 'HealthMetric');
      
      // Check if the same entity belongs to the care journey (it shouldn't)
      const careResult = await careContext.belongsToJourney('metric123', 'HealthMetric');
      expect(careResult).toBe(false);
      expect(mockCareBelongsToJourney).toHaveBeenCalledWith('metric123', 'HealthMetric');
    });
    
    it('should share connection pool across contexts', async () => {
      // Mock the checkHealth method for each context
      const mockHealthCheckHealth = jest.spyOn(healthContext, 'checkHealth');
      mockHealthCheckHealth.mockResolvedValueOnce({
        isAvailable: true,
        status: 'up',
        responseTimeMs: 5,
        connectionPool: {
          active: 2,
          idle: 3,
          total: 5,
          max: 10,
        },
        metadata: {
          journeyId: 'health',
          journeyName: 'Minha Saúde',
        },
      });
      
      const mockCareCheckHealth = jest.spyOn(careContext, 'checkHealth');
      mockCareCheckHealth.mockResolvedValueOnce({
        isAvailable: true,
        status: 'up',
        responseTimeMs: 3,
        connectionPool: {
          active: 2,
          idle: 3,
          total: 5,
          max: 10,
        },
        metadata: {
          journeyId: 'care',
          journeyName: 'Cuidar-me Agora',
        },
      });
      
      // Check health for both contexts
      const healthStatus = await healthContext.checkHealth();
      const careStatus = await careContext.checkHealth();
      
      // Verify the results
      expect(healthStatus.isAvailable).toBe(true);
      expect(careStatus.isAvailable).toBe(true);
      
      // Both contexts should have the same connection pool stats
      expect(healthStatus.connectionPool).toEqual(careStatus.connectionPool);
    });
  });
  
  describe('Health Checks', () => {
    it('should perform health checks for each journey context', async () => {
      // Mock the checkHealth method for each context
      const mockHealthCheckHealth = jest.spyOn(healthContext, 'checkHealth');
      mockHealthCheckHealth.mockResolvedValueOnce({
        isAvailable: true,
        status: 'up',
        responseTimeMs: 5,
        lastSuccessfulConnection: new Date(),
        connectionPool: {
          active: 2,
          idle: 3,
          total: 5,
          max: 10,
        },
        metadata: {
          journeyId: 'health',
          journeyName: 'Minha Saúde',
        },
      });
      
      const mockCareCheckHealth = jest.spyOn(careContext, 'checkHealth');
      mockCareCheckHealth.mockResolvedValueOnce({
        isAvailable: true,
        status: 'up',
        responseTimeMs: 3,
        lastSuccessfulConnection: new Date(),
        connectionPool: {
          active: 2,
          idle: 3,
          total: 5,
          max: 10,
        },
        metadata: {
          journeyId: 'care',
          journeyName: 'Cuidar-me Agora',
        },
      });
      
      const mockPlanCheckHealth = jest.spyOn(planContext, 'checkHealth');
      mockPlanCheckHealth.mockResolvedValueOnce({
        isAvailable: true,
        status: 'up',
        responseTimeMs: 4,
        lastSuccessfulConnection: new Date(),
        connectionPool: {
          active: 2,
          idle: 3,
          total: 5,
          max: 10,
        },
        metadata: {
          journeyId: 'plan',
          journeyName: 'Meu Plano & Benefícios',
        },
      });
      
      // Check health for all contexts
      const healthStatus = await healthContext.checkHealth();
      const careStatus = await careContext.checkHealth();
      const planStatus = await planContext.checkHealth();
      
      // Verify the results
      expect(healthStatus.isAvailable).toBe(true);
      expect(healthStatus.status).toBe('up');
      expect(healthStatus.metadata.journeyId).toBe('health');
      
      expect(careStatus.isAvailable).toBe(true);
      expect(careStatus.status).toBe('up');
      expect(careStatus.metadata.journeyId).toBe('care');
      
      expect(planStatus.isAvailable).toBe(true);
      expect(planStatus.status).toBe('up');
      expect(planStatus.metadata.journeyId).toBe('plan');
    });
    
    it('should handle health check failures', async () => {
      // Mock the checkHealth method to simulate a failure
      const mockCheckHealth = jest.spyOn(healthContext, 'checkHealth');
      mockCheckHealth.mockResolvedValueOnce({
        isAvailable: false,
        status: 'down',
        error: {
          message: 'Database connection failed',
          code: 'P1001',
          type: 'CONNECTION',
        },
        metadata: {
          journeyId: 'health',
          journeyName: 'Minha Saúde',
        },
      });
      
      // Check health
      const healthStatus = await healthContext.checkHealth();
      
      // Verify the result
      expect(healthStatus.isAvailable).toBe(false);
      expect(healthStatus.status).toBe('down');
      expect(healthStatus.error).toBeDefined();
      expect(healthStatus.error.message).toBe('Database connection failed');
    });
  });
});