/**
 * @file logger-service-formatter.integration.spec.ts
 * @description Integration tests for LoggerService and formatters
 * 
 * These tests verify the correct interaction between LoggerService and the various formatters
 * (JSON, Text, CloudWatch). They ensure log entries are properly transformed into the expected
 * output formats with all required fields and context information.
 */

import { Test } from '@nestjs/testing';
import { LoggerService } from '../../src/logger.service';
import { LoggerConfig } from '../../src/interfaces/log-config.interface';
import { LogLevel } from '../../src/interfaces/log-level.enum';
import { JsonFormatter } from '../../src/formatters/json.formatter';
import { TextFormatter } from '../../src/formatters/text.formatter';
import { CloudWatchFormatter } from '../../src/formatters/cloudwatch.formatter';
import { Transport } from '../../src/interfaces/transport.interface';
import { JourneyType } from '../../src/context/context.constants';
import { TracingService } from '@austa/tracing';

// Mock transport to capture formatted logs for testing
class MockTransport implements Transport {
  public logs: Array<{ formattedLog: string | Record<string, any>; level: LogLevel }> = [];

  initialize(): Promise<void> {
    return Promise.resolve();
  }

  write(formattedLog: string | Record<string, any>, level: LogLevel): void {
    this.logs.push({ formattedLog, level });
  }

  close(): Promise<void> {
    return Promise.resolve();
  }

  clear(): void {
    this.logs = [];
  }
}

// Mock tracing service for testing trace correlation
class MockTracingService implements Partial<TracingService> {
  getCurrentTraceId(): string {
    return 'test-trace-id';
  }

  getCurrentSpanId(): string {
    return 'test-span-id';
  }
}

