import { describe, it, expect } from 'jest';
import { capitalizeFirstLetter, truncate } from '../../../src/string/formatting';

describe('String Formatting Utilities', () => {
  describe('capitalizeFirstLetter', () => {
    // Basic functionality tests
    it('should capitalize the first letter of a string', () => {
      expect(capitalizeFirstLetter('hello')).toBe('Hello');
      expect(capitalizeFirstLetter('world')).toBe('World');
      expect(capitalizeFirstLetter('test string')).toBe('Test string');
    });

    // Already capitalized strings
    it('should not change already capitalized strings', () => {
      expect(capitalizeFirstLetter('Hello')).toBe('Hello');
      expect(capitalizeFirstLetter('World')).toBe('World');
      expect(capitalizeFirstLetter('Test string')).toBe('Test string');
    });

    // Special characters and non-alphabetic first characters
    it('should handle strings with special characters or non-alphabetic first characters', () => {
      expect(capitalizeFirstLetter('123test')).toBe('123test');
      expect(capitalizeFirstLetter('!hello')).toBe('!hello');
      expect(capitalizeFirstLetter(' space first')).toBe(' space first');
      expect(capitalizeFirstLetter('_underscore')).toBe('_underscore');
    });

    // Unicode characters
    it('should properly capitalize unicode characters', () => {
      expect(capitalizeFirstLetter('água')).toBe('Água');
      expect(capitalizeFirstLetter('ñandu')).toBe('Ñandu');
      expect(capitalizeFirstLetter('über')).toBe('Über');
    });

    // Edge cases - empty strings, null, undefined
    it('should handle edge cases gracefully', () => {
      // Empty string
      expect(capitalizeFirstLetter('')).toBe('');
      
      // Single character
      expect(capitalizeFirstLetter('a')).toBe('A');
      expect(capitalizeFirstLetter('z')).toBe('Z');
      
      // Null and undefined handling
      expect(() => capitalizeFirstLetter(null as unknown as string)).not.toThrow();
      expect(() => capitalizeFirstLetter(undefined as unknown as string)).not.toThrow();
      expect(capitalizeFirstLetter(null as unknown as string)).toBe('');
      expect(capitalizeFirstLetter(undefined as unknown as string)).toBe('');
    });
  });

  describe('truncate', () => {
    // Basic functionality tests
    it('should truncate strings longer than the specified length', () => {
      expect(truncate('Hello world', 5)).toBe('Hello...');
      expect(truncate('This is a test string', 10)).toBe('This is a ...');
      expect(truncate('Short', 10)).toBe('Short');
    });

    // Edge cases - empty strings, null, undefined
    it('should handle edge cases gracefully', () => {
      // Empty string
      expect(truncate('', 5)).toBe('');
      
      // String shorter than max length
      expect(truncate('Short', 10)).toBe('Short');
      
      // String exactly at max length
      expect(truncate('Exactly10', 10)).toBe('Exactly10');
      
      // Very short max length
      expect(truncate('Hello', 1)).toBe('H...');
      expect(truncate('Hello', 0)).toBe('...');
      
      // Null and undefined handling
      expect(() => truncate(null as unknown as string, 5)).not.toThrow();
      expect(() => truncate(undefined as unknown as string, 5)).not.toThrow();
      expect(truncate(null as unknown as string, 5)).toBe('');
      expect(truncate(undefined as unknown as string, 5)).toBe('');
    });

    // Special cases
    it('should handle special cases correctly', () => {
      // Unicode characters
      expect(truncate('Café au lait', 6)).toBe('Café a...');
      
      // Strings with newlines
      expect(truncate('Line 1\nLine 2', 6)).toBe('Line 1...');
      
      // Strings with tabs
      expect(truncate('Tab\tCharacter', 5)).toBe('Tab\t...');
    });

    // Boundary conditions
    it('should handle boundary conditions correctly', () => {
      // Negative length (should be treated as 0)
      expect(truncate('Test', -5)).toBe('...');
      
      // Very large length
      const longString = 'a'.repeat(1000);
      expect(truncate(longString, 500)).toBe(longString.substring(0, 500) + '...');
      
      // Length equal to string length
      expect(truncate('Exactly', 7)).toBe('Exactly');
      
      // Length one less than string length
      expect(truncate('Exactly', 6)).toBe('Exactl...');
    });
  });
});