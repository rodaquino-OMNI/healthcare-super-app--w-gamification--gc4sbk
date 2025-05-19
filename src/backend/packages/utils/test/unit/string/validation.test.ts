import { isValidCPF } from '@austa/utils/string';

/**
 * Test suite for Brazilian CPF validation functionality.
 * These tests ensure the correct implementation of the official modulus-11 algorithm
 * for CPF validation, which is critical for all Brazilian user identity verification
 * across the platform's journey services.
 */
describe('CPF Validation', () => {
  describe('Valid CPF numbers', () => {
    test('should validate a correctly formatted CPF with punctuation', () => {
      expect(isValidCPF('529.982.247-25')).toBe(true);
    });

    test('should validate a correctly formatted CPF without punctuation', () => {
      expect(isValidCPF('52998224725')).toBe(true);
    });

    test('should validate multiple known valid CPFs', () => {
      const validCPFs = [
        '111.444.777-35',
        '11144477735',
        '048.067.200-46',
        '04806720046',
        '798.023.690-57',
        '79802369057',
      ];

      validCPFs.forEach(cpf => {
        expect(isValidCPF(cpf)).toBe(true);
      });
    });
  });

  describe('Invalid CPF numbers', () => {
    test('should reject CPFs with incorrect check digits', () => {
      // These CPFs have the correct format but wrong check digits
      const invalidCheckDigitCPFs = [
        '529.982.247-26', // Last digit changed
        '529.982.247-15', // Second-to-last digit changed
        '529.982.247-00', // Both check digits changed
      ];

      invalidCheckDigitCPFs.forEach(cpf => {
        expect(isValidCPF(cpf)).toBe(false);
      });
    });

    test('should reject CPFs with all repeated digits', () => {
      const repeatedDigitCPFs = [
        '000.000.000-00',
        '111.111.111-11',
        '222.222.222-22',
        '333.333.333-33',
        '444.444.444-44',
        '555.555.555-55',
        '666.666.666-66',
        '777.777.777-77',
        '888.888.888-88',
        '999.999.999-99',
      ];

      repeatedDigitCPFs.forEach(cpf => {
        expect(isValidCPF(cpf)).toBe(false);
      });
    });

    test('should reject CPFs with incorrect length', () => {
      const incorrectLengthCPFs = [
        '529.982.247-2', // Too short
        '529.982.247-255', // Too long
        '529.982.24-25', // Missing digit
        '5299822472', // Only 10 digits
        '529982247256', // 12 digits
        '', // Empty string
      ];

      incorrectLengthCPFs.forEach(cpf => {
        expect(isValidCPF(cpf)).toBe(false);
      });
    });

    test('should reject CPFs with invalid characters', () => {
      const invalidCharacterCPFs = [
        '529.982.24A-25', // Contains a letter
        '529.982.24*-25', // Contains a special character
        '529,982,247-25', // Uses commas instead of periods
        '529.982.247.25', // Uses period instead of hyphen
        '529 982 247 25', // Uses spaces
      ];

      invalidCharacterCPFs.forEach(cpf => {
        expect(isValidCPF(cpf)).toBe(false);
      });
    });

    test('should reject null or undefined values', () => {
      // @ts-expect-error Testing invalid input
      expect(isValidCPF(null)).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(isValidCPF(undefined)).toBe(false);
    });

    test('should reject non-string inputs', () => {
      // @ts-expect-error Testing invalid input type
      expect(isValidCPF(12345678901)).toBe(false);
      // @ts-expect-error Testing invalid input type
      expect(isValidCPF({})).toBe(false);
      // @ts-expect-error Testing invalid input type
      expect(isValidCPF([])).toBe(false);
    });
  });

  describe('Edge cases', () => {
    test('should handle CPFs with extra whitespace', () => {
      expect(isValidCPF(' 529.982.247-25 ')).toBe(true);
      expect(isValidCPF('\t529.982.247-25\n')).toBe(true);
    });

    test('should handle CPFs with mixed formatting', () => {
      expect(isValidCPF('529982.247-25')).toBe(true);
      expect(isValidCPF('529.982247-25')).toBe(true);
      expect(isValidCPF('529.982.24725')).toBe(true);
    });
  });
});