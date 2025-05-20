import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@austa/logging';
import { TracingModule } from '@austa/tracing';
import { KafkaModule } from '../../../src/kafka/kafka.module';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { EventSchemaRegistry } from '../../../src/schema/schema-registry.service';
import { KAFKA_MODULE_OPTIONS, EVENT_SCHEMA_REGISTRY } from '../../../src/constants/tokens.constants';
import { KafkaModuleOptions } from '../../../src/interfaces/kafka-options.interface';

/**
 * Unit tests for the KafkaModule.
 * 
 * These tests verify that the KafkaModule correctly integrates with NestJS
 * dependency injection system, properly registers providers, and supports
 * various module registration patterns.
 */
describe('KafkaModule', () => {
  // Test basic module registration
  describe('basic registration', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [KafkaModule],
      }).compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should provide KafkaService', () => {
      const service = module.get<KafkaService>(KafkaService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(KafkaService);
    });

    it('should import required modules', () => {
      // Verify that the required modules are imported
      expect(() => module.get(ConfigModule)).not.toThrow();
      expect(() => module.get(LoggerModule)).not.toThrow();
      expect(() => module.get(TracingModule)).not.toThrow();
    });
  });

  // Test module registration with options
  describe('register() with options', () => {
    let module: TestingModule;
    const testOptions: KafkaModuleOptions = {
      serviceName: 'test-service',
      configNamespace: 'test-namespace',
      enableSchemaValidation: true,
    };

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [KafkaModule.register(testOptions)],
      }).compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should register module with options', () => {
      const options = module.get<KafkaModuleOptions>(KAFKA_MODULE_OPTIONS);
      expect(options).toEqual(testOptions);
    });

    it('should provide EventSchemaRegistry when enableSchemaValidation is true', () => {
      const schemaRegistry = module.get<EventSchemaRegistry>(EVENT_SCHEMA_REGISTRY);
      expect(schemaRegistry).toBeDefined();
      expect(schemaRegistry).toBeInstanceOf(EventSchemaRegistry);
    });

    it('should export KafkaService', () => {
      // Create a module that imports KafkaModule to test exports
      const createTestModule = async () => {
        return Test.createTestingModule({
          imports: [KafkaModule.register(testOptions)],
          providers: [
            {
              provide: 'TEST_PROVIDER',
              useFactory: (kafkaService: KafkaService) => {
                return { kafkaService };
              },
              inject: [KafkaService],
            },
          ],
        }).compile();
      };

      return createTestModule().then((testModule) => {
        const testProvider = testModule.get('TEST_PROVIDER');
        expect(testProvider.kafkaService).toBeInstanceOf(KafkaService);
        return testModule.close();
      });
    });
  });

  // Test module registration without schema validation
  describe('register() without schema validation', () => {
    let module: TestingModule;
    const testOptions: KafkaModuleOptions = {
      serviceName: 'test-service',
      enableSchemaValidation: false,
    };

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [KafkaModule.register(testOptions)],
      }).compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should not provide EventSchemaRegistry when enableSchemaValidation is false', () => {
      expect(() => module.get<EventSchemaRegistry>(EVENT_SCHEMA_REGISTRY)).toThrow();
    });
  });

  // Test global module registration
  describe('registerGlobal()', () => {
    let module: TestingModule;
    const testOptions: KafkaModuleOptions = {
      serviceName: 'test-service',
    };

    beforeEach(async () => {
      // Create a dynamic module with KafkaModule registered as global
      const dynamicModule = KafkaModule.registerGlobal(testOptions);
      
      // Verify the module is marked as global
      expect(dynamicModule.global).toBe(true);
      
      module = await Test.createTestingModule({
        imports: [dynamicModule],
      }).compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should register module with options', () => {
      const options = module.get<KafkaModuleOptions>(KAFKA_MODULE_OPTIONS);
      expect(options).toEqual(testOptions);
    });

    it('should make KafkaService available globally', async () => {
      // Create a separate module that doesn't import KafkaModule
      // but should have access to KafkaService because it's global
      const testModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'TEST_PROVIDER',
            useFactory: (kafkaService: KafkaService) => {
              return { kafkaService };
            },
            inject: [KafkaService],
          },
        ],
      }).compile();

      try {
        const testProvider = testModule.get('TEST_PROVIDER');
        expect(testProvider.kafkaService).toBeInstanceOf(KafkaService);
      } finally {
        await testModule.close();
      }
    });
  });

  // Test async module registration
  describe('registerAsync()', () => {
    let module: TestingModule;
    const testOptions: KafkaModuleOptions = {
      serviceName: 'test-service',
      enableSchemaValidation: true,
    };

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          KafkaModule.registerAsync({
            imports: [ConfigModule.forRoot()],
            useFactory: () => testOptions,
            inject: [ConfigModule],
          }),
        ],
      }).compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should register module with async factory', () => {
      const options = module.get<KafkaModuleOptions>(KAFKA_MODULE_OPTIONS);
      expect(options).toEqual(testOptions);
    });

    it('should provide EventSchemaRegistry', () => {
      const schemaRegistry = module.get<EventSchemaRegistry>(EVENT_SCHEMA_REGISTRY);
      expect(schemaRegistry).toBeDefined();
      expect(schemaRegistry).toBeInstanceOf(EventSchemaRegistry);
    });

    it('should export KafkaService and EventSchemaRegistry', () => {
      // Create a module that imports KafkaModule to test exports
      const createTestModule = async () => {
        return Test.createTestingModule({
          imports: [
            KafkaModule.registerAsync({
              useFactory: () => testOptions,
            }),
          ],
          providers: [
            {
              provide: 'TEST_PROVIDER',
              useFactory: (kafkaService: KafkaService, schemaRegistry: EventSchemaRegistry) => {
                return { kafkaService, schemaRegistry };
              },
              inject: [KafkaService, EVENT_SCHEMA_REGISTRY],
            },
          ],
        }).compile();
      };

      return createTestModule().then((testModule) => {
        const testProvider = testModule.get('TEST_PROVIDER');
        expect(testProvider.kafkaService).toBeInstanceOf(KafkaService);
        expect(testProvider.schemaRegistry).toBeInstanceOf(EventSchemaRegistry);
        return testModule.close();
      });
    });
  });

  // Test global async module registration
  describe('registerAsync() with global flag', () => {
    let module: TestingModule;
    const testOptions: KafkaModuleOptions = {
      serviceName: 'test-service',
    };

    beforeEach(async () => {
      // Create a dynamic module with KafkaModule registered as global
      const dynamicModule = KafkaModule.registerAsync({
        useFactory: () => testOptions,
        global: true,
      });
      
      module = await Test.createTestingModule({
        imports: [dynamicModule],
      }).compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should make KafkaService available globally', async () => {
      // Create a separate module that doesn't import KafkaModule
      // but should have access to KafkaService because it's global
      const testModule = await Test.createTestingModule({
        providers: [
          {
            provide: 'TEST_PROVIDER',
            useFactory: (kafkaService: KafkaService) => {
              return { kafkaService };
            },
            inject: [KafkaService],
          },
        ],
      }).compile();

      try {
        const testProvider = testModule.get('TEST_PROVIDER');
        expect(testProvider.kafkaService).toBeInstanceOf(KafkaService);
      } finally {
        await testModule.close();
      }
    });
  });

  // Test integration with other modules
  describe('integration with other modules', () => {
    let module: TestingModule;

    beforeEach(async () => {
      // Create a test module that simulates a journey service
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          LoggerModule.register({ service: 'test-service' }),
          TracingModule.register({ service: 'test-service' }),
          KafkaModule.register({
            serviceName: 'test-service',
            enableSchemaValidation: true,
          }),
        ],
        providers: [
          {
            provide: 'JOURNEY_SERVICE',
            useFactory: (kafkaService: KafkaService) => {
              return { kafkaService };
            },
            inject: [KafkaService],
          },
        ],
      }).compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should integrate with ConfigModule', () => {
      const configService = module.get(ConfigModule);
      expect(configService).toBeDefined();
    });

    it('should integrate with LoggerModule', () => {
      const loggerModule = module.get(LoggerModule);
      expect(loggerModule).toBeDefined();
    });

    it('should integrate with TracingModule', () => {
      const tracingModule = module.get(TracingModule);
      expect(tracingModule).toBeDefined();
    });

    it('should provide KafkaService to journey service', () => {
      const journeyService = module.get('JOURNEY_SERVICE');
      expect(journeyService).toBeDefined();
      expect(journeyService.kafkaService).toBeInstanceOf(KafkaService);
    });
  });

  // Test default options
  describe('default options', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [KafkaModule.register()],
      }).compile();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should use empty object as default options', () => {
      const options = module.get<KafkaModuleOptions>(KAFKA_MODULE_OPTIONS);
      expect(options).toEqual({});
    });

    it('should still provide KafkaService', () => {
      const service = module.get<KafkaService>(KafkaService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(KafkaService);
    });
  });
});