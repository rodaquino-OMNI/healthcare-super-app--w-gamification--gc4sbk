/**
 * Tests for the validation utilities barrel file exports.
 * These tests ensure that all validation functions are properly exported and accessible
 * through the central import point, maintaining a consistent public API and ensuring
 * module resolution works correctly across the monorepo.
 */

import * as validationModule from '../../../src/validation';
import defaultExport from '../../../src/validation';

describe('Validation Module Exports', () => {
  describe('Namespaced Exports', () => {
    it('should export the string validation namespace', () => {
      expect(validationModule.string).toBeDefined();
      expect(typeof validationModule.string).toBe('object');
      expect(validationModule.string.isValidCPF).toBeDefined();
      expect(validationModule.string.isValidEmail).toBeDefined();
      expect(validationModule.string.isValidUrl).toBeDefined();
      expect(validationModule.string.isValidStringLength).toBeDefined();
      expect(validationModule.string.isValidPattern).toBeDefined();
    });

    it('should export the date validation namespace', () => {
      expect(validationModule.date).toBeDefined();
      expect(typeof validationModule.date).toBe('object');
      expect(validationModule.date.isValidDate).toBeDefined();
      expect(validationModule.date.isDateInRange).toBeDefined();
      expect(validationModule.date.isFutureDate).toBeDefined();
      expect(validationModule.date.isPastDate).toBeDefined();
    });

    it('should export the number validation namespace', () => {
      expect(validationModule.number).toBeDefined();
      expect(typeof validationModule.number).toBe('object');
      expect(validationModule.number.isInRange).toBeDefined();
      expect(validationModule.number.isInteger).toBeDefined();
      expect(validationModule.number.isPositive).toBeDefined();
      expect(validationModule.number.isNegative).toBeDefined();
    });

    it('should export the object validation namespace', () => {
      expect(validationModule.object).toBeDefined();
      expect(typeof validationModule.object).toBe('object');
      expect(validationModule.object.hasRequiredProperties).toBeDefined();
      expect(validationModule.object.isValidType).toBeDefined();
    });

    it('should export the schema validation namespace', () => {
      expect(validationModule.schema).toBeDefined();
      expect(typeof validationModule.schema).toBe('object');
    });

    it('should export the common validation namespace', () => {
      expect(validationModule.common).toBeDefined();
      expect(typeof validationModule.common).toBe('object');
      expect(validationModule.common.isValidCNPJ).toBeDefined();
      expect(validationModule.common.isValidPhoneNumber).toBeDefined();
      expect(validationModule.common.isValidPostalCode).toBeDefined();
    });
  });

  describe('Type Definitions', () => {
    it('should export ValidationOptions interface', () => {
      // TypeScript interfaces are not available at runtime, so we can only check
      // that the type is being used in the module
      const options: validationModule.ValidationOptions = {
        throwOnError: true,
        errorMessage: 'Custom error message',
        context: { field: 'test' }
      };
      expect(options).toBeDefined();
    });

    it('should export ValidationResult interface', () => {
      const result: validationModule.ValidationResult = {
        success: true,
        data: { field: 'value' }
      };
      expect(result).toBeDefined();

      const errorResult: validationModule.ValidationResult = {
        success: false,
        errors: [{
          field: 'test',
          message: 'Error message',
          code: 'ERROR_CODE',
          context: { additionalInfo: 'test' }
        }]
      };
      expect(errorResult).toBeDefined();
    });

    it('should export ValidationError interface', () => {
      const error: validationModule.ValidationError = {
        field: 'test',
        message: 'Error message',
        code: 'ERROR_CODE',
        context: { additionalInfo: 'test' }
      };
      expect(error).toBeDefined();
    });
  });

  describe('Convenience Re-exports', () => {
    it('should re-export string validators', () => {
      expect(validationModule.isValidCPF).toBeDefined();
      expect(validationModule.isValidEmail).toBeDefined();
      expect(validationModule.isValidUrl).toBeDefined();
      expect(typeof validationModule.isValidCPF).toBe('function');
      expect(typeof validationModule.isValidEmail).toBe('function');
      expect(typeof validationModule.isValidUrl).toBe('function');
    });

    it('should re-export date validators', () => {
      expect(validationModule.isValidDate).toBeDefined();
      expect(validationModule.isDateInRange).toBeDefined();
      expect(validationModule.isFutureDate).toBeDefined();
      expect(validationModule.isPastDate).toBeDefined();
      expect(typeof validationModule.isValidDate).toBe('function');
      expect(typeof validationModule.isDateInRange).toBe('function');
      expect(typeof validationModule.isFutureDate).toBe('function');
      expect(typeof validationModule.isPastDate).toBe('function');
    });

    it('should re-export number validators', () => {
      expect(validationModule.isInRange).toBeDefined();
      expect(validationModule.isInteger).toBeDefined();
      expect(validationModule.isPositive).toBeDefined();
      expect(validationModule.isNegative).toBeDefined();
      expect(typeof validationModule.isInRange).toBe('function');
      expect(typeof validationModule.isInteger).toBe('function');
      expect(typeof validationModule.isPositive).toBe('function');
      expect(typeof validationModule.isNegative).toBe('function');
    });

    it('should re-export object validators', () => {
      expect(validationModule.hasRequiredProperties).toBeDefined();
      expect(validationModule.isValidType).toBeDefined();
      expect(typeof validationModule.hasRequiredProperties).toBe('function');
      expect(typeof validationModule.isValidType).toBe('function');
    });

    it('should re-export common validators', () => {
      expect(validationModule.isValidCNPJ).toBeDefined();
      expect(validationModule.isValidPhoneNumber).toBeDefined();
      expect(validationModule.isValidPostalCode).toBeDefined();
      expect(typeof validationModule.isValidCNPJ).toBe('function');
      expect(typeof validationModule.isValidPhoneNumber).toBe('function');
      expect(typeof validationModule.isValidPostalCode).toBe('function');
    });
  });

  describe('Default Export', () => {
    it('should provide a default export for backwards compatibility', () => {
      expect(defaultExport).toBeDefined();
      expect(typeof defaultExport).toBe('object');
    });

    it('should include all namespaced validators in the default export', () => {
      expect(defaultExport.string).toBeDefined();
      expect(defaultExport.date).toBeDefined();
      expect(defaultExport.number).toBeDefined();
      expect(defaultExport.object).toBeDefined();
      expect(defaultExport.schema).toBeDefined();
      expect(defaultExport.common).toBeDefined();
    });

    it('should have the same structure as the named exports', () => {
      expect(defaultExport.string).toBe(validationModule.string);
      expect(defaultExport.date).toBe(validationModule.date);
      expect(defaultExport.number).toBe(validationModule.number);
      expect(defaultExport.object).toBe(validationModule.object);
      expect(defaultExport.schema).toBe(validationModule.schema);
      expect(defaultExport.common).toBe(validationModule.common);
    });
  });

  describe('Import Patterns', () => {
    it('should support namespace imports', () => {
      // This test verifies that the module can be imported as a namespace
      // and all exports are accessible through that namespace
      expect(validationModule).toBeDefined();
      expect(validationModule.string).toBeDefined();
      expect(validationModule.date).toBeDefined();
      expect(validationModule.number).toBeDefined();
      expect(validationModule.object).toBeDefined();
      expect(validationModule.schema).toBeDefined();
      expect(validationModule.common).toBeDefined();
    });

    it('should support direct imports of convenience functions', () => {
      // In actual code, this would be:
      // import { isValidCPF, isValidEmail } from '@austa/utils/validation';
      const { isValidCPF, isValidEmail } = validationModule;
      expect(isValidCPF).toBeDefined();
      expect(isValidEmail).toBeDefined();
      expect(typeof isValidCPF).toBe('function');
      expect(typeof isValidEmail).toBe('function');
    });

    it('should support direct imports of namespaced validators', () => {
      // In actual code, this would be:
      // import { string, date } from '@austa/utils/validation';
      const { string, date } = validationModule;
      expect(string).toBeDefined();
      expect(date).toBeDefined();
      expect(string.isValidCPF).toBeDefined();
      expect(date.isValidDate).toBeDefined();
    });

    it('should support legacy default import pattern', () => {
      // In actual code, this would be:
      // import validation from '@austa/utils/validation';
      expect(defaultExport).toBeDefined();
      expect(defaultExport.string.isValidCPF).toBeDefined();
      expect(defaultExport.date.isValidDate).toBeDefined();
    });
  });

  describe('Module Resolution', () => {
    it('should maintain consistent function references across import patterns', () => {
      // Direct re-export should be the same function as the namespaced version
      expect(validationModule.isValidCPF).toBe(validationModule.string.isValidCPF);
      expect(validationModule.isValidEmail).toBe(validationModule.string.isValidEmail);
      expect(validationModule.isValidUrl).toBe(validationModule.string.isValidUrl);
      
      expect(validationModule.isValidDate).toBe(validationModule.date.isValidDate);
      expect(validationModule.isDateInRange).toBe(validationModule.date.isDateInRange);
      
      expect(validationModule.isInRange).toBe(validationModule.number.isInRange);
      expect(validationModule.isInteger).toBe(validationModule.number.isInteger);
      
      expect(validationModule.hasRequiredProperties).toBe(validationModule.object.hasRequiredProperties);
      expect(validationModule.isValidType).toBe(validationModule.object.isValidType);
      
      expect(validationModule.isValidCNPJ).toBe(validationModule.common.isValidCNPJ);
      expect(validationModule.isValidPhoneNumber).toBe(validationModule.common.isValidPhoneNumber);
    });

    it('should maintain consistent function references between named and default exports', () => {
      expect(defaultExport.string.isValidCPF).toBe(validationModule.string.isValidCPF);
      expect(defaultExport.date.isValidDate).toBe(validationModule.date.isValidDate);
      expect(defaultExport.number.isInRange).toBe(validationModule.number.isInRange);
      expect(defaultExport.object.hasRequiredProperties).toBe(validationModule.object.hasRequiredProperties);
      expect(defaultExport.common.isValidCNPJ).toBe(validationModule.common.isValidCNPJ);
    });
  });
});