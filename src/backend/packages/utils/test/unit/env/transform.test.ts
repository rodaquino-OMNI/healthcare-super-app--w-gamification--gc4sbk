import {
  parseBoolean,
  parseNumber,
  parseArray,
  parseNumberArray,
  parseJson,
  parseCSV,
  parseRange,
  isInRange,
  parseUrl,
  parseEnum,
  parseDuration,
  parseMemorySize,
  transform
} from '../../../src/env/transform';

describe('Environment Variable Transformation Utilities', () => {
  describe('parseBoolean', () => {
    it('should parse truthy values correctly', () => {
      expect(parseBoolean('true')).toBe(true);
      expect(parseBoolean('TRUE')).toBe(true);
      expect(parseBoolean('True')).toBe(true);
      expect(parseBoolean('1')).toBe(true);
      expect(parseBoolean('yes')).toBe(true);
      expect(parseBoolean('YES')).toBe(true);
      expect(parseBoolean('y')).toBe(true);
      expect(parseBoolean('on')).toBe(true);
      expect(parseBoolean('ON')).toBe(true);
    });

    it('should parse falsy values correctly', () => {
      expect(parseBoolean('false')).toBe(false);
      expect(parseBoolean('FALSE')).toBe(false);
      expect(parseBoolean('False')).toBe(false);
      expect(parseBoolean('0')).toBe(false);
      expect(parseBoolean('no')).toBe(false);
      expect(parseBoolean('NO')).toBe(false);
      expect(parseBoolean('n')).toBe(false);
      expect(parseBoolean('off')).toBe(false);
      expect(parseBoolean('OFF')).toBe(false);
    });

    it('should handle empty or invalid values as false', () => {
      expect(parseBoolean('')).toBe(false);
      expect(parseBoolean('  ')).toBe(false);
      expect(parseBoolean('invalid')).toBe(false);
      expect(parseBoolean(null as unknown as string)).toBe(false);
      expect(parseBoolean(undefined as unknown as string)).toBe(false);
    });

    it('should trim whitespace before parsing', () => {
      expect(parseBoolean(' true ')).toBe(true);
      expect(parseBoolean(' false ')).toBe(false);
    });
  });

  describe('parseNumber', () => {
    it('should parse integer values correctly', () => {
      expect(parseNumber('0')).toBe(0);
      expect(parseNumber('1')).toBe(1);
      expect(parseNumber('-1')).toBe(-1);
      expect(parseNumber('42')).toBe(42);
      expect(parseNumber('9007199254740991')).toBe(9007199254740991); // MAX_SAFE_INTEGER
    });

    it('should parse floating-point values correctly', () => {
      expect(parseNumber('0.0')).toBe(0);
      expect(parseNumber('3.14')).toBe(3.14);
      expect(parseNumber('-2.5')).toBe(-2.5);
      expect(parseNumber('1e3')).toBe(1000);
      expect(parseNumber('1.5e2')).toBe(150);
    });

    it('should handle whitespace correctly', () => {
      expect(parseNumber(' 42 ')).toBe(42);
      expect(parseNumber('\t3.14\n')).toBe(3.14);
    });

    it('should return default value for invalid input when provided', () => {
      expect(parseNumber('not-a-number', 0)).toBe(0);
      expect(parseNumber('', 42)).toBe(42);
      expect(parseNumber('   ', -1)).toBe(-1);
      expect(parseNumber(null as unknown as string, 100)).toBe(100);
      expect(parseNumber(undefined as unknown as string, 100)).toBe(100);
    });

    it('should throw error for invalid input when no default is provided', () => {
      expect(() => parseNumber('not-a-number')).toThrow();
      expect(() => parseNumber('')).toThrow();
      expect(() => parseNumber('   ')).toThrow();
      expect(() => parseNumber(null as unknown as string)).toThrow();
      expect(() => parseNumber(undefined as unknown as string)).toThrow();
    });

    it('should include the invalid value in the error message', () => {
      try {
        parseNumber('abc');
        fail('Expected parseNumber to throw an error');
      } catch (error) {
        expect((error as Error).message).toContain('abc');
      }
    });
  });

  describe('parseArray', () => {
    it('should parse comma-separated values correctly', () => {
      expect(parseArray('a,b,c')).toEqual(['a', 'b', 'c']);
      expect(parseArray('1,2,3')).toEqual(['1', '2', '3']);
      expect(parseArray('true,false')).toEqual(['true', 'false']);
    });

    it('should handle custom delimiters', () => {
      expect(parseArray('a|b|c', '|')).toEqual(['a', 'b', 'c']);
      expect(parseArray('a;b;c', ';')).toEqual(['a', 'b', 'c']);
      expect(parseArray('a b c', ' ')).toEqual(['a', 'b', 'c']);
    });

    it('should trim whitespace from array items', () => {
      expect(parseArray(' a , b , c ')).toEqual(['a', 'b', 'c']);
      expect(parseArray('\ta\n,\tb\n,\tc\n')).toEqual(['a', 'b', 'c']);
    });

    it('should filter out empty items', () => {
      expect(parseArray('a,,c')).toEqual(['a', 'c']);
      expect(parseArray('a, ,c')).toEqual(['a', 'c']);
      expect(parseArray(',a,c,')).toEqual(['a', 'c']);
    });

    it('should return empty array for empty or invalid input', () => {
      expect(parseArray('')).toEqual([]);
      expect(parseArray('   ')).toEqual([]);
      expect(parseArray(null as unknown as string)).toEqual([]);
      expect(parseArray(undefined as unknown as string)).toEqual([]);
    });
  });

  describe('parseNumberArray', () => {
    it('should parse comma-separated numbers correctly', () => {
      expect(parseNumberArray('1,2,3')).toEqual([1, 2, 3]);
      expect(parseNumberArray('-1,0,1')).toEqual([-1, 0, 1]);
      expect(parseNumberArray('3.14,2.71,1.41')).toEqual([3.14, 2.71, 1.41]);
    });

    it('should handle custom delimiters', () => {
      expect(parseNumberArray('1|2|3', '|')).toEqual([1, 2, 3]);
      expect(parseNumberArray('1;2;3', ';')).toEqual([1, 2, 3]);
      expect(parseNumberArray('1 2 3', ' ')).toEqual([1, 2, 3]);
    });

    it('should trim whitespace from array items', () => {
      expect(parseNumberArray(' 1 , 2 , 3 ')).toEqual([1, 2, 3]);
      expect(parseNumberArray('\t1\n,\t2\n,\t3\n')).toEqual([1, 2, 3]);
    });

    it('should throw error if any item cannot be parsed as a number', () => {
      expect(() => parseNumberArray('1,2,a')).toThrow();
      expect(() => parseNumberArray('1,not-a-number,3')).toThrow();
    });

    it('should include the invalid value and index in the error message', () => {
      try {
        parseNumberArray('1,abc,3');
        fail('Expected parseNumberArray to throw an error');
      } catch (error) {
        expect((error as Error).message).toContain('abc');
        expect((error as Error).message).toContain('index 1');
      }
    });

    it('should return empty array for empty input', () => {
      expect(parseNumberArray('')).toEqual([]);
      expect(parseNumberArray('   ')).toEqual([]);
      expect(parseNumberArray(null as unknown as string)).toEqual([]);
      expect(parseNumberArray(undefined as unknown as string)).toEqual([]);
    });
  });

  describe('parseJson', () => {
    it('should parse valid JSON objects correctly', () => {
      expect(parseJson('{"name":"test"}')).toEqual({ name: 'test' });
      expect(parseJson('{"a":1,"b":2}')).toEqual({ a: 1, b: 2 });
      expect(parseJson('{"nested":{"value":true}}')).toEqual({ nested: { value: true } });
    });

    it('should parse valid JSON arrays correctly', () => {
      expect(parseJson('[1,2,3]')).toEqual([1, 2, 3]);
      expect(parseJson('["a","b","c"]')).toEqual(['a', 'b', 'c']);
      expect(parseJson('[{"id":1},{"id":2}]')).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should parse primitive JSON values correctly', () => {
      expect(parseJson('"string"')).toEqual('string');
      expect(parseJson('42')).toEqual(42);
      expect(parseJson('true')).toEqual(true);
      expect(parseJson('null')).toEqual(null);
    });

    it('should return default value for invalid JSON when provided', () => {
      const defaultValue = { default: true };
      expect(parseJson('invalid-json', defaultValue)).toEqual(defaultValue);
      expect(parseJson('', defaultValue)).toEqual(defaultValue);
      expect(parseJson(null as unknown as string, defaultValue)).toEqual(defaultValue);
      expect(parseJson(undefined as unknown as string, defaultValue)).toEqual(defaultValue);
    });

    it('should throw error for invalid JSON when no default is provided', () => {
      expect(() => parseJson('invalid-json')).toThrow();
      expect(() => parseJson('')).toThrow();
      expect(() => parseJson(null as unknown as string)).toThrow();
      expect(() => parseJson(undefined as unknown as string)).toThrow();
    });

    it('should include the error details in the error message', () => {
      try {
        parseJson('{invalid}');
        fail('Expected parseJson to throw an error');
      } catch (error) {
        expect((error as Error).message).toContain('Cannot parse value to JSON');
      }
    });

    it('should support generic type parameter', () => {
      interface User { id: number; name: string }
      const user = parseJson<User>('{ "id": 1, "name": "John" }');
      expect(user.id).toBe(1);
      expect(user.name).toBe('John');
    });
  });

  describe('parseCSV', () => {
    it('should parse CSV with header row correctly', () => {
      const csv = 'name,age\nJohn,30\nJane,25';
      const expected = [
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' }
      ];
      expect(parseCSV(csv)).toEqual(expected);
    });

    it('should handle custom delimiters', () => {
      const csv = 'name;age\nJohn;30\nJane;25';
      const expected = [
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' }
      ];
      expect(parseCSV(csv, { delimiter: ';' })).toEqual(expected);
    });

    it('should handle CSV without header row', () => {
      const csv = 'John,30\nJane,25';
      const expected = [
        ['John', '30'],
        ['Jane', '25']
      ];
      expect(parseCSV(csv, { headerRow: false })).toEqual(expected);
    });

    it('should trim whitespace from values', () => {
      const csv = ' name , age \n John , 30 \n Jane , 25 ';
      const expected = [
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' }
      ];
      expect(parseCSV(csv)).toEqual(expected);
    });

    it('should handle missing values', () => {
      const csv = 'name,age,city\nJohn,30,\nJane,,New York';
      const expected = [
        { name: 'John', age: '30', city: '' },
        { name: 'Jane', age: '', city: 'New York' }
      ];
      expect(parseCSV(csv)).toEqual(expected);
    });

    it('should return empty array for empty input', () => {
      expect(parseCSV('')).toEqual([]);
      expect(parseCSV('   ')).toEqual([]);
      expect(parseCSV(null as unknown as string)).toEqual([]);
      expect(parseCSV(undefined as unknown as string)).toEqual([]);
    });

    it('should support generic type parameter', () => {
      interface User { name: string; age: string }
      const csv = 'name,age\nJohn,30\nJane,25';
      const users = parseCSV<User>(csv);
      expect(users[0].name).toBe('John');
      expect(users[0].age).toBe('30');
    });
  });

  describe('parseRange', () => {
    it('should parse range with default delimiter correctly', () => {
      expect(parseRange('1-10')).toEqual({ min: 1, max: 10 });
      expect(parseRange('0-100')).toEqual({ min: 0, max: 100 });
      expect(parseRange('-10-10')).toEqual({ min: -10, max: 10 });
    });

    it('should handle custom delimiters', () => {
      expect(parseRange('1:10', ':')).toEqual({ min: 1, max: 10 });
      expect(parseRange('0..100', '..')).toEqual({ min: 0, max: 100 });
      expect(parseRange('-10,10', ',')).toEqual({ min: -10, max: 10 });
    });

    it('should parse floating-point ranges correctly', () => {
      expect(parseRange('1.5-10.5')).toEqual({ min: 1.5, max: 10.5 });
      expect(parseRange('-0.5-0.5')).toEqual({ min: -0.5, max: 0.5 });
    });

    it('should throw error if range format is invalid', () => {
      expect(() => parseRange('')).toThrow();
      expect(() => parseRange('invalid')).toThrow();
      expect(() => parseRange('10')).toThrow();
      expect(() => parseRange(null as unknown as string)).toThrow();
      expect(() => parseRange(undefined as unknown as string)).toThrow();
    });

    it('should throw error if min is greater than max', () => {
      expect(() => parseRange('10-1')).toThrow();
      expect(() => parseRange('100-0')).toThrow();
    });

    it('should include the invalid format in the error message', () => {
      try {
        parseRange('invalid');
        fail('Expected parseRange to throw an error');
      } catch (error) {
        expect((error as Error).message).toContain('invalid');
      }
    });
  });

  describe('isInRange', () => {
    it('should return true for values within range', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true); // Min boundary
      expect(isInRange(10, 1, 10)).toBe(true); // Max boundary
      expect(isInRange(0, -10, 10)).toBe(true);
    });

    it('should return false for values outside range', () => {
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
      expect(isInRange(-11, -10, 10)).toBe(false);
    });

    it('should handle floating-point values correctly', () => {
      expect(isInRange(1.5, 1, 2)).toBe(true);
      expect(isInRange(0.9, 1, 2)).toBe(false);
      expect(isInRange(2.1, 1, 2)).toBe(false);
    });
  });

  describe('parseUrl', () => {
    it('should parse valid URLs correctly', () => {
      const url = parseUrl('https://example.com');
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe('example.com');
      expect(url.href).toBe('https://example.com/');
    });

    it('should parse URLs with paths, query parameters, and fragments', () => {
      const url = parseUrl('https://example.com/path?query=value#fragment');
      expect(url.pathname).toBe('/path');
      expect(url.search).toBe('?query=value');
      expect(url.hash).toBe('#fragment');
    });

    it('should parse URLs with ports', () => {
      const url = parseUrl('https://example.com:8080');
      expect(url.port).toBe('8080');
    });

    it('should validate protocols when specified', () => {
      expect(() => parseUrl('https://example.com', { protocols: ['https'] })).not.toThrow();
      expect(() => parseUrl('http://example.com', { protocols: ['https'] })).toThrow();
      expect(() => parseUrl('ftp://example.com', { protocols: ['http', 'https'] })).toThrow();
    });

    it('should validate TLD when required', () => {
      expect(() => parseUrl('https://example.com', { requireTld: true })).not.toThrow();
      expect(() => parseUrl('https://localhost', { requireTld: false })).not.toThrow();
      expect(() => parseUrl('https://localhost', { requireTld: true })).toThrow();
    });

    it('should throw error for invalid URLs', () => {
      expect(() => parseUrl('')).toThrow();
      expect(() => parseUrl('invalid')).toThrow();
      expect(() => parseUrl('example.com')).toThrow(); // Missing protocol
      expect(() => parseUrl(null as unknown as string)).toThrow();
      expect(() => parseUrl(undefined as unknown as string)).toThrow();
    });

    it('should include the invalid URL in the error message', () => {
      try {
        parseUrl('invalid');
        fail('Expected parseUrl to throw an error');
      } catch (error) {
        expect((error as Error).message).toContain('invalid');
      }
    });
  });

  describe('parseEnum', () => {
    enum Color {
      Red = 'red',
      Green = 'green',
      Blue = 'blue'
    }

    enum Status {
      Active = 1,
      Inactive = 0,
      Pending = 2
    }

    it('should parse string enum values correctly', () => {
      expect(parseEnum('red', Color)).toBe(Color.Red);
      expect(parseEnum('green', Color)).toBe(Color.Green);
      expect(parseEnum('blue', Color)).toBe(Color.Blue);
    });

    it('should parse numeric enum values correctly', () => {
      expect(parseEnum('1', Status)).toBe(Status.Active);
      expect(parseEnum('0', Status)).toBe(Status.Inactive);
      expect(parseEnum('2', Status)).toBe(Status.Pending);
    });

    it('should be case-insensitive', () => {
      expect(parseEnum('RED', Color)).toBe(Color.Red);
      expect(parseEnum('Green', Color)).toBe(Color.Green);
      expect(parseEnum('BLUE', Color)).toBe(Color.Blue);
    });

    it('should match enum keys if values don\'t match', () => {
      expect(parseEnum('Red', Color)).toBe(Color.Red);
      expect(parseEnum('Active', Status)).toBe(Status.Active);
    });

    it('should return default value for invalid input when provided', () => {
      expect(parseEnum('yellow', Color, Color.Red)).toBe(Color.Red);
      expect(parseEnum('3', Status, Status.Pending)).toBe(Status.Pending);
      expect(parseEnum('', Color, Color.Blue)).toBe(Color.Blue);
      expect(parseEnum(null as unknown as string, Color, Color.Green)).toBe(Color.Green);
      expect(parseEnum(undefined as unknown as string, Status, Status.Active)).toBe(Status.Active);
    });

    it('should throw error for invalid input when no default is provided', () => {
      expect(() => parseEnum('yellow', Color)).toThrow();
      expect(() => parseEnum('3', Status)).toThrow();
      expect(() => parseEnum('', Color)).toThrow();
      expect(() => parseEnum(null as unknown as string, Color)).toThrow();
      expect(() => parseEnum(undefined as unknown as string, Status)).toThrow();
    });

    it('should include the invalid value and expected values in the error message', () => {
      try {
        parseEnum('yellow', Color);
        fail('Expected parseEnum to throw an error');
      } catch (error) {
        expect((error as Error).message).toContain('yellow');
        expect((error as Error).message).toContain('red');
        expect((error as Error).message).toContain('green');
        expect((error as Error).message).toContain('blue');
      }
    });
  });

  describe('parseDuration', () => {
    it('should parse day durations correctly', () => {
      expect(parseDuration('1d')).toBe(24 * 60 * 60 * 1000); // 1 day in ms
      expect(parseDuration('2d')).toBe(2 * 24 * 60 * 60 * 1000); // 2 days in ms
      expect(parseDuration('0.5d')).toBe(0.5 * 24 * 60 * 60 * 1000); // 0.5 days in ms
    });

    it('should parse hour durations correctly', () => {
      expect(parseDuration('1h')).toBe(60 * 60 * 1000); // 1 hour in ms
      expect(parseDuration('2h')).toBe(2 * 60 * 60 * 1000); // 2 hours in ms
      expect(parseDuration('0.5h')).toBe(0.5 * 60 * 60 * 1000); // 0.5 hours in ms
    });

    it('should parse minute durations correctly', () => {
      expect(parseDuration('1m')).toBe(60 * 1000); // 1 minute in ms
      expect(parseDuration('30m')).toBe(30 * 60 * 1000); // 30 minutes in ms
      expect(parseDuration('0.5m')).toBe(0.5 * 60 * 1000); // 0.5 minutes in ms
    });

    it('should parse second durations correctly', () => {
      expect(parseDuration('1s')).toBe(1000); // 1 second in ms
      expect(parseDuration('30s')).toBe(30 * 1000); // 30 seconds in ms
      expect(parseDuration('0.5s')).toBe(0.5 * 1000); // 0.5 seconds in ms
    });

    it('should parse millisecond durations correctly', () => {
      expect(parseDuration('1ms')).toBe(1); // 1 ms
      expect(parseDuration('500ms')).toBe(500); // 500 ms
    });

    it('should parse plain millisecond values', () => {
      expect(parseDuration('1000')).toBe(1000); // 1000 ms
      expect(parseDuration('500')).toBe(500); // 500 ms
    });

    it('should be case-insensitive for units', () => {
      expect(parseDuration('1D')).toBe(24 * 60 * 60 * 1000);
      expect(parseDuration('1H')).toBe(60 * 60 * 1000);
      expect(parseDuration('1M')).toBe(60 * 1000);
      expect(parseDuration('1S')).toBe(1000);
      expect(parseDuration('1MS')).toBe(1);
    });

    it('should throw error for invalid duration format', () => {
      expect(() => parseDuration('')).toThrow();
      expect(() => parseDuration('invalid')).toThrow();
      expect(() => parseDuration('1x')).toThrow(); // Invalid unit
      expect(() => parseDuration('d')).toThrow(); // Missing amount
      expect(() => parseDuration(null as unknown as string)).toThrow();
      expect(() => parseDuration(undefined as unknown as string)).toThrow();
    });

    it('should include the invalid format in the error message', () => {
      try {
        parseDuration('invalid');
        fail('Expected parseDuration to throw an error');
      } catch (error) {
        expect((error as Error).message).toContain('invalid');
      }
    });
  });

  describe('parseMemorySize', () => {
    it('should parse byte values correctly', () => {
      expect(parseMemorySize('1B')).toBe(1);
      expect(parseMemorySize('100B')).toBe(100);
      expect(parseMemorySize('0B')).toBe(0);
    });

    it('should parse kilobyte values correctly', () => {
      expect(parseMemorySize('1KB')).toBe(1024);
      expect(parseMemorySize('1K')).toBe(1024);
      expect(parseMemorySize('2KB')).toBe(2 * 1024);
      expect(parseMemorySize('0.5KB')).toBe(0.5 * 1024);
    });

    it('should parse megabyte values correctly', () => {
      expect(parseMemorySize('1MB')).toBe(1024 * 1024);
      expect(parseMemorySize('1M')).toBe(1024 * 1024);
      expect(parseMemorySize('2MB')).toBe(2 * 1024 * 1024);
      expect(parseMemorySize('0.5MB')).toBe(0.5 * 1024 * 1024);
    });

    it('should parse gigabyte values correctly', () => {
      expect(parseMemorySize('1GB')).toBe(1024 * 1024 * 1024);
      expect(parseMemorySize('1G')).toBe(1024 * 1024 * 1024);
      expect(parseMemorySize('2GB')).toBe(2 * 1024 * 1024 * 1024);
      expect(parseMemorySize('0.5GB')).toBe(0.5 * 1024 * 1024 * 1024);
    });

    it('should parse terabyte values correctly', () => {
      expect(parseMemorySize('1TB')).toBe(1024 * 1024 * 1024 * 1024);
      expect(parseMemorySize('1T')).toBe(1024 * 1024 * 1024 * 1024);
      expect(parseMemorySize('2TB')).toBe(2 * 1024 * 1024 * 1024 * 1024);
      expect(parseMemorySize('0.5TB')).toBe(0.5 * 1024 * 1024 * 1024 * 1024);
    });

    it('should parse plain byte values', () => {
      expect(parseMemorySize('1024')).toBe(1024);
      expect(parseMemorySize('500')).toBe(500);
    });

    it('should be case-insensitive for units', () => {
      expect(parseMemorySize('1kb')).toBe(1024);
      expect(parseMemorySize('1mb')).toBe(1024 * 1024);
      expect(parseMemorySize('1gb')).toBe(1024 * 1024 * 1024);
      expect(parseMemorySize('1tb')).toBe(1024 * 1024 * 1024 * 1024);
    });

    it('should handle whitespace in the input', () => {
      expect(parseMemorySize('1 KB')).toBe(1024);
      expect(parseMemorySize(' 1MB ')).toBe(1024 * 1024);
    });

    it('should throw error for invalid memory size format', () => {
      expect(() => parseMemorySize('')).toThrow();
      expect(() => parseMemorySize('invalid')).toThrow();
      expect(() => parseMemorySize('1XB')).toThrow(); // Invalid unit
      expect(() => parseMemorySize('KB')).toThrow(); // Missing amount
      expect(() => parseMemorySize(null as unknown as string)).toThrow();
      expect(() => parseMemorySize(undefined as unknown as string)).toThrow();
    });

    it('should include the invalid format in the error message', () => {
      try {
        parseMemorySize('invalid');
        fail('Expected parseMemorySize to throw an error');
      } catch (error) {
        expect((error as Error).message).toContain('invalid');
      }
    });
  });

  describe('transform', () => {
    it('should apply custom transformation function correctly', () => {
      const toUpperCase = (value: string) => value.toUpperCase();
      expect(transform('hello', toUpperCase)).toBe('HELLO');
      
      const toNumber = (value: string) => Number(value) * 2;
      expect(transform('5', toNumber)).toBe(10);
      
      const toBoolean = (value: string) => value === 'yes';
      expect(transform('yes', toBoolean)).toBe(true);
      expect(transform('no', toBoolean)).toBe(false);
    });

    it('should return default value when transformation fails and default is provided', () => {
      const failingTransform = () => { throw new Error('Transformation failed'); };
      expect(transform('value', failingTransform, 'default')).toBe('default');
      
      const numberTransform = (value: string) => {
        const num = Number(value);
        if (isNaN(num)) throw new Error('Not a number');
        return num;
      };
      expect(transform('not-a-number', numberTransform, 42)).toBe(42);
    });

    it('should throw error when transformation fails and no default is provided', () => {
      const failingTransform = () => { throw new Error('Transformation failed'); };
      expect(() => transform('value', failingTransform)).toThrow();
      
      const numberTransform = (value: string) => {
        const num = Number(value);
        if (isNaN(num)) throw new Error('Not a number');
        return num;
      };
      expect(() => transform('not-a-number', numberTransform)).toThrow();
    });

    it('should handle null or undefined input', () => {
      const toUpperCase = (value: string) => value.toUpperCase();
      expect(() => transform(null as unknown as string, toUpperCase)).toThrow();
      expect(() => transform(undefined as unknown as string, toUpperCase)).toThrow();
      expect(transform(null as unknown as string, toUpperCase, 'DEFAULT')).toBe('DEFAULT');
      expect(transform(undefined as unknown as string, toUpperCase, 'DEFAULT')).toBe('DEFAULT');
    });

    it('should include the error message from the transformation function', () => {
      const failingTransform = () => { throw new Error('Custom error message'); };
      try {
        transform('value', failingTransform);
        fail('Expected transform to throw an error');
      } catch (error) {
        expect((error as Error).message).toContain('Custom error message');
      }
    });

    it('should support generic type parameters', () => {
      const toArray = (value: string): string[] => value.split(',');
      const result = transform<string[]>('a,b,c', toArray);
      expect(result).toEqual(['a', 'b', 'c']);
      
      interface User { name: string; age: number }
      const toUser = (value: string): User => {
        const [name, ageStr] = value.split(',');
        return { name, age: Number(ageStr) };
      };
      const user = transform<User>('John,30', toUser);
      expect(user.name).toBe('John');
      expect(user.age).toBe(30);
    });
  });
});