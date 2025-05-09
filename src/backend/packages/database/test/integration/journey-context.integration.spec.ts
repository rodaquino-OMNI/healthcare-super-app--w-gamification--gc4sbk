import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { mock, MockProxy } from 'jest-mock-extended';

import { 
  BaseJourneyContext,
  HealthDatabaseContext,
  CareContext,
  PlanContext,
  JourneyType,
  JourneyContextMap
} from '../../src/contexts';

import { 
  DatabaseContextFactory,
  DatabaseContextConfig,
  DEFAULT_HEALTH_CONTEXT_CONFIG,
  DEFAULT_CARE_CONTEXT_CONFIG,
  DEFAULT_PLAN_CONTEXT_CONFIG
} from '../../src/types';

import { ConnectionManager } from '../../src/connection/connection-manager';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { TransactionIsolationLevel } from '../../src/transactions/transaction.interface';

/**
 * Integration tests for journey-specific database contexts.
 * 
 * These tests verify the creation, management, and optimization of database
 * connections based on journey requirements. They cover context creation,
 * query execution within contexts, and optimization strategies for different
 * journey patterns.
 */
describe('Journey Database Contexts', () => {
  let moduleRef: TestingModule;
  let configService: ConfigService;
  let connectionManager: ConnectionManager;
  let contextFactory: DatabaseContextFactory;
  let mockPrismaClient: MockProxy<PrismaClient>;
  
  beforeAll(async () => {
    // Create mock PrismaClient
    mockPrismaClient = mock<PrismaClient>();
    
    // Setup test module
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [
        {
          provide: PrismaClient,
          useValue: mockPrismaClient,
        },
        ConnectionManager,
        {
          provide: DatabaseContextFactory,
          useFactory: (configService: ConfigService, connectionManager: ConnectionManager) => ({
            createContext: jest.fn(),
            createJourneyContext: jest.fn(),
            createHealthContext: jest.fn().mockImplementation(() => new HealthDatabaseContext(configService)),
            createCareContext: jest.fn().mockImplementation(() => new CareContext(configService)),
            createPlanContext: jest.fn().mockImplementation(() => new PlanContext(configService)),
          }),
          inject: [ConfigService, ConnectionManager],
        },
      ],
    }).compile();
    
    configService = moduleRef.get<ConfigService>(ConfigService);
    connectionManager = moduleRef.get<ConnectionManager>(ConnectionManager);
    contextFactory = moduleRef.get<DatabaseContextFactory>(DatabaseContextFactory);
  });
  
  afterAll(async () => {
    await moduleRef.close();
  });
  
  describe('Context Creation', () => {
    it('should create a Health journey context with appropriate configuration', async () => {
      // Arrange
      const healthConfig: Partial<DatabaseContextConfig> = {
        connectionPool: {
          min: 5,
          max: 20,
        },
        journey: {
          journeyType: JourneyType.HEALTH,
          options: {
            enableTimeSeriesOptimization: true,
          },
        },
      };
      
      // Act
      const healthContext = await contextFactory.createHealthContext(healthConfig);
      
      // Assert
      expect(healthContext).toBeInstanceOf(HealthDatabaseContext);
      expect(healthContext.journeyType).toBe(JourneyType.HEALTH);
      
      // Verify journey-specific configuration was applied
      const journeyConfig = healthContext.getJourneyConfig();
      expect(journeyConfig).toHaveProperty('enableTimeSeriesOptimization', true);
      expect(journeyConfig).toHaveProperty('enableWearableIntegration');
    });
    
    it('should create a Care journey context with appropriate configuration', async () => {
      // Arrange
      const careConfig: Partial<DatabaseContextConfig> = {
        transaction: {
          defaultIsolationLevel: TransactionIsolationLevel.SERIALIZABLE,
        },
        journey: {
          journeyType: JourneyType.CARE,
          options: {
            appointmentSlotLockTimeSeconds: 300,
          },
        },
      };
      
      // Act
      const careContext = await contextFactory.createCareContext(careConfig);
      
      // Assert
      expect(careContext).toBeInstanceOf(CareContext);
      expect(careContext.journeyType).toBe(JourneyType.CARE);
      
      // Verify journey-specific configuration was applied
      const journeyConfig = careContext.getJourneyConfig();
      expect(journeyConfig).toHaveProperty('appointmentSlotLockTimeSeconds', 300);
      expect(journeyConfig).toHaveProperty('enableProviderCaching');
    });
    
    it('should create a Plan journey context with appropriate configuration', async () => {
      // Arrange
      const planConfig: Partial<DatabaseContextConfig> = {
        retry: {
          maxRetries: 5,
        },
        journey: {
          journeyType: JourneyType.PLAN,
          options: {
            claimProcessingBatchSize: 50,
          },
        },
      };
      
      // Act
      const planContext = await contextFactory.createPlanContext(planConfig);
      
      // Assert
      expect(planContext).toBeInstanceOf(PlanContext);
      expect(planContext.journeyType).toBe(JourneyType.PLAN);
      
      // Verify journey-specific configuration was applied
      const journeyConfig = planContext.getJourneyConfig();
      expect(journeyConfig).toHaveProperty('claimProcessingBatchSize', 50);
      expect(journeyConfig).toHaveProperty('enableDocumentStorage');
    });
    
    it('should apply default configuration when no config is provided', async () => {
      // Act
      const healthContext = await contextFactory.createHealthContext();
      const careContext = await contextFactory.createCareContext();
      const planContext = await contextFactory.createPlanContext();
      
      // Assert - verify default configs were applied
      expect(healthContext.config).toMatchObject(DEFAULT_HEALTH_CONTEXT_CONFIG);
      expect(careContext.config).toMatchObject(DEFAULT_CARE_CONTEXT_CONFIG);
      expect(planContext.config).toMatchObject(DEFAULT_PLAN_CONTEXT_CONFIG);
    });
    
    it('should merge provided config with default config', async () => {
      // Arrange
      const customConfig: Partial<DatabaseContextConfig> = {
        logging: {
          logQueries: true,
          logSlowQueries: true,
          slowQueryThreshold: 500, // Lower than default
        },
      };
      
      // Act
      const healthContext = await contextFactory.createHealthContext(customConfig);
      
      // Assert - verify custom config was merged with defaults
      expect(healthContext.config.logging).toMatchObject(customConfig.logging);
      expect(healthContext.config.connectionPool).toMatchObject(DEFAULT_HEALTH_CONTEXT_CONFIG.connectionPool);
    });
  });
  
  describe('Query Execution', () => {
    let healthContext: HealthDatabaseContext;
    let careContext: CareContext;
    let planContext: PlanContext;
    
    beforeEach(async () => {
      healthContext = await contextFactory.createHealthContext();
      careContext = await contextFactory.createCareContext();
      planContext = await contextFactory.createPlanContext();
      
      // Setup mock responses
      mockPrismaClient.$queryRaw.mockResolvedValue([{ result: 1 }]);
    });
    
    it('should execute queries with journey-specific error handling', async () => {
      // Arrange
      const mockOperation = jest.fn().mockResolvedValue({ id: '123', name: 'Test' });
      const mockErrorOperation = jest.fn().mockRejectedValue(new Error('Database error'));
      
      // Act & Assert - successful operation
      await expect(healthContext.executeJourneyOperation('test', mockOperation)).resolves.toEqual({ id: '123', name: 'Test' });
      
      // Act & Assert - failed operation with error handling
      await expect(healthContext.executeJourneyOperation('test', mockErrorOperation)).rejects.toThrow(DatabaseException);
    });
    
    it('should apply journey-specific optimizations for Health journey', async () => {
      // Arrange
      const userId = 'user123';
      const metricType = 'HEART_RATE';
      const startTime = new Date('2023-01-01');
      const endTime = new Date('2023-01-31');
      
      // Mock the time-series client method
      const timeSeriesClient = healthContext.getTimeSeriesClient();
      jest.spyOn(timeSeriesClient, 'query').mockResolvedValue([{ timestamp: new Date(), value: 75 }]);
      
      // Act
      const result = await healthContext.queryHealthMetrics(
        userId,
        metricType,
        startTime,
        endTime,
        'avg',
        'day'
      );
      
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('value', 75);
      expect(timeSeriesClient.query).toHaveBeenCalledWith(
        expect.stringContaining('time_bucket'),
        expect.arrayContaining([userId, metricType, startTime, endTime])
      );
    });
    
    it('should apply journey-specific optimizations for Care journey', async () => {
      // Arrange
      const providerId = 'provider123';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      
      // Mock the findAvailableAppointmentSlots method
      mockPrismaClient.appointmentSlot.findMany.mockResolvedValue([
        { id: 'slot1', startTime: new Date(), endTime: new Date(), isBooked: false },
      ]);
      
      // Act
      const result = await careContext.findAvailableAppointmentSlots(
        providerId,
        startDate,
        endDate
      );
      
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'slot1');
      expect(mockPrismaClient.appointmentSlot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            providerId,
            startTime: { gte: startDate },
            endTime: { lte: endDate },
            isBooked: false,
          }),
        })
      );
    });
    
    it('should apply journey-specific optimizations for Plan journey', async () => {
      // Arrange
      const userId = 'user123';
      
      // Mock the getUserPlanDetails method
      mockPrismaClient.insurancePlan.findFirst.mockResolvedValue({
        id: 'plan1',
        name: 'Premium Plan',
        coverageDetails: {},
      });
      
      // Act
      const result = await planContext.getUserPlanDetails(userId);
      
      // Assert
      expect(result).toHaveProperty('id', 'plan1');
      expect(mockPrismaClient.insurancePlan.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
          }),
          include: expect.objectContaining({
            benefits: true,
            coverage: true,
          }),
        })
      );
    });
  });
  
  describe('Transaction Management', () => {
    let healthContext: HealthDatabaseContext;
    
    beforeEach(async () => {
      healthContext = await contextFactory.createHealthContext();
      
      // Setup mock transaction
      mockPrismaClient.$transaction.mockImplementation((fn) => fn(mockPrismaClient));
    });
    
    it('should execute operations within a transaction', async () => {
      // Arrange
      const mockTransactionFn = jest.fn().mockResolvedValue({ success: true });
      
      // Act
      const result = await healthContext.executeTransaction(mockTransactionFn);
      
      // Assert
      expect(result).toEqual({ success: true });
      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
      expect(mockTransactionFn).toHaveBeenCalledWith(mockPrismaClient);
    });
    
    it('should handle transaction errors', async () => {
      // Arrange
      const mockErrorFn = jest.fn().mockRejectedValue(new Error('Transaction error'));
      
      // Act & Assert
      await expect(healthContext.executeTransaction(mockErrorFn)).rejects.toThrow(DatabaseException);
    });
    
    it('should support nested transactions', async () => {
      // Arrange
      const outerFn = jest.fn().mockImplementation(async (tx) => {
        // Perform some operations
        await tx.healthMetric.findMany();
        
        // Execute nested transaction
        return healthContext.executeNestedTransaction(async (nestedTx) => {
          await nestedTx.healthMetric.create({ data: { userId: 'user1', type: 'HEART_RATE', value: 75 } });
          return { nestedSuccess: true };
        }, tx);
      });
      
      // Act
      const result = await healthContext.executeTransaction(outerFn);
      
      // Assert
      expect(result).toEqual({ nestedSuccess: true });
      expect(mockPrismaClient.healthMetric.findMany).toHaveBeenCalled();
      expect(mockPrismaClient.healthMetric.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user1',
            type: 'HEART_RATE',
            value: 75,
          }),
        })
      );
    });
  });
  
  describe('Context Inheritance and Sharing', () => {
    it('should allow creating contexts with shared connection pools', async () => {
      // Arrange
      const sharedConfig: Partial<DatabaseContextConfig> = {
        connectionPool: {
          min: 10,
          max: 30,
          idle: 5000,
        },
      };
      
      // Act - create contexts with shared config
      const healthContext = await contextFactory.createHealthContext(sharedConfig);
      const careContext = await contextFactory.createCareContext(sharedConfig);
      
      // Assert - both contexts should have the same connection pool config
      expect(healthContext.config.connectionPool).toEqual(careContext.config.connectionPool);
      expect(healthContext.config.connectionPool.min).toBe(10);
      expect(healthContext.config.connectionPool.max).toBe(30);
    });
    
    it('should support cross-journey operations', async () => {
      // Arrange
      const healthContext = await contextFactory.createHealthContext();
      const careContext = await contextFactory.createCareContext();
      
      // Mock cross-journey operation
      const mockHealthData = { userId: 'user1', metrics: [{ type: 'HEART_RATE', value: 80 }] };
      const mockCareData = { userId: 'user1', appointments: [{ id: 'appt1', date: new Date() }] };
      
      jest.spyOn(healthContext, 'executeJourneyOperation').mockResolvedValue(mockHealthData);
      jest.spyOn(careContext, 'executeJourneyOperation').mockResolvedValue(mockCareData);
      
      // Act - perform a cross-journey operation that combines health and care data
      const crossJourneyOperation = async () => {
        const healthData = await healthContext.executeJourneyOperation('getHealthData', () => Promise.resolve(mockHealthData));
        const careData = await careContext.executeJourneyOperation('getCareData', () => Promise.resolve(mockCareData));
        
        return {
          userId: healthData.userId,
          healthMetrics: healthData.metrics,
          careAppointments: careData.appointments,
        };
      };
      
      const result = await crossJourneyOperation();
      
      // Assert
      expect(result).toEqual({
        userId: 'user1',
        healthMetrics: [{ type: 'HEART_RATE', value: 80 }],
        careAppointments: [{ id: 'appt1', date: expect.any(Date) }],
      });
      expect(healthContext.executeJourneyOperation).toHaveBeenCalled();
      expect(careContext.executeJourneyOperation).toHaveBeenCalled();
    });
    
    it('should maintain journey-specific optimizations when sharing connections', async () => {
      // Arrange
      const sharedConfig: Partial<DatabaseContextConfig> = {
        connectionPool: {
          min: 10,
          max: 30,
        },
      };
      
      // Act - create contexts with shared connection config but different journey configs
      const healthContext = await contextFactory.createHealthContext({
        ...sharedConfig,
        journey: {
          journeyType: JourneyType.HEALTH,
          options: {
            enableTimeSeriesOptimization: true,
            healthMetricsBatchSize: 200, // Custom value
          },
        },
      });
      
      const careContext = await contextFactory.createCareContext({
        ...sharedConfig,
        journey: {
          journeyType: JourneyType.CARE,
          options: {
            appointmentSlotLockTimeSeconds: 600, // Custom value
          },
        },
      });
      
      // Assert - connection pool is shared but journey-specific options are maintained
      expect(healthContext.config.connectionPool).toEqual(careContext.config.connectionPool);
      
      const healthJourneyConfig = healthContext.getJourneyConfig();
      const careJourneyConfig = careContext.getJourneyConfig();
      
      expect(healthJourneyConfig).toHaveProperty('enableTimeSeriesOptimization', true);
      expect(healthJourneyConfig).toHaveProperty('healthMetricsBatchSize', 200);
      
      expect(careJourneyConfig).toHaveProperty('appointmentSlotLockTimeSeconds', 600);
      expect(careJourneyConfig).not.toHaveProperty('enableTimeSeriesOptimization');
    });
  });
});