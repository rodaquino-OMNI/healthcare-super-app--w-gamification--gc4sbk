import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z } from 'zod';
import {
  parseBoolean,
  parseNumber,
  parseArray,
  parseJson,
  parseEnum,
  parseUrl,
  parseDate
} from '../../../src/env/transform';
import { InvalidEnvironmentVariableError } from '../../../src/env/error';

describe('Environment Variable Transformation', () => {
  describe('parseBoolean', () => {
    it('should parse "true" as true', () => {
      expect(parseBoolean('true')).toBe(true);
    });

    it('should parse "false" as false', () => {
      expect(parseBoolean('false')).toBe(false);
    });

    it('should parse "yes" as true', () => {
      expect(parseBoolean('yes')).toBe(true);
    });

    it('should parse "no" as false', () => {
      expect(parseBoolean('no')).toBe(false);
    });

    it('should parse "1" as true', () => {
      expect(parseBoolean('1')).toBe(true);
    });

    it('should parse "0" as false', () => {
      expect(parseBoolean('0')).toBe(false);
    });

    it('should parse "TRUE" as true (case insensitive)', () => {
      expect(parseBoolean('TRUE')).toBe(true);
    });

    it('should parse "FALSE" as false (case insensitive)', () => {
      expect(parseBoolean('FALSE')).toBe(false);
    });

    it('should parse "YES" as true (case insensitive)', () => {
      expect(parseBoolean('YES')).toBe(true);
    });

    it('should parse "NO" as false (case insensitive)', () => {
      expect(parseBoolean('NO')).toBe(false);
    });

    it('should throw InvalidEnvironmentVariableError for invalid boolean values', () => {
      expect(() => parseBoolean('not-a-boolean')).toThrow(InvalidEnvironmentVariableError);
      expect(() => parseBoolean('')).toThrow(InvalidEnvironmentVariableError);
      expect(() => parseBoolean('2')).toThrow(InvalidEnvironmentVariableError);
    });

    it('should include the value in the error message', () => {
      try {
        parseBoolean('invalid');
        fail('Expected parseBoolean to throw');
      } catch (error) {
        expect(error.message).toContain('invalid');
        expect(error.message).toContain('boolean');
      }
    });
  });

  describe('parseNumber', () => {
    it('should parse integer values', () => {
      expect(parseNumber('42')).toBe(42);
      expect(parseNumber('0')).toBe(0);
      expect(parseNumber('-10')).toBe(-10);
    });

    it('should parse floating-point values', () => {
      expect(parseNumber('3.14')).toBe(3.14);
      expect(parseNumber('-2.5')).toBe(-2.5);
      expect(parseNumber('0.0')).toBe(0);
    });

    it('should parse scientific notation', () => {
      expect(parseNumber('1e3')).toBe(1000);
      expect(parseNumber('1.5e2')).toBe(150);
      expect(parseNumber('-2.5e-1')).toBe(-0.25);
    });

    it('should throw InvalidEnvironmentVariableError for non-numeric values', () => {
      expect(() => parseNumber('not-a-number')).toThrow(InvalidEnvironmentVariableError);
      expect(() => parseNumber('')).toThrow(InvalidEnvironmentVariableError);
      expect(() => parseNumber('123abc')).toThrow(InvalidEnvironmentVariableError);
    });

    it('should enforce integer constraint when specified', () => {
      expect(parseNumber('42', { integer: true })).toBe(42);
      expect(() => parseNumber('3.14', { integer: true })).toThrow(InvalidEnvironmentVariableError);
    });

    it('should enforce minimum value constraint when specified', () => {
      expect(parseNumber('42', { min: 10 })).toBe(42);
      expect(() => parseNumber('5', { min: 10 })).toThrow(InvalidEnvironmentVariableError);
    });

    it('should enforce maximum value constraint when specified', () => {
      expect(parseNumber('42', { max: 50 })).toBe(42);
      expect(() => parseNumber('100', { max: 50 })).toThrow(InvalidEnvironmentVariableError);
    });

    it('should enforce both min and max constraints when specified', () => {
      expect(parseNumber('25', { min: 10, max: 50 })).toBe(25);
      expect(() => parseNumber('5', { min: 10, max: 50 })).toThrow(InvalidEnvironmentVariableError);
      expect(() => parseNumber('100', { min: 10, max: 50 })).toThrow(InvalidEnvironmentVariableError);
    });

    it('should include constraint information in error messages', () => {
      try {
        parseNumber('5', { min: 10 });
        fail('Expected parseNumber to throw');
      } catch (error) {
        expect(error.message).toContain('5');
        expect(error.message).toContain('minimum');
        expect(error.message).toContain('10');
      }

      try {
        parseNumber('100', { max: 50 });
        fail('Expected parseNumber to throw');
      } catch (error) {
        expect(error.message).toContain('100');
        expect(error.message).toContain('maximum');
        expect(error.message).toContain('50');
      }

      try {
        parseNumber('3.14', { integer: true });
        fail('Expected parseNumber to throw');
      } catch (error) {
        expect(error.message).toContain('3.14');
        expect(error.message).toContain('integer');
      }
    });
  });

  describe('parseArray', () => {
    it('should parse comma-separated values', () => {
      expect(parseArray('a,b,c')).toEqual(['a', 'b', 'c']);
      expect(parseArray('1,2,3')).toEqual(['1', '2', '3']);
      expect(parseArray('true,false')).toEqual(['true', 'false']);
    });

    it('should handle whitespace in comma-separated values', () => {
      expect(parseArray('a, b, c')).toEqual(['a', 'b', 'c']);
      expect(parseArray(' a,b ,c ')).toEqual(['a', 'b', 'c']);
    });

    it('should parse JSON array format', () => {
      expect(parseArray('["a","b","c"]')).toEqual(['a', 'b', 'c']);
      expect(parseArray('[1,2,3]')).toEqual([1, 2, 3]);
      expect(parseArray('[true,false]')).toEqual([true, false]);
    });

    it('should parse empty arrays', () => {
      expect(parseArray('')).toEqual([]);
      expect(parseArray('[]')).toEqual([]);
    });

    it('should throw InvalidEnvironmentVariableError for malformed JSON arrays', () => {
      expect(() => parseArray('["a","b",')).toThrow(InvalidEnvironmentVariableError);
      expect(() => parseArray('{"a":1}')).toThrow(InvalidEnvironmentVariableError);
    });

    it('should apply item transformation when specified', () => {
      expect(parseArray('1,2,3', { itemTransform: (item) => parseInt(item, 10) }))
        .toEqual([1, 2, 3]);
      
      expect(parseArray('true,false,true', { itemTransform: (item) => item === 'true' }))
        .toEqual([true, false, true]);
    });

    it('should apply item validation when specified', () => {
      const validatePositiveNumber = (item: number) => {
        if (typeof item !== 'number' || item <= 0) {
          throw new Error('Item must be a positive number');
        }
        return item;
      };

      expect(parseArray('1,2,3', {
        itemTransform: (item) => parseInt(item, 10),
        itemValidate: validatePositiveNumber
      })).toEqual([1, 2, 3]);

      expect(() => parseArray('1,-2,3', {
        itemTransform: (item) => parseInt(item, 10),
        itemValidate: validatePositiveNumber
      })).toThrow(InvalidEnvironmentVariableError);
    });

    it('should enforce minimum length constraint when specified', () => {
      expect(parseArray('a,b,c', { minLength: 3 })).toEqual(['a', 'b', 'c']);
      expect(() => parseArray('a,b', { minLength: 3 })).toThrow(InvalidEnvironmentVariableError);
    });

    it('should enforce maximum length constraint when specified', () => {
      expect(parseArray('a,b', { maxLength: 3 })).toEqual(['a', 'b']);
      expect(() => parseArray('a,b,c,d', { maxLength: 3 })).toThrow(InvalidEnvironmentVariableError);
    });

    it('should use custom delimiter when specified', () => {
      expect(parseArray('a|b|c', { delimiter: '|' })).toEqual(['a', 'b', 'c']);
      expect(parseArray('a;b;c', { delimiter: ';' })).toEqual(['a', 'b', 'c']);
    });
  });

  describe('parseJson', () => {
    it('should parse valid JSON objects', () => {
      expect(parseJson('{"name":"test","value":42}')).toEqual({ name: 'test', value: 42 });
      expect(parseJson('{"enabled":true,"tags":["a","b"]}')).toEqual({ enabled: true, tags: ['a', 'b'] });
    });

    it('should parse valid JSON arrays', () => {
      expect(parseJson('[1,2,3]')).toEqual([1, 2, 3]);
      expect(parseJson('[{"id":1},{"id":2}]')).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should throw InvalidEnvironmentVariableError for invalid JSON', () => {
      expect(() => parseJson('{"name":"test"')).toThrow(InvalidEnvironmentVariableError);
      expect(() => parseJson('not-json')).toThrow(InvalidEnvironmentVariableError);
      expect(() => parseJson('')).toThrow(InvalidEnvironmentVariableError);
    });

    it('should validate JSON against schema when provided', () => {
      const schema = z.object({
        name: z.string(),
        value: z.number()
      });

      expect(parseJson('{"name":"test","value":42}', { schema })).toEqual({ name: 'test', value: 42 });
      
      expect(() => parseJson('{"name":"test","value":"not-a-number"}', { schema }))
        .toThrow(InvalidEnvironmentVariableError);
      
      expect(() => parseJson('{"name":"test"}', { schema }))
        .toThrow(InvalidEnvironmentVariableError);
    });

    it('should include schema validation errors in the error message', () => {
      const schema = z.object({
        name: z.string(),
        value: z.number().positive()
      });

      try {
        parseJson('{"name":"test","value":-1}', { schema });
        fail('Expected parseJson to throw');
      } catch (error) {
        expect(error.message).toContain('JSON');
        expect(error.message).toContain('schema');
        expect(error.message).toContain('positive');
        expect(error.details).toBeDefined();
        expect(error.details.issues).toHaveLength(1);
      }
    });

    it('should apply transformation after validation when specified', () => {
      const schema = z.object({
        date: z.string()
      });

      const transform = (data: { date: string }) => ({
        date: new Date(data.date)
      });

      const result = parseJson('{"date":"2023-01-01"}', { schema, transform });
      
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date.toISOString()).toContain('2023-01-01');
    });
  });

  describe('parseEnum', () => {
    const LogLevel = {
      DEBUG: 'debug',
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error'
    } as const;
    
    type LogLevel = typeof LogLevel[keyof typeof LogLevel];

    it('should parse valid enum values', () => {
      expect(parseEnum('debug', Object.values(LogLevel))).toBe('debug');
      expect(parseEnum('info', Object.values(LogLevel))).toBe('info');
      expect(parseEnum('warn', Object.values(LogLevel))).toBe('warn');
      expect(parseEnum('error', Object.values(LogLevel))).toBe('error');
    });

    it('should throw InvalidEnvironmentVariableError for invalid enum values', () => {
      expect(() => parseEnum('trace', Object.values(LogLevel)))
        .toThrow(InvalidEnvironmentVariableError);
      expect(() => parseEnum('', Object.values(LogLevel)))
        .toThrow(InvalidEnvironmentVariableError);
    });

    it('should handle case-insensitive matching when specified', () => {
      expect(parseEnum('DEBUG', Object.values(LogLevel), { caseInsensitive: true })).toBe('debug');
      expect(parseEnum('Info', Object.values(LogLevel), { caseInsensitive: true })).toBe('info');
    });

    it('should include available options in error message', () => {
      try {
        parseEnum('trace', Object.values(LogLevel));
        fail('Expected parseEnum to throw');
      } catch (error) {
        expect(error.message).toContain('trace');
        expect(error.message).toContain('debug');
        expect(error.message).toContain('info');
        expect(error.message).toContain('warn');
        expect(error.message).toContain('error');
      }
    });
  });

  describe('parseUrl', () => {
    it('should parse valid URLs', () => {
      const url = parseUrl('https://api.example.com/v1');
      expect(url.href).toBe('https://api.example.com/v1');
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe('api.example.com');
      expect(url.pathname).toBe('/v1');
    });

    it('should throw InvalidEnvironmentVariableError for invalid URLs', () => {
      expect(() => parseUrl('not-a-url')).toThrow(InvalidEnvironmentVariableError);
      expect(() => parseUrl('')).toThrow(InvalidEnvironmentVariableError);
    });

    it('should validate protocol when specified', () => {
      expect(parseUrl('https://example.com', { protocols: ['https'] }).protocol).toBe('https:');
      expect(() => parseUrl('http://example.com', { protocols: ['https'] }))
        .toThrow(InvalidEnvironmentVariableError);
    });

    it('should validate hostname pattern when specified', () => {
      expect(parseUrl('https://api.austa.com', { hostnamePattern: /\.austa\.com$/ }).hostname)
        .toBe('api.austa.com');
      
      expect(() => parseUrl('https://api.example.com', { hostnamePattern: /\.austa\.com$/ }))
        .toThrow(InvalidEnvironmentVariableError);
    });

    it('should include validation constraints in error message', () => {
      try {
        parseUrl('http://example.com', { protocols: ['https'] });
        fail('Expected parseUrl to throw');
      } catch (error) {
        expect(error.message).toContain('http');
        expect(error.message).toContain('https');
        expect(error.message).toContain('protocol');
      }

      try {
        parseUrl('https://api.example.com', { hostnamePattern: /\.austa\.com$/ });
        fail('Expected parseUrl to throw');
      } catch (error) {
        expect(error.message).toContain('hostname');
        expect(error.message).toContain('pattern');
        expect(error.message).toContain('austa.com');
      }
    });
  });

  describe('parseDate', () => {
    it('should parse ISO date strings', () => {
      const date = parseDate('2023-01-01T12:00:00Z');
      expect(date).toBeInstanceOf(Date);
      expect(date.toISOString()).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should parse date-only strings', () => {
      const date = parseDate('2023-01-01');
      expect(date).toBeInstanceOf(Date);
      expect(date.toISOString().substring(0, 10)).toBe('2023-01-01');
    });

    it('should throw InvalidEnvironmentVariableError for invalid dates', () => {
      expect(() => parseDate('not-a-date')).toThrow(InvalidEnvironmentVariableError);
      expect(() => parseDate('')).toThrow(InvalidEnvironmentVariableError);
      expect(() => parseDate('2023-13-01')).toThrow(InvalidEnvironmentVariableError); // Invalid month
    });

    it('should validate minimum date when specified', () => {
      const minDate = new Date('2023-01-01');
      
      expect(parseDate('2023-01-02', { min: minDate })).toBeInstanceOf(Date);
      expect(() => parseDate('2022-12-31', { min: minDate }))
        .toThrow(InvalidEnvironmentVariableError);
    });

    it('should validate maximum date when specified', () => {
      const maxDate = new Date('2023-12-31');
      
      expect(parseDate('2023-12-30', { max: maxDate })).toBeInstanceOf(Date);
      expect(() => parseDate('2024-01-01', { max: maxDate }))
        .toThrow(InvalidEnvironmentVariableError);
    });

    it('should include validation constraints in error message', () => {
      const minDate = new Date('2023-01-01');
      const maxDate = new Date('2023-12-31');

      try {
        parseDate('2022-12-31', { min: minDate });
        fail('Expected parseDate to throw');
      } catch (error) {
        expect(error.message).toContain('2022-12-31');
        expect(error.message).toContain('minimum');
        expect(error.message).toContain('2023-01-01');
      }

      try {
        parseDate('2024-01-01', { max: maxDate });
        fail('Expected parseDate to throw');
      } catch (error) {
        expect(error.message).toContain('2024-01-01');
        expect(error.message).toContain('maximum');
        expect(error.message).toContain('2023-12-31');
      }
    });

    it('should parse custom date formats when specified', () => {
      const parseFormat = (dateStr: string) => {
        const [day, month, year] = dateStr.split('/');
        return new Date(`${year}-${month}-${day}`);
      };

      const date = parseDate('31/12/2023', { parseFormat });
      expect(date).toBeInstanceOf(Date);
      expect(date.toISOString().substring(0, 10)).toBe('2023-12-31');
    });
  });
});