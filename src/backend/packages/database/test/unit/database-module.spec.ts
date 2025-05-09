import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { DatabaseModule, DatabaseModuleOptions, DatabaseModuleService } from '../../src/database.module';
import { PrismaService } from '../../src/prisma.service';
import { ConnectionManager } from '../../src/connection/connection-manager';
import { ConnectionPool } from '../../src/connection/connection-pool';
import { ConnectionHealth } from '../../src/connection/connection-health';
import { ConnectionRetry } from '../../src/connection/connection-retry';
import { ConnectionConfig } from '../../src/connection/connection-config';
import { TransactionService } from '../../src/transactions/transaction.service';
import { MiddlewareRegistry } from '../../src/middleware/middleware.registry';
import { MiddlewareFactory } from '../../src/middleware/middleware.factory';
import { LoggingMiddleware } from '../../src/middleware/logging.middleware';
import { PerformanceMiddleware } from '../../src/middleware/performance.middleware';
import { CircuitBreakerMiddleware } from '../../src/middleware/circuit-breaker.middleware';
import { TransformationMiddleware } from '../../src/middleware/transformation.middleware';
import { ErrorTransformer } from '../../src/errors/error-transformer';
import { BaseJourneyContext } from '../../src/contexts/base-journey.context';
import { HealthContext } from '../../src/contexts/health.context';
import { CareContext } from '../../src/contexts/care.context';
import { PlanContext } from '../../src/contexts/plan.context';
import { JourneyType } from '../../src/types/journey.types';

// Mock classes for dependencies
class MockPrismaService {
  $connect = jest.fn().mockResolvedValue(undefined);
  $disconnect = jest.fn().mockResolvedValue(undefined);
  applyMigrations = jest.fn().mockResolvedValue(undefined);
  $transaction = jest.fn().mockImplementation((fn) => fn(this));
  $on = jest.fn();
  $use = jest.fn();
}

class MockConnectionManager {
  initialize = jest.fn().mockResolvedValue(undefined);
  shutdown = jest.fn().mockResolvedValue(undefined);
  getConnection = jest.fn().mockReturnValue({});
  releaseConnection = jest.fn();
}

class MockConfigService {
  get = jest.fn().mockImplementation((key: string) => {
    if (key === 'database.url') return 'postgresql://test:test@localhost:5432/test';
    if (key === 'database.poolSize') return 10;
    if (key === 'database.connectionTimeout') return 5000;
    if (key === 'database.logLevel') return 'info';
    if (key === 'database.slowQueryThreshold') return 1000;
    if (key === 'database.circuitBreaker.failureThreshold') return 5;
    if (key === 'database.circuitBreaker.resetTimeout') return 30000;
    if (key === 'database.circuitBreaker.halfOpenMaxCalls') return 3;
    return undefined;
  });
}

// Test module to use for testing global module availability
@Global()
@Module({
  imports: [DatabaseModule.forRoot()],
  exports: [DatabaseModule],
})
class GlobalTestModule {}

// Test module for testing module imports
@Module({
  imports: [DatabaseModule.forRoot()],
})
class TestModule {}

