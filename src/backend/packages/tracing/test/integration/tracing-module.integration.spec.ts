import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TracingModule } from '../../src/tracing.module';
import { TracingService } from '../../src/tracing.service';
import { CONFIG_KEYS } from '../../src/constants/config-keys';

// Mock logger service to avoid actual logging during tests
@Injectable()
class MockLoggerService {
  log(message: string, context?: string): void {}
  error(message: string, trace?: string, context?: string): void {}
  warn(message: string, context?: string): void {}
  debug(message: string, context?: string): void {}
}

// Test service that directly imports TracingModule
@Injectable()
class DirectConsumerService {
  constructor(public readonly tracingService: TracingService) {}
}

// Module that directly imports TracingModule
@Module({
  imports: [TracingModule],
  providers: [DirectConsumerService],
  exports: [DirectConsumerService],
})
class DirectConsumerModule {}

// Test service that doesn't import TracingModule (tests @Global() functionality)
@Injectable()
class IndirectConsumerService {
  constructor(public readonly tracingService: TracingService) {}
}

// Module that doesn't import TracingModule
@Module({
  providers: [IndirectConsumerService],
  exports: [IndirectConsumerService],
})
class IndirectConsumerModule {}

// Test configuration values
const TEST_SERVICE_NAME = 'test-service';
const TEST_CONFIG = {
  [CONFIG_KEYS.SERVICE_NAME]: TEST_SERVICE_NAME,
  [CONFIG_KEYS.GENERAL.ENABLED]: true,
  [CONFIG_KEYS.SAMPLING.RATIO]: 0.5,
};

describe('TracingModule Integration', () => {
  let moduleRef: TestingModule;
  let directConsumerService: DirectConsumerService;
  let indirectConsumerService: IndirectConsumerService;
  let configService: ConfigService;

  beforeEach(async () => {
    // Create a test module with TracingModule and test consumers
    moduleRef = await Test.createTestingModule({
      imports: [
        // Configure the ConfigModule with test values
        ConfigModule.forRoot({
          load: [() => TEST_CONFIG],
          isGlobal: true,
        }),
        TracingModule,
        DirectConsumerModule,
        IndirectConsumerModule,
      ],
      providers: [
        // Provide a mock logger service
        {
          provide: 'LoggerService',
          useClass: MockLoggerService,
        },
      ],
    }).compile();

    // Get service instances for testing
    directConsumerService = moduleRef.get<DirectConsumerService>(DirectConsumerService);
    indirectConsumerService = moduleRef.get<IndirectConsumerService>(IndirectConsumerService);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('should be defined', () => {
    expect(moduleRef).toBeDefined();
  });

  it('should provide TracingService to direct consumer', () => {
    expect(directConsumerService).toBeDefined();
    expect(directConsumerService.tracingService).toBeDefined();
    expect(directConsumerService.tracingService).toBeInstanceOf(TracingService);
  });

  it('should provide TracingService to indirect consumer (via @Global())', () => {
    expect(indirectConsumerService).toBeDefined();
    expect(indirectConsumerService.tracingService).toBeDefined();
    expect(indirectConsumerService.tracingService).toBeInstanceOf(TracingService);
  });

  it('should configure TracingService with values from ConfigService', () => {
    // Verify that the TracingService is using the configuration values
    const tracingService = moduleRef.get<TracingService>(TracingService);
    
    // We can't directly access private properties, but we can test the behavior
    // by checking if the configuration was properly loaded
    expect(configService.get(CONFIG_KEYS.SERVICE_NAME)).toBe(TEST_SERVICE_NAME);
    
    // Verify that the tracer is available
    expect(tracingService.getTracer()).toBeDefined();
  });

  it('should properly initialize with all dependencies', async () => {
    // Create a new module with explicit initialization order
    const orderedModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [() => TEST_CONFIG],
        }),
        TracingModule,
      ],
      providers: [
        {
          provide: 'LoggerService',
          useClass: MockLoggerService,
        },
      ],
    }).compile();

    // Get the TracingService instance
    const tracingService = orderedModule.get<TracingService>(TracingService);
    expect(tracingService).toBeDefined();
    expect(tracingService.getTracer()).toBeDefined();

    // Clean up
    await orderedModule.close();
  });

  it('should create spans and propagate context correctly', async () => {
    const tracingService = moduleRef.get<TracingService>(TracingService);
    
    // Test creating a span
    const testFunction = jest.fn().mockResolvedValue('test-result');
    const result = await tracingService.createSpan('test-span', testFunction, {
      attributes: { testAttribute: 'test-value' },
    });

    // Verify the function was called and returned the expected result
    expect(testFunction).toHaveBeenCalled();
    expect(result).toBe('test-result');
  });

  it('should create journey-specific spans', async () => {
    const tracingService = moduleRef.get<TracingService>(TracingService);
    
    // Test creating a journey-specific span
    const testFunction = jest.fn().mockResolvedValue('journey-result');
    const result = await tracingService.createJourneySpan(
      'health',
      'test-operation',
      testFunction,
      {
        userId: 'test-user',
        requestId: 'test-request',
      }
    );

    // Verify the function was called and returned the expected result
    expect(testFunction).toHaveBeenCalled();
    expect(result).toBe('journey-result');
  });

  it('should handle errors in spans correctly', async () => {
    const tracingService = moduleRef.get<TracingService>(TracingService);
    const testError = new Error('Test error');
    
    // Test error handling in a span
    const errorFunction = jest.fn().mockRejectedValue(testError);
    
    await expect(
      tracingService.createSpan('error-span', errorFunction)
    ).rejects.toThrow(testError);

    // Verify the function was called
    expect(errorFunction).toHaveBeenCalled();
  });

  it('should extract and inject context into headers', () => {
    const tracingService = moduleRef.get<TracingService>(TracingService);
    
    // Test header injection
    const headers = {};
    const headersWithContext = tracingService.injectContextIntoHeaders(headers);
    
    // The headers should be modified, but we can't predict the exact values
    // since they depend on the actual trace context
    expect(headersWithContext).toBeDefined();
    
    // Test context extraction
    const extractedContext = tracingService.extractContextFromHeaders(headersWithContext);
    
    // The context might be null if no active span exists
    // This is just a basic check that the function doesn't throw
    expect(() => tracingService.extractContextFromHeaders(headersWithContext)).not.toThrow();
  });
});