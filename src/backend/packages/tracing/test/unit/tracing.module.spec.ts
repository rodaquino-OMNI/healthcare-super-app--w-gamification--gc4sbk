import { Test, TestingModule } from '@nestjs/testing';
import { Module, LoggerService, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import 'reflect-metadata';

import { TracingModule } from '../../src/tracing.module';
import { TracingService } from '../../src/tracing.service';
import { LoggerModule } from '../../../logging/src/logger.module';
import { DEFAULT_SERVICE_NAME, DEFAULT_LOGGER_CONTEXT } from '../../src/constants/defaults';

describe('TracingModule', () => {
  describe('module definition', () => {
    it('should be defined', () => {
      expect(TracingModule).toBeDefined();
    });

    it('should be decorated with @Global()', () => {
      // Access the metadata to verify @Global() decorator
      const metadata = Reflect.getMetadata('__global__', TracingModule);
      expect(metadata).toBe(true);
    });

    it('should have correct imports', () => {
      // Access the module metadata to verify imports
      const metadata = Reflect.getMetadata('imports', TracingModule);
      expect(metadata).toEqual(expect.arrayContaining([LoggerModule, ConfigModule]));
    });

    it('should provide TracingService', () => {
      // Access the module metadata to verify providers
      const metadata = Reflect.getMetadata('providers', TracingModule);
      expect(metadata).toEqual(expect.arrayContaining([TracingService]));
    });

    it('should export TracingService', () => {
      // Access the module metadata to verify exports
      const metadata = Reflect.getMetadata('exports', TracingModule);
      expect(metadata).toEqual(expect.arrayContaining([TracingService]));
    });
  });

  describe('module instantiation', () => {
    let testingModule: TestingModule;

    beforeEach(async () => {
      // Create a mock logger service
      const mockLoggerService = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
      };

      // Create a mock config service
      const mockConfigService = {
        get: jest.fn().mockImplementation((key, defaultValue) => defaultValue),
      };

      // Create a test module with TracingModule
      testingModule = await Test.createTestingModule({
        imports: [TracingModule],
        providers: [
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
        ],
      }).compile();
    });

    it('should successfully instantiate the module', () => {
      expect(testingModule).toBeDefined();
    });

    it('should provide TracingService for injection', () => {
      const tracingService = testingModule.get(TracingService);
      expect(tracingService).toBeDefined();
      expect(tracingService).toBeInstanceOf(TracingService);
    });
    
    it('should initialize TracingService with correct dependencies', () => {
      const tracingService = testingModule.get(TracingService);
      const configService = testingModule.get(ConfigService);
      const loggerService = testingModule.get(LoggerService);
      
      // Verify that the config service was used to get the service name
      expect(configService.get).toHaveBeenCalledWith('TRACING_SERVICE_NAME', DEFAULT_SERVICE_NAME);
      
      // Verify that the logger was used to log initialization
      expect(loggerService.log).toHaveBeenCalledWith(
        expect.stringContaining(`Initialized tracer for ${DEFAULT_SERVICE_NAME}`),
        DEFAULT_LOGGER_CONTEXT
      );
    });
  });

  describe('global module functionality', () => {
    let rootModule: TestingModule;
    let testModule: TestingModule;

    // Define a test module that doesn't import TracingModule
    @Module({
      imports: [],
    })
    class TestModule {}

    beforeEach(async () => {
      // Create a mock logger service
      const mockLoggerService = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
      };

      // Create a mock config service
      const mockConfigService = {
        get: jest.fn().mockImplementation((key, defaultValue) => defaultValue),
      };

      // Create a root module that imports TracingModule
      rootModule = await Test.createTestingModule({
        imports: [TracingModule],
        providers: [
          { provide: ConfigService, useValue: mockConfigService },
          { provide: LoggerService, useValue: mockLoggerService },
        ],
      }).compile();

      // Create a test module that doesn't explicitly import TracingModule
      testModule = await Test.createTestingModule({
        imports: [TestModule],
      }).compile();
    });

    it('should make TracingService available globally', () => {
      // Get the TracingService from the root module
      const rootTracingService = rootModule.get(TracingService);
      expect(rootTracingService).toBeDefined();
      expect(rootTracingService).toBeInstanceOf(TracingService);
    });

    it('should have the @Global() decorator', () => {
      // Check if the TracingModule has the @Global() decorator
      const isGlobal = Reflect.getMetadata('__global__', TracingModule);
      expect(isGlobal).toBe(true);
    });

    it('should have the correct module metadata', () => {
      // Verify the module metadata
      const imports = Reflect.getMetadata('imports', TracingModule);
      const providers = Reflect.getMetadata('providers', TracingModule);
      const exports = Reflect.getMetadata('exports', TracingModule);

      expect(imports).toEqual(expect.arrayContaining([LoggerModule, ConfigModule]));
      expect(providers).toEqual(expect.arrayContaining([TracingService]));
      expect(exports).toEqual(expect.arrayContaining([TracingService]));
    });
  });
});