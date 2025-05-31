/**
 * Test suite for the validation utilities barrel file exports.
 * This ensures that all validation functions are properly exported and accessible
 * through the central import point, maintaining a consistent public API.
 */

import { describe, expect, it } from '@jest/globals';

// Import the entire validation module to test the barrel file exports
import * as validation from '../../../src/validation';

// Import specific validators to test direct exports
import { string, number, date, object, common, schema } from '../../../src/validation';

describe('Validation Barrel File Exports', () => {
  describe('Module Structure', () => {
    it('should export all validator namespaces', () => {
      // Test that all expected namespaces are exported
      expect(validation.string).toBeDefined();
      expect(validation.number).toBeDefined();
      expect(validation.date).toBeDefined();
      expect(validation.object).toBeDefined();
      expect(validation.common).toBeDefined();
      expect(validation.schema).toBeDefined();
    });

    it('should maintain proper types for all exports', () => {
      // Test that exports are objects (namespaces)
      expect(typeof validation.string).toBe('object');
      expect(typeof validation.number).toBe('object');
      expect(typeof validation.date).toBe('object');
      expect(typeof validation.object).toBe('object');
      expect(typeof validation.common).toBe('object');
      expect(typeof validation.schema).toBe('object');
    });
  });

  describe('String Validators', () => {
    it('should export all string validators', () => {
      // Test that all expected string validators are exported
      expect(validation.string.isValidCPF).toBeDefined();
      expect(typeof validation.string.isValidCPF).toBe('function');
      
      // Test direct import works the same way
      expect(string.isValidCPF).toBeDefined();
      expect(typeof string.isValidCPF).toBe('function');
      
      // Test other expected string validators
      expect(string.isValidEmail).toBeDefined();
      expect(string.isValidURL).toBeDefined();
      expect(string.hasValidLength).toBeDefined();
      expect(string.matchesPattern).toBeDefined();
    });
  });

  describe('Number Validators', () => {
    it('should export all number validators', () => {
      // Test that all expected number validators are exported
      expect(validation.number.isInRange).toBeDefined();
      expect(typeof validation.number.isInRange).toBe('function');
      
      // Test direct import works the same way
      expect(number.isInRange).toBeDefined();
      expect(typeof number.isInRange).toBe('function');
      
      // Test other expected number validators
      expect(number.isInteger).toBeDefined();
      expect(number.isPositive).toBeDefined();
      expect(number.isNegative).toBeDefined();
      expect(number.isValidBrazilianCurrency).toBeDefined();
    });
  });

  describe('Date Validators', () => {
    it('should export all date validators', () => {
      // Test that all expected date validators are exported
      expect(validation.date.isValidDate).toBeDefined();
      expect(typeof validation.date.isValidDate).toBe('function');
      
      // Test direct import works the same way
      expect(date.isValidDate).toBeDefined();
      expect(typeof date.isValidDate).toBe('function');
      
      // Test other expected date validators
      expect(date.isDateInRange).toBeDefined();
      expect(date.isFutureDate).toBeDefined();
      expect(date.isPastDate).toBeDefined();
      expect(date.isBusinessDay).toBeDefined();
    });
  });

  describe('Object Validators', () => {
    it('should export all object validators', () => {
      // Test that all expected object validators are exported
      expect(validation.object.hasRequiredProperties).toBeDefined();
      expect(typeof validation.object.hasRequiredProperties).toBe('function');
      
      // Test direct import works the same way
      expect(object.hasRequiredProperties).toBeDefined();
      expect(typeof object.hasRequiredProperties).toBe('function');
      
      // Test other expected object validators
      expect(object.hasValidNestedProperty).toBeDefined();
      expect(object.isOfType).toBeDefined();
      expect(object.hasValidArrayProperty).toBeDefined();
      expect(object.hasValidStructure).toBeDefined();
    });
  });

  describe('Common Validators', () => {
    it('should export all common validators', () => {
      // Test that all expected common validators are exported
      expect(validation.common.isValidCNPJ).toBeDefined();
      expect(typeof validation.common.isValidCNPJ).toBe('function');
      
      // Test direct import works the same way
      expect(common.isValidCNPJ).toBeDefined();
      expect(typeof common.isValidCNPJ).toBe('function');
      
      // Test other expected common validators
      expect(common.isValidRG).toBeDefined();
      expect(common.isValidPhoneNumber).toBeDefined();
      expect(common.isValidPostalCode).toBeDefined();
      expect(common.combineValidators).toBeDefined();
    });
  });

  describe('Schema Validators', () => {
    it('should export all schema validators', () => {
      // Test that all expected schema validators are exported
      expect(validation.schema.createZodSchema).toBeDefined();
      expect(typeof validation.schema.createZodSchema).toBe('function');
      
      // Test direct import works the same way
      expect(schema.createZodSchema).toBeDefined();
      expect(typeof schema.createZodSchema).toBe('function');
      
      // Test other expected schema validators
      expect(schema.zodToClassValidator).toBeDefined();
      expect(schema.validateWithZod).toBeDefined();
      expect(schema.transformValidationErrors).toBeDefined();
    });
  });

  describe('Legacy Import Compatibility', () => {
    it('should support legacy import patterns', () => {
      // Test that the module can be imported as a whole
      expect(validation).toBeDefined();
      expect(typeof validation).toBe('object');
      
      // Test that individual validators can be accessed through the module
      expect(validation.string.isValidCPF).toBeDefined();
      expect(validation.number.isInRange).toBeDefined();
      expect(validation.date.isValidDate).toBeDefined();
      expect(validation.object.hasRequiredProperties).toBeDefined();
      expect(validation.common.isValidCNPJ).toBeDefined();
      expect(validation.schema.createZodSchema).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should maintain proper function signatures', () => {
      // Test CPF validator signature by calling it with a valid CPF
      const validCPF = '123.456.789-09'; // Example CPF format
      const invalidCPF = 'not-a-cpf';
      
      // We're not testing the actual implementation, just that the function exists and returns a boolean
      expect(typeof string.isValidCPF(validCPF)).toBe('boolean');
      expect(typeof string.isValidCPF(invalidCPF)).toBe('boolean');
      
      // Test number range validator signature
      const num = 5;
      const min = 1;
      const max = 10;
      
      // We're not testing the actual implementation, just that the function exists and returns a boolean
      expect(typeof number.isInRange(num, min, max)).toBe('boolean');
    });
  });
});