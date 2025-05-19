import { capitalizeFirstLetter, truncate } from '@austa/utils/string';

/**
 * Test suite for string formatting utilities.
 * These tests verify that the formatting utilities properly handle various edge cases
 * including empty strings, special characters, and boundary conditions, which is
 * essential to maintain consistent text presentation across all platform components.
 */
describe('String Formatting Utilities', () => {
  describe('capitalizeFirstLetter', () => {
    describe('Normal operation', () => {
      test('should capitalize the first letter of a lowercase string', () => {
        expect(capitalizeFirstLetter('hello')).toBe('Hello');
      });

      test('should not change strings that already start with a capital letter', () => {
        expect(capitalizeFirstLetter('Hello')).toBe('Hello');
      });

      test('should handle single character strings', () => {
        expect(capitalizeFirstLetter('a')).toBe('A');
      });

      test('should not affect other characters in the string', () => {
        expect(capitalizeFirstLetter('hello world')).toBe('Hello world');
      });

      test('should handle strings with mixed case', () => {
        expect(capitalizeFirstLetter('hELLO')).toBe('HELLO');
      });
    });

    describe('Special characters and non-alphabetic content', () => {
      test('should handle strings starting with numbers', () => {
        expect(capitalizeFirstLetter('123abc')).toBe('123abc');
      });

      test('should handle strings starting with special characters', () => {
        expect(capitalizeFirstLetter('!hello')).toBe('!hello');
      });

      test('should handle strings with Unicode characters', () => {
        expect(capitalizeFirstLetter('água')).toBe('Água');
        expect(capitalizeFirstLetter('café')).toBe('Café');
        expect(capitalizeFirstLetter('über')).toBe('Über');
      });
    });

    describe('Edge cases', () => {
      test('should return empty string for empty input', () => {
        expect(capitalizeFirstLetter('')).toBe('');
      });

      test('should handle null and undefined gracefully', () => {
        // @ts-expect-error Testing invalid input
        expect(capitalizeFirstLetter(null)).toBe('');
        // @ts-expect-error Testing invalid input
        expect(capitalizeFirstLetter(undefined)).toBe('');
      });

      test('should handle non-string inputs', () => {
        // @ts-expect-error Testing invalid input type
        expect(capitalizeFirstLetter(123)).toBe('');
        // @ts-expect-error Testing invalid input type
        expect(capitalizeFirstLetter({})).toBe('');
        // @ts-expect-error Testing invalid input type
        expect(capitalizeFirstLetter([])).toBe('');
      });
    });
  });

  describe('truncate', () => {
    describe('Normal operation', () => {
      test('should not modify strings shorter than the limit', () => {
        expect(truncate('Hello', 10)).toBe('Hello');
      });

      test('should not modify strings exactly at the limit', () => {
        expect(truncate('Hello', 5)).toBe('Hello');
      });

      test('should truncate strings longer than the limit and add ellipsis', () => {
        expect(truncate('Hello world', 5)).toBe('Hello...');
      });

      test('should count the limit correctly', () => {
        expect(truncate('abcdefghij', 5)).toBe('abcde...');
        expect(truncate('abcdefghij', 7)).toBe('abcdefg...');
      });
    });

    describe('Edge cases', () => {
      test('should handle empty strings', () => {
        expect(truncate('', 5)).toBe('');
      });

      test('should handle null and undefined gracefully', () => {
        // @ts-expect-error Testing invalid input
        expect(truncate(null, 5)).toBe('');
        // @ts-expect-error Testing invalid input
        expect(truncate(undefined, 5)).toBe('');
      });

      test('should handle very short max lengths', () => {
        expect(truncate('Hello', 1)).toBe('H...');
        expect(truncate('Hello', 0)).toBe('...');
      });

      test('should handle negative max lengths as zero', () => {
        expect(truncate('Hello', -5)).toBe('...');
      });

      test('should handle non-string inputs', () => {
        // @ts-expect-error Testing invalid input type
        expect(truncate(123, 5)).toBe('');
        // @ts-expect-error Testing invalid input type
        expect(truncate({}, 5)).toBe('');
        // @ts-expect-error Testing invalid input type
        expect(truncate([], 5)).toBe('');
      });

      test('should handle non-numeric length inputs', () => {
        // @ts-expect-error Testing invalid input type
        expect(truncate('Hello', '5')).toBe('Hello');
        // @ts-expect-error Testing invalid input type
        expect(truncate('Hello', null)).toBe('Hello');
        // @ts-expect-error Testing invalid input type
        expect(truncate('Hello', undefined)).toBe('Hello');
      });
    });

    describe('Special formatting cases', () => {
      test('should handle strings with Unicode characters', () => {
        expect(truncate('café au lait', 4)).toBe('café...');
        expect(truncate('über alles', 4)).toBe('über...');
      });

      test('should handle strings with HTML entities', () => {
        expect(truncate('&lt;div&gt;Hello&lt;/div&gt;', 10)).toBe('&lt;div&gt;Hello...');
      });

      test('should handle strings with emojis', () => {
        expect(truncate('Hello 👋 world', 8)).toBe('Hello 👋...');
      });
    });
  });
});