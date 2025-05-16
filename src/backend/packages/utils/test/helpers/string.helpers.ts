/**
 * @file String Test Helper Functions
 * @description Provides test helper functions for string utilities, including generators for random strings,
 * Brazilian-specific identifiers (CPF, RG, CNPJ), and special string patterns. These helpers facilitate
 * testing of string validation, formatting, and transformation functions across all journey services.
 * 
 * @module @austa/utils/test/helpers/string
 * @version 1.0.0
 */

// ===================================================
// RANDOM STRING GENERATORS
// ===================================================

/**
 * Generates a random string of specified length with configurable character set.
 * 
 * @example
 * ```typescript
 * // Generate a random alphanumeric string of length 10
 * const randomStr = generateRandomString(10);
 * 
 * // Generate a random string with only lowercase letters
 * const randomLetters = generateRandomString(8, 'abcdefghijklmnopqrstuvwxyz');
 * 
 * // Generate a random numeric string
 * const randomNumbers = generateRandomString(6, '0123456789');
 * ```
 * 
 * @param length - The length of the string to generate
 * @param charset - Optional character set to use (defaults to alphanumeric)
 * @returns A random string of the specified length
 */
export const generateRandomString = (length: number, charset?: string): string => {
  const defaultCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const chars = charset || defaultCharset;
  
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars.charAt(randomIndex);
  }
  
  return result;
};

/**
 * Generates a random numeric string of specified length.
 * 
 * @example
 * ```typescript
 * // Generate a random 5-digit number as string
 * const randomDigits = generateRandomNumericString(5);
 * ```
 * 
 * @param length - The length of the numeric string to generate
 * @returns A random numeric string of the specified length
 */
export const generateRandomNumericString = (length: number): string => {
  return generateRandomString(length, '0123456789');
};

/**
 * Generates a random alphabetic string (letters only) of specified length.
 * 
 * @example
 * ```typescript
 * // Generate a random 8-character alphabetic string
 * const randomLetters = generateRandomAlphabeticString(8);
 * 
 * // Generate a random 10-character lowercase alphabetic string
 * const randomLowercase = generateRandomAlphabeticString(10, false);
 * ```
 * 
 * @param length - The length of the alphabetic string to generate
 * @param includeUppercase - Whether to include uppercase letters (default: true)
 * @returns A random alphabetic string of the specified length
 */
export const generateRandomAlphabeticString = (length: number, includeUppercase = true): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const charset = includeUppercase ? lowercase + lowercase.toUpperCase() : lowercase;
  return generateRandomString(length, charset);
};

// ===================================================
// BRAZILIAN DOCUMENT GENERATORS
// ===================================================

/**
 * Generates a valid Brazilian CPF number.
 * 
 * @example
 * ```typescript
 * // Generate a valid CPF with formatting
 * const formattedCPF = generateValidCPF(true); // e.g. '123.456.789-09'
 * 
 * // Generate a valid CPF without formatting
 * const unformattedCPF = generateValidCPF(); // e.g. '12345678909'
 * ```
 * 
 * @param formatted - Whether to format the CPF with dots and dash (default: false)
 * @returns A valid CPF string
 */
