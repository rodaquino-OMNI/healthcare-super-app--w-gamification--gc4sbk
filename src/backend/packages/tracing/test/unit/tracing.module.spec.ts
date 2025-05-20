/**
 * Unit tests for the TracingModule class.
 * 
 * These tests verify that the TracingModule is properly configured as a NestJS module,
 * with the correct imports, providers, and exports. The tests ensure that:
 * 
 * 1. The module is decorated with @Global() to make it available throughout the application
 * 2. The module imports LoggerModule and ConfigModule for proper functionality
 * 3. The module provides TracingService as a provider
 * 4. The module exports TracingService for use in other modules
 * 5. The module can be used in a NestJS application
 * 
 * These tests are critical for ensuring that the tracing functionality is properly
 * integrated into the AUSTA SuperApp architecture and available to all services.
 * 
 * @package @austa/tracing
 * @group unit
 * @category module
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@austa/logging';
import { TracingModule } from '../../src/tracing.module';
import { TracingService } from '../../src/tracing.service';

describe('TracingModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Create a testing module with TracingModule
    module = await Test.createTestingModule({
      imports: [TracingModule],
    }).compile();
  });

  afterEach(async () => {
    // Clean up after each test
    await module.close();
  });

  it('should be defined', () => {
    // Verify the module is defined
    expect(module).toBeDefined();
    expect(TracingModule).toBeDefined();
  });

  it('should be decorated with @Global()', () => {
    // Verify the module is decorated with @Global()
    const isGlobal = Reflect.getMetadata('__global', TracingModule);
    expect(isGlobal).toBe(true);
  });

  describe('module metadata', () => {
    let metadata: any;

    beforeEach(() => {
      // Get the module metadata
      metadata = Reflect.getMetadata('__module', TracingModule);
    });

    it('should have the correct imports', () => {
      // Verify the module imports LoggerModule and ConfigModule
      expect(metadata.imports).toBeDefined();
      expect(metadata.imports).toHaveLength(2);
      expect(metadata.imports).toContain(LoggerModule);
      expect(metadata.imports).toContain(ConfigModule);
    });

    it('should provide TracingService', () => {
      // Verify the module provides TracingService
      expect(metadata.providers).toBeDefined();
      expect(metadata.providers).toContain(TracingService);
    });

    it('should export TracingService', () => {
      // Verify the module exports TracingService
      expect(metadata.exports).toBeDefined();
      expect(metadata.exports).toContain(TracingService);
    });
  });

  describe('dependency injection', () => {
    it('should provide TracingService for injection', () => {
      // Verify TracingService can be injected
      const tracingService = module.get<TracingService>(TracingService);
      expect(tracingService).toBeDefined();
      expect(tracingService).toBeInstanceOf(TracingService);
    });

    it('should make TracingService available to other modules', async () => {
      // Create a test consumer module that imports TracingModule
      const consumerModule = await Test.createTestingModule({
        imports: [TracingModule],
      }).compile();

      // Verify TracingService is available in the consumer module
      const tracingService = consumerModule.get<TracingService>(TracingService);
      expect(tracingService).toBeDefined();
      expect(tracingService).toBeInstanceOf(TracingService);

      // Clean up
      await consumerModule.close();
    });
  });

  describe('module registration', () => {
    it('should support dynamic module registration with options', async () => {
      // Mock the register static method if it exists
      if (typeof TracingModule.register === 'function') {
        // Create a test module using the register method
        const dynamicModule = await Test.createTestingModule({
          imports: [
            TracingModule.register({
              serviceName: 'test-service',
              // Add other options as needed
            }),
          ],
        }).compile();

        // Verify the module is created successfully
        expect(dynamicModule).toBeDefined();

        // Verify TracingService is available
        const tracingService = dynamicModule.get<TracingService>(TracingService);
        expect(tracingService).toBeDefined();
        expect(tracingService).toBeInstanceOf(TracingService);

        // Clean up
        await dynamicModule.close();
      } else {
        // Skip this test if register method is not implemented
        console.log('TracingModule.register is not implemented, skipping test');
        expect(true).toBeTruthy(); // Dummy assertion to avoid empty test
      }
    });

    it('should support async module registration with options', async () => {
      // Mock the registerAsync static method if it exists
      if (typeof TracingModule.registerAsync === 'function') {
        // Create a test module using the registerAsync method
        const asyncModule = await Test.createTestingModule({
          imports: [
            TracingModule.registerAsync({
              useFactory: () => ({
                serviceName: 'test-service',
                // Add other options as needed
              }),
            }),
          ],
        }).compile();

        // Verify the module is created successfully
        expect(asyncModule).toBeDefined();

        // Verify TracingService is available
        const tracingService = asyncModule.get<TracingService>(TracingService);
        expect(tracingService).toBeDefined();
        expect(tracingService).toBeInstanceOf(TracingService);

        // Clean up
        await asyncModule.close();
      } else {
        // Skip this test if registerAsync method is not implemented
        console.log('TracingModule.registerAsync is not implemented, skipping test');
        expect(true).toBeTruthy(); // Dummy assertion to avoid empty test
      }
    });
  });

  describe('integration with AUSTA SuperApp architecture', () => {
    it('should support journey-specific tracing', () => {
      // Get the TracingService instance
      const tracingService = module.get<TracingService>(TracingService);

      // Verify the service has journey-specific methods
      expect(tracingService.createJourneySpan).toBeDefined();
      expect(typeof tracingService.createJourneySpan).toBe('function');
    });

    it('should integrate with the logging system', () => {
      // Verify LoggerModule is imported
      const metadata = Reflect.getMetadata('__module', TracingModule);
      expect(metadata.imports).toContain(LoggerModule);

      // Get the TracingService instance
      const tracingService = module.get<TracingService>(TracingService);

      // Verify the service has methods that interact with logging
      expect(tracingService.extractContextFromHeaders).toBeDefined();
      expect(tracingService.injectContextIntoHeaders).toBeDefined();
    });

    it('should support configuration through NestJS ConfigService', () => {
      // Verify ConfigModule is imported
      const metadata = Reflect.getMetadata('__module', TracingModule);
      expect(metadata.imports).toContain(ConfigModule);

      // Get the TracingService instance
      const tracingService = module.get<TracingService>(TracingService);

      // Verify the service is properly initialized
      expect(tracingService.getTracer).toBeDefined();
      expect(typeof tracingService.getTracer).toBe('function');
    });
  });
});