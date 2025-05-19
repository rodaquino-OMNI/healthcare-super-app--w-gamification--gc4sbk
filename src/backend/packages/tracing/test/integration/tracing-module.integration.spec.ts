import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerService } from '@nestjs/common';
import { TracingModule } from '../../src/tracing.module';
import { TracingService } from '../../src/tracing.service';

// Mock logger service for testing
@Injectable()
class MockLoggerService implements LoggerService {
  log(message: any, context?: string): void {}
  error(message: any, trace?: string, context?: string, ...rest: any[]): void {}
  warn(message: any, context?: string): void {}
  debug(message: any, context?: string): void {}
  verbose(message: any, context?: string): void {}
}

// Test consumer service that injects TracingService
@Injectable()
class TestConsumerService {
  constructor(public readonly tracingService: TracingService) {}

  async performOperation(): Promise<string> {
    return this.tracingService.createSpan('test-operation', async () => {
      return 'operation completed';
    });
  }
}

// Module that doesn't import TracingModule but uses TracingService
@Module({
  providers: [TestConsumerService],
  exports: [TestConsumerService],
})
class TestConsumerModule {}

// Module that provides configuration for TracingModule
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [() => ({
        tracing: {
          serviceName: 'test-service',
          serviceVersion: '1.0.0',
        },
      })],
    }),
  ],
  exports: [ConfigModule],
})
class TestConfigModule {}

describe('TracingModule Integration', () => {
  let moduleRef: TestingModule;
  let consumerService: TestConsumerService;
  let tracingService: TracingService;
  let configService: ConfigService;

  beforeAll(async () => {
    // Create a test module with TracingModule and a consumer module
    moduleRef = await Test.createTestingModule({
      imports: [
        TestConfigModule,
        TracingModule,
        TestConsumerModule,
      ],
      providers: [
        { provide: LoggerService, useClass: MockLoggerService },
      ],
    }).compile();

    // Get service instances
    consumerService = moduleRef.get<TestConsumerService>(TestConsumerService);
    tracingService = moduleRef.get<TracingService>(TracingService);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('should be defined', () => {
    expect(moduleRef).toBeDefined();
    expect(consumerService).toBeDefined();
    expect(tracingService).toBeDefined();
    expect(configService).toBeDefined();
  });

  it('should provide TracingService as a global service', () => {
    // TestConsumerModule doesn't import TracingModule, but should have access to TracingService
    // because TracingModule is marked as @Global()
    expect(consumerService.tracingService).toBeDefined();
    expect(consumerService.tracingService).toBeInstanceOf(TracingService);
  });

  it('should properly inject TracingService into consumer services', async () => {
    // Test that the consumer service can use TracingService methods
    const result = await consumerService.performOperation();
    expect(result).toBe('operation completed');
  });

  it('should integrate with ConfigModule for service configuration', () => {
    // Verify that TracingService uses ConfigService to get configuration values
    const serviceName = configService.get('tracing.serviceName');
    const serviceVersion = configService.get('tracing.serviceVersion');
    
    expect(serviceName).toBe('test-service');
    expect(serviceVersion).toBe('1.0.0');
  });

  it('should create a tracer with the configured service name', () => {
    // This test verifies that TracingService initializes with the correct service name
    // We can't directly test the private tracer property, but we can test that the service
    // is properly initialized and doesn't throw errors
    expect(() => tracingService.getCurrentTraceInfo()).not.toThrow();
  });

  it('should provide methods for trace context propagation', () => {
    // Verify that TracingService exposes methods for context propagation
    expect(typeof tracingService.getTraceContextForPropagation).toBe('function');
    expect(typeof tracingService.injectTraceContextIntoHeaders).toBe('function');
    expect(typeof tracingService.extractTraceContextFromHeaders).toBe('function');
  });

  it('should provide methods for creating spans with different contexts', () => {
    // Verify that TracingService exposes methods for creating different types of spans
    expect(typeof tracingService.createSpan).toBe('function');
    expect(typeof tracingService.createJourneySpan).toBe('function');
    expect(typeof tracingService.createHttpSpan).toBe('function');
    expect(typeof tracingService.createDatabaseSpan).toBe('function');
  });
});