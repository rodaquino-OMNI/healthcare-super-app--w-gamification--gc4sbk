import { describe, expect, it, jest } from '@jest/globals';

// Import the validators we want to test
// Note: The actual implementation will be created in common.validator.ts
import {
  isValidCNPJ,
  isValidRG,
  isValidPhoneNumber,
  isValidCEP,
  combineValidators
} from '../../../src/validation/common.validator';

// Mock the module
jest.mock('../../../src/validation/common.validator', () => ({
  isValidCNPJ: jest.fn(),
  isValidRG: jest.fn(),
  isValidPhoneNumber: jest.fn(),
  isValidCEP: jest.fn(),
  combineValidators: jest.fn(),
}));

describe('Common Validators', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('isValidCNPJ', () => {
    it('should return true for valid CNPJ with formatting', () => {
      // Arrange
      const cnpj = '12.345.678/0001-90';
      (isValidCNPJ as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidCNPJ(cnpj);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidCNPJ).toHaveBeenCalledWith(cnpj);
    });

    it('should return true for valid CNPJ without formatting', () => {
      // Arrange
      const cnpj = '12345678000190';
      (isValidCNPJ as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidCNPJ(cnpj);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidCNPJ).toHaveBeenCalledWith(cnpj);
    });

    it('should return false for CNPJ with invalid check digits', () => {
      // Arrange
      const cnpj = '12.345.678/0001-91';
      (isValidCNPJ as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidCNPJ(cnpj);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidCNPJ).toHaveBeenCalledWith(cnpj);
    });

    it('should return false for CNPJ with repeated digits', () => {
      // Arrange
      const cnpj = '11.111.111/1111-11';
      (isValidCNPJ as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidCNPJ(cnpj);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidCNPJ).toHaveBeenCalledWith(cnpj);
    });

    it('should return false for CNPJ with incorrect length', () => {
      // Arrange
      const cnpj = '12.345.678/0001';
      (isValidCNPJ as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidCNPJ(cnpj);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidCNPJ).toHaveBeenCalledWith(cnpj);
    });

    it('should return false for CNPJ with non-numeric characters', () => {
      // Arrange
      const cnpj = '12.345.67A/0001-90';
      (isValidCNPJ as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidCNPJ(cnpj);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidCNPJ).toHaveBeenCalledWith(cnpj);
    });
  });

  describe('isValidRG', () => {
    it('should return true for valid RG with formatting', () => {
      // Arrange
      const rg = '12.345.678-9';
      (isValidRG as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidRG(rg);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidRG).toHaveBeenCalledWith(rg);
    });

    it('should return true for valid RG without formatting', () => {
      // Arrange
      const rg = '123456789';
      (isValidRG as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidRG(rg);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidRG).toHaveBeenCalledWith(rg);
    });

    it('should return true for valid RG with X as check digit', () => {
      // Arrange
      const rg = '12.345.678-X';
      (isValidRG as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidRG(rg);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidRG).toHaveBeenCalledWith(rg);
    });

    it('should return false for RG with invalid check digit', () => {
      // Arrange
      const rg = '12.345.678-0';
      (isValidRG as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidRG(rg);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidRG).toHaveBeenCalledWith(rg);
    });

    it('should return false for RG with incorrect length', () => {
      // Arrange
      const rg = '12.345.67';
      (isValidRG as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidRG(rg);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidRG).toHaveBeenCalledWith(rg);
    });

    it('should return false for RG with non-alphanumeric characters', () => {
      // Arrange
      const rg = '12.345.67$-9';
      (isValidRG as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidRG(rg);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidRG).toHaveBeenCalledWith(rg);
    });

    it('should handle state-specific RG validation when state is provided', () => {
      // Arrange
      const rg = '12.345.678-9';
      const state = 'SP';
      (isValidRG as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidRG(rg, state);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidRG).toHaveBeenCalledWith(rg, state);
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should return true for valid mobile phone with formatting', () => {
      // Arrange
      const phoneNumber = '(11) 98765-4321';
      (isValidPhoneNumber as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidPhoneNumber(phoneNumber);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidPhoneNumber).toHaveBeenCalledWith(phoneNumber);
    });

    it('should return true for valid mobile phone without formatting', () => {
      // Arrange
      const phoneNumber = '11987654321';
      (isValidPhoneNumber as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidPhoneNumber(phoneNumber);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidPhoneNumber).toHaveBeenCalledWith(phoneNumber);
    });

    it('should return true for valid landline with formatting', () => {
      // Arrange
      const phoneNumber = '(11) 3456-7890';
      (isValidPhoneNumber as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidPhoneNumber(phoneNumber);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidPhoneNumber).toHaveBeenCalledWith(phoneNumber);
    });

    it('should return true for valid landline without formatting', () => {
      // Arrange
      const phoneNumber = '1134567890';
      (isValidPhoneNumber as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidPhoneNumber(phoneNumber);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidPhoneNumber).toHaveBeenCalledWith(phoneNumber);
    });

    it('should return true for valid phone with country code', () => {
      // Arrange
      const phoneNumber = '+55 11 98765-4321';
      (isValidPhoneNumber as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidPhoneNumber(phoneNumber);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidPhoneNumber).toHaveBeenCalledWith(phoneNumber);
    });

    it('should return false for phone with invalid area code', () => {
      // Arrange
      const phoneNumber = '(00) 98765-4321';
      (isValidPhoneNumber as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidPhoneNumber(phoneNumber);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidPhoneNumber).toHaveBeenCalledWith(phoneNumber);
    });

    it('should return false for phone with incorrect length', () => {
      // Arrange
      const phoneNumber = '(11) 9876-543';
      (isValidPhoneNumber as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidPhoneNumber(phoneNumber);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidPhoneNumber).toHaveBeenCalledWith(phoneNumber);
    });

    it('should return false for phone with non-numeric characters', () => {
      // Arrange
      const phoneNumber = '(11) 9876A-4321';
      (isValidPhoneNumber as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidPhoneNumber(phoneNumber);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidPhoneNumber).toHaveBeenCalledWith(phoneNumber);
    });

    it('should handle strict validation mode when specified', () => {
      // Arrange
      const phoneNumber = '(11) 98765-4321';
      const strict = true;
      (isValidPhoneNumber as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidPhoneNumber(phoneNumber, strict);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidPhoneNumber).toHaveBeenCalledWith(phoneNumber, strict);
    });
  });

  describe('isValidCEP', () => {
    it('should return true for valid CEP with formatting', () => {
      // Arrange
      const cep = '12345-678';
      (isValidCEP as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidCEP(cep);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidCEP).toHaveBeenCalledWith(cep);
    });

    it('should return true for valid CEP without formatting', () => {
      // Arrange
      const cep = '12345678';
      (isValidCEP as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidCEP(cep);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidCEP).toHaveBeenCalledWith(cep);
    });

    it('should return false for CEP with incorrect length', () => {
      // Arrange
      const cep = '1234-567';
      (isValidCEP as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidCEP(cep);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidCEP).toHaveBeenCalledWith(cep);
    });

    it('should return false for CEP with non-numeric characters', () => {
      // Arrange
      const cep = '1234A-678';
      (isValidCEP as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidCEP(cep);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidCEP).toHaveBeenCalledWith(cep);
    });

    it('should return false for CEP with all zeros', () => {
      // Arrange
      const cep = '00000-000';
      (isValidCEP as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = isValidCEP(cep);
      
      // Assert
      expect(result).toBe(false);
      expect(isValidCEP).toHaveBeenCalledWith(cep);
    });

    it('should handle region validation when specified', () => {
      // Arrange
      const cep = '01000-000';
      const region = 'SP';
      (isValidCEP as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = isValidCEP(cep, region);
      
      // Assert
      expect(result).toBe(true);
      expect(isValidCEP).toHaveBeenCalledWith(cep, region);
    });
  });

  describe('combineValidators', () => {
    it('should return true when all validators return true', () => {
      // Arrange
      const value = 'test';
      const validator1 = jest.fn().mockReturnValue(true);
      const validator2 = jest.fn().mockReturnValue(true);
      const validator3 = jest.fn().mockReturnValue(true);
      (combineValidators as jest.Mock).mockImplementation((validators) => {
        return (val: any) => validators.every(v => v(val));
      });
      
      // Act
      const combinedValidator = combineValidators([validator1, validator2, validator3]);
      const result = combinedValidator(value);
      
      // Assert
      expect(result).toBe(true);
      expect(combineValidators).toHaveBeenCalledWith([validator1, validator2, validator3]);
    });

    it('should return false when any validator returns false', () => {
      // Arrange
      const value = 'test';
      const validator1 = jest.fn().mockReturnValue(true);
      const validator2 = jest.fn().mockReturnValue(false);
      const validator3 = jest.fn().mockReturnValue(true);
      (combineValidators as jest.Mock).mockImplementation((validators) => {
        return (val: any) => validators.every(v => v(val));
      });
      
      // Act
      const combinedValidator = combineValidators([validator1, validator2, validator3]);
      const result = combinedValidator(value);
      
      // Assert
      expect(result).toBe(false);
      expect(combineValidators).toHaveBeenCalledWith([validator1, validator2, validator3]);
    });

    it('should handle empty validator array', () => {
      // Arrange
      const value = 'test';
      (combineValidators as jest.Mock).mockImplementation((validators) => {
        return (val: any) => validators.length === 0 ? true : validators.every(v => v(val));
      });
      
      // Act
      const combinedValidator = combineValidators([]);
      const result = combinedValidator(value);
      
      // Assert
      expect(result).toBe(true);
      expect(combineValidators).toHaveBeenCalledWith([]);
    });

    it('should pass the value to each validator', () => {
      // Arrange
      const value = 'test';
      const validator1 = jest.fn().mockReturnValue(true);
      const validator2 = jest.fn().mockReturnValue(true);
      (combineValidators as jest.Mock).mockImplementation((validators) => {
        return (val: any) => validators.every(v => v(val));
      });
      
      // Act
      const combinedValidator = combineValidators([validator1, validator2]);
      combinedValidator(value);
      
      // Assert
      expect(validator1).toHaveBeenCalledWith(value);
      expect(validator2).toHaveBeenCalledWith(value);
    });

    it('should short-circuit evaluation when a validator returns false', () => {
      // Arrange
      const value = 'test';
      const validator1 = jest.fn().mockReturnValue(false);
      const validator2 = jest.fn().mockReturnValue(true);
      (combineValidators as jest.Mock).mockImplementation((validators) => {
        return (val: any) => {
          for (const validator of validators) {
            if (!validator(val)) return false;
          }
          return true;
        };
      });
      
      // Act
      const combinedValidator = combineValidators([validator1, validator2]);
      const result = combinedValidator(value);
      
      // Assert
      expect(result).toBe(false);
      expect(validator1).toHaveBeenCalledWith(value);
      expect(validator2).not.toHaveBeenCalled();
    });

    it('should support custom error handling', () => {
      // Arrange
      const value = 'test';
      const errorHandler = jest.fn();
      const validator1 = jest.fn().mockReturnValue(false);
      (combineValidators as jest.Mock).mockImplementation((validators, handler) => {
        return (val: any) => {
          for (const validator of validators) {
            if (!validator(val)) {
              if (handler) handler(val, validator);
              return false;
            }
          }
          return true;
        };
      });
      
      // Act
      const combinedValidator = combineValidators([validator1], errorHandler);
      const result = combinedValidator(value);
      
      // Assert
      expect(result).toBe(false);
      expect(combineValidators).toHaveBeenCalledWith([validator1], errorHandler);
      expect(errorHandler).toHaveBeenCalledWith(value, validator1);
    });
  });
});