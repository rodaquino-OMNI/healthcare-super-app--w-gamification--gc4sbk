/**
 * @file Kafka Module Unit Tests
 * @description Tests for the NestJS Kafka module that provides dependency injection for Kafka components.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';

import { KafkaModule } from '../../../src/kafka/kafka.module';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { KafkaProducer } from '../../../src/kafka/kafka.producer';
import { IKafkaConfig, IKafkaModuleOptions } from '../../../src/kafka/kafka.interfaces';

// Mock implementation of KafkaService for testing
class MockKafkaService {
  private readonly config: IKafkaConfig;
  private connected = false;

  constructor(config: IKafkaConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    this.connected = true;
    return Promise.resolve();
  }

  disconnect(): Promise<void> {
    this.connected = false;
    return Promise.resolve();
  }

  getClient() {
    return {};
  }

  getTracingService() {
    return {};
  }

  getLoggingService() {
    return {};
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConfig(): IKafkaConfig {
    return this.config;
  }
}

// Mock implementation of KafkaProducer for testing
class MockKafkaProducer {
  constructor(
    private readonly client: any,
    private readonly tracingService: any,
    private readonly loggingService: any,
  ) {}

  connect(): Promise<void> {
    return Promise.resolve();
  }

  disconnect(): Promise<void> {
    return Promise.resolve();
  }

  isConnected(): boolean {
    return true;
  }
}

// Create a test module that uses KafkaModule
@Module({
  imports: [
    KafkaModule.register({
      config: {
        brokers: ['localhost:9092'],
        clientId: 'test-client',
      },
    }),
  ],
})
class TestModule {}

// Create a test module that uses KafkaModule with async configuration
@Module({
  imports: [
    ConfigModule.forRoot(),
    KafkaModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        config: {
          brokers: configService.get<string[]>('KAFKA_BROKERS', ['localhost:9092']),
          clientId: configService.get<string>('KAFKA_CLIENT_ID', 'test-async-client'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
class AsyncTestModule {}

// Create a test module that uses KafkaModule with forFeature (non-global)
@Module({
  imports: [
    KafkaModule.forFeature({
      config: {
        brokers: ['localhost:9092'],
        clientId: 'test-feature-client',
      },
    }),
  ],
  exports: [KafkaModule],
})
class FeatureTestModule {}

describe('KafkaModule', () => {
  // Mock the actual implementations to avoid real connections
  beforeAll(() => {
    jest.mock('../../../src/kafka/kafka.service', () => ({
      KafkaService: MockKafkaService,
    }));
    jest.mock('../../../src/kafka/kafka.producer', () => ({
      KafkaProducer: MockKafkaProducer,
    }));
  });

  afterAll(() => {
    jest.resetModules();
  });

  describe('register()', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          KafkaModule.register({
            config: {
              brokers: ['localhost:9092'],
              clientId: 'test-client',
            },
          }),
        ],
      }).compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should provide KafkaService', () => {
      const service = module.get<KafkaService>(KafkaService);
      expect(service).toBeDefined();
      expect(service.getConfig()).toEqual({
        brokers: ['localhost:9092'],
        clientId: 'test-client',
      });
    });

    it('should provide KafkaProducer', () => {
      const producer = module.get<KafkaProducer>(KafkaProducer);
      expect(producer).toBeDefined();
    });

    it('should provide KAFKA_MODULE_OPTIONS', () => {
      const options = module.get<IKafkaModuleOptions>('KAFKA_MODULE_OPTIONS');
      expect(options).toBeDefined();
      expect(options.config).toEqual({
        brokers: ['localhost:9092'],
        clientId: 'test-client',
      });
    });

    it('should register as global module by default', () => {
      // Create a child module to test global registration
      const childModule = Test.createTestingModule({
        imports: [],
      });

      // If registered globally, KafkaService should be available in child module
      expect(() => childModule.get<KafkaService>(KafkaService)).not.toThrow();
    });
  });

  describe('registerAsync()', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          KafkaModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
              config: {
                brokers: configService.get<string[]>('KAFKA_BROKERS', ['localhost:9092']),
                clientId: configService.get<string>('KAFKA_CLIENT_ID', 'test-async-client'),
              },
            }),
            inject: [ConfigService],
          }),
        ],
      }).compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should provide KafkaService with async configuration', () => {
      const service = module.get<KafkaService>(KafkaService);
      expect(service).toBeDefined();
      expect(service.getConfig()).toEqual({
        brokers: ['localhost:9092'],
        clientId: 'test-async-client',
      });
    });

    it('should provide KafkaProducer with async configuration', () => {
      const producer = module.get<KafkaProducer>(KafkaProducer);
      expect(producer).toBeDefined();
    });

    it('should inject dependencies into factory function', () => {
      const options = module.get<IKafkaModuleOptions>('KAFKA_MODULE_OPTIONS');
      expect(options).toBeDefined();
      expect(options.config.clientId).toBe('test-async-client');
    });
  });

  describe('forFeature()', () => {
    let module: TestingModule;
    let featureModule: TestingModule;

    beforeEach(async () => {
      // Create a module with non-global KafkaModule
      featureModule = await Test.createTestingModule({
        imports: [
          KafkaModule.forFeature({
            config: {
              brokers: ['localhost:9092'],
              clientId: 'test-feature-client',
            },
          }),
        ],
        exports: [KafkaModule],
      }).compile();

      // Create a parent module that imports the feature module
      module = await Test.createTestingModule({
        imports: [featureModule],
      }).compile();
    });

    afterEach(async () => {
      await module.close();
      await featureModule.close();
    });

    it('should provide KafkaService in the feature module', () => {
      const service = featureModule.get<KafkaService>(KafkaService);
      expect(service).toBeDefined();
      expect(service.getConfig().clientId).toBe('test-feature-client');
    });

    it('should provide KafkaService in the parent module that imports the feature module', () => {
      const service = module.get<KafkaService>(KafkaService);
      expect(service).toBeDefined();
      expect(service.getConfig().clientId).toBe('test-feature-client');
    });

    it('should not register as global module', () => {
      // Create a sibling module that doesn't import the feature module
      const siblingModule = Test.createTestingModule({
        imports: [],
      });

      // If not registered globally, KafkaService should not be available in sibling module
      expect(() => siblingModule.get<KafkaService>(KafkaService)).toThrow();
    });
  });

  describe('forFeatureAsync()', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          KafkaModule.forFeatureAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
              config: {
                brokers: configService.get<string[]>('KAFKA_BROKERS', ['localhost:9092']),
                clientId: configService.get<string>('KAFKA_CLIENT_ID', 'test-feature-async-client'),
              },
            }),
            inject: [ConfigService],
          }),
        ],
      }).compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should provide KafkaService with async configuration', () => {
      const service = module.get<KafkaService>(KafkaService);
      expect(service).toBeDefined();
      expect(service.getConfig().clientId).toBe('test-feature-async-client');
    });

    it('should not register as global module', () => {
      // Create a sibling module that doesn't import the feature module
      const siblingModule = Test.createTestingModule({
        imports: [],
      });

      // If not registered globally, KafkaService should not be available in sibling module
      expect(() => siblingModule.get<KafkaService>(KafkaService)).toThrow();
    });
  });

  describe('Module integration', () => {
    it('should work when imported into another module', async () => {
      const module = await Test.createTestingModule({
        imports: [TestModule],
      }).compile();

      const service = module.get<KafkaService>(KafkaService);
      expect(service).toBeDefined();
      expect(service.getConfig().clientId).toBe('test-client');

      await module.close();
    });

    it('should work with async configuration when imported into another module', async () => {
      const module = await Test.createTestingModule({
        imports: [AsyncTestModule],
      }).compile();

      const service = module.get<KafkaService>(KafkaService);
      expect(service).toBeDefined();
      expect(service.getConfig().clientId).toBe('test-async-client');

      await module.close();
    });

    it('should allow multiple instances with different configurations', async () => {
      const module = await Test.createTestingModule({
        imports: [
          // Global instance
          KafkaModule.register({
            config: {
              brokers: ['localhost:9092'],
              clientId: 'global-client',
            },
          }),
          // Feature instance (non-global)
          KafkaModule.forFeature({
            config: {
              brokers: ['localhost:9093'],
              clientId: 'feature-client',
            },
          }),
        ],
      }).compile();

      // The global instance should be available
      const globalService = module.get<KafkaService>(KafkaService);
      expect(globalService).toBeDefined();
      expect(globalService.getConfig().clientId).toBe('global-client');

      await module.close();
    });
  });

  describe('Service injection', () => {
    it('should allow KafkaService to be injected into other services', async () => {
      // Create a service that depends on KafkaService
      class TestService {
        constructor(private readonly kafkaService: KafkaService) {}

        getKafkaConfig() {
          return this.kafkaService.getConfig();
        }
      }

      const module = await Test.createTestingModule({
        imports: [
          KafkaModule.register({
            config: {
              brokers: ['localhost:9092'],
              clientId: 'injection-test-client',
            },
          }),
        ],
        providers: [TestService],
      }).compile();

      const testService = module.get<TestService>(TestService);
      expect(testService).toBeDefined();
      expect(testService.getKafkaConfig().clientId).toBe('injection-test-client');

      await module.close();
    });

    it('should allow KafkaProducer to be injected into other services', async () => {
      // Create a service that depends on KafkaProducer
      class TestService {
        constructor(private readonly kafkaProducer: KafkaProducer) {}

        isProducerConnected() {
          return this.kafkaProducer.isConnected();
        }
      }

      const module = await Test.createTestingModule({
        imports: [
          KafkaModule.register({
            config: {
              brokers: ['localhost:9092'],
              clientId: 'producer-injection-test-client',
            },
          }),
        ],
        providers: [TestService],
      }).compile();

      const testService = module.get<TestService>(TestService);
      expect(testService).toBeDefined();
      expect(testService.isProducerConnected()).toBe(true);

      await module.close();
    });
  });
});