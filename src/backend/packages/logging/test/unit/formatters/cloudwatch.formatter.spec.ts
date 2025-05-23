import { CloudWatchFormatter } from '../../../src/formatters/cloudwatch.formatter';
import { LogEntry, JourneyType } from '../../../src/interfaces/log-entry.interface';
import { LogLevel } from '../../../src/interfaces/log-level.enum';

describe('CloudWatchFormatter', () => {
  let formatter: CloudWatchFormatter;
  const mockRegion = 'us-west-2';
  const mockAccountId = '123456789012';
  
  beforeEach(() => {
    // Create a new formatter instance before each test
    formatter = new CloudWatchFormatter(mockRegion, mockAccountId);
  });

  describe('constructor', () => {
    it('should use provided region and accountId', () => {
      const customFormatter = new CloudWatchFormatter('eu-west-1', '987654321098');
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z')
      };
      
      const result = JSON.parse(customFormatter.format(entry));
      
      expect(result['@aws'].region).toBe('eu-west-1');
      expect(result['@aws'].accountId).toBe('987654321098');
    });

    it('should use default values when region and accountId are not provided', () => {
      // Save original env vars
      const originalRegion = process.env.AWS_REGION;
      const originalAccountId = process.env.AWS_ACCOUNT_ID;
      
      // Set env vars for test
      process.env.AWS_REGION = 'eu-central-1';
      process.env.AWS_ACCOUNT_ID = '111222333444';
      
      const defaultFormatter = new CloudWatchFormatter();
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z')
      };
      
      const result = JSON.parse(defaultFormatter.format(entry));
      
      expect(result['@aws'].region).toBe('eu-central-1');
      expect(result['@aws'].accountId).toBe('111222333444');
      
      // Restore original env vars
      process.env.AWS_REGION = originalRegion;
      process.env.AWS_ACCOUNT_ID = originalAccountId;
    });

    it('should use fallback values when env vars are not set', () => {
      // Save original env vars
      const originalRegion = process.env.AWS_REGION;
      const originalAccountId = process.env.AWS_ACCOUNT_ID;
      
      // Unset env vars for test
      delete process.env.AWS_REGION;
      delete process.env.AWS_ACCOUNT_ID;
      
      const defaultFormatter = new CloudWatchFormatter();
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z')
      };
      
      const result = JSON.parse(defaultFormatter.format(entry));
      
      expect(result['@aws'].region).toBe('us-east-1'); // Default fallback
      expect(result['@aws'].accountId).toBe(''); // Default fallback
      
      // Restore original env vars
      process.env.AWS_REGION = originalRegion;
      process.env.AWS_ACCOUNT_ID = originalAccountId;
    });
  });

  describe('format', () => {
    it('should format basic log entry with CloudWatch-specific fields', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp,
        serviceName: 'test-service'
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      // Verify CloudWatch-specific fields
      expect(result['@timestamp']).toBe(timestamp.toISOString());
      expect(result['@message']).toBe('Test message');
      expect(result['@level']).toBe('INFO');
      expect(result['@aws']).toEqual({
        region: mockRegion,
        accountId: mockAccountId,
        service: 'test-service'
      });
    });

    it('should use default service name when not provided', () => {
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z')
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      expect(result['@aws'].service).toBe('austa-superapp');
    });

    it('should format all log levels correctly', () => {
      const levels = [
        { level: LogLevel.DEBUG, expected: 'DEBUG' },
        { level: LogLevel.INFO, expected: 'INFO' },
        { level: LogLevel.WARN, expected: 'WARN' },
        { level: LogLevel.ERROR, expected: 'ERROR' },
        { level: LogLevel.FATAL, expected: 'FATAL' }
      ];
      
      for (const { level, expected } of levels) {
        const entry: LogEntry = {
          message: 'Test message',
          level,
          timestamp: new Date('2023-01-01T12:00:00Z')
        };
        
        const result = JSON.parse(formatter.format(entry));
        
        expect(result['@level']).toBe(expected);
      }
    });
  });

  describe('request context formatting', () => {
    it('should format request context correctly', () => {
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z'),
        requestId: 'req-123',
        userId: 'user-456',
        sessionId: 'session-789',
        clientIp: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      expect(result['@request']).toEqual({
        id: 'req-123',
        userId: 'user-456',
        sessionId: 'session-789',
        clientIp: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });
    });

    it('should not include @request field when no request data is present', () => {
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z')
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      expect(result['@request']).toBeUndefined();
    });

    it('should include partial request data when only some fields are present', () => {
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z'),
        requestId: 'req-123',
        // Only requestId is provided
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      expect(result['@request']).toEqual({
        id: 'req-123'
      });
      expect(result['@request'].userId).toBeUndefined();
      expect(result['@request'].sessionId).toBeUndefined();
    });
  });

  describe('trace context formatting', () => {
    it('should format trace context correctly', () => {
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z'),
        traceId: 'trace-123',
        spanId: 'span-456',
        parentSpanId: 'parent-789'
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      expect(result['@trace']).toEqual({
        traceId: 'trace-123',
        spanId: 'span-456',
        parentSpanId: 'parent-789'
      });
    });

    it('should not include @trace field when no trace data is present', () => {
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z')
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      expect(result['@trace']).toBeUndefined();
    });

    it('should include partial trace data when only some fields are present', () => {
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z'),
        traceId: 'trace-123',
        // Only traceId is provided
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      expect(result['@trace']).toEqual({
        traceId: 'trace-123'
      });
      expect(result['@trace'].spanId).toBeUndefined();
      expect(result['@trace'].parentSpanId).toBeUndefined();
    });
  });

  describe('journey context formatting', () => {
    it('should format basic journey context correctly', () => {
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z'),
        journey: {
          type: JourneyType.HEALTH,
          resourceId: 'health-123',
          action: 'view-metrics'
        }
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      expect(result['@journey']).toEqual({
        type: JourneyType.HEALTH,
        resourceId: 'health-123',
        action: 'view-metrics'
      });
    });

    it('should not include @journey field when no journey data is present', () => {
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z')
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      expect(result['@journey']).toBeUndefined();
    });

    it('should format health journey-specific fields correctly', () => {
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z'),
        journey: {
          type: JourneyType.HEALTH,
          resourceId: 'health-123',
          action: 'update-metric',
          data: {
            metricId: 'metric-123',
            goalId: 'goal-456',
            deviceId: 'device-789',
            value: 75,
            unit: 'bpm'
          }
        }
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      expect(result['@journey'].type).toBe(JourneyType.HEALTH);
      expect(result['@journey'].metricId).toBe('metric-123');
      expect(result['@journey'].goalId).toBe('goal-456');
      expect(result['@journey'].deviceId).toBe('device-789');
      expect(result['@journey'].data).toEqual({
        metricId: 'metric-123',
        goalId: 'goal-456',
        deviceId: 'device-789',
        value: 75,
        unit: 'bpm'
      });
    });

    it('should format care journey-specific fields correctly', () => {
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z'),
        journey: {
          type: JourneyType.CARE,
          resourceId: 'care-123',
          action: 'book-appointment',
          data: {
            appointmentId: 'appt-123',
            providerId: 'provider-456',
            medicationId: 'med-789',
            date: '2023-02-01',
            time: '14:30'
          }
        }
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      expect(result['@journey'].type).toBe(JourneyType.CARE);
      expect(result['@journey'].appointmentId).toBe('appt-123');
      expect(result['@journey'].providerId).toBe('provider-456');
      expect(result['@journey'].medicationId).toBe('med-789');
      expect(result['@journey'].data).toEqual({
        appointmentId: 'appt-123',
        providerId: 'provider-456',
        medicationId: 'med-789',
        date: '2023-02-01',
        time: '14:30'
      });
    });

    it('should format plan journey-specific fields correctly', () => {
      const entry: LogEntry = {
        message: 'Test message',
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z'),
        journey: {
          type: JourneyType.PLAN,
          resourceId: 'plan-123',
          action: 'submit-claim',
          data: {
            planId: 'plan-123',
            benefitId: 'benefit-456',
            claimId: 'claim-789',
            amount: 150.75,
            status: 'submitted'
          }
        }
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      expect(result['@journey'].type).toBe(JourneyType.PLAN);
      expect(result['@journey'].planId).toBe('plan-123');
      expect(result['@journey'].benefitId).toBe('benefit-456');
      expect(result['@journey'].claimId).toBe('claim-789');
      expect(result['@journey'].data).toEqual({
        planId: 'plan-123',
        benefitId: 'benefit-456',
        claimId: 'claim-789',
        amount: 150.75,
        status: 'submitted'
      });
    });
  });

  describe('error formatting', () => {
    it('should format basic error information correctly', () => {
      const entry: LogEntry = {
        message: 'An error occurred',
        level: LogLevel.ERROR,
        timestamp: new Date('2023-01-01T12:00:00Z'),
        error: {
          message: 'Something went wrong',
          name: 'TestError',
          code: 'ERR_TEST_FAILURE'
        }
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      expect(result['@error']).toEqual({
        message: 'Something went wrong',
        name: 'TestError',
        code: 'ERR_TEST_FAILURE'
      });
    });

    it('should use default error name when not provided', () => {
      const entry: LogEntry = {
        message: 'An error occurred',
        level: LogLevel.ERROR,
        timestamp: new Date('2023-01-01T12:00:00Z'),
        error: {
          message: 'Something went wrong'
          // No name provided
        }
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      expect(result['@error'].name).toBe('Error');
    });

    it('should format stack trace correctly', () => {
      const stackTrace = 'Error: Something went wrong\n    at Test.method (/app/test.js:10:15)\n    at process._tickCallback (internal/process/next_tick.js:68:7)';
      const entry: LogEntry = {
        message: 'An error occurred',
        level: LogLevel.ERROR,
        timestamp: new Date('2023-01-01T12:00:00Z'),
        error: {
          message: 'Something went wrong',
          name: 'TestError',
          stack: stackTrace
        }
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      // Verify that newlines are replaced with \r\n for CloudWatch
      expect(result['@error'].stack).toBe(stackTrace.replace(/\n/g, '\r\n'));
    });

    it('should include error classification fields when provided', () => {
      const entry: LogEntry = {
        message: 'An error occurred',
        level: LogLevel.ERROR,
        timestamp: new Date('2023-01-01T12:00:00Z'),
        error: {
          message: 'Something went wrong',
          name: 'TestError',
          isTransient: true,
          isClientError: false,
          isExternalError: true
        }
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      expect(result['@error'].isTransient).toBe(true);
      expect(result['@error'].isClientError).toBe(false);
      expect(result['@error'].isExternalError).toBe(true);
    });

    it('should not include error classification fields when not provided', () => {
      const entry: LogEntry = {
        message: 'An error occurred',
        level: LogLevel.ERROR,
        timestamp: new Date('2023-01-01T12:00:00Z'),
        error: {
          message: 'Something went wrong',
          name: 'TestError'
          // No classification fields
        }
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      expect(result['@error'].isTransient).toBeUndefined();
      expect(result['@error'].isClientError).toBeUndefined();
      expect(result['@error'].isExternalError).toBeUndefined();
    });
  });

  describe('CloudWatch Logs Insights compatibility', () => {
    it('should format logs for optimal CloudWatch Logs Insights querying', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const entry: LogEntry = {
        message: 'Test message for CloudWatch Logs Insights',
        level: LogLevel.INFO,
        timestamp,
        serviceName: 'test-service',
        requestId: 'req-123',
        userId: 'user-456',
        traceId: 'trace-123',
        journey: {
          type: JourneyType.HEALTH,
          resourceId: 'health-123',
          action: 'view-metrics'
        }
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      // Verify CloudWatch Logs Insights optimized fields (with @ prefix)
      expect(result['@timestamp']).toBe(timestamp.toISOString());
      expect(result['@message']).toBe('Test message for CloudWatch Logs Insights');
      expect(result['@level']).toBe('INFO');
      expect(result['@aws']).toBeDefined();
      expect(result['@request']).toBeDefined();
      expect(result['@trace']).toBeDefined();
      expect(result['@journey']).toBeDefined();
      
      // Verify nested fields are properly structured for querying
      expect(result['@aws'].region).toBe(mockRegion);
      expect(result['@request'].id).toBe('req-123');
      expect(result['@trace'].traceId).toBe('trace-123');
      expect(result['@journey'].type).toBe(JourneyType.HEALTH);
    });

    it('should format complex nested objects for CloudWatch Logs Insights querying', () => {
      const entry: LogEntry = {
        message: 'Complex object test',
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z'),
        contextData: {
          nestedObject: {
            level1: {
              level2: {
                level3: 'deep value'
              }
            },
            array: [1, 2, { key: 'value' }]
          }
        },
        journey: {
          type: JourneyType.HEALTH,
          data: {
            complexMetric: {
              values: [75, 80, 85],
              average: 80,
              metadata: {
                source: 'device',
                reliability: 'high'
              }
            }
          }
        }
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      // Verify complex nested objects are properly formatted
      expect(result['@journey'].data.complexMetric.values).toEqual([75, 80, 85]);
      expect(result['@journey'].data.complexMetric.metadata.reliability).toBe('high');
    });

    it('should handle special characters in log messages for CloudWatch compatibility', () => {
      const specialCharsMessage = 'Special chars: \n\r\t\b\f\'\"\\';  
      const entry: LogEntry = {
        message: specialCharsMessage,
        level: LogLevel.INFO,
        timestamp: new Date('2023-01-01T12:00:00Z')
      };
      
      const result = JSON.parse(formatter.format(entry));
      
      // Verify special characters are properly escaped in JSON
      expect(result['@message']).toBe(specialCharsMessage);
    });
  });
});