// Test module for testing async module imports
@Module({
  imports: [
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        databaseUrl: configService.get<string>('database.url'),
        connectionPool: {
          maxConnections: configService.get<number>('database.poolSize'),
          connectionTimeout: configService.get<number>('database.connectionTimeout'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
class AsyncTestModule {}

// Test module for testing journey-specific module imports
@Module({
  imports: [DatabaseModule.forJourney(JourneyType.HEALTH)],
})
class JourneyTestModule {}

describe('DatabaseModule', () => {
  // Test suite for module registration with default options
  describe('forRoot() with default options', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [DatabaseModule.forRoot()],
      })
        .overrideProvider(PrismaService)
        .useClass(MockPrismaService)
        .overrideProvider(ConnectionManager)
        .useClass(MockConnectionManager)
        .overrideProvider(ConfigService)
        .useClass(MockConfigService)
        .compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should provide PrismaService', () => {
      const prismaService = module.get<PrismaService>(PrismaService);
      expect(prismaService).toBeDefined();
      expect(prismaService).toBeInstanceOf(MockPrismaService);
    });

    it('should provide DatabaseModuleService', () => {
      const databaseModuleService = module.get<DatabaseModuleService>(DatabaseModuleService);
      expect(databaseModuleService).toBeDefined();
    });

    it('should provide ConnectionManager', () => {
      const connectionManager = module.get<ConnectionManager>(ConnectionManager);
      expect(connectionManager).toBeDefined();
      expect(connectionManager).toBeInstanceOf(MockConnectionManager);
    });

    it('should provide TransactionService', () => {
      const transactionService = module.get<TransactionService>(TransactionService);
      expect(transactionService).toBeDefined();
    });

    it('should provide ErrorTransformer', () => {
      const errorTransformer = module.get<ErrorTransformer>(ErrorTransformer);
      expect(errorTransformer).toBeDefined();
    });

    it('should provide BaseJourneyContext', () => {
      const baseJourneyContext = module.get<BaseJourneyContext>(BaseJourneyContext);
      expect(baseJourneyContext).toBeDefined();
    });

    it('should provide module options', () => {
      const options = module.get<DatabaseModuleOptions>('DATABASE_MODULE_OPTIONS');
      expect(options).toBeDefined();
      expect(options.isGlobal).toBe(true);
      expect(options.enableLogging).toBeDefined();
      expect(options.connectionPool).toBeDefined();
      expect(options.retry).toBeDefined();
    });
  });

  // Test suite for module registration with custom options
  describe('forRoot() with custom options', () => {
    let module: TestingModule;
    const customOptions: DatabaseModuleOptions = {
      databaseUrl: 'postgresql://custom:custom@localhost:5432/custom',
      enableLogging: false,
      enablePerformanceTracking: false,
      enableCircuitBreaker: false,
      enableTransformation: false,
      isGlobal: false,
      connectionPool: {
        minConnections: 5,
        maxConnections: 20,
        maxIdleConnections: 10,
        connectionTimeout: 10000,
      },
      retry: {
        maxRetries: 5,
        baseDelay: 200,
        maxDelay: 10000,
        useJitter: false,
      },
    };

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [DatabaseModule.forRoot(customOptions)],
      })
        .overrideProvider(PrismaService)
        .useClass(MockPrismaService)
        .overrideProvider(ConnectionManager)
        .useClass(MockConnectionManager)
        .overrideProvider(ConfigService)
        .useClass(MockConfigService)
        .compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should use custom options', () => {
      const options = module.get<DatabaseModuleOptions>('DATABASE_MODULE_OPTIONS');
      expect(options).toBeDefined();
      expect(options.databaseUrl).toBe(customOptions.databaseUrl);
      expect(options.enableLogging).toBe(customOptions.enableLogging);
      expect(options.enablePerformanceTracking).toBe(customOptions.enablePerformanceTracking);
      expect(options.enableCircuitBreaker).toBe(customOptions.enableCircuitBreaker);
      expect(options.enableTransformation).toBe(customOptions.enableTransformation);
      expect(options.isGlobal).toBe(customOptions.isGlobal);
      expect(options.connectionPool).toEqual(customOptions.connectionPool);
      expect(options.retry).toEqual(customOptions.retry);
    });

    it('should not provide LoggingMiddleware when disabled', () => {
      expect(() => module.get<LoggingMiddleware>(LoggingMiddleware)).toThrow();
    });

    it('should not provide PerformanceMiddleware when disabled', () => {
      expect(() => module.get<PerformanceMiddleware>(PerformanceMiddleware)).toThrow();
    });

    it('should not provide CircuitBreakerMiddleware when disabled', () => {
      expect(() => module.get<CircuitBreakerMiddleware>(CircuitBreakerMiddleware)).toThrow();
    });

    it('should not provide TransformationMiddleware when disabled', () => {
      expect(() => module.get<TransformationMiddleware>(TransformationMiddleware)).toThrow();
    });
  });

  // Test suite for async module registration
  describe('forRootAsync()', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          DatabaseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
              databaseUrl: configService.get<string>('database.url'),
              connectionPool: {
                maxConnections: configService.get<number>('database.poolSize'),
                connectionTimeout: configService.get<number>('database.connectionTimeout'),
              },
            }),
            inject: [ConfigService],
          }),
        ],
      })
        .overrideProvider(PrismaService)
        .useClass(MockPrismaService)
        .overrideProvider(ConnectionManager)
        .useClass(MockConnectionManager)
        .overrideProvider(ConfigService)
        .useClass(MockConfigService)
        .compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should provide PrismaService', () => {
      const prismaService = module.get<PrismaService>(PrismaService);
      expect(prismaService).toBeDefined();
      expect(prismaService).toBeInstanceOf(MockPrismaService);
    });

    it('should use config service values', () => {
      const options = module.get<DatabaseModuleOptions>('DATABASE_MODULE_OPTIONS');
      expect(options).toBeDefined();
      expect(options.databaseUrl).toBe('postgresql://test:test@localhost:5432/test');
      expect(options.connectionPool?.maxConnections).toBe(10);
      expect(options.connectionPool?.connectionTimeout).toBe(5000);
    });

    it('should initialize DatabaseModuleService with config values', () => {
      const databaseModuleService = module.get<DatabaseModuleService>(DatabaseModuleService);
      expect(databaseModuleService).toBeDefined();
      // We can't directly test the private properties, but we can verify the service is created
    });
  });

  // Test suite for journey-specific module registration
  describe('forJourney()', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [DatabaseModule.forJourney(JourneyType.HEALTH)],
      })
        .overrideProvider(PrismaService)
        .useClass(MockPrismaService)
        .overrideProvider(ConnectionManager)
        .useClass(MockConnectionManager)
        .overrideProvider(ConfigService)
        .useClass(MockConfigService)
        .compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should set journey type in options', () => {
      const options = module.get<DatabaseModuleOptions>('DATABASE_MODULE_OPTIONS');
      expect(options).toBeDefined();
      expect(options.journeyType).toBe(JourneyType.HEALTH);
    });

    it('should provide journey-specific context', () => {
      const healthContext = module.get<HealthContext>(HealthContext);
      expect(healthContext).toBeDefined();
    });

    it('should not provide other journey contexts', () => {
      expect(() => module.get<CareContext>(CareContext)).toThrow();
      expect(() => module.get<PlanContext>(PlanContext)).toThrow();
    });
  });

  // Test suite for testing module registration
  describe('forTesting()', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [DatabaseModule.forTesting()],
      }).compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should provide mock PrismaService', () => {
      const prismaService = module.get<PrismaService>(PrismaService);
      expect(prismaService).toBeDefined();
      expect(prismaService.$connect).toBeDefined();
      expect(prismaService.$disconnect).toBeDefined();
      expect(prismaService.applyMigrations).toBeDefined();
      expect(prismaService.$transaction).toBeDefined();
    });

    it('should provide mock ConnectionManager', () => {
      const connectionManager = module.get<ConnectionManager>(ConnectionManager);
      expect(connectionManager).toBeDefined();
      expect(connectionManager.initialize).toBeDefined();
      expect(connectionManager.shutdown).toBeDefined();
      expect(connectionManager.getConnection).toBeDefined();
      expect(connectionManager.releaseConnection).toBeDefined();
    });

    it('should provide mock journey contexts', () => {
      const baseContext = module.get<BaseJourneyContext>(BaseJourneyContext);
      const healthContext = module.get<HealthContext>(HealthContext);
      const careContext = module.get<CareContext>(CareContext);
      const planContext = module.get<PlanContext>(PlanContext);

      expect(baseContext).toBeDefined();
      expect(healthContext).toBeDefined();
      expect(careContext).toBeDefined();
      expect(planContext).toBeDefined();

      expect(baseContext.executeQuery).toBeDefined();
      expect(healthContext.getHealthMetrics).toBeDefined();
      expect(careContext.getAppointments).toBeDefined();
      expect(planContext.getPlans).toBeDefined();
    });

    it('should provide mock TransactionService', () => {
      const transactionService = module.get<TransactionService>(TransactionService);
      expect(transactionService).toBeDefined();
      expect(transactionService.startTransaction).toBeDefined();
      expect(transactionService.commitTransaction).toBeDefined();
      expect(transactionService.rollbackTransaction).toBeDefined();
      expect(transactionService.executeInTransaction).toBeDefined();
    });

    it('should use test configuration', () => {
      const options = module.get<DatabaseModuleOptions>('DATABASE_MODULE_OPTIONS');
      expect(options).toBeDefined();
      expect(options.enableLogging).toBe(false);
      expect(options.autoApplyMigrations).toBe(false);
      expect(options.databaseUrl).toBe('postgresql://test:test@localhost:5432/test');
    });
  });

  // Test suite for global module availability
  describe('Global module availability', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [GlobalTestModule],
      })
        .overrideProvider(PrismaService)
        .useClass(MockPrismaService)
        .overrideProvider(ConnectionManager)
        .useClass(MockConnectionManager)
        .overrideProvider(ConfigService)
        .useClass(MockConfigService)
        .compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should make PrismaService globally available', () => {
      const prismaService = module.get<PrismaService>(PrismaService);
      expect(prismaService).toBeDefined();
      expect(prismaService).toBeInstanceOf(MockPrismaService);
    });

    it('should make ConnectionManager globally available', () => {
      const connectionManager = module.get<ConnectionManager>(ConnectionManager);
      expect(connectionManager).toBeDefined();
      expect(connectionManager).toBeInstanceOf(MockConnectionManager);
    });

    it('should make TransactionService globally available', () => {
      const transactionService = module.get<TransactionService>(TransactionService);
      expect(transactionService).toBeDefined();
    });

    it('should make ErrorTransformer globally available', () => {
      const errorTransformer = module.get<ErrorTransformer>(ErrorTransformer);
      expect(errorTransformer).toBeDefined();
    });

    it('should make BaseJourneyContext globally available', () => {
      const baseJourneyContext = module.get<BaseJourneyContext>(BaseJourneyContext);
      expect(baseJourneyContext).toBeDefined();
    });
  });

  // Test suite for module lifecycle
  describe('Module lifecycle', () => {
    let module: TestingModule;
    let prismaService: MockPrismaService;
    let connectionManager: MockConnectionManager;
    let databaseModuleService: DatabaseModuleService;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [DatabaseModule.forRoot()],
      })
        .overrideProvider(PrismaService)
        .useClass(MockPrismaService)
        .overrideProvider(ConnectionManager)
        .useClass(MockConnectionManager)
        .overrideProvider(ConfigService)
        .useClass(MockConfigService)
        .compile();

      prismaService = module.get(PrismaService) as unknown as MockPrismaService;
      connectionManager = module.get(ConnectionManager) as unknown as MockConnectionManager;
      databaseModuleService = module.get(DatabaseModuleService);
    });

    afterEach(async () => {
      await module.close();
    });

    it('should initialize on module init', async () => {
      await databaseModuleService.onModuleInit();

      expect(connectionManager.initialize).toHaveBeenCalled();
      expect(prismaService.applyMigrations).not.toHaveBeenCalled(); // Default is false
    });

    it('should apply migrations when configured', async () => {
      const options = module.get<DatabaseModuleOptions>('DATABASE_MODULE_OPTIONS');
      Object.defineProperty(options, 'autoApplyMigrations', { value: true });

      await databaseModuleService.onModuleInit();

      expect(prismaService.applyMigrations).toHaveBeenCalled();
    });

    it('should clean up on module destroy', async () => {
      await databaseModuleService.onModuleDestroy();

      expect(connectionManager.shutdown).toHaveBeenCalled();
      expect(prismaService.$disconnect).toHaveBeenCalled();
    });
  });

  // Test suite for environment-specific configuration
  describe('Environment-specific configuration', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should enable logging in development environment', async () => {
      process.env.NODE_ENV = 'development';

      const module = await Test.createTestingModule({
        imports: [DatabaseModule.forRoot()],
      })
        .overrideProvider(PrismaService)
        .useClass(MockPrismaService)
        .overrideProvider(ConnectionManager)
        .useClass(MockConnectionManager)
        .overrideProvider(ConfigService)
        .useClass(MockConfigService)
        .compile();

      const options = module.get<DatabaseModuleOptions>('DATABASE_MODULE_OPTIONS');
      expect(options.enableLogging).toBe(true);

      await module.close();
    });

    it('should disable logging in production environment', async () => {
      process.env.NODE_ENV = 'production';

      const module = await Test.createTestingModule({
        imports: [DatabaseModule.forRoot()],
      })
        .overrideProvider(PrismaService)
        .useClass(MockPrismaService)
        .overrideProvider(ConnectionManager)
        .useClass(MockConnectionManager)
        .overrideProvider(ConfigService)
        .useClass(MockConfigService)
        .compile();

      const options = module.get<DatabaseModuleOptions>('DATABASE_MODULE_OPTIONS');
      expect(options.enableLogging).toBe(false);

      await module.close();
    });
  });

  // Test suite for dynamic provider creation
  describe('Dynamic provider creation', () => {
    it('should create providers based on options', async () => {
      // With all middleware enabled
      const moduleWithAllMiddleware = await Test.createTestingModule({
        imports: [
          DatabaseModule.forRoot({
            enableLogging: true,
            enablePerformanceTracking: true,
            enableCircuitBreaker: true,
            enableTransformation: true,
          }),
        ],
      })
        .overrideProvider(PrismaService)
        .useClass(MockPrismaService)
        .overrideProvider(ConnectionManager)
        .useClass(MockConnectionManager)
        .overrideProvider(ConfigService)
        .useClass(MockConfigService)
        .compile();

      expect(moduleWithAllMiddleware.get(LoggingMiddleware)).toBeDefined();
      expect(moduleWithAllMiddleware.get(PerformanceMiddleware)).toBeDefined();
      expect(moduleWithAllMiddleware.get(CircuitBreakerMiddleware)).toBeDefined();
      expect(moduleWithAllMiddleware.get(TransformationMiddleware)).toBeDefined();

      await moduleWithAllMiddleware.close();

      // With selective middleware enabled
      const moduleWithSelectiveMiddleware = await Test.createTestingModule({
        imports: [
          DatabaseModule.forRoot({
            enableLogging: true,
            enablePerformanceTracking: false,
            enableCircuitBreaker: true,
            enableTransformation: false,
          }),
        ],
      })
        .overrideProvider(PrismaService)
        .useClass(MockPrismaService)
        .overrideProvider(ConnectionManager)
        .useClass(MockConnectionManager)
        .overrideProvider(ConfigService)
        .useClass(MockConfigService)
        .compile();

      expect(moduleWithSelectiveMiddleware.get(LoggingMiddleware)).toBeDefined();
      expect(() => moduleWithSelectiveMiddleware.get(PerformanceMiddleware)).toThrow();
      expect(moduleWithSelectiveMiddleware.get(CircuitBreakerMiddleware)).toBeDefined();
      expect(() => moduleWithSelectiveMiddleware.get(TransformationMiddleware)).toThrow();

      await moduleWithSelectiveMiddleware.close();
    });

    it('should create journey-specific providers', async () => {
      // Health journey
      const healthModule = await Test.createTestingModule({
        imports: [DatabaseModule.forJourney(JourneyType.HEALTH)],
      })
        .overrideProvider(PrismaService)
        .useClass(MockPrismaService)
        .overrideProvider(ConnectionManager)
        .useClass(MockConnectionManager)
        .overrideProvider(ConfigService)
        .useClass(MockConfigService)
        .compile();

      expect(healthModule.get(HealthContext)).toBeDefined();
      expect(() => healthModule.get(CareContext)).toThrow();
      expect(() => healthModule.get(PlanContext)).toThrow();

      await healthModule.close();

      // Care journey
      const careModule = await Test.createTestingModule({
        imports: [DatabaseModule.forJourney(JourneyType.CARE)],
      })
        .overrideProvider(PrismaService)
        .useClass(MockPrismaService)
        .overrideProvider(ConnectionManager)
        .useClass(MockConnectionManager)
        .overrideProvider(ConfigService)
        .useClass(MockConfigService)
        .compile();

      expect(() => careModule.get(HealthContext)).toThrow();
      expect(careModule.get(CareContext)).toBeDefined();
      expect(() => careModule.get(PlanContext)).toThrow();

      await careModule.close();

      // Plan journey
      const planModule = await Test.createTestingModule({
        imports: [DatabaseModule.forJourney(JourneyType.PLAN)],
      })
        .overrideProvider(PrismaService)
        .useClass(MockPrismaService)
        .overrideProvider(ConnectionManager)
        .useClass(MockConnectionManager)
        .overrideProvider(ConfigService)
        .useClass(MockConfigService)
        .compile();

      expect(() => planModule.get(HealthContext)).toThrow();
      expect(() => planModule.get(CareContext)).toThrow();
      expect(planModule.get(PlanContext)).toBeDefined();

      await planModule.close();
    });
  });

  // Test suite for custom providers
  describe('Custom providers', () => {
    it('should register custom providers', async () => {
      // Define a custom provider
      class CustomService {}
      const customProvider: Provider = {
        provide: CustomService,
        useClass: CustomService,
      };

      const module = await Test.createTestingModule({
        imports: [
          DatabaseModule.forRoot({
            providers: [customProvider],
          }),
        ],
      })
        .overrideProvider(PrismaService)
        .useClass(MockPrismaService)
        .overrideProvider(ConnectionManager)
        .useClass(MockConnectionManager)
        .overrideProvider(ConfigService)
        .useClass(MockConfigService)
        .compile();

      expect(module.get(CustomService)).toBeDefined();

      await module.close();
    });
  });
});