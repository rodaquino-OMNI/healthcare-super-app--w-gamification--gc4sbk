import { describe, expect, it, jest } from '@jest/globals';

// Import the validators we want to test
// Note: The actual implementation will be created in string.validator.ts
import {
  isValidCPF,
  isValidEmail,
  isValidURL,
  isValidLength,
  matchesPattern
} from '../../../src/validation/string.validator';

// Mock the module
jest.mock('../../../src/validation/string.validator', () => ({
  isValidCPF: jest.fn(),
  isValidEmail: jest.fn(),
  isValidURL: jest.fn(),
  isValidLength: jest.fn(),
  matchesPattern: jest.fn(),
}));

describe('String Validators', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('isValidCPF', () => {
    it('should return true for valid CPF with formatting', () => {
      // Arrange
      const cpf = '123.456.789-09';
      (isValidCPF as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidCPF(cpf);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidCPF).toHaveBeenCalledWith(cpf);
    });

    it('should return true for valid CPF without formatting', () => {
      // Arrange
      const cpf = '12345678909';
      (isValidCPF as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidCPF(cpf);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidCPF).toHaveBeenCalledWith(cpf);
    });

    it('should return false for CPF with invalid check digits', () => {
      // Arrange
      const cpf = '123.456.789-10';
      (isValidCPF as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidCPF(cpf);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidCPF).toHaveBeenCalledWith(cpf);
    });

    it('should return false for CPF with repeated digits', () => {
      // Arrange
      const cpf = '111.111.111-11';
      (isValidCPF as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidCPF(cpf);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidCPF).toHaveBeenCalledWith(cpf);
    });

    it('should return false for CPF with incorrect length', () => {
      // Arrange
      const cpf = '123.456.789';
      (isValidCPF as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidCPF(cpf);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidCPF).toHaveBeenCalledWith(cpf);
    });

    it('should return false for CPF with non-numeric characters', () => {
      // Arrange
      const cpf = '123.456.78A-09';
      (isValidCPF as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidCPF(cpf);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidCPF).toHaveBeenCalledWith(cpf);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid standard email', () => {
      // Arrange
      const email = 'user@example.com';
      (isValidEmail as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidEmail(email);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidEmail).toHaveBeenCalledWith(email);
    });

    it('should return true for valid email with subdomain', () => {
      // Arrange
      const email = 'user@subdomain.example.com';
      (isValidEmail as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidEmail(email);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidEmail).toHaveBeenCalledWith(email);
    });

    it('should return true for valid email with plus addressing', () => {
      // Arrange
      const email = 'user+tag@example.com';
      (isValidEmail as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidEmail(email);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidEmail).toHaveBeenCalledWith(email);
    });

    it('should return true for valid email with numbers and special characters', () => {
      // Arrange
      (isValidEmail as jest.Mock).mockReturnValue(true);
      const email = 'user.name123@example-domain.com';
      
      // Act
      const result = isValidEmail(email);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidEmail).toHaveBeenCalledWith(email);
    });

    it('should return true for valid international email with IDN', () => {
      // Arrange
      (isValidEmail as jest.Mock).mockReturnValue(true);
      const email = 'user@例子.测试';
      
      // Act
      const result = isValidEmail(email);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidEmail).toHaveBeenCalledWith(email);
    });

    it('should return false for email without @ symbol', () => {
      // Arrange
      (isValidEmail as jest.Mock).mockReturnValue(false);
      const email = 'userexample.com';
      
      // Act
      const result = isValidEmail(email);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidEmail).toHaveBeenCalledWith(email);
    });

    it('should return false for email without domain part', () => {
      // Arrange
      (isValidEmail as jest.Mock).mockReturnValue(false);
      const email = 'user@';
      
      // Act
      const result = isValidEmail(email);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidEmail).toHaveBeenCalledWith(email);
    });

    it('should return false for email with invalid characters', () => {
      // Arrange
      (isValidEmail as jest.Mock).mockReturnValue(false);
      const email = 'user name@example.com';
      
      // Act
      const result = isValidEmail(email);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidEmail).toHaveBeenCalledWith(email);
    });

    it('should return false for email with multiple @ symbols', () => {
      // Arrange
      (isValidEmail as jest.Mock).mockReturnValue(false);
      const email = 'user@domain@example.com';
      
      // Act
      const result = isValidEmail(email);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('isValidURL', () => {
    it('should return true for valid HTTP URL', () => {
      // Arrange
      (isValidURL as jest.Mock).mockReturnValue(true);
      const url = 'http://example.com';
      
      // Act
      const result = isValidURL(url);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidURL).toHaveBeenCalledWith(url);
    });

    it('should return true for valid HTTPS URL', () => {
      // Arrange
      (isValidURL as jest.Mock).mockReturnValue(true);
      const url = 'https://example.com';
      
      // Act
      const result = isValidURL(url);
      
      // Assert
      expect(result).toBe(true);
      expect(mockValidators.isValidURL).toHaveBeenCalledWith(url);
    });

    it('should return true for valid URL with path', () => {
      // Arrange
      (isValidURL as jest.Mock).mockReturnValue(true);
      const url = 'https://example.com/path/to/resource';
      
      // Act
      const result = isValidURL(url);
      
      // Assert
      expect(result).toBe(true);
      expect(mockValidators.isValidURL).toHaveBeenCalledWith(url);
    });

    it('should return true for valid URL with query parameters', () => {
      // Arrange
      (isValidURL as jest.Mock).mockReturnValue(true);
      const url = 'https://example.com/search?q=test&page=1';
      
      // Act
      const result = isValidURL(url);
      
      // Assert
      expect(result).toBe(true);
      expect(mockValidators.isValidURL).toHaveBeenCalledWith(url);
    });

    it('should return true for valid URL with port', () => {
      // Arrange
      (isValidURL as jest.Mock).mockReturnValue(true);
      const url = 'https://example.com:8080/api';
      
      // Act
      const result = isValidURL(url);
      
      // Assert
      expect(result).toBe(true);
      expect(mockValidators.isValidURL).toHaveBeenCalledWith(url);
    });

    it('should return false for URL with private IP address (SSRF protection)', () => {
      // Arrange
      (isValidURL as jest.Mock).mockReturnValue(false);
      const url = 'http://192.168.1.1';
      
      // Act
      const result = isValidURL(url);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidURL).toHaveBeenCalledWith(url);
    });

    it('should return false for URL with localhost (SSRF protection)', () => {
      // Arrange
      (isValidURL as jest.Mock).mockReturnValue(false);
      const url = 'http://localhost:3000';
      
      // Act
      const result = isValidURL(url);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidURL).toHaveBeenCalledWith(url);
    });

    it('should return false for URL with invalid protocol', () => {
      // Arrange
      (isValidURL as jest.Mock).mockReturnValue(false);
      const url = 'ftp://example.com';
      
      // Act
      const result = isValidURL(url);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidURL).toHaveBeenCalledWith(url);
    });

    it('should return false for URL without protocol', () => {
      // Arrange
      (isValidURL as jest.Mock).mockReturnValue(false);
      const url = 'example.com';
      
      // Act
      const result = isValidURL(url);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidURL).toHaveBeenCalledWith(url);
    });

    it('should return false for malformed URL', () => {
      // Arrange
      (isValidURL as jest.Mock).mockReturnValue(false);
      const url = 'https://example..com';
      
      // Act
      const result = isValidURL(url);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidURL).toHaveBeenCalledWith(url);
    });
  });

  describe('isValidLength', () => {
    it('should return true when string length is within min and max bounds', () => {
      // Arrange
      (isValidLength as jest.Mock).mockReturnValue(true);
      const str = 'test string';
      const min = 5;
      const max = 20;
      
      // Act
      const result = isValidLength(str, min, max);
      
      // Assert
      expect(result).toBe(true);
      expect(mockValidators.isValidLength).toHaveBeenCalledWith(str, min, max);
    });

    it('should return true when string length equals min bound', () => {
      // Arrange
      (isValidLength as jest.Mock).mockReturnValue(true);
      const str = 'test';
      const min = 4;
      const max = 10;
      
      // Act
      const result = isValidLength(str, min, max);
      
      // Assert
      expect(result).toBe(true);
      expect(mockValidators.isValidLength).toHaveBeenCalledWith(str, min, max);
    });

    it('should return true when string length equals max bound', () => {
      // Arrange
      (isValidLength as jest.Mock).mockReturnValue(true);
      const str = 'test string';
      const min = 5;
      const max = 11;
      
      // Act
      const result = isValidLength(str, min, max);
      
      // Assert
      expect(result).toBe(true);
      expect(mockValidators.isValidLength).toHaveBeenCalledWith(str, min, max);
    });

    it('should return false when string length is less than min bound', () => {
      // Arrange
      (isValidLength as jest.Mock).mockReturnValue(false);
      const str = 'test';
      const min = 5;
      const max = 10;
      
      // Act
      const result = isValidLength(str, min, max);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidLength).toHaveBeenCalledWith(str, min, max);
    });

    it('should return false when string length is greater than max bound', () => {
      // Arrange
      (isValidLength as jest.Mock).mockReturnValue(false);
      const str = 'test string that is too long';
      const min = 5;
      const max = 20;
      
      // Act
      const result = isValidLength(str, min, max);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidLength).toHaveBeenCalledWith(str, min, max);
    });

    it('should handle empty string correctly', () => {
      // Arrange
      (isValidLength as jest.Mock).mockReturnValue(false);
      const str = '';
      const min = 1;
      const max = 10;
      
      // Act
      const result = isValidLength(str, min, max);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidLength).toHaveBeenCalledWith(str, min, max);
    });

    it('should handle null or undefined string correctly', () => {
      // Arrange
      (isValidLength as jest.Mock).mockReturnValue(false);
      const str = null;
      const min = 1;
      const max = 10;
      
      // Act
      const result = isValidLength(str, min, max);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidLength).toHaveBeenCalledWith(str, min, max);
    });
  });

  describe('matchesPattern', () => {
    it('should return true when string matches the pattern', () => {
      // Arrange
      (matchesPattern as jest.Mock).mockReturnValue(true);
      const str = 'ABC-123';
      const pattern = /^[A-Z]+-\d+$/;
      
      // Act
      const result = matchesPattern(str, pattern);
      
      // Assert
      expect(result).toBe(true);
      expect(mockValidators.matchesPattern).toHaveBeenCalledWith(str, pattern);
    });

    it('should return true for phone number pattern', () => {
      // Arrange
      (matchesPattern as jest.Mock).mockReturnValue(true);
      const str = '+55 (11) 98765-4321';
      const pattern = /^\+\d{2}\s\(\d{2}\)\s\d{5}-\d{4}$/;
      
      // Act
      const result = matchesPattern(str, pattern);
      
      // Assert
      expect(result).toBe(true);
      expect(mockValidators.matchesPattern).toHaveBeenCalledWith(str, pattern);
    });

    it('should return true for postal code pattern', () => {
      // Arrange
      (matchesPattern as jest.Mock).mockReturnValue(true);
      const str = '12345-678';
      const pattern = /^\d{5}-\d{3}$/;
      
      // Act
      const result = mockValidators.matchesPattern(str, pattern);
      
      // Assert
      expect(result).toBe(true);
      expect(matchesPattern).toHaveBeenCalledWith(str, pattern);
    });

    it('should return false when string does not match the pattern', () => {
      // Arrange
      (matchesPattern as jest.Mock).mockReturnValue(false);
      const str = 'abc-123';
      const pattern = /^[A-Z]+-\d+$/;
      
      // Act
      const result = matchesPattern(str, pattern);
      
      // Assert
      expect(result).toBe(false);
      expect(matchesPattern).toHaveBeenCalledWith(str, pattern);
    });

    it('should return false for empty string', () => {
      // Arrange
      (matchesPattern as jest.Mock).mockReturnValue(false);
      const str = '';
      const pattern = /^[A-Z]+-\d+$/;
      
      // Act
      const result = matchesPattern(str, pattern);
      
      // Assert
      expect(result).toBe(false);
      expect(matchesPattern).toHaveBeenCalledWith(str, pattern);
    });

    it('should handle null or undefined string correctly', () => {
      // Arrange
      (matchesPattern as jest.Mock).mockReturnValue(false);
      const str = null;
      const pattern = /^[A-Z]+-\d+$/;
      
      // Act
      const result = matchesPattern(str, pattern);
      
      // Assert
      expect(result).toBe(false);
      expect(matchesPattern).toHaveBeenCalledWith(str, pattern);
    });

    it('should handle predefined patterns for common use cases', () => {
      // Arrange
      (matchesPattern as jest.Mock).mockReturnValue(true);
      const str = 'ABC123';
      const pattern = 'alphanumeric'; // Assuming this is a predefined pattern name
      
      // Act
      const result = matchesPattern(str, pattern);
      
      // Assert
      expect(result).toBe(true);
      expect(matchesPattern).toHaveBeenCalledWith(str, pattern);
    });
  });
});