import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { DatabaseModule } from '../../src/database.module';
import { PrismaService } from '../../src/prisma.service';
import { ConnectionManager } from '../../src/connection/connection-manager';
import { TransactionService } from '../../src/transactions/transaction.service';
import { ErrorTransformer } from '../../src/errors/error-transformer';
import { HealthContext } from '../../src/contexts/health.context';
import { CareContext } from '../../src/contexts/care.context';
import { PlanContext } from '../../src/contexts/plan.context';
import { BaseJourneyContext } from '../../src/contexts/base-journey.context';

/**
 * Custom journey context for testing
 */
class CustomJourneyContext extends BaseJourneyContext {
  constructor(prisma: PrismaService, transactionService: TransactionService) {
    super(prisma, transactionService);
  }
}

/**
 * Mock module for testing module imports
 */
@Module({})
class TestModule {}

/**
 * Unit tests for the DatabaseModule
 * 
 * These tests verify that the DatabaseModule correctly registers providers,
 * configures dynamic options, and makes services available to consuming modules.
 */
describe('DatabaseModule', () => {
  let module: TestingModule;
  let configService: ConfigService;

  beforeEach(() => {
    // Mock the ConfigService
    configService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config = {
          'DATABASE_URL': 'postgresql://user:password@localhost:5432/test_db',
          'HEALTH_DATABASE_URL': 'postgresql://user:password@localhost:5432/health_db',
          'CARE_DATABASE_URL': 'postgresql://user:password@localhost:5432/care_db',
          'PLAN_DATABASE_URL': 'postgresql://user:password@localhost:5432/plan_db',
          'NODE_ENV': 'test',
        };
        return config[key] || defaultValue;
      }),
    } as unknown as ConfigService;
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
    jest.clearAllMocks();
  });

  describe('module registration', () => {
    it('should be defined', () => {
      expect(DatabaseModule).toBeDefined();
    });

    it('should be a global module', () => {
      // Check if the module has the @Global() decorator
      const metadata = Reflect.getMetadata('__module', DatabaseModule);
      expect(metadata).toBeDefined();
      expect(metadata.global).toBe(true);
    });
  });

  describe('forRoot', () => {
    it('should register core providers with default options', async () => {
      // Create a test module with DatabaseModule.forRoot()
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          DatabaseModule.forRoot(),
        ],
      })
        .overrideProvider(ConfigService)
        .useValue(configService)
        .compile();

      // Verify that core providers are registered
      expect(module.get(PrismaService)).toBeDefined();
      expect(module.get(ConnectionManager)).toBeDefined();
      expect(module.get(TransactionService)).toBeDefined();
      expect(module.get(ErrorTransformer)).toBeDefined();

      // Verify that journey contexts are registered by default
      expect(module.get(HealthContext)).toBeDefined();
      expect(module.get(CareContext)).toBeDefined();
      expect(module.get(PlanContext)).toBeDefined();
    });

    it('should respect custom options', async () => {
      // Create a test module with custom options
      const customProvider: Provider = {
        provide: 'CUSTOM_PROVIDER',
        useValue: { test: true },
      };

      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          DatabaseModule.forRoot({
            registerJourneyContexts: false,
            enableQueryLogging: true,
            maxConnections: 20,
            extraProviders: [customProvider],
          }),
        ],
      })
        .overrideProvider(ConfigService)
        .useValue(configService)
        .compile();

      // Verify that core providers are registered
      expect(module.get(PrismaService)).toBeDefined();
      expect(module.get(ConnectionManager)).toBeDefined();
      expect(module.get(TransactionService)).toBeDefined();
      expect(module.get(ErrorTransformer)).toBeDefined();

      // Verify that custom provider is registered
      expect(module.get('CUSTOM_PROVIDER')).toBeDefined();
      expect(module.get('CUSTOM_PROVIDER')).toEqual({ test: true });

      // Verify that journey contexts are not registered
      expect(() => module.get(HealthContext)).toThrow();
      expect(() => module.get(CareContext)).toThrow();
      expect(() => module.get(PlanContext)).toThrow();

      // Verify that DATABASE_OPTIONS is registered with custom values
      const options = module.get('DATABASE_OPTIONS');
      expect(options).toBeDefined();
      expect(options.registerJourneyContexts).toBe(false);
      expect(options.enableQueryLogging).toBe(true);
      expect(options.maxConnections).toBe(20);
    });

    it('should register custom journey contexts', async () => {
      // Create a test module with custom journey context
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          DatabaseModule.forRoot({
            customJourneyContexts: [CustomJourneyContext],
          }),
        ],
      })
        .overrideProvider(ConfigService)
        .useValue(configService)
        .compile();

      // Verify that custom journey context is registered
      expect(module.get(CustomJourneyContext)).toBeDefined();
    });
  });

  describe('forJourney', () => {
    it('should configure for health journey', async () => {
      // Create a test module for health journey
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          DatabaseModule.forJourney('health'),
        ],
      })
        .overrideProvider(ConfigService)
        .useValue(configService)
        .compile();

      // Verify that core providers are registered
      expect(module.get(PrismaService)).toBeDefined();
      expect(module.get(ConnectionManager)).toBeDefined();
      expect(module.get(TransactionService)).toBeDefined();
      expect(module.get(ErrorTransformer)).toBeDefined();

      // Verify that only health context is registered
      expect(module.get(HealthContext)).toBeDefined();
      expect(() => module.get(CareContext)).toThrow();
      expect(() => module.get(PlanContext)).toThrow();

      // Verify that DATABASE_OPTIONS is registered with journey type
      const options = module.get('DATABASE_OPTIONS');
      expect(options).toBeDefined();
      expect(options.journeyType).toBe('health');

      // Verify that PrismaService is configured with the correct database URL
      const prismaServiceSpy = jest.spyOn(configService, 'get');
      expect(prismaServiceSpy).toHaveBeenCalledWith('HEALTH_DATABASE_URL');
    });

    it('should configure for care journey', async () => {
      // Create a test module for care journey
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          DatabaseModule.forJourney('care'),
        ],
      })
        .overrideProvider(ConfigService)
        .useValue(configService)
        .compile();

      // Verify that core providers are registered
      expect(module.get(PrismaService)).toBeDefined();
      expect(module.get(ConnectionManager)).toBeDefined();
      expect(module.get(TransactionService)).toBeDefined();
      expect(module.get(ErrorTransformer)).toBeDefined();

      // Verify that only care context is registered
      expect(() => module.get(HealthContext)).toThrow();
      expect(module.get(CareContext)).toBeDefined();
      expect(() => module.get(PlanContext)).toThrow();

      // Verify that DATABASE_OPTIONS is registered with journey type
      const options = module.get('DATABASE_OPTIONS');
      expect(options).toBeDefined();
      expect(options.journeyType).toBe('care');

      // Verify that PrismaService is configured with the correct database URL
      const prismaServiceSpy = jest.spyOn(configService, 'get');
      expect(prismaServiceSpy).toHaveBeenCalledWith('CARE_DATABASE_URL');
    });

    it('should configure for plan journey', async () => {
      // Create a test module for plan journey
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          DatabaseModule.forJourney('plan'),
        ],
      })
        .overrideProvider(ConfigService)
        .useValue(configService)
        .compile();

      // Verify that core providers are registered
      expect(module.get(PrismaService)).toBeDefined();
      expect(module.get(ConnectionManager)).toBeDefined();
      expect(module.get(TransactionService)).toBeDefined();
      expect(module.get(ErrorTransformer)).toBeDefined();

      // Verify that only plan context is registered
      expect(() => module.get(HealthContext)).toThrow();
      expect(() => module.get(CareContext)).toThrow();
      expect(module.get(PlanContext)).toBeDefined();

      // Verify that DATABASE_OPTIONS is registered with journey type
      const options = module.get('DATABASE_OPTIONS');
      expect(options).toBeDefined();
      expect(options.journeyType).toBe('plan');

      // Verify that PrismaService is configured with the correct database URL
      const prismaServiceSpy = jest.spyOn(configService, 'get');
      expect(prismaServiceSpy).toHaveBeenCalledWith('PLAN_DATABASE_URL');
    });

    it('should throw error for invalid journey type', () => {
      // Attempt to create a module with invalid journey type
      expect(() => {
        DatabaseModule.forJourney('invalid' as any);
      }).toThrow('Invalid journey type: invalid');
    });
  });

  describe('forTesting', () => {
    it('should register mock implementations for testing', async () => {
      // Create a test module with DatabaseModule.forTesting()
      module = await Test.createTestingModule({
        imports: [
          DatabaseModule.forTesting(),
        ],
      }).compile();

      // Verify that mock providers are registered
      const prismaService = module.get(PrismaService);
      expect(prismaService).toBeDefined();
      expect(prismaService.$connect).toBeDefined();
      expect(prismaService.$connect).toBeInstanceOf(Function);

      const connectionManager = module.get(ConnectionManager);
      expect(connectionManager).toBeDefined();
      expect(connectionManager.getConnection).toBeDefined();
      expect(connectionManager.getConnection).toBeInstanceOf(Function);

      const transactionService = module.get(TransactionService);
      expect(transactionService).toBeDefined();
      expect(transactionService.startTransaction).toBeDefined();
      expect(transactionService.startTransaction).toBeInstanceOf(Function);

      // Verify that mock journey contexts are registered by default
      const healthContext = module.get(HealthContext);
      expect(healthContext).toBeDefined();
      expect(healthContext.findById).toBeDefined();
      expect(healthContext.findById).toBeInstanceOf(Function);

      const careContext = module.get(CareContext);
      expect(careContext).toBeDefined();
      expect(careContext.findById).toBeDefined();
      expect(careContext.findById).toBeInstanceOf(Function);

      const planContext = module.get(PlanContext);
      expect(planContext).toBeDefined();
      expect(planContext.findById).toBeDefined();
      expect(planContext.findById).toBeInstanceOf(Function);
    });

    it('should respect custom options for testing', async () => {
      // Create a test module with custom options
      const customProvider: Provider = {
        provide: 'CUSTOM_TEST_PROVIDER',
        useValue: { test: true },
      };

      module = await Test.createTestingModule({
        imports: [
          DatabaseModule.forTesting({
            registerJourneyContexts: false,
            extraProviders: [customProvider],
          }),
        ],
      }).compile();

      // Verify that core providers are registered
      expect(module.get(PrismaService)).toBeDefined();
      expect(module.get(ConnectionManager)).toBeDefined();
      expect(module.get(TransactionService)).toBeDefined();
      expect(module.get(ErrorTransformer)).toBeDefined();

      // Verify that custom provider is registered
      expect(module.get('CUSTOM_TEST_PROVIDER')).toBeDefined();
      expect(module.get('CUSTOM_TEST_PROVIDER')).toEqual({ test: true });

      // Verify that journey contexts are not registered
      expect(() => module.get(HealthContext)).toThrow();
      expect(() => module.get(CareContext)).toThrow();
      expect(() => module.get(PlanContext)).toThrow();

      // Verify that DATABASE_OPTIONS is registered with custom values
      const options = module.get('DATABASE_OPTIONS');
      expect(options).toBeDefined();
      expect(options.registerJourneyContexts).toBe(false);
      expect(options.enableQueryLogging).toBe(false); // Default for testing
      expect(options.maxConnections).toBe(5); // Default for testing
    });
  });

  describe('global module availability', () => {
    it('should make providers available to other modules', async () => {
      // Create a module that imports DatabaseModule
      @Module({
        imports: [DatabaseModule.forRoot()],
        providers: [],
        exports: [],
      })
      class ImportingModule {}

      // Create a module that depends on ImportingModule
      @Module({
        imports: [ImportingModule],
        providers: [],
        exports: [],
      })
      class DependentModule {}

      // Create a test module with the dependent module
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          DependentModule,
        ],
      })
        .overrideProvider(ConfigService)
        .useValue(configService)
        .compile();

      // Verify that providers from DatabaseModule are available in the dependent module
      expect(module.get(PrismaService)).toBeDefined();
      expect(module.get(ConnectionManager)).toBeDefined();
      expect(module.get(TransactionService)).toBeDefined();
      expect(module.get(ErrorTransformer)).toBeDefined();
      expect(module.get(HealthContext)).toBeDefined();
      expect(module.get(CareContext)).toBeDefined();
      expect(module.get(PlanContext)).toBeDefined();
    });
  });

  describe('environment-specific configuration', () => {
    it('should configure based on environment variables', async () => {
      // Mock environment-specific configuration
      const envConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => {
          const config = {
            'DATABASE_URL': 'postgresql://user:password@localhost:5432/prod_db',
            'NODE_ENV': 'production',
            'DATABASE_POOL_MIN': '10',
            'DATABASE_POOL_MAX': '50',
            'DATABASE_ENABLE_QUERY_LOGGING': 'false',
          };
          return config[key] || defaultValue;
        }),
      } as unknown as ConfigService;

      // Create a test module with production environment
      const dynamicModule = DatabaseModule.forRoot();
      
      // Find the PrismaService provider
      const prismaProvider = (dynamicModule.providers as Provider[]).find(
        (provider: any) => provider.provide === PrismaService
      );
      
      expect(prismaProvider).toBeDefined();
      expect(prismaProvider.useFactory).toBeDefined();
      
      // Call the factory function with our mock config service
      const prismaService = await prismaProvider.useFactory(envConfigService);
      
      // Verify that the config service was called with the expected keys
      expect(envConfigService.get).toHaveBeenCalledWith('DATABASE_URL');
      expect(envConfigService.get).toHaveBeenCalledWith('NODE_ENV', 'development');
    });
  });
});