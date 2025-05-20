import { 
  formatError, 
  formatTimestamp, 
  formatValue, 
  formatObject, 
  safeStringify, 
  formatJourneyContext,
  redactSensitiveInfo
} from '../../../src/utils/format.utils';
import { LogLevel } from '../../../src/interfaces/log-level.enum';

describe('Serialization Utilities', () => {
  describe('safeStringify', () => {
    it('should convert simple objects to JSON strings', () => {
      const obj = { name: 'Test', value: 123 };
      const result = safeStringify(obj);
      expect(result).toBe(JSON.stringify(obj));
    });

    it('should handle arrays properly', () => {
      const arr = [1, 2, { name: 'Test' }];
      const result = safeStringify(arr);
      expect(result).toBe(JSON.stringify(arr));
    });

    it('should handle null and undefined values', () => {
      expect(safeStringify(null)).toBe('null');
      expect(safeStringify(undefined)).toBe(undefined);
    });

    it('should handle circular references without throwing errors', () => {
      const obj: any = { name: 'Circular' };
      obj.self = obj; // Create circular reference
      
      const result = safeStringify(obj);
      expect(result).toContain('Circular');
      expect(result).toContain('[Circular Reference]');
    });

    it('should handle nested circular references', () => {
      const parent: any = { name: 'Parent' };
      const child: any = { name: 'Child', parent };
      parent.child = child; // Create circular reference
      
      const result = safeStringify(parent);
      expect(result).toContain('Parent');
      expect(result).toContain('Child');
      expect(result).toContain('[Circular Reference]');
    });
  });

  describe('formatValue', () => {
    it('should format string values correctly', () => {
      expect(formatValue('test')).toBe('test');
    });

    it('should format number values correctly', () => {
      expect(formatValue(123)).toBe(123);
      expect(formatValue(123.45)).toBe(123.45);
    });

    it('should format boolean values correctly', () => {
      expect(formatValue(true)).toBe(true);
      expect(formatValue(false)).toBe(false);
    });

    it('should format null and undefined correctly', () => {
      expect(formatValue(null)).toBe(null);
      expect(formatValue(undefined)).toBe(undefined);
    });

    it('should format Date objects as ISO strings', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      expect(formatValue(date)).toBe(date.toISOString());
    });

    it('should format functions as descriptive strings', () => {
      function testFunction() {}
      const result = formatValue(testFunction);
      expect(result).toBe('[Function: testFunction]');
    });

    it('should format anonymous functions with appropriate label', () => {
      const result = formatValue(() => {});
      expect(result).toBe('[Function: anonymous]');
    });

    it('should format symbols as strings', () => {
      const sym = Symbol('test');
      expect(formatValue(sym)).toBe(sym.toString());
    });

    it('should format arrays by processing each element', () => {
      const arr = [1, 'test', true];
      const result = formatValue(arr);
      expect(result).toEqual(arr);
    });

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(11000);
      const result = formatValue(longString);
      expect(result).toContain('truncated');
      expect(result.length).toBeLessThan(longString.length);
    });
  });

  describe('formatObject', () => {
    it('should format simple objects correctly', () => {
      const obj = { name: 'Test', value: 123 };
      const result = formatObject(obj);
      expect(result).toEqual(obj);
    });

    it('should handle nested objects', () => {
      const obj = { 
        name: 'Test', 
        nested: { 
          value: 123,
          deep: {
            deeper: true
          }
        } 
      };
      const result = formatObject(obj);
      expect(result).toEqual(obj);
    });

    it('should detect and handle circular references', () => {
      const obj: any = { name: 'Circular' };
      obj.self = obj; // Create circular reference
      
      const result = formatObject(obj);
      expect(result.name).toBe('Circular');
      expect(result.self).toEqual({ value: '[Circular Reference]' });
    });

    it('should limit object depth to prevent excessive nesting', () => {
      // Create a deeply nested object
      let deepObj: any = { value: true };
      let current = deepObj;
      
      // Create 15 levels of nesting (beyond MAX_DEPTH)
      for (let i = 0; i < 15; i++) {
        current.nested = { level: i };
        current = current.nested;
      }
      
      const result = formatObject(deepObj);
      
      // Navigate through the result to find the max depth cutoff
      let resultCurrent = result;
      let depth = 0;
      while (resultCurrent.nested && depth < 20) {
        resultCurrent = resultCurrent.nested;
        depth++;
      }
      
      // Should find a max depth indicator
      expect(resultCurrent).toHaveProperty('value');
      expect(resultCurrent.value).toBe('[Max Depth Exceeded]');
    });

    it('should handle null values', () => {
      expect(formatObject(null)).toBe(null);
    });
  });

  describe('formatError', () => {
    it('should format basic Error objects', () => {
      const error = new Error('Test error');
      const result = formatError(error);
      
      expect(result.message).toBe('Test error');
      expect(result.name).toBe('Error');
      expect(result.stack).toBeDefined();
      expect(Array.isArray(result.stack)).toBe(true);
    });

    it('should handle errors without stack traces', () => {
      const error = new Error('No stack');
      delete error.stack;
      
      const result = formatError(error);
      expect(result.message).toBe('No stack');
      expect(result.stack).toBeUndefined();
    });

    it('should include custom error properties', () => {
      const error: any = new Error('Custom error');
      error.code = 'CUSTOM_ERROR';
      error.statusCode = 400;
      error.customData = { id: 123 };
      
      const result = formatError(error);
      expect(result.code).toBe('CUSTOM_ERROR');
      expect(result.statusCode).toBe(400);
      expect(result.customData).toEqual({ id: 123 });
    });

    it('should handle HTTP errors with response data', () => {
      const error: any = new Error('HTTP error');
      error.response = {
        status: 404,
        data: { message: 'Not found' }
      };
      
      const result = formatError(error);
      expect(result.response).toBeDefined();
      expect(result.response.status).toBe(404);
      expect(result.response.data.message).toBe('Not found');
    });

    it('should handle HTTP errors with request data', () => {
      const error: any = new Error('HTTP error');
      error.request = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: { 'Content-Type': 'application/json' }
      };
      
      const result = formatError(error);
      expect(result.request).toBeDefined();
      expect(result.request.method).toBe('GET');
      expect(result.request.url).toBe('https://api.example.com/test');
      expect(result.request.headers['Content-Type']).toBe('application/json');
    });

    it('should handle null or undefined errors', () => {
      expect(formatError(null as any).message).toBe('Unknown error');
      expect(formatError(undefined as any).message).toBe('Unknown error');
    });
  });

  describe('formatTimestamp', () => {
    it('should format Date objects to ISO strings', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      expect(formatTimestamp(date)).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should format numeric timestamps to ISO strings', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z').getTime();
      expect(formatTimestamp(timestamp)).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should use current time when no timestamp is provided', () => {
      // Mock Date.now to return a fixed timestamp
      const originalNow = Date.now;
      const mockDate = new Date('2023-01-01T12:00:00Z');
      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;
      
      expect(formatTimestamp()).toBe('2023-01-01T12:00:00.000Z');
      
      // Restore original Date
      global.Date = originalNow as any;
    });
  });

  describe('formatJourneyContext', () => {
    it('should format health journey context correctly', () => {
      const context = {
        journeyId: 'health-123',
        step: 'metrics',
        metricType: 'blood-pressure',
        deviceId: 'device-456'
      };
      
      const result = formatJourneyContext(context, 'health');
      
      expect(result.journeyType).toBe('health');
      expect(result.journeyId).toBe('health-123');
      expect(result.journeyStep).toBe('metrics');
      expect(result.healthMetricType).toBe('blood-pressure');
      expect(result.healthDeviceId).toBe('device-456');
    });

    it('should format care journey context correctly', () => {
      const context = {
        journeyId: 'care-123',
        step: 'appointment',
        appointmentId: 'appt-456',
        providerId: 'provider-789'
      };
      
      const result = formatJourneyContext(context, 'care');
      
      expect(result.journeyType).toBe('care');
      expect(result.journeyId).toBe('care-123');
      expect(result.journeyStep).toBe('appointment');
      expect(result.careAppointmentId).toBe('appt-456');
      expect(result.careProviderId).toBe('provider-789');
    });

    it('should format plan journey context correctly', () => {
      const context = {
        journeyId: 'plan-123',
        step: 'claims',
        planId: 'plan-456',
        claimId: 'claim-789'
      };
      
      const result = formatJourneyContext(context, 'plan');
      
      expect(result.journeyType).toBe('plan');
      expect(result.journeyId).toBe('plan-123');
      expect(result.journeyStep).toBe('claims');
      expect(result.planId).toBe('plan-456');
      expect(result.planClaimId).toBe('claim-789');
    });

    it('should use journeyType from context if not explicitly provided', () => {
      const context = {
        journeyType: 'health',
        journeyId: 'health-123',
        step: 'metrics'
      };
      
      const result = formatJourneyContext(context);
      
      expect(result.journeyType).toBe('health');
      expect(result.journeyId).toBe('health-123');
    });

    it('should handle empty or undefined context', () => {
      expect(formatJourneyContext(null as any)).toEqual({});
      expect(formatJourneyContext(undefined as any)).toEqual({});
      expect(formatJourneyContext({})).toEqual({ journeyType: 'unknown' });
    });
  });

  describe('redactSensitiveInfo', () => {
    it('should redact sensitive string fields', () => {
      const obj = {
        username: 'testuser',
        password: 'secret123',
        apiKey: 'abc123xyz',
        data: 'public data'
      };
      
      const result = redactSensitiveInfo(obj);
      
      expect(result.username).toBe('testuser');
      expect(result.password).toBe('[REDACTED]');
      expect(result.apiKey).toBe('[REDACTED]');
      expect(result.data).toBe('public data');
    });

    it('should redact sensitive fields in nested objects', () => {
      const obj = {
        user: {
          id: 123,
          credentials: {
            password: 'secret123',
            token: 'jwt-token-here'
          }
        },
        publicData: 'visible'
      };
      
      const result = redactSensitiveInfo(obj);
      
      expect(result.user.id).toBe(123);
      expect(result.user.credentials.password).toBe('[REDACTED]');
      expect(result.user.credentials.token).toBe('[REDACTED]');
      expect(result.publicData).toBe('visible');
    });

    it('should redact sensitive fields in arrays', () => {
      const obj = {
        users: [
          { id: 1, apiKey: 'key1' },
          { id: 2, apiKey: 'key2' }
        ]
      };
      
      const result = redactSensitiveInfo(obj);
      
      expect(result.users[0].id).toBe(1);
      expect(result.users[0].apiKey).toBe('[REDACTED]');
      expect(result.users[1].id).toBe(2);
      expect(result.users[1].apiKey).toBe('[REDACTED]');
    });

    it('should preserve type information when redacting', () => {
      const obj = {
        password: 'secret',
        secretNumber: 12345,
        secretArray: [1, 2, 3],
        secretObject: { a: 1, b: 2 },
        secretNull: null
      };
      
      const result = redactSensitiveInfo(obj);
      
      expect(result.password).toBe('[REDACTED]');
      expect(result.secretNumber).toBe(0);
      expect(Array.isArray(result.secretArray)).toBe(true);
      expect(result.secretArray).toEqual(['[REDACTED]']);
      expect(typeof result.secretObject).toBe('object');
      expect(result.secretObject).toEqual({ redacted: true });
      expect(result.secretNull).toBe(null);
    });

    it('should allow custom sensitive keys', () => {
      const obj = {
        username: 'testuser',
        password: 'secret123',
        customSecret: 'hidden',
        internalCode: 'visible'
      };
      
      const result = redactSensitiveInfo(obj, ['password', 'customSecret']);
      
      expect(result.username).toBe('testuser');
      expect(result.password).toBe('[REDACTED]');
      expect(result.customSecret).toBe('[REDACTED]');
      expect(result.internalCode).toBe('visible');
    });

    it('should handle non-object inputs', () => {
      expect(redactSensitiveInfo('string' as any)).toBe('string');
      expect(redactSensitiveInfo(123 as any)).toBe(123);
      expect(redactSensitiveInfo(null as any)).toBe(null);
      expect(redactSensitiveInfo(undefined as any)).toBe(undefined);
    });
  });

  describe('Complex serialization scenarios', () => {
    it('should properly serialize a complete log entry with context', () => {
      // Create a complex log entry with various data types and context
      const logEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.INFO,
        message: 'User completed health assessment',
        context: {
          requestId: 'req-123',
          correlationId: 'corr-456',
          userId: 'user-789',
          journeyType: 'health',
          journeyStep: 'assessment'
        },
        metadata: {
          duration: 1500,
          completionScore: 85,
          metrics: {
            bloodPressure: '120/80',
            heartRate: 72
          }
        }
      };
      
      // Format and stringify the log entry
      const formattedEntry = {};
      Object.entries(logEntry).forEach(([key, value]) => {
        formattedEntry[key] = formatValue(value);
      });
      
      const serialized = safeStringify(formattedEntry);
      const parsed = JSON.parse(serialized);
      
      // Verify the serialized output
      expect(parsed.timestamp).toBe('2023-01-01T12:00:00.000Z');
      expect(parsed.level).toBe(1); // INFO level
      expect(parsed.message).toBe('User completed health assessment');
      expect(parsed.context.requestId).toBe('req-123');
      expect(parsed.context.userId).toBe('user-789');
      expect(parsed.metadata.completionScore).toBe(85);
      expect(parsed.metadata.metrics.bloodPressure).toBe('120/80');
    });

    it('should handle serialization of error objects within log entries', () => {
      const error = new Error('API request failed');
      (error as any).statusCode = 500;
      (error as any).code = 'INTERNAL_SERVER_ERROR';
      
      const logEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.ERROR,
        message: 'Failed to process health data',
        error,
        context: {
          requestId: 'req-123',
          userId: 'user-789'
        }
      };
      
      // Format and stringify the log entry
      const formattedEntry = {};
      Object.entries(logEntry).forEach(([key, value]) => {
        formattedEntry[key] = formatValue(value);
      });
      
      const serialized = safeStringify(formattedEntry);
      const parsed = JSON.parse(serialized);
      
      // Verify the serialized output
      expect(parsed.timestamp).toBe('2023-01-01T12:00:00.000Z');
      expect(parsed.level).toBe(3); // ERROR level
      expect(parsed.message).toBe('Failed to process health data');
      expect(parsed.error.message).toBe('API request failed');
      expect(parsed.error.statusCode).toBe(500);
      expect(parsed.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(Array.isArray(parsed.error.stack)).toBe(true);
    });

    it('should properly serialize log entries with sensitive information redacted', () => {
      const logEntry = {
        timestamp: new Date('2023-01-01T12:00:00Z'),
        level: LogLevel.INFO,
        message: 'User authenticated',
        context: {
          requestId: 'req-123',
          userId: 'user-789'
        },
        credentials: {
          username: 'testuser',
          password: 'secret123',
          token: 'jwt-token-here'
        }
      };
      
      // Format, redact, and stringify the log entry
      const formattedEntry = {};
      Object.entries(logEntry).forEach(([key, value]) => {
        formattedEntry[key] = formatValue(value);
      });
      
      const redactedEntry = redactSensitiveInfo(formattedEntry);
      const serialized = safeStringify(redactedEntry);
      const parsed = JSON.parse(serialized);
      
      // Verify the serialized output
      expect(parsed.timestamp).toBe('2023-01-01T12:00:00.000Z');
      expect(parsed.level).toBe(1); // INFO level
      expect(parsed.message).toBe('User authenticated');
      expect(parsed.context.requestId).toBe('req-123');
      expect(parsed.context.userId).toBe('user-789');
      expect(parsed.credentials.username).toBe('testuser');
      expect(parsed.credentials.password).toBe('[REDACTED]');
      expect(parsed.credentials.token).toBe('[REDACTED]');
    });
  });
});