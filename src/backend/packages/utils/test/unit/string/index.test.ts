import { describe, it, expect } from 'jest';

// Import all exports from the barrel file
import * as StringUtils from '../../../src/string';

// Import individual modules to compare exports
import * as StringFormatting from '../../../src/string/formatting';
import * as StringValidation from '../../../src/string/validation';

describe('String Utils Barrel Exports', () => {
  it('should export all formatting utilities', () => {
    // Check that all formatting functions are exported
    expect(StringUtils.capitalizeFirstLetter).toBeDefined();
    expect(StringUtils.truncate).toBeDefined();
    
    // Verify that the exported functions match the original implementations
    expect(StringUtils.capitalizeFirstLetter).toBe(StringFormatting.capitalizeFirstLetter);
    expect(StringUtils.truncate).toBe(StringFormatting.truncate);
  });

  it('should export all validation utilities', () => {
    // Check that all validation functions are exported
    expect(StringUtils.isValidCPF).toBeDefined();
    
    // Verify that the exported functions match the original implementations
    expect(StringUtils.isValidCPF).toBe(StringValidation.isValidCPF);
  });

  it('should maintain correct function signatures for formatting utilities', () => {
    // Test capitalizeFirstLetter function signature and behavior
    expect(typeof StringUtils.capitalizeFirstLetter).toBe('function');
    expect(StringUtils.capitalizeFirstLetter('hello')).toBe('Hello');
    expect(StringUtils.capitalizeFirstLetter('')).toBe('');
    
    // Test truncate function signature and behavior
    expect(typeof StringUtils.truncate).toBe('function');
    expect(StringUtils.truncate('hello world', 5)).toBe('hello...');
    expect(StringUtils.truncate('hello', 10)).toBe('hello');
  });

  it('should maintain correct function signatures for validation utilities', () => {
    // Test isValidCPF function signature and behavior
    expect(typeof StringUtils.isValidCPF).toBe('function');
    
    // Valid CPF test
    expect(StringUtils.isValidCPF('529.982.247-25')).toBe(true);
    
    // Invalid CPF tests
    expect(StringUtils.isValidCPF('111.111.111-11')).toBe(false); // All same digits
    expect(StringUtils.isValidCPF('123.456.789-10')).toBe(false); // Invalid check digits
    expect(StringUtils.isValidCPF('123')).toBe(false); // Too short
  });

  it('should support named imports for better tree-shaking', () => {
    // Destructure the exports to verify named imports work correctly
    const { capitalizeFirstLetter, truncate, isValidCPF } = StringUtils;
    
    // Verify the destructured functions work correctly
    expect(capitalizeFirstLetter('test')).toBe('Test');
    expect(truncate('long text', 4)).toBe('long...');
    expect(isValidCPF('529.982.247-25')).toBe(true);
  });
});