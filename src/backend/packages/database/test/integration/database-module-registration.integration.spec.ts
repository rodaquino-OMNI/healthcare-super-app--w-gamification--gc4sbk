import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../src/database.module';
import { PrismaService } from '../../src/prisma.service';
import { ConnectionManager } from '../../src/connection/connection-manager';
import { ConnectionPool } from '../../src/connection/connection-pool';
import { ConnectionHealth } from '../../src/connection/connection-health';
import { ConnectionRetry } from '../../src/connection/connection-retry';
import { TransactionService } from '../../src/transactions/transaction.service';
import { MiddlewareRegistry } from '../../src/middleware/middleware.registry';
import { MiddlewareFactory } from '../../src/middleware/middleware.factory';
import { LoggingMiddleware } from '../../src/middleware/logging.middleware';
import { PerformanceMiddleware } from '../../src/middleware/performance.middleware';
import { CircuitBreakerMiddleware } from '../../src/middleware/circuit-breaker.middleware';
import { TransformationMiddleware } from '../../src/middleware/transformation.middleware';
import { ErrorTransformer } from '../../src/errors/error-transformer';
import { HealthContext } from '../../src/contexts/health.context';
import { CareContext } from '../../src/contexts/care.context';
import { PlanContext } from '../../src/contexts/plan.context';
import { BaseJourneyContext } from '../../src/contexts/base-journey.context';
import { JourneyType } from '../../src/types/journey.types';

/**
 * Test module that imports DatabaseModule with default configuration
 */
@Module({
  imports: [DatabaseModule.forRoot()],
})
class DefaultConfigTestModule {}

/**
 * Test module that imports DatabaseModule with custom configuration
 */
@Module({
  imports: [
    DatabaseModule.forRoot({
      enableLogging: true,
      connectionPool: {
        minConnections: 3,
        maxConnections: 15,
      },
    }),
  ],
})
class CustomConfigTestModule {}

/**
 * Test module that imports DatabaseModule with async configuration
 */
@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        enableLogging: configService.get<boolean>('DATABASE_LOGGING_ENABLED') || false,
        connectionPool: {
          minConnections: configService.get<number>('DATABASE_MIN_CONNECTIONS') || 2,
          maxConnections: configService.get<number>('DATABASE_MAX_CONNECTIONS') || 10,
        },
      }),
    }),
  ],
})
class AsyncConfigTestModule {}

/**
 * Test module that imports DatabaseModule for a specific journey
 */
@Module({
  imports: [DatabaseModule.forJourney(JourneyType.HEALTH)],
})
class JourneySpecificTestModule {}

/**
 * Test module that imports DatabaseModule for testing
 */
@Module({
  imports: [DatabaseModule.forTesting()],
})
class TestingConfigTestModule {}

