import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@austa/logging';
import { TracingModule } from '../../src/tracing.module';
import { TracingService } from '../../src/tracing.service';

describe('TracingModule', () => {
  /**
   * Tests for the TracingModule class which verify its NestJS module definition,
   * dependency imports, provider registration, and exports.
   * 
   * These tests ensure that the module correctly imports required dependencies
   * (LoggerModule, ConfigModule), provides the TracingService, and exports it
   * for use in other modules.
   */

  describe('module definition', () => {
    it('should be defined', () => {
      expect(TracingModule).toBeDefined();
    });

    it('should be decorated with @Global()', () => {
      // Get the metadata from the module
      const metadata = Reflect.getMetadata('__global__', TracingModule);
      
      // Verify the module is decorated with @Global()
      expect(metadata).toBe(true);
    });

    it('should have the correct module metadata', () => {
      // Get the module metadata
      const metadata = Reflect.getMetadata('__module__', TracingModule);
      
      // Verify the module has the correct imports
      expect(metadata.imports).toContain(LoggerModule);
      expect(metadata.imports).toContain(ConfigModule);
      
      // Verify the module provides TracingService
      expect(metadata.providers).toContain(TracingService);
      
      // Verify the module exports TracingService
      expect(metadata.exports).toContain(TracingService);
    });
  });

  describe('module compilation', () => {
    let moduleRef;

    beforeEach(async () => {
      // Create a testing module with TracingModule
      moduleRef = await Test.createTestingModule({
        imports: [TracingModule],
      }).compile();
    });

    it('should compile successfully', () => {
      expect(moduleRef).toBeDefined();
    });

    it('should provide TracingService', () => {
      // Get the TracingService from the module
      const tracingService = moduleRef.get<TracingService>(TracingService);
      
      // Verify the service is provided
      expect(tracingService).toBeDefined();
      expect(tracingService).toBeInstanceOf(TracingService);
    });
  });

  describe('module integration', () => {
    let moduleRef;

    beforeEach(async () => {
      // Create a test module that imports TracingModule
      moduleRef = await Test.createTestingModule({
        imports: [
          // Mock the ConfigModule to avoid loading actual config
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({ tracing: { serviceName: 'test-service' } })],
          }),
          // Import the TracingModule
          TracingModule,
        ],
      }).compile();
    });

    it('should make TracingService available for injection', () => {
      // Get the TracingService from the module
      const tracingService = moduleRef.get<TracingService>(TracingService);
      
      // Verify the service is available
      expect(tracingService).toBeDefined();
      expect(tracingService).toBeInstanceOf(TracingService);
    });

    it('should make TracingService available in a feature module', async () => {
      // Create a feature module that depends on TracingService
      const featureModuleRef = await Test.createTestingModule({
        imports: [TracingModule],
        providers: [
          {
            provide: 'TEST_PROVIDER',
            useFactory: (tracingService: TracingService) => {
              // Verify the service is injected correctly
              expect(tracingService).toBeInstanceOf(TracingService);
              return { tracingService };
            },
            inject: [TracingService],
          },
        ],
      }).compile();

      // Get the test provider that depends on TracingService
      const testProvider = featureModuleRef.get('TEST_PROVIDER');
      
      // Verify the provider received TracingService
      expect(testProvider).toBeDefined();
      expect(testProvider.tracingService).toBeInstanceOf(TracingService);
    });
  });

  describe('global availability', () => {
    it('should be available globally without importing', async () => {
      // Create a module without explicitly importing TracingModule
      const moduleRef = await Test.createTestingModule({
        imports: [
          // Mock the ConfigModule and LoggerModule to avoid loading actual implementations
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({ tracing: { serviceName: 'test-service' } })],
          }),
          LoggerModule,
        ],
        providers: [
          // Add a provider that depends on TracingService
          {
            provide: 'GLOBAL_TEST_PROVIDER',
            useFactory: (tracingService: TracingService) => {
              // This will throw if TracingService is not available
              return { tracingService };
            },
            inject: [TracingService],
          },
        ],
      })
      // Override the TracingModule provider to avoid actual initialization
      .overrideProvider(TracingService)
      .useValue({
        // Mock implementation
        createSpan: jest.fn(),
        createJourneySpan: jest.fn(),
      })
      .compile();

      // Get the test provider that depends on TracingService
      const testProvider = moduleRef.get('GLOBAL_TEST_PROVIDER');
      
      // Verify the provider exists and received the TracingService
      expect(testProvider).toBeDefined();
      expect(testProvider.tracingService).toBeDefined();
    });
  });
});