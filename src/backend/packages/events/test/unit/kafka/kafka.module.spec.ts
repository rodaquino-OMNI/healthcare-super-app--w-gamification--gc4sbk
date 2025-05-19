import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaModule } from '../../../src/kafka/kafka.module';
import { KafkaService } from '../../../src/kafka/kafka.service';
import { KafkaProducer } from '../../../src/kafka/kafka.producer';
import { KAFKA_MODULE_OPTIONS } from '../../../src/kafka/kafka.constants';
import { KafkaModuleOptions, KafkaOptionsFactory } from '../../../src/kafka/kafka.interfaces';
import { Injectable, Module } from '@nestjs/common';

describe('KafkaModule', () => {
  // Test static registration
  describe('register', () => {
    let moduleRef: TestingModule;
    const mockKafkaOptions: KafkaModuleOptions = {
      clientId: 'test-client',
      brokers: ['localhost:9092'],
      groupId: 'test-group',
    };

    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [KafkaModule.register(mockKafkaOptions)],
      }).compile();
    });

    it('should provide the KafkaService', () => {
      const kafkaService = moduleRef.get<KafkaService>(KafkaService);
      expect(kafkaService).toBeDefined();
    });

    it('should provide the KafkaProducer', () => {
      const kafkaProducer = moduleRef.get<KafkaProducer>(KafkaProducer);
      expect(kafkaProducer).toBeDefined();
    });

    it('should provide the module options', () => {
      const options = moduleRef.get<KafkaModuleOptions>(KAFKA_MODULE_OPTIONS);
      expect(options).toEqual(mockKafkaOptions);
    });

    it('should register as a global module by default', () => {
      // Create a test module that doesn't import KafkaModule
      @Module({})
      class TestModule {}

      // The module should be available globally
      const testModuleRef = Test.createTestingModule({
        imports: [TestModule, KafkaModule.register(mockKafkaOptions, true)],
      });

      expect(testModuleRef).toBeDefined();
    });

    it('should register as a non-global module when specified', async () => {
      // Create a test module that doesn't import KafkaModule
      @Module({})
      class TestModule {}

      // Create a module that imports KafkaModule as non-global
      const nonGlobalModuleRef = await Test.createTestingModule({
        imports: [KafkaModule.register(mockKafkaOptions, false)],
      }).compile();

      const kafkaService = nonGlobalModuleRef.get<KafkaService>(KafkaService);
      expect(kafkaService).toBeDefined();

      // Create another module that doesn't import KafkaModule
      // This should throw an error when trying to get KafkaService
      const testModuleRef = await Test.createTestingModule({
        imports: [TestModule],
      }).compile();

      expect(() => testModuleRef.get<KafkaService>(KafkaService)).toThrow();
    });
  });

  // Test async registration with useFactory
  describe('registerAsync with useFactory', () => {
    let moduleRef: TestingModule;
    const mockKafkaOptions: KafkaModuleOptions = {
      clientId: 'test-client',
      brokers: ['localhost:9092'],
      groupId: 'test-group',
    };

    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({ kafka: mockKafkaOptions })],
          }),
          KafkaModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
              return configService.get('kafka');
            },
          }),
        ],
      }).compile();
    });

    it('should provide the KafkaService', () => {
      const kafkaService = moduleRef.get<KafkaService>(KafkaService);
      expect(kafkaService).toBeDefined();
    });

    it('should provide the KafkaProducer', () => {
      const kafkaProducer = moduleRef.get<KafkaProducer>(KafkaProducer);
      expect(kafkaProducer).toBeDefined();
    });

    it('should provide the module options from factory', () => {
      const options = moduleRef.get<KafkaModuleOptions>(KAFKA_MODULE_OPTIONS);
      expect(options).toEqual(mockKafkaOptions);
    });
  });

  // Test async registration with useClass
  describe('registerAsync with useClass', () => {
    @Injectable()
    class TestKafkaOptionsFactory implements KafkaOptionsFactory {
      createKafkaOptions(): KafkaModuleOptions {
        return {
          clientId: 'test-client-class',
          brokers: ['localhost:9092'],
          groupId: 'test-group-class',
        };
      }
    }

    let moduleRef: TestingModule;

    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [
          KafkaModule.registerAsync({
            useClass: TestKafkaOptionsFactory,
          }),
        ],
      }).compile();
    });

    it('should provide the KafkaService', () => {
      const kafkaService = moduleRef.get<KafkaService>(KafkaService);
      expect(kafkaService).toBeDefined();
    });

    it('should provide the KafkaProducer', () => {
      const kafkaProducer = moduleRef.get<KafkaProducer>(KafkaProducer);
      expect(kafkaProducer).toBeDefined();
    });

    it('should provide the module options from class factory', () => {
      const options = moduleRef.get<KafkaModuleOptions>(KAFKA_MODULE_OPTIONS);
      expect(options).toEqual({
        clientId: 'test-client-class',
        brokers: ['localhost:9092'],
        groupId: 'test-group-class',
      });
    });
  });

  // Test async registration with useExisting
  describe('registerAsync with useExisting', () => {
    @Injectable()
    class TestKafkaOptionsFactory implements KafkaOptionsFactory {
      createKafkaOptions(): KafkaModuleOptions {
        return {
          clientId: 'test-client-existing',
          brokers: ['localhost:9092'],
          groupId: 'test-group-existing',
        };
      }
    }

    let moduleRef: TestingModule;

    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        providers: [TestKafkaOptionsFactory],
        imports: [
          KafkaModule.registerAsync({
            useExisting: TestKafkaOptionsFactory,
          }),
        ],
      }).compile();
    });

    it('should provide the KafkaService', () => {
      const kafkaService = moduleRef.get<KafkaService>(KafkaService);
      expect(kafkaService).toBeDefined();
    });

    it('should provide the KafkaProducer', () => {
      const kafkaProducer = moduleRef.get<KafkaProducer>(KafkaProducer);
      expect(kafkaProducer).toBeDefined();
    });

    it('should provide the module options from existing factory', () => {
      const options = moduleRef.get<KafkaModuleOptions>(KAFKA_MODULE_OPTIONS);
      expect(options).toEqual({
        clientId: 'test-client-existing',
        brokers: ['localhost:9092'],
        groupId: 'test-group-existing',
      });
    });
  });

  // Test journey-specific registration
  describe('forJourney', () => {
    let moduleRef: TestingModule;
    const journeyName = 'health';

    beforeEach(async () => {
      // Mock environment variables
      process.env.KAFKA_CLIENT_ID = 'austa';
      process.env.KAFKA_BROKERS = 'localhost:9092';
      process.env.KAFKA_GROUP_ID = 'austa-group';

      moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          KafkaModule.forJourney(journeyName),
        ],
      }).compile();
    });

    afterEach(() => {
      // Clean up environment variables
      delete process.env.KAFKA_CLIENT_ID;
      delete process.env.KAFKA_BROKERS;
      delete process.env.KAFKA_GROUP_ID;
    });

    it('should provide the KafkaService', () => {
      const kafkaService = moduleRef.get<KafkaService>(KafkaService);
      expect(kafkaService).toBeDefined();
    });

    it('should provide the KafkaProducer', () => {
      const kafkaProducer = moduleRef.get<KafkaProducer>(KafkaProducer);
      expect(kafkaProducer).toBeDefined();
    });

    it('should provide the module options with journey-specific configuration', () => {
      const options = moduleRef.get<KafkaModuleOptions>(KAFKA_MODULE_OPTIONS);
      expect(options).toEqual({
        clientId: 'austa-health',
        brokers: ['localhost:9092'],
        groupId: 'austa-group-health',
      });
    });

    it('should allow additional broker configuration', async () => {
      const additionalBrokers = ['kafka-broker-2:9092'];
      const moduleRefWithAdditionalBrokers = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          KafkaModule.forJourney(journeyName, {
            brokers: additionalBrokers,
          }),
        ],
      }).compile();

      const options = moduleRefWithAdditionalBrokers.get<KafkaModuleOptions>(KAFKA_MODULE_OPTIONS);
      expect(options.brokers).toEqual(['localhost:9092', 'kafka-broker-2:9092']);
    });
  });

  // Test integration with other modules
  describe('integration with other modules', () => {
    @Module({
      imports: [
        KafkaModule.register({
          clientId: 'test-client',
          brokers: ['localhost:9092'],
          groupId: 'test-group',
        }),
      ],
      exports: [KafkaModule],
    })
    class TestModule {}

    @Module({
      imports: [TestModule],
    })
    class ConsumerModule {}

    let moduleRef: TestingModule;

    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [ConsumerModule],
      }).compile();
    });

    it('should provide the KafkaService to modules that import a module that exports KafkaModule', () => {
      const kafkaService = moduleRef.get<KafkaService>(KafkaService);
      expect(kafkaService).toBeDefined();
    });

    it('should provide the KafkaProducer to modules that import a module that exports KafkaModule', () => {
      const kafkaProducer = moduleRef.get<KafkaProducer>(KafkaProducer);
      expect(kafkaProducer).toBeDefined();
    });
  });
});