describe('DatabaseModule Registration', () => {
  let moduleRef: TestingModule;

  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  describe('forRoot() with default configuration', () => {
    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [DefaultConfigTestModule],
      }).compile();
    });

    it('should register the module with default configuration', () => {
      expect(moduleRef).toBeDefined();
    });

    it('should provide PrismaService', () => {
      const prismaService = moduleRef.get<PrismaService>(PrismaService);
      expect(prismaService).toBeDefined();
      expect(prismaService).toBeInstanceOf(PrismaService);
    });

    it('should provide ConnectionManager', () => {
      const connectionManager = moduleRef.get<ConnectionManager>(ConnectionManager);
      expect(connectionManager).toBeDefined();
      expect(connectionManager).toBeInstanceOf(ConnectionManager);
    });

    it('should provide TransactionService', () => {
      const transactionService = moduleRef.get<TransactionService>(TransactionService);
      expect(transactionService).toBeDefined();
      expect(transactionService).toBeInstanceOf(TransactionService);
    });

    it('should provide middleware components', () => {
      const middlewareRegistry = moduleRef.get<MiddlewareRegistry>(MiddlewareRegistry);
      const middlewareFactory = moduleRef.get<MiddlewareFactory>(MiddlewareFactory);
      
      expect(middlewareRegistry).toBeDefined();
      expect(middlewareFactory).toBeDefined();
      expect(middlewareRegistry).toBeInstanceOf(MiddlewareRegistry);
      expect(middlewareFactory).toBeInstanceOf(MiddlewareFactory);
    });

    it('should provide BaseJourneyContext', () => {
      const baseJourneyContext = moduleRef.get<BaseJourneyContext>(BaseJourneyContext);
      expect(baseJourneyContext).toBeDefined();
      expect(baseJourneyContext).toBeInstanceOf(BaseJourneyContext);
    });

    it('should provide module options with default values', () => {
      const options = moduleRef.get('DATABASE_MODULE_OPTIONS');
      expect(options).toBeDefined();
      expect(options.enableLogging).toBe(process.env.NODE_ENV !== 'production');
      expect(options.enablePerformanceTracking).toBe(true);
      expect(options.enableCircuitBreaker).toBe(true);
      expect(options.enableTransformation).toBe(true);
      expect(options.isGlobal).toBe(true);
    });
  });

  describe('forRoot() with custom configuration', () => {
    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [CustomConfigTestModule],
      }).compile();
    });

    it('should register the module with custom configuration', () => {
      expect(moduleRef).toBeDefined();
    });

    it('should provide module options with custom values', () => {
      const options = moduleRef.get('DATABASE_MODULE_OPTIONS');
      expect(options).toBeDefined();
      expect(options.enableLogging).toBe(true);
      expect(options.connectionPool.minConnections).toBe(3);
      expect(options.connectionPool.maxConnections).toBe(15);
    });

    it('should configure ConnectionManager with custom pool settings', () => {
      const connectionManager = moduleRef.get<ConnectionManager>(ConnectionManager);
      expect(connectionManager).toBeDefined();
      
      // Access private properties for testing
      const poolConfig = (connectionManager as any).options.poolConfig;
      expect(poolConfig).toBeDefined();
      expect(poolConfig.minConnections).toBe(3);
      expect(poolConfig.maxConnections).toBe(15);
    });
  });

  describe('forRootAsync() with async configuration', () => {
    beforeEach(async () => {
      // Set environment variables for testing
      process.env.DATABASE_LOGGING_ENABLED = 'true';
      process.env.DATABASE_MIN_CONNECTIONS = '4';
      process.env.DATABASE_MAX_CONNECTIONS = '20';

      moduleRef = await Test.createTestingModule({
        imports: [AsyncConfigTestModule],
      }).compile();
    });

    afterEach(() => {
      // Clean up environment variables
      delete process.env.DATABASE_LOGGING_ENABLED;
      delete process.env.DATABASE_MIN_CONNECTIONS;
      delete process.env.DATABASE_MAX_CONNECTIONS;
    });

    it('should register the module with async configuration', () => {
      expect(moduleRef).toBeDefined();
    });

    it('should provide module options with values from environment', () => {
      const options = moduleRef.get('DATABASE_MODULE_OPTIONS');
      expect(options).toBeDefined();
      expect(options.enableLogging).toBe(true);
      expect(options.connectionPool.minConnections).toBe(4);
      expect(options.connectionPool.maxConnections).toBe(20);
    });

    it('should inject ConfigService into the module', () => {
      const configService = moduleRef.get<ConfigService>(ConfigService);
      expect(configService).toBeDefined();
      expect(configService).toBeInstanceOf(ConfigService);
    });
  });

  describe('forJourney() with journey-specific configuration', () => {
    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [JourneySpecificTestModule],
      }).compile();
    });

    it('should register the module with journey-specific configuration', () => {
      expect(moduleRef).toBeDefined();
    });

    it('should provide module options with journey type', () => {
      const options = moduleRef.get('DATABASE_MODULE_OPTIONS');
      expect(options).toBeDefined();
      expect(options.journeyType).toBe(JourneyType.HEALTH);
    });

    it('should provide journey-specific context', () => {
      const healthContext = moduleRef.get<HealthContext>(HealthContext);
      expect(healthContext).toBeDefined();
      expect(healthContext).toBeInstanceOf(HealthContext);
    });

    it('should not provide contexts for other journeys', () => {
      // CareContext and PlanContext should not be available
      expect(() => moduleRef.get<CareContext>(CareContext)).toThrow();
      expect(() => moduleRef.get<PlanContext>(PlanContext)).toThrow();
    });
  });

  describe('forTesting() with test configuration', () => {
    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [TestingConfigTestModule],
      }).compile();
    });

    it('should register the module with test configuration', () => {
      expect(moduleRef).toBeDefined();
    });

    it('should provide mock PrismaService', () => {
      const prismaService = moduleRef.get<PrismaService>(PrismaService);
      expect(prismaService).toBeDefined();
      
      // Verify mock methods are available
      expect(prismaService.$connect).toBeDefined();
      expect(prismaService.$disconnect).toBeDefined();
      expect(prismaService.applyMigrations).toBeDefined();
      expect(prismaService.$transaction).toBeDefined();
      
      // Verify these are mock implementations
      expect(jest.isMockFunction(prismaService.$connect)).toBe(true);
      expect(jest.isMockFunction(prismaService.$disconnect)).toBe(true);
      expect(jest.isMockFunction(prismaService.applyMigrations)).toBe(true);
      expect(jest.isMockFunction(prismaService.$transaction)).toBe(true);
    });

    it('should provide mock ConnectionManager', () => {
      const connectionManager = moduleRef.get<ConnectionManager>(ConnectionManager);
      expect(connectionManager).toBeDefined();
      
      // Verify mock methods are available
      expect(connectionManager.initialize).toBeDefined();
      expect(connectionManager.shutdown).toBeDefined();
      expect(connectionManager.getConnection).toBeDefined();
      expect(connectionManager.releaseConnection).toBeDefined();
      
      // Verify these are mock implementations
      expect(jest.isMockFunction(connectionManager.initialize)).toBe(true);
      expect(jest.isMockFunction(connectionManager.shutdown)).toBe(true);
      expect(jest.isMockFunction(connectionManager.getConnection)).toBe(true);
      expect(jest.isMockFunction(connectionManager.releaseConnection)).toBe(true);
    });

    it('should provide mock TransactionService', () => {
      const transactionService = moduleRef.get<TransactionService>(TransactionService);
      expect(transactionService).toBeDefined();
      
      // Verify mock methods are available
      expect(transactionService.startTransaction).toBeDefined();
      expect(transactionService.commitTransaction).toBeDefined();
      expect(transactionService.rollbackTransaction).toBeDefined();
      expect(transactionService.executeInTransaction).toBeDefined();
      
      // Verify these are mock implementations
      expect(jest.isMockFunction(transactionService.startTransaction)).toBe(true);
      expect(jest.isMockFunction(transactionService.commitTransaction)).toBe(true);
      expect(jest.isMockFunction(transactionService.rollbackTransaction)).toBe(true);
      expect(jest.isMockFunction(transactionService.executeInTransaction)).toBe(true);
    });

    it('should provide mock journey contexts', () => {
      const baseJourneyContext = moduleRef.get<BaseJourneyContext>(BaseJourneyContext);
      const healthContext = moduleRef.get<HealthContext>(HealthContext);
      const careContext = moduleRef.get<CareContext>(CareContext);
      const planContext = moduleRef.get<PlanContext>(PlanContext);
      
      expect(baseJourneyContext).toBeDefined();
      expect(healthContext).toBeDefined();
      expect(careContext).toBeDefined();
      expect(planContext).toBeDefined();
      
      // Verify mock methods are available
      expect(baseJourneyContext.executeQuery).toBeDefined();
      expect(healthContext.getHealthMetrics).toBeDefined();
      expect(careContext.getAppointments).toBeDefined();
      expect(planContext.getPlans).toBeDefined();
      
      // Verify these are mock implementations
      expect(jest.isMockFunction(baseJourneyContext.executeQuery)).toBe(true);
      expect(jest.isMockFunction(healthContext.getHealthMetrics)).toBe(true);
      expect(jest.isMockFunction(careContext.getAppointments)).toBe(true);
      expect(jest.isMockFunction(planContext.getPlans)).toBe(true);
    });
  });

  describe('Module initialization and lifecycle', () => {
    let onModuleInitSpy: jest.SpyInstance;
    let onModuleDestroySpy: jest.SpyInstance;

    beforeEach(async () => {
      // Create spies for lifecycle methods
      onModuleInitSpy = jest.spyOn(PrismaService.prototype, 'onModuleInit').mockResolvedValue();
      onModuleDestroySpy = jest.spyOn(PrismaService.prototype, 'onModuleDestroy').mockResolvedValue();

      moduleRef = await Test.createTestingModule({
        imports: [DefaultConfigTestModule],
      }).compile();

      // Initialize the module
      await moduleRef.init();
    });

    afterEach(async () => {
      // Clean up spies
      onModuleInitSpy.mockRestore();
      onModuleDestroySpy.mockRestore();
    });

    it('should call onModuleInit during initialization', () => {
      expect(onModuleInitSpy).toHaveBeenCalled();
    });

    it('should call onModuleDestroy during shutdown', async () => {
      await moduleRef.close();
      expect(onModuleDestroySpy).toHaveBeenCalled();
    });

    it('should initialize in the correct order', () => {
      // This test is a placeholder for more detailed initialization order tests
      // In a real implementation, we would verify that dependencies are initialized
      // before the services that depend on them
      expect(onModuleInitSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling during initialization', () => {
    let onModuleInitSpy: jest.SpyInstance;

    beforeEach(() => {
      // Create a spy that throws an error
      onModuleInitSpy = jest.spyOn(PrismaService.prototype, 'onModuleInit')
        .mockRejectedValue(new Error('Database connection failed'));
    });

    afterEach(() => {
      // Clean up spy
      onModuleInitSpy.mockRestore();
    });

    it('should propagate initialization errors', async () => {
      await expect(Test.createTestingModule({
        imports: [DefaultConfigTestModule],
      }).compile().then(module => module.init()))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('Module resolution and path aliases', () => {
    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [DefaultConfigTestModule],
      }).compile();
    });

    it('should resolve all required providers', () => {
      // Core services
      expect(moduleRef.get(PrismaService)).toBeDefined();
      expect(moduleRef.get(ConnectionManager)).toBeDefined();
      expect(moduleRef.get(ConnectionPool)).toBeDefined();
      expect(moduleRef.get(ConnectionHealth)).toBeDefined();
      expect(moduleRef.get(ConnectionRetry)).toBeDefined();
      expect(moduleRef.get(TransactionService)).toBeDefined();
      
      // Middleware
      expect(moduleRef.get(MiddlewareRegistry)).toBeDefined();
      expect(moduleRef.get(MiddlewareFactory)).toBeDefined();
      expect(moduleRef.get(LoggingMiddleware)).toBeDefined();
      expect(moduleRef.get(PerformanceMiddleware)).toBeDefined();
      expect(moduleRef.get(CircuitBreakerMiddleware)).toBeDefined();
      expect(moduleRef.get(TransformationMiddleware)).toBeDefined();
      
      // Error handling
      expect(moduleRef.get(ErrorTransformer)).toBeDefined();
      
      // Journey context
      expect(moduleRef.get(BaseJourneyContext)).toBeDefined();
    });

    it('should make providers available to importing modules', async () => {
      // Create a module that imports DefaultConfigTestModule
      @Module({
        imports: [DefaultConfigTestModule],
        providers: [
          {
            provide: 'TEST_SERVICE',
            useFactory: (prismaService: PrismaService, connectionManager: ConnectionManager) => {
              // This factory function will fail if the dependencies are not available
              return { prismaService, connectionManager };
            },
            inject: [PrismaService, ConnectionManager],
          },
        ],
      })
      class ImportingModule {}

      const importingModuleRef = await Test.createTestingModule({
        imports: [ImportingModule],
      }).compile();

      const testService = importingModuleRef.get('TEST_SERVICE');
      expect(testService).toBeDefined();
      expect(testService.prismaService).toBeInstanceOf(PrismaService);
      expect(testService.connectionManager).toBeInstanceOf(ConnectionManager);

      await importingModuleRef.close();
    });
  });
});