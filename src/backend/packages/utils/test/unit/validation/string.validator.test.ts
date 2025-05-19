import {
  validateCPF,
  validateEmail,
  validateUrl,
  validateStringLength,
  validatePattern,
  isValidCPF,
  isValidEmail,
  isValidUrl,
  isValidStringLength,
  isValidPattern,
  StringValidationPatterns,
  StringValidationErrors,
  ValidationResult,
  StringLengthOptions,
  PatternValidationOptions,
  UrlValidationOptions,
  EmailValidationOptions
} from '../../../src/validation/string.validator';

describe('String Validators', () => {
  describe('CPF Validation', () => {
    describe('validateCPF', () => {
      it('should validate a correctly formatted CPF with separators', () => {
        const result = validateCPF('529.982.247-25');
        expect(result.isValid).toBe(true);
      });

      it('should validate a correctly formatted CPF without separators', () => {
        const result = validateCPF('52998224725');
        expect(result.isValid).toBe(true);
      });

      it('should validate a correctly formatted CPF with only hyphen', () => {
        const result = validateCPF('529982247-25');
        expect(result.isValid).toBe(true);
      });

      it('should validate a correctly formatted CPF with only dots', () => {
        const result = validateCPF('529.982.24725');
        expect(result.isValid).toBe(true);
      });

      it('should reject an empty CPF', () => {
        const result = validateCPF('');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.EMPTY_STRING);
      });

      it('should reject a null or undefined CPF', () => {
        const result1 = validateCPF(null as unknown as string);
        expect(result1.isValid).toBe(false);
        expect(result1.error).toBe(StringValidationErrors.EMPTY_STRING);

        const result2 = validateCPF(undefined as unknown as string);
        expect(result2.isValid).toBe(false);
        expect(result2.error).toBe(StringValidationErrors.EMPTY_STRING);
      });

      it('should reject a CPF with invalid format', () => {
        const result = validateCPF('529.982.247.25');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.INVALID_CPF);
        expect(result.details?.reason).toBe('format');
      });

      it('should reject a CPF with invalid length', () => {
        const result = validateCPF('5299822');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.INVALID_CPF);
        expect(result.details?.reason).toBe('format');
      });

      it('should reject a CPF with all repeated digits', () => {
        const result = validateCPF('111.111.111-11');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.INVALID_CPF);
        expect(result.details?.reason).toBe('repeated_digits');
      });

      it('should reject a CPF with invalid checksum', () => {
        const result = validateCPF('529.982.247-26'); // Changed last digit
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.INVALID_CPF);
        expect(result.details?.reason).toBe('checksum');
      });

      it('should reject a CPF with letters', () => {
        const result = validateCPF('529.98A.247-25');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.INVALID_CPF);
        expect(result.details?.reason).toBe('format');
      });
    });

    describe('isValidCPF', () => {
      it('should return true for valid CPFs', () => {
        expect(isValidCPF('529.982.247-25')).toBe(true);
        expect(isValidCPF('52998224725')).toBe(true);
      });

      it('should return false for invalid CPFs', () => {
        expect(isValidCPF('')).toBe(false);
        expect(isValidCPF('111.111.111-11')).toBe(false);
        expect(isValidCPF('529.982.247-26')).toBe(false);
        expect(isValidCPF('abc')).toBe(false);
      });
    });
  });

  describe('Email Validation', () => {
    describe('validateEmail', () => {
      it('should validate a standard email address', () => {
        const result = validateEmail('user@example.com');
        expect(result.isValid).toBe(true);
      });

      it('should validate an email with subdomain', () => {
        const result = validateEmail('user@sub.example.com');
        expect(result.isValid).toBe(true);
      });

      it('should validate an email with plus addressing', () => {
        const result = validateEmail('user+tag@example.com');
        expect(result.isValid).toBe(true);
      });

      it('should validate an email with numbers and special characters', () => {
        const result = validateEmail('user.name123@example-site.co.uk');
        expect(result.isValid).toBe(true);
      });

      it('should validate a Brazilian email address', () => {
        const result = validateEmail('usuario@empresa.com.br');
        expect(result.isValid).toBe(true);
      });

      it('should validate a Brazilian government email address', () => {
        const result = validateEmail('usuario@orgao.gov.br');
        expect(result.isValid).toBe(true);
      });

      it('should reject an empty email', () => {
        const result = validateEmail('');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.EMPTY_STRING);
      });

      it('should reject a null or undefined email', () => {
        const result1 = validateEmail(null as unknown as string);
        expect(result1.isValid).toBe(false);
        expect(result1.error).toBe(StringValidationErrors.EMPTY_STRING);

        const result2 = validateEmail(undefined as unknown as string);
        expect(result2.isValid).toBe(false);
        expect(result2.error).toBe(StringValidationErrors.EMPTY_STRING);
      });

      it('should reject an email without @ symbol', () => {
        const result = validateEmail('userexample.com');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.INVALID_EMAIL);
        expect(result.details?.reason).toBe('format');
      });

      it('should reject an email without domain', () => {
        const result = validateEmail('user@');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.INVALID_EMAIL);
        expect(result.details?.reason).toBe('format');
      });

      it('should reject an email with invalid TLD', () => {
        const result = validateEmail('user@example.x');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.INVALID_EMAIL);
        expect(result.details?.reason).toBe('format');
      });

      it('should reject non-Brazilian emails when Brazilian-only option is set', () => {
        const options: EmailValidationOptions = {
          allowBrazilianOnly: true,
          allowInternational: false
        };
        
        const result1 = validateEmail('user@example.com', options);
        expect(result1.isValid).toBe(false);
        expect(result1.error).toBe(StringValidationErrors.INVALID_EMAIL);
        expect(result1.details?.reason).toBe('not_brazilian_domain');

        const result2 = validateEmail('usuario@empresa.com.br', options);
        expect(result2.isValid).toBe(true);
      });
    });

    describe('isValidEmail', () => {
      it('should return true for valid emails', () => {
        expect(isValidEmail('user@example.com')).toBe(true);
        expect(isValidEmail('usuario@empresa.com.br')).toBe(true);
      });

      it('should return false for invalid emails', () => {
        expect(isValidEmail('')).toBe(false);
        expect(isValidEmail('userexample.com')).toBe(false);
        expect(isValidEmail('user@')).toBe(false);
      });

      it('should respect options for Brazilian-only emails', () => {
        const options: EmailValidationOptions = {
          allowBrazilianOnly: true,
          allowInternational: false
        };
        
        expect(isValidEmail('user@example.com', options)).toBe(false);
        expect(isValidEmail('usuario@empresa.com.br', options)).toBe(true);
      });
    });
  });

  describe('URL Validation', () => {
    describe('validateUrl', () => {
      it('should validate a standard HTTP URL', () => {
        const result = validateUrl('http://example.com');
        expect(result.isValid).toBe(true);
      });

      it('should validate a standard HTTPS URL', () => {
        const result = validateUrl('https://example.com');
        expect(result.isValid).toBe(true);
      });

      it('should validate a URL with path', () => {
        const result = validateUrl('https://example.com/path/to/resource');
        expect(result.isValid).toBe(true);
      });

      it('should validate a URL with query parameters', () => {
        const result = validateUrl('https://example.com/search?q=test&page=1');
        expect(result.isValid).toBe(true);
      });

      it('should validate a URL with fragment', () => {
        const result = validateUrl('https://example.com/page#section');
        expect(result.isValid).toBe(true);
      });

      it('should validate a URL with port', () => {
        const result = validateUrl('https://example.com:8080/api');
        expect(result.isValid).toBe(true);
      });

      it('should reject an empty URL', () => {
        const result = validateUrl('');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.EMPTY_STRING);
      });

      it('should reject a null or undefined URL', () => {
        const result1 = validateUrl(null as unknown as string);
        expect(result1.isValid).toBe(false);
        expect(result1.error).toBe(StringValidationErrors.EMPTY_STRING);

        const result2 = validateUrl(undefined as unknown as string);
        expect(result2.isValid).toBe(false);
        expect(result2.error).toBe(StringValidationErrors.EMPTY_STRING);
      });

      it('should reject a URL with invalid format', () => {
        const result = validateUrl('not a url');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.INVALID_URL);
        expect(result.details?.reason).toBe('format');
      });

      it('should reject a URL with invalid protocol', () => {
        const result = validateUrl('ftp://example.com');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.INVALID_URL);
        expect(result.details?.reason).toBe('protocol');
      });

      it('should reject HTTP URLs when HTTPS is required', () => {
        const options: UrlValidationOptions = { requireHttps: true };
        const result = validateUrl('http://example.com', options);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.INVALID_URL);
        expect(result.details?.reason).toBe('https_required');
      });

      it('should reject private IP addresses by default (SSRF protection)', () => {
        const privateUrls = [
          'http://localhost/api',
          'http://127.0.0.1/api',
          'http://192.168.1.1/api',
          'http://10.0.0.1/api',
          'http://172.16.0.1/api',
          'http://example.local/api'
        ];

        privateUrls.forEach(url => {
          const result = validateUrl(url);
          expect(result.isValid).toBe(false);
          expect(result.error).toBe(StringValidationErrors.SSRF_PROTECTION);
          expect(result.details?.reason).toBe('private_ip');
        });
      });

      it('should allow private IP addresses when explicitly configured', () => {
        const options: UrlValidationOptions = { allowPrivateIps: true };
        const privateUrls = [
          'http://localhost/api',
          'http://127.0.0.1/api',
          'http://192.168.1.1/api'
        ];

        privateUrls.forEach(url => {
          const result = validateUrl(url, options);
          expect(result.isValid).toBe(true);
        });
      });

      it('should allow custom protocols when specified', () => {
        const options: UrlValidationOptions = { 
          allowedProtocols: ['http', 'https', 'ftp'] 
        };
        
        const result = validateUrl('ftp://example.com', options);
        expect(result.isValid).toBe(true);
      });
    });

    describe('isValidUrl', () => {
      it('should return true for valid URLs', () => {
        expect(isValidUrl('http://example.com')).toBe(true);
        expect(isValidUrl('https://example.com/path?query=1#fragment')).toBe(true);
      });

      it('should return false for invalid URLs', () => {
        expect(isValidUrl('')).toBe(false);
        expect(isValidUrl('not a url')).toBe(false);
        expect(isValidUrl('ftp://example.com')).toBe(false);
      });

      it('should respect HTTPS requirement option', () => {
        const options: UrlValidationOptions = { requireHttps: true };
        expect(isValidUrl('http://example.com', options)).toBe(false);
        expect(isValidUrl('https://example.com', options)).toBe(true);
      });

      it('should respect SSRF protection options', () => {
        const options: UrlValidationOptions = { allowPrivateIps: true };
        expect(isValidUrl('http://localhost', options)).toBe(true);
        expect(isValidUrl('http://localhost')).toBe(false);
      });
    });
  });

  describe('String Length Validation', () => {
    describe('validateStringLength', () => {
      it('should validate strings within default constraints', () => {
        const result = validateStringLength('test string');
        expect(result.isValid).toBe(true);
      });

      it('should validate strings within specified min length', () => {
        const options: StringLengthOptions = { min: 5 };
        
        const result1 = validateStringLength('test string', options);
        expect(result1.isValid).toBe(true);
        
        const result2 = validateStringLength('test', options);
        expect(result2.isValid).toBe(false);
        expect(result2.error).toBe(StringValidationErrors.STRING_TOO_SHORT);
        expect(result2.details?.min).toBe(5);
        expect(result2.details?.actual).toBe(4);
      });

      it('should validate strings within specified max length', () => {
        const options: StringLengthOptions = { max: 10 };
        
        const result1 = validateStringLength('test', options);
        expect(result1.isValid).toBe(true);
        
        const result2 = validateStringLength('test string that is too long', options);
        expect(result2.isValid).toBe(false);
        expect(result2.error).toBe(StringValidationErrors.STRING_TOO_LONG);
        expect(result2.details?.max).toBe(10);
        expect(result2.details?.actual).toBe(28);
      });

      it('should validate strings within specified min and max length', () => {
        const options: StringLengthOptions = { min: 5, max: 10 };
        
        const result1 = validateStringLength('test12', options);
        expect(result1.isValid).toBe(true);
        
        const result2 = validateStringLength('test', options);
        expect(result2.isValid).toBe(false);
        expect(result2.error).toBe(StringValidationErrors.STRING_TOO_SHORT);
        
        const result3 = validateStringLength('test string that is too long', options);
        expect(result3.isValid).toBe(false);
        expect(result3.error).toBe(StringValidationErrors.STRING_TOO_LONG);
      });

      it('should reject empty strings by default', () => {
        const result = validateStringLength('');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.EMPTY_STRING);
      });

      it('should allow empty strings when configured', () => {
        const options: StringLengthOptions = { allowEmpty: true };
        const result = validateStringLength('', options);
        expect(result.isValid).toBe(true);
      });

      it('should reject null or undefined strings', () => {
        const result1 = validateStringLength(null as unknown as string);
        expect(result1.isValid).toBe(false);
        expect(result1.error).toBe(StringValidationErrors.EMPTY_STRING);

        const result2 = validateStringLength(undefined as unknown as string);
        expect(result2.isValid).toBe(false);
        expect(result2.error).toBe(StringValidationErrors.EMPTY_STRING);
      });
    });

    describe('isValidStringLength', () => {
      it('should return true for valid string lengths', () => {
        expect(isValidStringLength('test')).toBe(true);
        expect(isValidStringLength('test', { min: 4 })).toBe(true);
        expect(isValidStringLength('test', { max: 4 })).toBe(true);
        expect(isValidStringLength('test', { min: 2, max: 6 })).toBe(true);
      });

      it('should return false for invalid string lengths', () => {
        expect(isValidStringLength('')).toBe(false);
        expect(isValidStringLength('test', { min: 5 })).toBe(false);
        expect(isValidStringLength('test', { max: 3 })).toBe(false);
      });

      it('should respect allowEmpty option', () => {
        expect(isValidStringLength('', { allowEmpty: true })).toBe(true);
        expect(isValidStringLength('', { allowEmpty: false })).toBe(false);
      });
    });
  });

  describe('Pattern Validation', () => {
    describe('validatePattern', () => {
      it('should validate strings matching alphanumeric pattern', () => {
        const options: PatternValidationOptions = {
          pattern: StringValidationPatterns.ALPHANUMERIC
        };
        
        const result = validatePattern('Test123', options);
        expect(result.isValid).toBe(true);
      });

      it('should validate strings matching letters-only pattern', () => {
        const options: PatternValidationOptions = {
          pattern: StringValidationPatterns.LETTERS_ONLY
        };
        
        const result = validatePattern('TestOnly', options);
        expect(result.isValid).toBe(true);
      });

      it('should validate strings matching numbers-only pattern', () => {
        const options: PatternValidationOptions = {
          pattern: StringValidationPatterns.NUMBERS_ONLY
        };
        
        const result = validatePattern('12345', options);
        expect(result.isValid).toBe(true);
      });

      it('should validate strings matching custom pattern', () => {
        const options: PatternValidationOptions = {
          pattern: /^[A-Z]{3}-\d{4}$/
        };
        
        const result = validatePattern('ABC-1234', options);
        expect(result.isValid).toBe(true);
      });

      it('should reject strings not matching the pattern', () => {
        const options: PatternValidationOptions = {
          pattern: StringValidationPatterns.LETTERS_ONLY
        };
        
        const result = validatePattern('Test123', options);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.PATTERN_MISMATCH);
      });

      it('should use custom error message when provided', () => {
        const customError = 'Must contain only letters';
        const options: PatternValidationOptions = {
          pattern: StringValidationPatterns.LETTERS_ONLY,
          errorMessage: customError
        };
        
        const result = validatePattern('Test123', options);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(customError);
      });

      it('should reject empty strings by default', () => {
        const options: PatternValidationOptions = {
          pattern: StringValidationPatterns.LETTERS_ONLY
        };
        
        const result = validatePattern('', options);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(StringValidationErrors.EMPTY_STRING);
      });

      it('should allow empty strings when configured', () => {
        const options: PatternValidationOptions = {
          pattern: StringValidationPatterns.LETTERS_ONLY,
          allowEmpty: true
        };
        
        const result = validatePattern('', options);
        expect(result.isValid).toBe(true);
      });

      it('should reject null or undefined strings', () => {
        const options: PatternValidationOptions = {
          pattern: StringValidationPatterns.LETTERS_ONLY
        };
        
        const result1 = validatePattern(null as unknown as string, options);
        expect(result1.isValid).toBe(false);
        expect(result1.error).toBe(StringValidationErrors.EMPTY_STRING);

        const result2 = validatePattern(undefined as unknown as string, options);
        expect(result2.isValid).toBe(false);
        expect(result2.error).toBe(StringValidationErrors.EMPTY_STRING);
      });
    });

    describe('isValidPattern', () => {
      it('should return true for strings matching the pattern', () => {
        expect(isValidPattern('Test123', { pattern: StringValidationPatterns.ALPHANUMERIC_WITH_SPACES })).toBe(true);
        expect(isValidPattern('TestOnly', { pattern: StringValidationPatterns.LETTERS_ONLY })).toBe(true);
        expect(isValidPattern('12345', { pattern: StringValidationPatterns.NUMBERS_ONLY })).toBe(true);
      });

      it('should return false for strings not matching the pattern', () => {
        expect(isValidPattern('Test123', { pattern: StringValidationPatterns.LETTERS_ONLY })).toBe(false);
        expect(isValidPattern('TestOnly', { pattern: StringValidationPatterns.NUMBERS_ONLY })).toBe(false);
      });

      it('should respect allowEmpty option', () => {
        expect(isValidPattern('', { pattern: /.*/, allowEmpty: true })).toBe(true);
        expect(isValidPattern('', { pattern: /.*/, allowEmpty: false })).toBe(false);
      });
    });
  });
});