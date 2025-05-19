import {
  isValidCNPJ,
  isValidRG,
  isValidBrazilianPhone,
  isValidCEP,
  isValidEmail,
  isValidURL,
  isValidDate,
  isValidLength,
  isAlphanumeric,
  isInRange,
  combineValidators,
  combineValidatorsWithErrors,
  ValidationOptions,
  Validator,
  ValidatorWithError
} from '../../../src/validation/common.validator';

describe('Common Validators', () => {
  describe('CNPJ Validation', () => {
    it('should validate a correctly formatted CNPJ with separators', () => {
      expect(isValidCNPJ('12.345.678/0001-90')).toBe(true);
    });

    it('should validate a correctly formatted CNPJ without separators', () => {
      expect(isValidCNPJ('12345678000190')).toBe(true);
    });

    it('should validate a correctly formatted CNPJ with only slash', () => {
      expect(isValidCNPJ('12345678/000190')).toBe(true);
    });

    it('should validate a correctly formatted CNPJ with only dots', () => {
      expect(isValidCNPJ('12.345.678000190')).toBe(true);
    });

    it('should reject an empty CNPJ', () => {
      expect(isValidCNPJ('')).toBe(false);
    });

    it('should allow empty CNPJ when allowEmpty option is true', () => {
      expect(isValidCNPJ('', { allowEmpty: true })).toBe(true);
    });

    it('should reject a null or undefined CNPJ', () => {
      expect(isValidCNPJ(null as unknown as string)).toBe(false);
      expect(isValidCNPJ(undefined as unknown as string)).toBe(false);
    });

    it('should reject a CNPJ with invalid format', () => {
      expect(isValidCNPJ('12.345.678.0001-90')).toBe(false);
    });

    it('should reject a CNPJ with invalid length', () => {
      expect(isValidCNPJ('12345678000')).toBe(false);
      expect(isValidCNPJ('123456780001901')).toBe(false);
    });

    it('should reject a CNPJ with all repeated digits', () => {
      expect(isValidCNPJ('11.111.111/1111-11')).toBe(false);
      expect(isValidCNPJ('00000000000000')).toBe(false);
    });

    it('should reject a CNPJ with invalid checksum', () => {
      expect(isValidCNPJ('12.345.678/0001-91')).toBe(false); // Changed last digit
    });

    it('should reject a CNPJ with letters', () => {
      expect(isValidCNPJ('12.345.67A/0001-90')).toBe(false);
    });
  });

  describe('RG Validation', () => {
    it('should validate a correctly formatted RG with separators', () => {
      expect(isValidRG('12.345.678-9')).toBe(true);
    });

    it('should validate a correctly formatted RG without separators', () => {
      expect(isValidRG('123456789')).toBe(true);
    });

    it('should validate a correctly formatted RG with only hyphen', () => {
      expect(isValidRG('12345678-9')).toBe(true);
    });

    it('should validate a correctly formatted RG with only dots', () => {
      expect(isValidRG('12.345.6789')).toBe(true);
    });

    it('should validate an RG with X as the last character', () => {
      expect(isValidRG('12.345.678-X')).toBe(true);
      expect(isValidRG('12345678X')).toBe(true);
    });

    it('should reject an empty RG', () => {
      expect(isValidRG('')).toBe(false);
    });

    it('should allow empty RG when allowEmpty option is true', () => {
      expect(isValidRG('', { allowEmpty: true })).toBe(true);
    });

    it('should reject a null or undefined RG', () => {
      expect(isValidRG(null as unknown as string)).toBe(false);
      expect(isValidRG(undefined as unknown as string)).toBe(false);
    });

    it('should reject an RG with invalid length', () => {
      expect(isValidRG('1234567')).toBe(false); // Too short
      expect(isValidRG('12345678901')).toBe(false); // Too long
    });

    it('should reject an RG with invalid characters', () => {
      expect(isValidRG('12.345.678-Y')).toBe(false); // Y is not valid
      expect(isValidRG('12.345.ABC-9')).toBe(false); // Letters in the middle
    });
  });

  describe('Brazilian Phone Validation', () => {
    it('should validate a mobile phone with area code and separators', () => {
      expect(isValidBrazilianPhone('(11) 98765-4321')).toBe(true);
    });

    it('should validate a mobile phone with area code without separators', () => {
      expect(isValidBrazilianPhone('11987654321')).toBe(true);
    });

    it('should validate a landline with area code and separators', () => {
      expect(isValidBrazilianPhone('(11) 3456-7890')).toBe(true);
    });

    it('should validate a landline with area code without separators', () => {
      expect(isValidBrazilianPhone('1134567890')).toBe(true);
    });

    it('should validate a mobile phone without area code', () => {
      expect(isValidBrazilianPhone('987654321')).toBe(true);
    });

    it('should validate a landline without area code', () => {
      expect(isValidBrazilianPhone('34567890')).toBe(true);
    });

    it('should validate a phone with country code', () => {
      expect(isValidBrazilianPhone('+55 (11) 98765-4321')).toBe(true);
      expect(isValidBrazilianPhone('5511987654321')).toBe(true);
    });

    it('should reject an empty phone number', () => {
      expect(isValidBrazilianPhone('')).toBe(false);
    });

    it('should allow empty phone number when allowEmpty option is true', () => {
      expect(isValidBrazilianPhone('', { allowEmpty: true })).toBe(true);
    });

    it('should reject a null or undefined phone number', () => {
      expect(isValidBrazilianPhone(null as unknown as string)).toBe(false);
      expect(isValidBrazilianPhone(undefined as unknown as string)).toBe(false);
    });

    it('should reject a phone number with invalid length', () => {
      expect(isValidBrazilianPhone('1234567')).toBe(false); // Too short
      expect(isValidBrazilianPhone('123456789012345')).toBe(false); // Too long
    });

    it('should reject a mobile phone without 9 as first digit', () => {
      expect(isValidBrazilianPhone('(11) 8765-4321')).toBe(false); // Should start with 9
      expect(isValidBrazilianPhone('118765432')).toBe(false); // Should start with 9
    });

    it('should reject a phone number with invalid area code', () => {
      expect(isValidBrazilianPhone('(00) 98765-4321')).toBe(false); // 00 is not a valid area code
      expect(isValidBrazilianPhone('(100) 98765-4321')).toBe(false); // 100 is not a valid area code
    });

    it('should reject a phone number with invalid country code', () => {
      expect(isValidBrazilianPhone('+1 (11) 98765-4321')).toBe(false); // +1 is not Brazil
      expect(isValidBrazilianPhone('1111987654321')).toBe(false); // 11 is not a valid country code
    });

    it('should reject a phone number with letters', () => {
      expect(isValidBrazilianPhone('(11) 9876-ABCD')).toBe(false);
    });
  });

  describe('CEP Validation', () => {
    it('should validate a correctly formatted CEP with separator', () => {
      expect(isValidCEP('12345-678')).toBe(true);
    });

    it('should validate a correctly formatted CEP without separator', () => {
      expect(isValidCEP('12345678')).toBe(true);
    });

    it('should reject an empty CEP', () => {
      expect(isValidCEP('')).toBe(false);
    });

    it('should allow empty CEP when allowEmpty option is true', () => {
      expect(isValidCEP('', { allowEmpty: true })).toBe(true);
    });

    it('should reject a null or undefined CEP', () => {
      expect(isValidCEP(null as unknown as string)).toBe(false);
      expect(isValidCEP(undefined as unknown as string)).toBe(false);
    });

    it('should reject a CEP with invalid length', () => {
      expect(isValidCEP('1234567')).toBe(false); // Too short
      expect(isValidCEP('123456789')).toBe(false); // Too long
    });

    it('should reject a CEP with all repeated digits', () => {
      expect(isValidCEP('11111-111')).toBe(false);
      expect(isValidCEP('00000000')).toBe(false);
    });

    it('should reject a CEP with letters', () => {
      expect(isValidCEP('1234A-678')).toBe(false);
    });
  });

  describe('Email Validation', () => {
    it('should validate a standard email address', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('should validate an email with subdomain', () => {
      expect(isValidEmail('user@sub.example.com')).toBe(true);
    });

    it('should validate an email with plus addressing', () => {
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should validate a Brazilian email address', () => {
      expect(isValidEmail('usuario@empresa.com.br')).toBe(true);
    });

    it('should reject an empty email', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should allow empty email when allowEmpty option is true', () => {
      expect(isValidEmail('', { allowEmpty: true })).toBe(true);
    });

    it('should reject a null or undefined email', () => {
      expect(isValidEmail(null as unknown as string)).toBe(false);
      expect(isValidEmail(undefined as unknown as string)).toBe(false);
    });

    it('should reject an email without @ symbol', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('should reject an email without domain', () => {
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('URL Validation', () => {
    it('should validate a standard HTTP URL', () => {
      expect(isValidURL('http://example.com')).toBe(true);
    });

    it('should validate a standard HTTPS URL', () => {
      expect(isValidURL('https://example.com')).toBe(true);
    });

    it('should validate a URL with path', () => {
      expect(isValidURL('https://example.com/path/to/resource')).toBe(true);
    });

    it('should validate a URL with query parameters', () => {
      expect(isValidURL('https://example.com/search?q=test&page=1')).toBe(true);
    });

    it('should reject an empty URL', () => {
      expect(isValidURL('')).toBe(false);
    });

    it('should allow empty URL when allowEmpty option is true', () => {
      expect(isValidURL('', { allowEmpty: true })).toBe(true);
    });

    it('should reject a null or undefined URL', () => {
      expect(isValidURL(null as unknown as string)).toBe(false);
      expect(isValidURL(undefined as unknown as string)).toBe(false);
    });

    it('should reject a URL with invalid format', () => {
      expect(isValidURL('not a url')).toBe(false);
    });
  });

  describe('Date Validation', () => {
    it('should validate a valid date string', () => {
      expect(isValidDate('2023-01-15')).toBe(true);
    });

    it('should validate a valid Date object', () => {
      expect(isValidDate(new Date())).toBe(true);
    });

    it('should reject an invalid date string', () => {
      expect(isValidDate('2023-13-45')).toBe(false); // Invalid month and day
    });

    it('should reject an empty date', () => {
      expect(isValidDate('')).toBe(false);
    });

    it('should allow empty date when allowEmpty option is true', () => {
      expect(isValidDate('', { allowEmpty: true })).toBe(true);
    });

    it('should reject a null or undefined date', () => {
      expect(isValidDate(null as unknown as string)).toBe(false);
      expect(isValidDate(undefined as unknown as string)).toBe(false);
    });

    it('should reject an invalid Date object', () => {
      expect(isValidDate(new Date('invalid date'))).toBe(false);
    });
  });

  describe('Length Validation', () => {
    it('should validate a string within specified min length', () => {
      expect(isValidLength('test', 3, 10)).toBe(true);
      expect(isValidLength('test', 4, 10)).toBe(true);
      expect(isValidLength('test', 5, 10)).toBe(false); // Too short
    });

    it('should validate a string within specified max length', () => {
      expect(isValidLength('test', 1, 5)).toBe(true);
      expect(isValidLength('test', 1, 4)).toBe(true);
      expect(isValidLength('test', 1, 3)).toBe(false); // Too long
    });

    it('should reject an empty string', () => {
      expect(isValidLength('', 1, 10)).toBe(false);
    });

    it('should allow empty string when allowEmpty option is true', () => {
      expect(isValidLength('', 1, 10, { allowEmpty: true })).toBe(true);
    });

    it('should reject a null or undefined string', () => {
      expect(isValidLength(null as unknown as string, 1, 10)).toBe(false);
      expect(isValidLength(undefined as unknown as string, 1, 10)).toBe(false);
    });
  });

  describe('Alphanumeric Validation', () => {
    it('should validate a string with only letters and numbers', () => {
      expect(isAlphanumeric('Test123')).toBe(true);
    });

    it('should reject a string with special characters', () => {
      expect(isAlphanumeric('Test@123')).toBe(false);
    });

    it('should reject a string with spaces by default', () => {
      expect(isAlphanumeric('Test 123')).toBe(false);
    });

    it('should allow spaces when allowSpaces is true', () => {
      expect(isAlphanumeric('Test 123', true)).toBe(true);
    });

    it('should reject an empty string', () => {
      expect(isAlphanumeric('')).toBe(false);
    });

    it('should allow empty string when allowEmpty option is true', () => {
      expect(isAlphanumeric('', false, { allowEmpty: true })).toBe(true);
    });

    it('should reject a null or undefined string', () => {
      expect(isAlphanumeric(null as unknown as string)).toBe(false);
      expect(isAlphanumeric(undefined as unknown as string)).toBe(false);
    });
  });

  describe('Range Validation', () => {
    it('should validate a number within specified range', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true); // Min boundary
      expect(isInRange(10, 1, 10)).toBe(true); // Max boundary
    });

    it('should reject a number outside specified range', () => {
      expect(isInRange(0, 1, 10)).toBe(false); // Below min
      expect(isInRange(11, 1, 10)).toBe(false); // Above max
    });

    it('should reject NaN', () => {
      expect(isInRange(NaN, 1, 10)).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(isInRange(null, 1, 10)).toBe(false);
      expect(isInRange(undefined, 1, 10)).toBe(false);
    });

    it('should allow null or undefined when allowEmpty option is true', () => {
      expect(isInRange(null, 1, 10, { allowEmpty: true })).toBe(true);
      expect(isInRange(undefined, 1, 10, { allowEmpty: true })).toBe(true);
    });
  });

  describe('Validator Combination', () => {
    describe('combineValidators', () => {
      it('should combine multiple validators and return true when all pass', () => {
        const isValidUsername = combineValidators([
          (value: string) => isValidLength(value, 3, 20),
          (value: string) => isAlphanumeric(value)
        ]);

        expect(isValidUsername('user123')).toBe(true);
      });

      it('should combine multiple validators and return false when any fails', () => {
        const isValidUsername = combineValidators([
          (value: string) => isValidLength(value, 3, 20),
          (value: string) => isAlphanumeric(value)
        ]);

        expect(isValidUsername('us')).toBe(false); // Too short
        expect(isValidUsername('user@123')).toBe(false); // Not alphanumeric
      });
    });

    describe('combineValidatorsWithErrors', () => {
      it('should combine multiple validators and return success result when all pass', () => {
        const validateUsername = combineValidatorsWithErrors([
          { validator: (value: string) => isValidLength(value, 3, 20), errorMessage: 'Username must be between 3 and 20 characters' },
          { validator: (value: string) => isAlphanumeric(value), errorMessage: 'Username must contain only letters and numbers' }
        ]);

        const result = validateUsername('user123');
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });

      it('should combine multiple validators and return first error when any fails', () => {
        const validateUsername = combineValidatorsWithErrors([
          { validator: (value: string) => isValidLength(value, 3, 20), errorMessage: 'Username must be between 3 and 20 characters' },
          { validator: (value: string) => isAlphanumeric(value), errorMessage: 'Username must contain only letters and numbers' }
        ]);

        const result1 = validateUsername('us');
        expect(result1.isValid).toBe(false);
        expect(result1.errorMessage).toBe('Username must be between 3 and 20 characters');

        const result2 = validateUsername('user@123');
        expect(result2.isValid).toBe(false);
        expect(result2.errorMessage).toBe('Username must contain only letters and numbers');
      });

      it('should return the first error in the order validators are provided', () => {
        const validateUserData = combineValidatorsWithErrors([
          { validator: (data: any) => isValidEmail(data.email), errorMessage: 'Invalid email' },
          { validator: (data: any) => isValidCNPJ(data.cnpj), errorMessage: 'Invalid CNPJ' },
          { validator: (data: any) => isValidCEP(data.postalCode), errorMessage: 'Invalid postal code' }
        ]);

        const userData = {
          email: 'invalid-email',
          cnpj: 'invalid-cnpj',
          postalCode: 'invalid-cep'
        };

        const result = validateUserData(userData);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Invalid email'); // First error
      });
    });
  });
});