describe('LoggerService + Formatter Integration', () => {
  let mockTransport: MockTransport;
  let tracingService: MockTracingService;

  beforeEach(() => {
    mockTransport = new MockTransport();
    tracingService = new MockTracingService();
  });

  afterEach(() => {
    mockTransport.clear();
  });

  describe('LoggerService with JsonFormatter', () => {
    let loggerService: LoggerService;

    beforeEach(() => {
      // Create logger with JSON formatter
      const config: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: 'debug',
        formatter: 'json',
        transports: ['console']
      };

      loggerService = new LoggerService(config, tracingService as unknown as TracingService);
      // Replace the transport with our mock
      (loggerService as any).transports = [mockTransport];
    });

    it('should format log entries as JSON with correct structure', () => {
      // Act
      loggerService.log('Test message', { testContext: 'value' });

      // Assert
      expect(mockTransport.logs.length).toBe(1);
      const logEntry = JSON.parse(mockTransport.logs[0].formattedLog as string);
      
      expect(logEntry).toHaveProperty('message', 'Test message');
      expect(logEntry).toHaveProperty('level', 'INFO');
      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry).toHaveProperty('service', 'test-service');
      expect(logEntry).toHaveProperty('context');
      expect(logEntry.context).toHaveProperty('testContext', 'value');
      expect(logEntry).toHaveProperty('trace');
      expect(logEntry.trace).toHaveProperty('traceId', 'test-trace-id');
      expect(logEntry.trace).toHaveProperty('spanId', 'test-span-id');
    });

    it('should properly format error objects in JSON', () => {
      // Arrange
      const testError = new Error('Test error');
      testError.name = 'TestError';
      
      // Act
      loggerService.error('Error occurred', testError);

      // Assert
      expect(mockTransport.logs.length).toBe(1);
      const logEntry = JSON.parse(mockTransport.logs[0].formattedLog as string);
      
      expect(logEntry).toHaveProperty('message', 'Error occurred');
      expect(logEntry).toHaveProperty('level', 'ERROR');
      expect(logEntry).toHaveProperty('error');
      expect(logEntry.error).toHaveProperty('message', 'Test error');
      expect(logEntry.error).toHaveProperty('name', 'TestError');
      expect(logEntry.error).toHaveProperty('stack');
    });

    it('should include journey context in JSON format', () => {
      // Act
      const journeyLogger = loggerService.forHealthJourney({ resourceId: 'health-123' });
      journeyLogger.log('Health journey log');

      // Assert
      expect(mockTransport.logs.length).toBe(1);
      const logEntry = JSON.parse(mockTransport.logs[0].formattedLog as string);
      
      expect(logEntry).toHaveProperty('journey');
      expect(logEntry.journey).toHaveProperty('type', 'health');
      expect(logEntry.journey).toHaveProperty('resourceId', 'health-123');
    });

    it('should handle complex nested objects in JSON format', () => {
      // Arrange
      const complexObject = {
        user: {
          id: 'user-123',
          profile: {
            name: 'Test User',
            preferences: {
              theme: 'dark',
              notifications: true
            }
          }
        },
        stats: {
          visits: 5,
          lastSeen: new Date('2023-01-01')
        }
      };
      
      // Act
      loggerService.log('Complex object log', { data: complexObject });

      // Assert
      expect(mockTransport.logs.length).toBe(1);
      const logEntry = JSON.parse(mockTransport.logs[0].formattedLog as string);
      
      expect(logEntry.context).toHaveProperty('data');
      expect(logEntry.context.data).toHaveProperty('user');
      expect(logEntry.context.data.user).toHaveProperty('profile');
      expect(logEntry.context.data.user.profile).toHaveProperty('preferences');
      expect(logEntry.context.data.user.profile.preferences).toHaveProperty('theme', 'dark');
      expect(logEntry.context.data.stats).toHaveProperty('visits', 5);
      expect(logEntry.context.data.stats).toHaveProperty('lastSeen');
    });
  });

  describe('LoggerService with TextFormatter', () => {
    let loggerService: LoggerService;

    beforeEach(() => {
      // Create logger with Text formatter
      const config: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: 'debug',
        formatter: 'text',
        transports: ['console']
      };

      loggerService = new LoggerService(config, tracingService as unknown as TracingService);
      // Replace the transport with our mock
      (loggerService as any).transports = [mockTransport];
    });

    it('should format log entries as human-readable text', () => {
      // Act
      loggerService.log('Test message', { testContext: 'value' });

      // Assert
      expect(mockTransport.logs.length).toBe(1);
      const logText = mockTransport.logs[0].formattedLog as string;
      
      expect(typeof logText).toBe('string');
      expect(logText).toContain('Test message');
      expect(logText).toContain('INFO');
      expect(logText).toContain('test-service');
      expect(logText).toContain('testContext');
      expect(logText).toContain('value');
    });

    it('should format error objects with stack traces in text format', () => {
      // Arrange
      const testError = new Error('Test error');
      
      // Act
      loggerService.error('Error occurred', testError);

      // Assert
      expect(mockTransport.logs.length).toBe(1);
      const logText = mockTransport.logs[0].formattedLog as string;
      
      expect(logText).toContain('Error occurred');
      expect(logText).toContain('ERROR');
      expect(logText).toContain('Test error');
      expect(logText).toContain('Error:');
      expect(logText).toContain('Stack Trace');
    });

    it('should include journey context in text format', () => {
      // Act
      const journeyLogger = loggerService.forCareJourney({ resourceId: 'appointment-123' });
      journeyLogger.log('Care journey log');

      // Assert
      expect(mockTransport.logs.length).toBe(1);
      const logText = mockTransport.logs[0].formattedLog as string;
      
      expect(logText).toContain('Care journey log');
      expect(logText).toContain('[CARE]');
      expect(logText).toContain('Resource: appointment-123');
    });

    it('should handle complex nested objects in text format', () => {
      // Arrange
      const complexObject = {
        user: {
          id: 'user-123',
          profile: {
            name: 'Test User',
            preferences: {
              theme: 'dark',
              notifications: true
            }
          }
        }
      };
      
      // Act
      loggerService.log('Complex object log', { data: complexObject });

      // Assert
      expect(mockTransport.logs.length).toBe(1);
      const logText = mockTransport.logs[0].formattedLog as string;
      
      expect(logText).toContain('Complex object log');
      expect(logText).toContain('user-123');
      expect(logText).toContain('Test User');
      expect(logText).toContain('dark');
      expect(logText).toContain('true');
    });
  });

  describe('LoggerService with CloudWatchFormatter', () => {
    let loggerService: LoggerService;

    beforeEach(() => {
      // Create logger with CloudWatch formatter
      const config: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: 'debug',
        formatter: 'cloudwatch',
        transports: ['console']
      };

      loggerService = new LoggerService(config, tracingService as unknown as TracingService);
      // Replace the transport with our mock
      (loggerService as any).transports = [mockTransport];
    });

    it('should format log entries with CloudWatch-specific fields', () => {
      // Act
      loggerService.log('Test message', { testContext: 'value' });

      // Assert
      expect(mockTransport.logs.length).toBe(1);
      const logEntry = JSON.parse(mockTransport.logs[0].formattedLog as string);
      
      expect(logEntry).toHaveProperty('@timestamp');
      expect(logEntry).toHaveProperty('@message', 'Test message');
      expect(logEntry).toHaveProperty('@level', 'INFO');
      expect(logEntry).toHaveProperty('@aws');
      expect(logEntry['@aws']).toHaveProperty('service', 'test-service');
      expect(logEntry).toHaveProperty('@trace');
      expect(logEntry['@trace']).toHaveProperty('traceId', 'test-trace-id');
    });

    it('should format error objects with CloudWatch error detection fields', () => {
      // Arrange
      const testError = new Error('Test error');
      testError.name = 'TestError';
      
      // Act
      loggerService.error('Error occurred', testError);

      // Assert
      expect(mockTransport.logs.length).toBe(1);
      const logEntry = JSON.parse(mockTransport.logs[0].formattedLog as string);
      
      expect(logEntry).toHaveProperty('@message', 'Error occurred');
      expect(logEntry).toHaveProperty('@level', 'ERROR');
      expect(logEntry).toHaveProperty('@error');
      expect(logEntry['@error']).toHaveProperty('message', 'Test error');
      expect(logEntry['@error']).toHaveProperty('name', 'TestError');
      expect(logEntry['@error']).toHaveProperty('stack');
    });

    it('should include journey-specific fields for CloudWatch filtering', () => {
      // Act
      const journeyLogger = loggerService.forPlanJourney({ 
        resourceId: 'claim-123',
        data: { claimId: 'claim-123', benefitId: 'benefit-456' }
      });
      journeyLogger.log('Plan journey log');

      // Assert
      expect(mockTransport.logs.length).toBe(1);
      const logEntry = JSON.parse(mockTransport.logs[0].formattedLog as string);
      
      expect(logEntry).toHaveProperty('@journey');
      expect(logEntry['@journey']).toHaveProperty('type', 'plan');
      expect(logEntry['@journey']).toHaveProperty('resourceId', 'claim-123');
      expect(logEntry['@journey']).toHaveProperty('claimId', 'claim-123');
      expect(logEntry['@journey']).toHaveProperty('benefitId', 'benefit-456');
    });

    it('should handle request context in CloudWatch format', () => {
      // Arrange
      const requestLogger = loggerService.withRequestContext({
        requestId: 'req-123',
        clientIp: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });
      
      // Act
      requestLogger.log('Request log');

      // Assert
      expect(mockTransport.logs.length).toBe(1);
      const logEntry = JSON.parse(mockTransport.logs[0].formattedLog as string);
      
      expect(logEntry).toHaveProperty('@request');
      expect(logEntry['@request']).toHaveProperty('id', 'req-123');
      expect(logEntry['@request']).toHaveProperty('clientIp', '192.168.1.1');
      expect(logEntry['@request']).toHaveProperty('userAgent', 'Mozilla/5.0');
    });
  });

  describe('Context Enrichment Across Formatters', () => {
    it('should maintain context when switching between formatters', () => {
      // Arrange - Create loggers with different formatters
      const jsonConfig: LoggerConfig = {
        serviceName: 'test-service',
        formatter: 'json',
        transports: ['console']
      };
      
      const textConfig: LoggerConfig = {
        serviceName: 'test-service',
        formatter: 'text',
        transports: ['console']
      };
      
      const cloudwatchConfig: LoggerConfig = {
        serviceName: 'test-service',
        formatter: 'cloudwatch',
        transports: ['console']
      };
      
      const jsonLogger = new LoggerService(jsonConfig, tracingService as unknown as TracingService);
      const textLogger = new LoggerService(textConfig, tracingService as unknown as TracingService);
      const cloudwatchLogger = new LoggerService(cloudwatchConfig, tracingService as unknown as TracingService);
      
      // Replace transports with our mocks
      (jsonLogger as any).transports = [mockTransport];
      
      // Create enriched context
      const contextData = {
        userId: 'user-123',
        sessionId: 'session-456',
        requestId: 'request-789',
        journeyType: JourneyType.HEALTH,
        resourceId: 'metric-123'
      };
      
      // Create context-enriched loggers
      const enrichedJsonLogger = jsonLogger.withContext(contextData);
      
      // Act - Log with JSON formatter
      enrichedJsonLogger.log('JSON formatted log');
      
      // Assert - Check JSON format
      expect(mockTransport.logs.length).toBe(1);
      const jsonLog = JSON.parse(mockTransport.logs[0].formattedLog as string);
      
      expect(jsonLog).toHaveProperty('userId', 'user-123');
      expect(jsonLog).toHaveProperty('sessionId', 'session-456');
      expect(jsonLog).toHaveProperty('requestId', 'request-789');
      
      // Clear logs and switch to text formatter
      mockTransport.clear();
      (textLogger as any).transports = [mockTransport];
      
      // Transfer context to text logger
      const enrichedTextLogger = textLogger.withContext(contextData);
      enrichedTextLogger.log('Text formatted log');
      
      // Assert - Check text format
      expect(mockTransport.logs.length).toBe(1);
      const textLog = mockTransport.logs[0].formattedLog as string;
      
      expect(textLog).toContain('user-123');
      expect(textLog).toContain('session-456');
      expect(textLog).toContain('request-789');
      
      // Clear logs and switch to CloudWatch formatter
      mockTransport.clear();
      (cloudwatchLogger as any).transports = [mockTransport];
      
      // Transfer context to CloudWatch logger
      const enrichedCloudwatchLogger = cloudwatchLogger.withContext(contextData);
      enrichedCloudwatchLogger.log('CloudWatch formatted log');
      
      // Assert - Check CloudWatch format
      expect(mockTransport.logs.length).toBe(1);
      const cloudwatchLog = JSON.parse(mockTransport.logs[0].formattedLog as string);
      
      expect(cloudwatchLog).toHaveProperty('@request');
      expect(cloudwatchLog['@request']).toHaveProperty('id', 'request-789');
      expect(cloudwatchLog).toHaveProperty('@journey');
      expect(cloudwatchLog['@journey']).toHaveProperty('type', 'health');
      expect(cloudwatchLog['@journey']).toHaveProperty('resourceId', 'metric-123');
    });
  });

  describe('Error Handling and Serialization', () => {
    let loggerService: LoggerService;

    beforeEach(() => {
      // Create logger with JSON formatter
      const config: LoggerConfig = {
        serviceName: 'test-service',
        logLevel: 'debug',
        formatter: 'json',
        transports: ['console']
      };

      loggerService = new LoggerService(config, tracingService as unknown as TracingService);
      // Replace the transport with our mock
      (loggerService as any).transports = [mockTransport];
    });

    it('should handle circular references in error objects', () => {
      // Arrange - Create an object with circular reference
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj;
      
      const errorWithCircular = new Error('Error with circular reference');
      (errorWithCircular as any).circular = circularObj;
      
      // Act
      loggerService.error('Circular reference error', errorWithCircular);
      
      // Assert - Should not throw and should handle the circular reference
      expect(mockTransport.logs.length).toBe(1);
      const logEntry = JSON.parse(mockTransport.logs[0].formattedLog as string);
      
      expect(logEntry).toHaveProperty('error');
      expect(logEntry.error).toHaveProperty('message', 'Error with circular reference');
      expect(logEntry.error).toHaveProperty('circular');
      // The circular reference should be replaced with a placeholder
      expect(logEntry.error.circular.self).toMatch(/\[Circular.*\]/);
    });

    it('should handle custom error properties', () => {
      // Arrange - Create an error with custom properties
      const customError = new Error('Custom error');
      (customError as any).code = 'ERR_CUSTOM';
      (customError as any).statusCode = 400;
      (customError as any).isTransient = false;
      (customError as any).metadata = { source: 'test', timestamp: new Date() };
      
      // Act
      loggerService.error('Custom error occurred', customError);
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      const logEntry = JSON.parse(mockTransport.logs[0].formattedLog as string);
      
      expect(logEntry).toHaveProperty('error');
      expect(logEntry.error).toHaveProperty('message', 'Custom error');
      expect(logEntry.error).toHaveProperty('code', 'ERR_CUSTOM');
      expect(logEntry.error).toHaveProperty('statusCode', 400);
      expect(logEntry.error).toHaveProperty('isTransient', false);
      expect(logEntry.error).toHaveProperty('metadata');
      expect(logEntry.error.metadata).toHaveProperty('source', 'test');
    });

    it('should handle nested errors', () => {
      // Arrange - Create nested errors
      const innerError = new Error('Inner error');
      const middleError = new Error('Middle error');
      (middleError as any).cause = innerError;
      const outerError = new Error('Outer error');
      (outerError as any).cause = middleError;
      
      // Act
      loggerService.error('Nested error occurred', outerError);
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      const logEntry = JSON.parse(mockTransport.logs[0].formattedLog as string);
      
      expect(logEntry).toHaveProperty('error');
      expect(logEntry.error).toHaveProperty('message', 'Outer error');
      expect(logEntry.error).toHaveProperty('cause');
      expect(logEntry.error.cause).toHaveProperty('message', 'Middle error');
      expect(logEntry.error.cause).toHaveProperty('cause');
      expect(logEntry.error.cause.cause).toHaveProperty('message', 'Inner error');
    });

    it('should handle non-error objects passed as errors', () => {
      // Arrange - Create a non-error object
      const nonError = { reason: 'Something went wrong', code: 500 };
      
      // Act
      loggerService.error('Non-error object', nonError as any);
      
      // Assert
      expect(mockTransport.logs.length).toBe(1);
      const logEntry = JSON.parse(mockTransport.logs[0].formattedLog as string);
      
      expect(logEntry).toHaveProperty('error');
      expect(logEntry.error).toHaveProperty('reason', 'Something went wrong');
      expect(logEntry.error).toHaveProperty('code', 500);
    });
  });
});