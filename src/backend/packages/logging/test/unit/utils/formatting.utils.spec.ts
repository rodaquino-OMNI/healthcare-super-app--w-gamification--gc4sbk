import {
  formatError,
  formatTimestamp,
  detectCircular,
  safeStringify,
  formatObject,
  formatValue,
  formatJourneyContext,
  formatLogLevel,
  redactSensitiveInfo,
} from '../../../src/utils/format.utils';
import { LogLevel } from '../../../src/interfaces/log-level.enum';

describe('Formatting Utilities', () => {
  describe('formatError', () => {
    it('should format a basic error with message and name', () => {
      const error = new Error('Test error');
      const formatted = formatError(error);

      expect(formatted.message).toBe('Test error');
      expect(formatted.name).toBe('Error');
      expect(Array.isArray(formatted.stack)).toBe(true);
    });

    it('should handle errors with additional properties', () => {
      const error = new Error('Test error') as any;
      error.code = 'ERR_TEST';
      error.statusCode = 400;
      error.customProp = 'custom value';

      const formatted = formatError(error);

      expect(formatted.message).toBe('Test error');
      expect(formatted.code).toBe('ERR_TEST');
      expect(formatted.statusCode).toBe(400);
      expect(formatted.customProp).toBe('custom value');
    });

    it('should handle errors with request and response properties', () => {
      const error = new Error('API error') as any;
      error.request = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: { 'Content-Type': 'application/json' },
      };
      error.response = {
        status: 500,
        data: { message: 'Internal server error' },
      };

      const formatted = formatError(error);

      expect(formatted.message).toBe('API error');
      expect(formatted.request.method).toBe('GET');
      expect(formatted.request.url).toBe('https://api.example.com/test');
      expect(formatted.response.status).toBe(500);
      expect(formatted.response.data.message).toBe('Internal server error');
    });

    it('should handle null or undefined errors', () => {
      const formatted = formatError(null as unknown as Error);
      expect(formatted.message).toBe('Unknown error');
    });
  });

  describe('formatTimestamp', () => {
    it('should format a Date object to ISO string', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const formatted = formatTimestamp(date);
      expect(formatted).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should format a timestamp number to ISO string', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z').getTime();
      const formatted = formatTimestamp(timestamp);
      expect(formatted).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should use current time when no timestamp is provided', () => {
      const before = new Date();
      const formatted = formatTimestamp();
      const after = new Date();

      const formattedDate = new Date(formatted);
      expect(formattedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(formattedDate.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('detectCircular', () => {
    it('should return false for primitive values', () => {
      expect(detectCircular(null)).toBe(false);
      expect(detectCircular(undefined)).toBe(false);
      expect(detectCircular(123)).toBe(false);
      expect(detectCircular('test')).toBe(false);
      expect(detectCircular(true)).toBe(false);
    });

    it('should return false for objects without circular references', () => {
      const obj = { a: 1, b: { c: 2 } };
      expect(detectCircular(obj)).toBe(false);
    });

    it('should return true for objects with direct circular references', () => {
      const obj: any = { a: 1 };
      obj.self = obj;
      expect(detectCircular(obj)).toBe(true);
    });

    it('should return true for objects with nested circular references', () => {
      const obj: any = { a: 1, b: { c: 2 } };
      obj.b.parent = obj;
      expect(detectCircular(obj)).toBe(true);
    });

    it('should return true for arrays with circular references', () => {
      const arr: any[] = [1, 2, 3];
      arr.push(arr);
      expect(detectCircular(arr)).toBe(true);
    });
  });

  describe('safeStringify', () => {
    it('should stringify simple objects normally', () => {
      const obj = { a: 1, b: 'test', c: true };
      const result = safeStringify(obj);
      expect(result).toBe(JSON.stringify(obj));
    });

    it('should handle objects with circular references', () => {
      const obj: any = { a: 1, b: { c: 2 } };
      obj.self = obj;

      const result = safeStringify(obj);
      expect(result).toContain('"a":1');
      expect(result).toContain('"c":2');
      expect(result).toContain('"self":"[Circular Reference]"');
    });

    it('should handle nested circular references', () => {
      const obj: any = { a: 1, b: { c: 2 } };
      obj.b.parent = obj;

      const result = safeStringify(obj);
      expect(result).toContain('"a":1');
      expect(result).toContain('"c":2');
      expect(result).toContain('"parent":"[Circular Reference]"');
    });
  });

  describe('formatObject', () => {
    it('should format a simple object', () => {
      const obj = { a: 1, b: 'test', c: true };
      const formatted = formatObject(obj);
      expect(formatted).toEqual(obj);
    });

    it('should handle null values', () => {
      const formatted = formatObject(null as any);
      expect(formatted).toBeNull();
    });

    it('should handle circular references', () => {
      const obj: any = { a: 1 };
      obj.self = obj;

      const formatted = formatObject(obj);
      expect(formatted.a).toBe(1);
      expect(formatted.self.value).toBe('[Circular Reference]');
    });

    it('should limit object depth', () => {
      // Create a deeply nested object
      let nested: any = { value: 'deepest' };
      for (let i = 0; i < 15; i++) {
        nested = { nested };
      }

      const formatted = formatObject(nested);
      
      // Navigate down to find the max depth cutoff
      let current = formatted;
      let depth = 0;
      while (current.nested && typeof current.nested === 'object' && !current.nested.value) {
        current = current.nested;
        depth++;
      }

      // At some point we should hit the max depth
      expect(current.nested.value).toBe('[Max Depth Exceeded]');
    });
  });

  describe('formatValue', () => {
    it('should handle null and undefined', () => {
      expect(formatValue(null)).toBeNull();
      expect(formatValue(undefined)).toBeUndefined();
    });

    it('should handle primitive types', () => {
      expect(formatValue(123)).toBe(123);
      expect(formatValue('test')).toBe('test');
      expect(formatValue(true)).toBe(true);
    });

    it('should format Date objects as ISO strings', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      expect(formatValue(date)).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should format Error objects', () => {
      const error = new Error('Test error');
      const formatted = formatValue(error);
      expect(formatted.message).toBe('Test error');
      expect(formatted.name).toBe('Error');
    });

    it('should format arrays', () => {
      const arr = [1, 'test', { a: 1 }];
      const formatted = formatValue(arr);
      expect(formatted).toEqual([1, 'test', { a: 1 }]);
    });

    it('should format functions', () => {
      function testFn() {}
      const formatted = formatValue(testFn);
      expect(formatted).toBe('[Function: testFn]');
    });

    it('should format symbols', () => {
      const sym = Symbol('test');
      const formatted = formatValue(sym);
      expect(formatted).toBe('Symbol(test)');
    });

    it('should format bigints', () => {
      const big = BigInt(123);
      const formatted = formatValue(big);
      expect(formatted).toBe('123');
    });

    it('should truncate long strings', () => {
      // Create a string longer than MAX_STRING_LENGTH (10000)
      const longString = 'a'.repeat(15000);
      const formatted = formatValue(longString);
      
      expect(formatted.length).toBeLessThan(longString.length);
      expect(formatted).toContain('... [truncated, 15000 chars total]');
      expect(formatted.startsWith('a'.repeat(10000))).toBe(true);
    });
  });

  describe('formatJourneyContext', () => {
    it('should format health journey context', () => {
      const context = {
        journeyId: 'health-123',
        step: 'metrics-input',
        metricType: 'blood-pressure',
        deviceId: 'device-456',
      };

      const formatted = formatJourneyContext(context, 'health');

      expect(formatted.journeyType).toBe('health');
      expect(formatted.journeyId).toBe('health-123');
      expect(formatted.journeyStep).toBe('metrics-input');
      expect(formatted.healthMetricType).toBe('blood-pressure');
      expect(formatted.healthDeviceId).toBe('device-456');
    });

    it('should format care journey context', () => {
      const context = {
        journeyId: 'care-123',
        step: 'appointment-booking',
        appointmentId: 'appt-456',
        providerId: 'provider-789',
      };

      const formatted = formatJourneyContext(context, 'care');

      expect(formatted.journeyType).toBe('care');
      expect(formatted.journeyId).toBe('care-123');
      expect(formatted.journeyStep).toBe('appointment-booking');
      expect(formatted.careAppointmentId).toBe('appt-456');
      expect(formatted.careProviderId).toBe('provider-789');
    });

    it('should format plan journey context', () => {
      const context = {
        journeyId: 'plan-123',
        step: 'claim-submission',
        planId: 'plan-456',
        claimId: 'claim-789',
      };

      const formatted = formatJourneyContext(context, 'plan');

      expect(formatted.journeyType).toBe('plan');
      expect(formatted.journeyId).toBe('plan-123');
      expect(formatted.journeyStep).toBe('claim-submission');
      expect(formatted.planId).toBe('plan-456');
      expect(formatted.planClaimId).toBe('claim-789');
    });

    it('should use journey type from context if not explicitly provided', () => {
      const context = {
        journeyType: 'health',
        journeyId: 'health-123',
      };

      const formatted = formatJourneyContext(context);

      expect(formatted.journeyType).toBe('health');
      expect(formatted.journeyId).toBe('health-123');
    });

    it('should handle empty or null context', () => {
      expect(formatJourneyContext(null as any)).toEqual({});
      expect(formatJourneyContext({})).toEqual({ journeyType: 'unknown' });
    });
  });

  describe('formatLogLevel', () => {
    it('should format string log levels', () => {
      expect(formatLogLevel('debug')).toBe('DEBUG');
      expect(formatLogLevel('INFO')).toBe('INFO');
      expect(formatLogLevel('warn')).toBe('WARN');
      expect(formatLogLevel('error')).toBe('ERROR');
      expect(formatLogLevel('fatal')).toBe('FATAL');
    });

    it('should format enum log levels', () => {
      expect(formatLogLevel(LogLevel.DEBUG)).toBe('DEBUG');
      expect(formatLogLevel(LogLevel.INFO)).toBe('INFO');
      expect(formatLogLevel(LogLevel.WARN)).toBe('WARN');
      expect(formatLogLevel(LogLevel.ERROR)).toBe('ERROR');
      expect(formatLogLevel(LogLevel.FATAL)).toBe('FATAL');
    });

    it('should handle unknown log levels', () => {
      expect(formatLogLevel(99 as LogLevel)).toBe('UNKNOWN');
    });
  });

  describe('redactSensitiveInfo', () => {
    it('should redact sensitive fields in objects', () => {
      const obj = {
        username: 'testuser',
        password: 'secret123',
        apiKey: 'abc123xyz',
        token: 'jwt-token-here',
        data: {
          userSecret: 'sensitive-data',
          publicInfo: 'public-data',
        },
      };

      const redacted = redactSensitiveInfo(obj);

      expect(redacted.username).toBe('testuser');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.apiKey).toBe('[REDACTED]');
      expect(redacted.token).toBe('[REDACTED]');
      expect(redacted.data.userSecret).toBe('[REDACTED]');
      expect(redacted.data.publicInfo).toBe('public-data');
    });

    it('should handle different types of sensitive data', () => {
      const obj = {
        passwordNumber: 12345,
        secretArray: [1, 2, 3],
        tokenObject: { id: 123 },
        nullSecret: null,
      };

      const redacted = redactSensitiveInfo(obj);

      expect(redacted.passwordNumber).toBe(0);
      expect(redacted.secretArray).toEqual(['[REDACTED]']);
      expect(redacted.tokenObject).toEqual({ redacted: true });
      expect(redacted.nullSecret).toBeNull();
    });

    it('should handle arrays of objects with sensitive data', () => {
      const obj = {
        users: [
          { id: 1, username: 'user1', password: 'pass1' },
          { id: 2, username: 'user2', password: 'pass2' },
        ],
      };

      const redacted = redactSensitiveInfo(obj);

      expect(redacted.users[0].id).toBe(1);
      expect(redacted.users[0].username).toBe('user1');
      expect(redacted.users[0].password).toBe('[REDACTED]');
      expect(redacted.users[1].id).toBe(2);
      expect(redacted.users[1].username).toBe('user2');
      expect(redacted.users[1].password).toBe('[REDACTED]');
    });

    it('should use custom sensitive keys if provided', () => {
      const obj = {
        username: 'testuser',
        password: 'secret123', // standard sensitive key
        customSensitive: 'hidden-data',
        normalField: 'normal-data',
      };

      const redacted = redactSensitiveInfo(obj, ['password', 'customSensitive']);

      expect(redacted.username).toBe('testuser');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.customSensitive).toBe('[REDACTED]');
      expect(redacted.normalField).toBe('normal-data');
    });

    it('should handle non-object inputs', () => {
      expect(redactSensitiveInfo(null as any)).toBeNull();
      expect(redactSensitiveInfo('string' as any)).toBe('string');
      expect(redactSensitiveInfo(123 as any)).toBe(123);
    });
  });
});