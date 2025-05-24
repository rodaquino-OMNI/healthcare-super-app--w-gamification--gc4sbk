import { describe, it, expect } from 'jest';
import { isValidCPF } from '../../../src/string/validation';

describe('String Validation Utilities', () => {
  describe('isValidCPF', () => {
    // Valid CPF test cases
    it('should validate correctly formatted CPF numbers', () => {
      // Valid CPF with formatting
      expect(isValidCPF('529.982.247-25')).toBe(true);
      
      // Valid CPF without formatting
      expect(isValidCPF('52998224725')).toBe(true);
      
      // Another valid CPF with formatting
      expect(isValidCPF('111.444.777-35')).toBe(true);
    });

    // Invalid CPF test cases - repeated digits
    it('should reject CPFs with all repeated digits', () => {
      expect(isValidCPF('000.000.000-00')).toBe(false);
      expect(isValidCPF('111.111.111-11')).toBe(false);
      expect(isValidCPF('222.222.222-22')).toBe(false);
      expect(isValidCPF('333.333.333-33')).toBe(false);
      expect(isValidCPF('444.444.444-44')).toBe(false);
      expect(isValidCPF('555.555.555-55')).toBe(false);
      expect(isValidCPF('666.666.666-66')).toBe(false);
      expect(isValidCPF('777.777.777-77')).toBe(false);
      expect(isValidCPF('888.888.888-88')).toBe(false);
      expect(isValidCPF('999.999.999-99')).toBe(false);
    });

    // Invalid CPF test cases - wrong check digits
    it('should reject CPFs with incorrect check digits', () => {
      // Valid base but wrong check digits
      expect(isValidCPF('529.982.247-00')).toBe(false);
      expect(isValidCPF('529.982.247-01')).toBe(false);
      expect(isValidCPF('529.982.247-99')).toBe(false);
      
      // Random invalid CPF
      expect(isValidCPF('123.456.789-10')).toBe(false);
    });

    // Invalid CPF test cases - wrong length
    it('should reject CPFs with incorrect length', () => {
      // Too short
      expect(isValidCPF('123')).toBe(false);
      expect(isValidCPF('1234567890')).toBe(false); // 10 digits
      
      // Too long
      expect(isValidCPF('123456789012')).toBe(false); // 12 digits
      expect(isValidCPF('529.982.247-255')).toBe(false);
    });

    // Invalid CPF test cases - malformed input
    it('should handle malformed input gracefully', () => {
      // Non-numeric characters (besides formatting)
      expect(isValidCPF('529.98A.247-25')).toBe(false);
      expect(isValidCPF('CPF:529.982.247-25')).toBe(false);
      
      // Incorrect formatting but valid digits
      expect(isValidCPF('529-982-247.25')).toBe(true); // Should still pass as digits are valid
      expect(isValidCPF('529 982 247 25')).toBe(true); // Should still pass as digits are valid
    });

    // Edge cases
    it('should handle edge cases appropriately', () => {
      // Empty string
      expect(isValidCPF('')).toBe(false);
      
      // Whitespace only
      expect(isValidCPF('   ')).toBe(false);
      
      // Mixed whitespace and digits but valid when cleaned
      expect(isValidCPF(' 529 982 247 25 ')).toBe(true);
      
      // Valid CPF with extra whitespace
      expect(isValidCPF(' 529.982.247-25 ')).toBe(true);
    });

    // Test specific algorithm implementation details
    it('should correctly implement the modulus-11 algorithm', () => {
      // CPF where first check digit calculation would be > 9 (should become 0)
      expect(isValidCPF('198.454.157-08')).toBe(true);
      
      // CPF where second check digit calculation would be > 9 (should become 0)
      expect(isValidCPF('798.688.147-03')).toBe(true);
    });
  });
});