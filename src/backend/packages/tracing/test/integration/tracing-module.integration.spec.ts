import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Module, LoggerService } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { TracingModule } from '../../src/tracing.module';
import { TracingService } from '../../src/tracing.service';
import { DEFAULT_SERVICE_NAME } from '../../src/constants/defaults';

// Mock LoggerService for testing
class MockLoggerService implements LoggerService {
  log(message: string): void {}
  error(message: string, trace?: string): void {}
  warn(message: string): void {}
  debug(message: string): void {}
  verbose(message: string): void {}
}

// Test service that injects TracingService
@Injectable()
class TestService {
  constructor(public readonly tracingService: TracingService) {}
}

// Feature module that doesn't import TracingModule (to test global module)
@Module({
  providers: [TestService],
  exports: [TestService],
})
class FeatureModule {}

// Another feature module with different configuration
@Injectable()
class AnotherTestService {
  constructor(public readonly tracingService: TracingService) {}
}

@Module({
  providers: [AnotherTestService],
  exports: [AnotherTestService],
})
class AnotherFeatureModule {}

describe('TracingModule Integration', () => {
  let module: TestingModule;
  let configService: ConfigService;
  let testService: TestService;
  let anotherTestService: AnotherTestService;

  beforeEach(async () => {
    // Create a test module with TracingModule as a global module
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            tracing: {
              serviceName: 'test-service',
              enabled: true,
            },
          })],
        }),
        TracingModule,
        FeatureModule,
        AnotherFeatureModule,
      ],
      providers: [
        {
          provide: LoggerService,
          useClass: MockLoggerService,
        },
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    testService = module.get<TestService>(TestService);
    anotherTestService = module.get<AnotherTestService>(AnotherTestService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide TracingService as a global provider', () => {
    const tracingService = module.get<TracingService>(TracingService);
    expect(tracingService).toBeDefined();
    expect(tracingService).toBeInstanceOf(TracingService);
  });

  it('should inject TracingService into feature modules without importing TracingModule', () => {
    expect(testService).toBeDefined();
    expect(testService.tracingService).toBeDefined();
    expect(testService.tracingService).toBeInstanceOf(TracingService);

    expect(anotherTestService).toBeDefined();
    expect(anotherTestService.tracingService).toBeDefined();
    expect(anotherTestService.tracingService).toBeInstanceOf(TracingService);
  });

  it('should use configuration from ConfigModule', () => {
    const tracingService = module.get<TracingService>(TracingService);
    // Access the private serviceName property for testing
    const serviceName = (tracingService as any).serviceName;
    
    expect(serviceName).toBe('test-service');
  });

  it('should use default service name when not provided in config', async () => {
    // Create a new module without service name in config
    const moduleWithoutConfig = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({})], // Empty config
        }),
        TracingModule,
      ],
      providers: [
        {
          provide: LoggerService,
          useClass: MockLoggerService,
        },
      ],
    }).compile();

    const tracingService = moduleWithoutConfig.get<TracingService>(TracingService);
    // Access the private serviceName property for testing
    const serviceName = (tracingService as any).serviceName;
    
    expect(serviceName).toBe(DEFAULT_SERVICE_NAME);
    
    await moduleWithoutConfig.close();
  });

  it('should initialize with proper dependency order', async () => {
    // This test verifies that TracingModule can be initialized with its dependencies
    // If dependencies are not properly ordered, this would throw an error during module initialization
    const tracingService = module.get<TracingService>(TracingService);
    expect(tracingService).toBeDefined();
  });

  it('should create spans with the configured service name', () => {
    const tracingService = module.get<TracingService>(TracingService);
    const span = tracingService.startSpan('test-span');
    
    // Verify span has the correct service name attribute
    const attributes = (span as any).attributes;
    expect(attributes['service.name']).toBe('test-service');
    
    span.end();
  });

  it('should create child spans that inherit context', async () => {
    const tracingService = module.get<TracingService>(TracingService);
    
    // Create a parent span
    const parentSpan = tracingService.startSpan('parent-span');
    
    // Use the createSpan method which should create a child span
    await tracingService.createSpan('child-span', async () => {
      const currentSpan = tracingService.getCurrentSpan();
      expect(currentSpan).toBeDefined();
      
      // The current span should be different from the parent span
      expect(currentSpan).not.toBe(parentSpan);
      
      // But should have the same trace ID (indicating it's a child span)
      const parentContext = parentSpan.spanContext();
      const childContext = currentSpan?.spanContext();
      
      expect(childContext?.traceId).toBe(parentContext.traceId);
      expect(childContext?.spanId).not.toBe(parentContext.spanId);
      
      return 'test-result';
    });
    
    parentSpan.end();
  });

  it('should propagate context through carriers', () => {
    const tracingService = module.get<TracingService>(TracingService);
    
    // Create a span to establish context
    const span = tracingService.startSpan('test-span');
    
    // Create a carrier object (like HTTP headers)
    const carrier: Record<string, string> = {};
    
    // Inject the current context into the carrier
    tracingService.injectContext(carrier);
    
    // Verify that the carrier now contains trace context
    expect(carrier.traceparent).toBeDefined();
    
    // Extract the context from the carrier
    const extractedContext = tracingService.extractContext(carrier);
    expect(extractedContext).toBeDefined();
    
    span.end();
  });
});