import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../../src/database.module';
import { PrismaService } from '../../src/prisma.service';
import { ConnectionManager } from '../../src/connection/connection-manager';
import { ConnectionPool } from '../../src/connection/connection-pool';
import { ConnectionHealth } from '../../src/connection/connection-health';
import { ConnectionRetry } from '../../src/connection/connection-retry';
import { MiddlewareRegistry } from '../../src/middleware/middleware.registry';
import { MiddlewareFactory } from '../../src/middleware/middleware.factory';
import { TransactionService } from '../../src/transactions/transaction.service';
import { ErrorTransformer } from '../../src/errors/error-transformer';
import { HealthContext } from '../../src/contexts/health.context';
import { CareContext } from '../../src/contexts/care.context';
import { PlanContext } from '../../src/contexts/plan.context';

describe('DatabaseModule Integration', () => {
  let module: TestingModule;

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('forRoot registration', () => {
    beforeEach(async () => {
      // Mock environment variables for testing
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
      process.env.NODE_ENV = 'test';

      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true, // Use process.env directly
          }),
          DatabaseModule.forRoot({
            enableQueryLogging: false,
            maxConnections: 5,
          }),
        ],
      }).compile();

      await module.init();
    });

    it('should register the DatabaseModule', () => {
      expect(module).toBeDefined();
    });

    it('should provide PrismaService', () => {
      const prismaService = module.get<PrismaService>(PrismaService);
      expect(prismaService).toBeDefined();
      expect(prismaService).toBeInstanceOf(PrismaService);
    });

    it('should provide ConnectionManager', () => {
      const connectionManager = module.get<ConnectionManager>(ConnectionManager);
      expect(connectionManager).toBeDefined();
    });

    it('should provide TransactionService', () => {
      const transactionService = module.get<TransactionService>(TransactionService);
      expect(transactionService).toBeDefined();
    });

    it('should provide ErrorTransformer', () => {
      const errorTransformer = module.get<ErrorTransformer>(ErrorTransformer);
      expect(errorTransformer).toBeDefined();
    });

    it('should register all required providers', () => {
      // Core services
      expect(module.get(PrismaService)).toBeDefined();
      expect(module.get(ConnectionManager)).toBeDefined();
      expect(module.get(ConnectionPool)).toBeDefined();
      expect(module.get(ConnectionHealth)).toBeDefined();
      expect(module.get(ConnectionRetry)).toBeDefined();
      expect(module.get(MiddlewareRegistry)).toBeDefined();
      expect(module.get(MiddlewareFactory)).toBeDefined();
      expect(module.get(TransactionService)).toBeDefined();
      expect(module.get(ErrorTransformer)).toBeDefined();

      // Journey contexts
      expect(module.get(HealthContext)).toBeDefined();
      expect(module.get(CareContext)).toBeDefined();
      expect(module.get(PlanContext)).toBeDefined();
    });

    it('should configure PrismaService with environment variables', () => {
      const prismaService = module.get<PrismaService>(PrismaService);
      // We can't directly access private properties, but we can check if the service was initialized
      expect(prismaService.$connect).toBeDefined();
      expect(prismaService.$disconnect).toBeDefined();
    });

    it('should register DATABASE_OPTIONS provider with merged options', () => {
      const databaseOptions = module.get('DATABASE_OPTIONS');
      expect(databaseOptions).toBeDefined();
      expect(databaseOptions.enableQueryLogging).toBe(false);
      expect(databaseOptions.maxConnections).toBe(5);
      expect(databaseOptions.registerJourneyContexts).toBe(true); // Default value
    });
  });

  describe('forJourney registration', () => {
    beforeEach(async () => {
      // Mock environment variables for testing
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
      process.env.HEALTH_DATABASE_URL = 'postgresql://test:test@localhost:5432/health_db';
      process.env.NODE_ENV = 'test';

      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true, // Use process.env directly
          }),
          DatabaseModule.forJourney('health', {
            enableQueryLogging: false,
          }),
        ],
      }).compile();

      await module.init();
    });

    it('should register the DatabaseModule for a specific journey', () => {
      expect(module).toBeDefined();
    });

    it('should provide journey-specific context', () => {
      const healthContext = module.get<HealthContext>(HealthContext);
      expect(healthContext).toBeDefined();
      expect(healthContext).toBeInstanceOf(HealthContext);
    });

    it('should configure PrismaService with journey-specific database URL', () => {
      const prismaService = module.get<PrismaService>(PrismaService);
      expect(prismaService).toBeDefined();
      // We can't directly access the URL, but we can verify the service was created
      expect(prismaService.$connect).toBeDefined();
    });

    it('should register DATABASE_OPTIONS provider with journey type', () => {
      const databaseOptions = module.get('DATABASE_OPTIONS');
      expect(databaseOptions).toBeDefined();
      expect(databaseOptions.journeyType).toBe('health');
    });

    it('should not register other journey contexts', () => {
      const healthContext = module.get<HealthContext>(HealthContext);
      expect(healthContext).toBeDefined();

      // CareContext and PlanContext should not be available
      expect(() => module.get(CareContext)).toThrow();
      expect(() => module.get(PlanContext)).toThrow();
    });
  });

  describe('forTesting registration', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
          }),
          DatabaseModule.forTesting({
            registerJourneyContexts: true,
          }),
        ],
      }).compile();

      await module.init();
    });

    it('should register the DatabaseModule for testing', () => {
      expect(module).toBeDefined();
    });

    it('should provide mock PrismaService', () => {
      const prismaService = module.get<PrismaService>(PrismaService);
      expect(prismaService).toBeDefined();
      expect(prismaService.$connect).toBeDefined();
      expect(prismaService.$connect).toBeInstanceOf(Function);
      // Verify it's a mock
      expect(jest.isMockFunction(prismaService.$connect)).toBe(true);
    });

    it('should provide mock ConnectionManager', () => {
      const connectionManager = module.get<ConnectionManager>(ConnectionManager);
      expect(connectionManager).toBeDefined();
      expect(connectionManager.getConnection).toBeDefined();
      expect(connectionManager.getConnection).toBeInstanceOf(Function);
      // Verify it's a mock
      expect(jest.isMockFunction(connectionManager.getConnection)).toBe(true);
    });

    it('should provide mock TransactionService', () => {
      const transactionService = module.get<TransactionService>(TransactionService);
      expect(transactionService).toBeDefined();
      expect(transactionService.startTransaction).toBeDefined();
      expect(transactionService.startTransaction).toBeInstanceOf(Function);
      // Verify it's a mock
      expect(jest.isMockFunction(transactionService.startTransaction)).toBe(true);
    });

    it('should register mock journey contexts if enabled', () => {
      const healthContext = module.get<HealthContext>(HealthContext);
      const careContext = module.get<CareContext>(CareContext);
      const planContext = module.get<PlanContext>(PlanContext);

      expect(healthContext).toBeDefined();
      expect(careContext).toBeDefined();
      expect(planContext).toBeDefined();

      // Verify they have mock methods
      expect(healthContext.findById).toBeDefined();
      expect(jest.isMockFunction(healthContext.findById)).toBe(true);
    });
  });

  describe('Dynamic configuration based on environment', () => {
    it('should use different logging settings based on NODE_ENV', async () => {
      // Test production environment
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

      const productionModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
          }),
          DatabaseModule.forRoot(),
        ],
      }).compile();

      await productionModule.init();
      const productionOptions = productionModule.get('DATABASE_OPTIONS');
      expect(productionOptions.enableQueryLogging).toBe(false); // Should be false in production

      await productionModule.close();

      // Test development environment
      process.env.NODE_ENV = 'development';

      const developmentModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
          }),
          DatabaseModule.forRoot(),
        ],
      }).compile();

      await developmentModule.init();
      const developmentOptions = developmentModule.get('DATABASE_OPTIONS');
      expect(developmentOptions.enableQueryLogging).toBe(true); // Should be true in development

      await developmentModule.close();
    });

    it('should prioritize journey-specific database URLs', async () => {
      // Set up environment variables
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
      process.env.CARE_DATABASE_URL = 'postgresql://test:test@localhost:5432/care_db';
      process.env.NODE_ENV = 'test';

      // Create a spy on ConfigService.get
      const configServiceGetSpy = jest.spyOn(ConfigService.prototype, 'get');

      const journeyModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
          }),
          DatabaseModule.forJourney('care'),
        ],
      }).compile();

      await journeyModule.init();

      // Verify that the journey-specific URL was requested first
      expect(configServiceGetSpy).toHaveBeenCalledWith('CARE_DATABASE_URL');

      await journeyModule.close();
      configServiceGetSpy.mockRestore();
    });
  });

  describe('Module initialization sequence', () => {
    it('should initialize PrismaService during module initialization', async () => {
      // Mock PrismaService methods
      const connectMock = jest.fn().mockResolvedValue(undefined);
      const disconnectMock = jest.fn().mockResolvedValue(undefined);

      // Create a custom testing module with mocked PrismaService
      const moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
          }),
          DatabaseModule.forTesting(),
        ],
      })
        .overrideProvider(PrismaService)
        .useValue({
          $connect: connectMock,
          $disconnect: disconnectMock,
          $on: jest.fn(),
          $transaction: jest.fn(),
        })
        .compile();

      // Initialize the module
      await moduleRef.init();

      // Verify that connect was called during initialization
      expect(connectMock).toHaveBeenCalled();

      // Close the module
      await moduleRef.close();

      // Verify that disconnect was called during cleanup
      expect(disconnectMock).toHaveBeenCalled();
    });
  });

  describe('Module imports and exports', () => {
    it('should properly export all required providers', async () => {
      // Create a test module that imports DatabaseModule
      const databaseModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
          }),
          DatabaseModule.forRoot(),
        ],
      }).compile();

      await databaseModule.init();

      // Create a consumer module that imports the DatabaseModule
      const consumerModule = await Test.createTestingModule({
        imports: [
          // Import the compiled database module
          databaseModule,
        ],
        providers: [
          // Define a provider that depends on database services
          {
            provide: 'TEST_CONSUMER',
            useFactory: (prisma: PrismaService, txService: TransactionService) => ({
              prisma,
              txService,
            }),
            inject: [PrismaService, TransactionService],
          },
        ],
      }).compile();

      await consumerModule.init();

      // Verify that the consumer can access the exported providers
      const consumer = consumerModule.get('TEST_CONSUMER');
      expect(consumer).toBeDefined();
      expect(consumer.prisma).toBeInstanceOf(PrismaService);
      expect(consumer.txService).toBeInstanceOf(TransactionService);

      await consumerModule.close();
      await databaseModule.close();
    });

    it('should make journey contexts available to consumers when using forJourney', async () => {
      // Create a test module that imports DatabaseModule.forJourney
      const databaseModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
          }),
          DatabaseModule.forJourney('health'),
        ],
      }).compile();

      await databaseModule.init();

      // Create a consumer module that imports the DatabaseModule
      const consumerModule = await Test.createTestingModule({
        imports: [
          // Import the compiled database module
          databaseModule,
        ],
        providers: [
          // Define a provider that depends on journey context
          {
            provide: 'HEALTH_CONSUMER',
            useFactory: (healthContext: HealthContext) => ({
              healthContext,
            }),
            inject: [HealthContext],
          },
        ],
      }).compile();

      await consumerModule.init();

      // Verify that the consumer can access the journey context
      const consumer = consumerModule.get('HEALTH_CONSUMER');
      expect(consumer).toBeDefined();
      expect(consumer.healthContext).toBeInstanceOf(HealthContext);

      await consumerModule.close();
      await databaseModule.close();
    });
  });
});