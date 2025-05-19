/**
 * @file Tests for string utility barrel exports
 * @description Verifies that all string utility functions are properly exported from the barrel file
 * and that they maintain the correct types and functionality.
 */

import { expect } from 'chai';

// Import all exports from the barrel file
import * as StringUtils from '../../../src/string';

// Import specific functions to verify they're correctly exported
import {
  capitalizeFirstLetter,
  truncate,
  isValidCPF,
  isValidCNPJ,
  isValidCEP,
  isValidBrazilianPhone,
  formatCPF,
  formatCNPJ,
  formatCEP,
  ValidationResult
} from '../../../src/string';

// Import from specific categories to verify sub-module exports
import * as FormattingUtils from '../../../src/string/formatting';
import * as ValidationUtils from '../../../src/string/validation';

describe('String Utilities Barrel Exports', () => {
  describe('Main barrel file exports', () => {
    it('should export all string utility functions', () => {
      // Check that all expected functions are exported
      expect(StringUtils).to.have.property('capitalizeFirstLetter').that.is.a('function');
      expect(StringUtils).to.have.property('truncate').that.is.a('function');
      expect(StringUtils).to.have.property('isValidCPF').that.is.a('function');
      expect(StringUtils).to.have.property('isValidCNPJ').that.is.a('function');
      expect(StringUtils).to.have.property('isValidCEP').that.is.a('function');
      expect(StringUtils).to.have.property('isValidBrazilianPhone').that.is.a('function');
      expect(StringUtils).to.have.property('formatCPF').that.is.a('function');
      expect(StringUtils).to.have.property('formatCNPJ').that.is.a('function');
      expect(StringUtils).to.have.property('formatCEP').that.is.a('function');
    });

    it('should export the ValidationResult type', () => {
      // Create a validation result object to verify the type works correctly
      const validResult: ValidationResult = { valid: true };
      const invalidResult: ValidationResult = { valid: false, error: 'Test error' };
      const booleanResult: ValidationResult = true;

      expect(validResult.valid).to.be.true;
      expect(invalidResult.valid).to.be.false;
      expect(invalidResult.error).to.equal('Test error');
      expect(booleanResult).to.be.true;
    });
  });

  describe('Named exports', () => {
    it('should correctly export formatting functions with proper types', () => {
      // Verify capitalizeFirstLetter function
      expect(capitalizeFirstLetter).to.be.a('function');
      expect(capitalizeFirstLetter('test')).to.equal('Test');
      expect(capitalizeFirstLetter('')).to.equal('');

      // Verify truncate function
      expect(truncate).to.be.a('function');
      expect(truncate('This is a test', 7)).to.equal('This is...');
      expect(truncate('Short', 10)).to.equal('Short');
    });

    it('should correctly export validation functions with proper types', () => {
      // Verify isValidCPF function
      expect(isValidCPF).to.be.a('function');
      expect(isValidCPF('111.111.111-11')).to.be.false;
      
      // Verify isValidCNPJ function
      expect(isValidCNPJ).to.be.a('function');
      expect(isValidCNPJ('11.111.111/1111-11')).to.be.false;
      
      // Verify isValidCEP function
      expect(isValidCEP).to.be.a('function');
      expect(isValidCEP('12345-678')).to.be.true;
      
      // Verify isValidBrazilianPhone function
      expect(isValidBrazilianPhone).to.be.a('function');
      expect(isValidBrazilianPhone('(11) 98765-4321')).to.be.true;
      
      // Verify formatting functions
      expect(formatCPF).to.be.a('function');
      expect(formatCPF('12345678909')).to.equal('123.456.789-09');
      
      expect(formatCNPJ).to.be.a('function');
      expect(formatCNPJ('12345678000195')).to.equal('12.345.678/0001-95');
      
      expect(formatCEP).to.be.a('function');
      expect(formatCEP('12345678')).to.equal('12345-678');
    });
  });

  describe('Sub-module exports', () => {
    it('should correctly export all formatting functions from the formatting module', () => {
      // Verify all formatting functions are exported from the formatting module
      expect(FormattingUtils).to.have.property('capitalizeFirstLetter').that.is.a('function');
      expect(FormattingUtils).to.have.property('truncate').that.is.a('function');
      
      // Verify the functions from the sub-module match the barrel exports
      expect(FormattingUtils.capitalizeFirstLetter).to.equal(StringUtils.capitalizeFirstLetter);
      expect(FormattingUtils.truncate).to.equal(StringUtils.truncate);
    });

    it('should correctly export all validation functions from the validation module', () => {
      // Verify all validation functions are exported from the validation module
      expect(ValidationUtils).to.have.property('isValidCPF').that.is.a('function');
      expect(ValidationUtils).to.have.property('isValidCNPJ').that.is.a('function');
      expect(ValidationUtils).to.have.property('isValidCEP').that.is.a('function');
      expect(ValidationUtils).to.have.property('isValidBrazilianPhone').that.is.a('function');
      expect(ValidationUtils).to.have.property('formatCPF').that.is.a('function');
      expect(ValidationUtils).to.have.property('formatCNPJ').that.is.a('function');
      expect(ValidationUtils).to.have.property('formatCEP').that.is.a('function');
      
      // Verify the functions from the sub-module match the barrel exports
      expect(ValidationUtils.isValidCPF).to.equal(StringUtils.isValidCPF);
      expect(ValidationUtils.isValidCNPJ).to.equal(StringUtils.isValidCNPJ);
      expect(ValidationUtils.isValidCEP).to.equal(StringUtils.isValidCEP);
      expect(ValidationUtils.isValidBrazilianPhone).to.equal(StringUtils.isValidBrazilianPhone);
      expect(ValidationUtils.formatCPF).to.equal(StringUtils.formatCPF);
      expect(ValidationUtils.formatCNPJ).to.equal(StringUtils.formatCNPJ);
      expect(ValidationUtils.formatCEP).to.equal(StringUtils.formatCEP);
    });
  });

  describe('Backward compatibility', () => {
    it('should maintain compatibility with legacy import patterns', () => {
      // In the old structure, functions were imported directly from the utils module
      // We need to verify that the new structure maintains compatibility
      
      // Test a sample of functions to verify they work the same way
      expect(capitalizeFirstLetter('hello')).to.equal('Hello');
      expect(isValidCPF('111.111.111-11')).to.be.false;
      
      // Verify detailed validation results still work
      const cpfResult = isValidCPF('111.111.111-11', true) as { valid: boolean; error?: string };
      expect(cpfResult).to.be.an('object');
      expect(cpfResult.valid).to.be.false;
      expect(cpfResult).to.have.property('error').that.is.a('string');
    });
  });
});