export const generateValidCPF = (formatted = false): string => {
  // Generate 9 random digits
  const digits: number[] = [];
  for (let i = 0; i < 9; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }
  
  // Calculate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder > 9 ? 0 : remainder;
  digits.push(digit1);
  
  // Calculate second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const digit2 = remainder > 9 ? 0 : remainder;
  digits.push(digit2);
  
  // Convert to string
  const cpf = digits.join('');
  
  // Format if requested
  if (formatted) {
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  
  return cpf;
};

/**
 * Generates an invalid Brazilian CPF number.
 * 
 * @example
 * ```typescript
 * // Generate an invalid CPF with formatting
 * const formattedInvalidCPF = generateInvalidCPF(true);
 * 
 * // Generate an invalid CPF without formatting
 * const unformattedInvalidCPF = generateInvalidCPF();
 * ```
 * 
 * @param formatted - Whether to format the CPF with dots and dash (default: false)
 * @param invalidType - Type of invalid CPF to generate: 'repeated' (all same digits), 'checksum' (invalid checksum), or 'length' (wrong length)
 * @returns An invalid CPF string
 */
export const generateInvalidCPF = (formatted = false, invalidType?: 'repeated' | 'checksum' | 'length'): string => {
  // Determine the type of invalid CPF to generate if not specified
  const type = invalidType || ['repeated', 'checksum', 'length'][Math.floor(Math.random() * 3)];
  
  let cpf: string;
  
  switch (type) {
    case 'repeated':
      // Generate a CPF with all digits the same (invalid)
      const digit = Math.floor(Math.random() * 10).toString();
      cpf = digit.repeat(11);
      break;
      
    case 'checksum':
      // Generate a CPF with invalid verification digits
      const validCPF = generateValidCPF();
      const base = validCPF.substring(0, 9);
      let invalidDigit1 = (parseInt(validCPF.charAt(9)) + 1) % 10;
      let invalidDigit2 = (parseInt(validCPF.charAt(10)) + 1) % 10;
      cpf = base + invalidDigit1 + invalidDigit2;
      break;
      
    case 'length':
      // Generate a CPF with incorrect length
      cpf = generateRandomNumericString(Math.random() > 0.5 ? 10 : 12);
      break;
      
    default:
      cpf = generateRandomNumericString(11);
  }
  
  // Format if requested and if length is correct
  if (formatted && cpf.length === 11) {
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  
  return cpf;
};

/**
 * Generates a valid Brazilian CNPJ number.
 * 
 * @example
 * ```typescript
 * // Generate a valid CNPJ with formatting
 * const formattedCNPJ = generateValidCNPJ(true); // e.g. '12.345.678/0001-95'
 * 
 * // Generate a valid CNPJ without formatting
 * const unformattedCNPJ = generateValidCNPJ(); // e.g. '12345678000195'
 * ```
 * 
 * @param formatted - Whether to format the CNPJ with dots, slash and dash (default: false)
 * @returns A valid CNPJ string
 */
export const generateValidCNPJ = (formatted = false): string => {
  // Generate 12 random digits
  const digits: number[] = [];
  for (let i = 0; i < 12; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }
  
  // Calculate first verification digit
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  digits.push(digit1);
  
  // Calculate second verification digit
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += digits[i] * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  digits.push(digit2);
  
  // Convert to string
  const cnpj = digits.join('');
  
  // Format if requested
  if (formatted) {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  
  return cnpj;
};

/**
 * Generates an invalid Brazilian CNPJ number.
 * 
 * @example
 * ```typescript
 * // Generate an invalid CNPJ with formatting
 * const formattedInvalidCNPJ = generateInvalidCNPJ(true);
 * 
 * // Generate an invalid CNPJ without formatting
 * const unformattedInvalidCNPJ = generateInvalidCNPJ();
 * ```
 * 
 * @param formatted - Whether to format the CNPJ with dots, slash and dash (default: false)
 * @param invalidType - Type of invalid CNPJ to generate: 'repeated' (all same digits), 'checksum' (invalid checksum), or 'length' (wrong length)
 * @returns An invalid CNPJ string
 */
export const generateInvalidCNPJ = (formatted = false, invalidType?: 'repeated' | 'checksum' | 'length'): string => {
  // Determine the type of invalid CNPJ to generate if not specified
  const type = invalidType || ['repeated', 'checksum', 'length'][Math.floor(Math.random() * 3)];
  
  let cnpj: string;
  
  switch (type) {
    case 'repeated':
      // Generate a CNPJ with all digits the same (invalid)
      const digit = Math.floor(Math.random() * 10).toString();
      cnpj = digit.repeat(14);
      break;
      
    case 'checksum':
      // Generate a CNPJ with invalid verification digits
      const validCNPJ = generateValidCNPJ();
      const base = validCNPJ.substring(0, 12);
      let invalidDigit1 = (parseInt(validCNPJ.charAt(12)) + 1) % 10;
      let invalidDigit2 = (parseInt(validCNPJ.charAt(13)) + 1) % 10;
      cnpj = base + invalidDigit1 + invalidDigit2;
      break;
      
    case 'length':
      // Generate a CNPJ with incorrect length
      cnpj = generateRandomNumericString(Math.random() > 0.5 ? 13 : 15);
      break;
      
    default:
      cnpj = generateRandomNumericString(14);
  }
  
  // Format if requested and if length is correct
  if (formatted && cnpj.length === 14) {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  
  return cnpj;
};

/**
 * Generates a valid Brazilian CEP (postal code).
 * 
 * @example
 * ```typescript
 * // Generate a valid CEP with formatting
 * const formattedCEP = generateValidCEP(true); // e.g. '12345-678'
 * 
 * // Generate a valid CEP without formatting
 * const unformattedCEP = generateValidCEP(); // e.g. '12345678'
 * ```
 * 
 * @param formatted - Whether to format the CEP with dash (default: false)
 * @returns A valid CEP string
 */
export const generateValidCEP = (formatted = false): string => {
  // Generate 8 random digits
  const cep = generateRandomNumericString(8);
  
  // Format if requested
  if (formatted) {
    return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  }
  
  return cep;
};

/**
 * Generates an invalid Brazilian CEP (postal code).
 * 
 * @example
 * ```typescript
 * // Generate an invalid CEP
 * const invalidCEP = generateInvalidCEP();
 * ```
 * 
 * @param formatted - Whether to format the CEP with dash if possible (default: false)
 * @returns An invalid CEP string
 */
export const generateInvalidCEP = (formatted = false): string => {
  // Generate a CEP with incorrect length (not 8 digits)
  const length = Math.random() > 0.5 ? 7 : 9;
  const cep = generateRandomNumericString(length);
  
  // Format if requested and if length allows formatting
  if (formatted && length > 5) {
    const firstPart = cep.substring(0, 5);
    const secondPart = cep.substring(5);
    return `${firstPart}-${secondPart}`;
  }
  
  return cep;
};

/**
 * Generates a valid Brazilian phone number.
 * 
 * @example
 * ```typescript
 * // Generate a valid mobile phone number with formatting
 * const formattedMobile = generateValidBrazilianPhone(true, true); // e.g. '(11) 98765-4321'
 * 
 * // Generate a valid landline number without formatting
 * const unformattedLandline = generateValidBrazilianPhone(false, false); // e.g. '1123456789'
 * 
 * // Generate a valid phone number with country code
 * const phoneWithCountryCode = generateValidBrazilianPhone(true, true, true); // e.g. '+55 (11) 98765-4321'
 * ```
 * 
 * @param formatted - Whether to format the phone number with parentheses and dash (default: false)
 * @param mobile - Whether to generate a mobile number (with 9 digits) or landline (8 digits) (default: true)
 * @param withCountryCode - Whether to include the Brazilian country code (+55) (default: false)
 * @returns A valid Brazilian phone number string
 */
export const generateValidBrazilianPhone = (
  formatted = false,
  mobile = true,
  withCountryCode = false
): string => {
  // Generate area code (2 digits)
  const areaCode = Math.floor(Math.random() * 90) + 10; // 10-99
  
  // Generate phone number
  let phoneNumber: string;
  if (mobile) {
    // Mobile numbers in Brazil start with 9 and have 9 digits total
    const firstDigit = '9';
    const remainingDigits = generateRandomNumericString(8);
    phoneNumber = firstDigit + remainingDigits;
  } else {
    // Landline numbers have 8 digits
    phoneNumber = generateRandomNumericString(8);
  }
  
  // Combine parts
  let result = `${areaCode}${phoneNumber}`;
  
  // Add country code if requested
  if (withCountryCode) {
    result = `55${result}`;
  }
  
  // Format if requested
  if (formatted) {
    if (withCountryCode) {
      if (mobile) {
        // +55 (11) 98765-4321
        return result.replace(/^(\d{2})(\d{2})(\d)(\d{4})(\d{4})$/, '+$1 ($2) $3$4-$5');
      } else {
        // +55 (11) 2345-6789
        return result.replace(/^(\d{2})(\d{2})(\d{4})(\d{4})$/, '+$1 ($2) $3-$4');
      }
    } else {
      if (mobile) {
        // (11) 98765-4321
        return result.replace(/^(\d{2})(\d)(\d{4})(\d{4})$/, '($1) $2$3-$4');
      } else {
        // (11) 2345-6789
        return result.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
      }
    }
  }
  
  return result;
};

/**
 * Generates an invalid Brazilian phone number.
 * 
 * @example
 * ```typescript
 * // Generate an invalid phone number
 * const invalidPhone = generateInvalidBrazilianPhone();
 * ```
 * 
 * @param formatted - Whether to attempt formatting the phone number (default: false)
 * @returns An invalid Brazilian phone number string
 */
export const generateInvalidBrazilianPhone = (formatted = false): string => {
  // Generate a phone number with incorrect length
  const length = [7, 14][Math.floor(Math.random() * 2)]; // Too short or too long
  const phone = generateRandomNumericString(length);
  
  // We don't format invalid phone numbers as they don't follow the expected pattern
  return phone;
};

// ===================================================
// STRING PATTERN GENERATORS
// ===================================================

/**
 * Generates a string with a specific pattern using placeholders.
 * 
 * @example
 * ```typescript
 * // Generate a string with a specific pattern
 * const pattern = generateStringWithPattern('User-###-??', {
 *   '#': '0123456789',
 *   '?': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
 * }); // e.g. 'User-123-XYZ'
 * ```
 * 
 * @param pattern - The pattern string with placeholders
 * @param charsets - An object mapping placeholder characters to character sets
 * @returns A string matching the specified pattern
 */
export const generateStringWithPattern = (
  pattern: string,
  charsets: Record<string, string>
): string => {
  let result = '';
  
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern.charAt(i);
    const charset = charsets[char];
    
    if (charset) {
      // Replace placeholder with random character from its charset
      const randomIndex = Math.floor(Math.random() * charset.length);
      result += charset.charAt(randomIndex);
    } else {
      // Keep non-placeholder characters as is
      result += char;
    }
  }
  
  return result;
};

/**
 * Generates a string that matches a specific regular expression pattern.
 * Note: This is a simplified implementation and works best with simple patterns.
 * 
 * @example
 * ```typescript
 * // Generate a string matching a simple regex pattern
 * const email = generateStringMatchingRegex(/[a-z]{5,10}@[a-z]{3,8}\.[a-z]{2,3}/);
 * // e.g. 'user123@example.com'
 * ```
 * 
 * @param regex - The regular expression to match
 * @param maxLength - Maximum length of the generated string (default: 100)
 * @returns A string that matches the regular expression pattern
 */
export const generateStringMatchingRegex = (regex: RegExp, maxLength = 100): string => {
  // This is a simplified implementation that works for basic patterns
  // For complex patterns, consider using a library like 'randexp'
  
  // Handle common patterns
  if (regex.source === '[a-zA-Z]+') {
    return generateRandomAlphabeticString(Math.floor(Math.random() * 10) + 5);
  }
  
  if (regex.source === '\\d+') {
    return generateRandomNumericString(Math.floor(Math.random() * 10) + 5);
  }
  
  if (regex.source.includes('@')) {
    // Simple email pattern
    const username = generateRandomAlphabeticString(Math.floor(Math.random() * 5) + 5, false);
    const domain = generateRandomAlphabeticString(Math.floor(Math.random() * 5) + 3, false);
    const tld = generateRandomAlphabeticString(Math.floor(Math.random() * 2) + 2, false);
    return `${username}@${domain}.${tld}`;
  }
  
  // Fallback for other patterns - generate random strings until one matches
  for (let attempt = 0; attempt < 100; attempt++) {
    const candidate = generateRandomString(Math.floor(Math.random() * maxLength) + 1);
    if (regex.test(candidate)) {
      return candidate;
    }
  }
  
  // If we couldn't generate a matching string, return a placeholder
  return `[Could not generate string matching ${regex}]`;
};

// ===================================================
// TEST ASSERTION HELPERS
// ===================================================

/**
 * Creates an array of test cases for string validation functions.
 * 
 * @example
 * ```typescript
 * // Create test cases for CPF validation
 * const cpfTestCases = createStringValidationTestCases({
 *   valid: [generateValidCPF(), generateValidCPF(true)],
 *   invalid: [generateInvalidCPF(), '123', null, undefined]
 * });
 * 
 * // Use in tests
 * cpfTestCases.forEach(testCase => {
 *   expect(isValidCPF(testCase.input)).toBe(testCase.expected);
 * });
 * ```
 * 
 * @param cases - Object containing valid and invalid test cases
 * @returns Array of test cases with input values and expected results
 */
export const createStringValidationTestCases = <T>(cases: {
  valid: T[];
  invalid: T[];
}): Array<{ input: T; expected: boolean }> => {
  return [
    ...cases.valid.map(input => ({ input, expected: true })),
    ...cases.invalid.map(input => ({ input, expected: false }))
  ];
};

/**
 * Creates an array of test cases for string formatting functions.
 * 
 * @example
 * ```typescript
 * // Create test cases for CPF formatting
 * const cpfFormattingTestCases = createStringFormattingTestCases([
 *   { input: '12345678909', expected: '123.456.789-09' },
 *   { input: '123.456.789-09', expected: '123.456.789-09' },
 *   { input: '123', expected: '123' }
 * ]);
 * 
 * // Use in tests
 * cpfFormattingTestCases.forEach(testCase => {
 *   expect(formatCPF(testCase.input)).toBe(testCase.expected);
 * });
 * ```
 * 
 * @param cases - Array of test cases with input and expected output
 * @returns The same array, useful for type checking and consistency
 */
export const createStringFormattingTestCases = <T, U>(cases: Array<{
  input: T;
  expected: U;
}>): Array<{ input: T; expected: U }> => {
  return cases;
};

/**
 * Generates a set of edge cases for string functions testing.
 * 
 * @example
 * ```typescript
 * // Get edge cases for string testing
 * const edgeCases = getStringEdgeCases();
 * 
 * // Use in tests
 * edgeCases.forEach(edgeCase => {
 *   // Test your string function with edge cases
 *   const result = myStringFunction(edgeCase.value);
 *   // Assert based on expected behavior
 * });
 * ```
 * 
 * @returns Array of edge cases with descriptive names and values
 */
export const getStringEdgeCases = (): Array<{ name: string; value: any }> => {
  return [
    { name: 'empty string', value: '' },
    { name: 'null', value: null },
    { name: 'undefined', value: undefined },
    { name: 'number', value: 123 },
    { name: 'boolean', value: true },
    { name: 'object', value: {} },
    { name: 'array', value: [] },
    { name: 'very long string', value: 'a'.repeat(1000) },
    { name: 'string with special chars', value: '!@#$%^&*()_+{}[]|\\:;"\'<>,.?/' },
    { name: 'string with line breaks', value: 'line1\nline2\r\nline3' },
    { name: 'string with tabs', value: 'tab\tcharacter' },
    { name: 'string with unicode', value: '你好世界' },
    { name: 'string with emojis', value: '😀🚀🌍🔥' },
    { name: 'string with HTML', value: '<div>Hello</div>' },
    { name: 'string with SQL', value: 'SELECT * FROM users' },
    { name: 'whitespace string', value: '   ' }
  ];
};