/**
 * @file String Test Helpers
 * @module @austa/utils/test/helpers/string
 * @description Provides test helper functions for string utilities, including generators for random strings,
 * Brazilian-specific identifiers (CPF, RG, CNPJ), and special string patterns. These helpers facilitate
 * testing of string validation, formatting, and transformation functions across all journey services.
 */

/**
 * Generates a random string of specified length with optional character set.
 * 
 * @param length - The length of the string to generate
 * @param charset - The character set to use (defaults to alphanumeric)
 * @returns A random string of the specified length
 * 
 * @example
 * // Generate a random alphanumeric string of length 10
 * const randomStr = generateRandomString(10);
 * 
 * // Generate a random numeric string of length 5
 * const randomNum = generateRandomString(5, '0123456789');
 */
export function generateRandomString(
  length: number,
  charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  if (length < 0) {
    throw new Error('Length must be a non-negative number');
  }
  
  let result = '';
  const charsetLength = charset.length;
  
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charsetLength));
  }
  
  return result;
}

/**
 * Generates a random numeric string of specified length.
 * 
 * @param length - The length of the numeric string to generate
 * @returns A random numeric string of the specified length
 * 
 * @example
 * // Generate a random numeric string of length 8
 * const randomNumeric = generateRandomNumericString(8);
 */
export function generateRandomNumericString(length: number): string {
  return generateRandomString(length, '0123456789');
}

/**
 * Generates a random alphabetic string of specified length.
 * 
 * @param length - The length of the alphabetic string to generate
 * @returns A random alphabetic string of the specified length
 * 
 * @example
 * // Generate a random alphabetic string of length 12
 * const randomAlpha = generateRandomAlphabeticString(12);
 */
export function generateRandomAlphabeticString(length: number): string {
  return generateRandomString(length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
}

/**
 * Generates a string with a specific pattern, replacing placeholders with random characters.
 * 
 * @param pattern - The pattern with placeholders (A=alpha, 9=numeric, *=alphanumeric)
 * @returns A string matching the specified pattern
 * 
 * @example
 * // Generate a string matching pattern 'AAA-999'
 * const patternStr = generateStringWithPattern('AAA-999'); // e.g., 'XYZ-123'
 */
export function generateStringWithPattern(pattern: string): string {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numeric = '0123456789';
  const alphanumeric = alpha + numeric;
  
  let result = '';
  
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern.charAt(i);
    
    switch (char) {
      case 'A':
        result += alpha.charAt(Math.floor(Math.random() * alpha.length));
        break;
      case '9':
        result += numeric.charAt(Math.floor(Math.random() * numeric.length));
        break;
      case '*':
        result += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
        break;
      default:
        result += char;
    }
  }
  
  return result;
}

/**
 * Calculates the check digits for a CPF number.
 * 
 * @param baseDigits - The first 9 digits of the CPF
 * @returns The two check digits as a string
 */
function calculateCPFCheckDigits(baseDigits: string): string {
  if (baseDigits.length !== 9 || !/^\d{9}$/.test(baseDigits)) {
    throw new Error('Base digits must be a 9-digit numeric string');
  }
  
  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(baseDigits.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder > 9 ? 0 : remainder;
  
  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(baseDigits.charAt(i)) * (11 - i);
  }
  sum += digit1 * 2; // Add the first check digit
  remainder = 11 - (sum % 11);
  const digit2 = remainder > 9 ? 0 : remainder;
  
  return `${digit1}${digit2}`;
}

/**
 * Generates a valid CPF (Brazilian individual taxpayer registry identification) number.
 * 
 * @param formatted - Whether to return the CPF with formatting (default: false)
 * @returns A valid CPF number
 * 
 * @example
 * // Generate a valid unformatted CPF
 * const cpf = generateValidCPF(); // e.g., '12345678909'
 * 
 * // Generate a valid formatted CPF
 * const formattedCpf = generateValidCPF(true); // e.g., '123.456.789-09'
 */
export function generateValidCPF(formatted = false): string {
  // Generate 9 random digits
  const baseDigits = generateRandomNumericString(9);
  
  // Calculate check digits
  const checkDigits = calculateCPFCheckDigits(baseDigits);
  
  // Combine base digits and check digits
  const cpf = baseDigits + checkDigits;
  
  // Format if requested
  if (formatted) {
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  
  return cpf;
}

/**
 * Generates an invalid CPF number with incorrect check digits.
 * 
 * @param formatted - Whether to return the CPF with formatting (default: false)
 * @returns An invalid CPF number
 * 
 * @example
 * // Generate an invalid unformatted CPF
 * const invalidCpf = generateInvalidCPF();
 * 
 * // Generate an invalid formatted CPF
 * const invalidFormattedCpf = generateInvalidCPF(true);
 */
export function generateInvalidCPF(formatted = false): string {
  // Generate 9 random digits
  const baseDigits = generateRandomNumericString(9);
  
  // Calculate correct check digits
  const correctCheckDigits = calculateCPFCheckDigits(baseDigits);
  
  // Generate incorrect check digits by adding 1 to the first digit (mod 10)
  let incorrectDigit1 = (parseInt(correctCheckDigits[0]) + 1) % 10;
  let incorrectDigit2 = parseInt(correctCheckDigits[1]);
  
  // Ensure the check digits are different from the correct ones
  if (incorrectDigit1 === parseInt(correctCheckDigits[0]) && 
      incorrectDigit2 === parseInt(correctCheckDigits[1])) {
    incorrectDigit2 = (incorrectDigit2 + 1) % 10;
  }
  
  // Combine base digits and incorrect check digits
  const invalidCpf = baseDigits + incorrectDigit1 + incorrectDigit2;
  
  // Format if requested
  if (formatted) {
    return invalidCpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  
  return invalidCpf;
}

/**
 * Calculates the check digits for a CNPJ number.
 * 
 * @param baseDigits - The first 12 digits of the CNPJ
 * @returns The two check digits as a string
 */
function calculateCNPJCheckDigits(baseDigits: string): string {
  if (baseDigits.length !== 12 || !/^\d{12}$/.test(baseDigits)) {
    throw new Error('Base digits must be a 12-digit numeric string');
  }
  
  // Calculate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(baseDigits.charAt(i)) * weights1[i];
  }
  
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  // Calculate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(baseDigits.charAt(i)) * weights2[i];
  }
  
  sum += digit1 * weights2[12]; // Add the first check digit
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return `${digit1}${digit2}`;
}

/**
 * Generates a valid CNPJ (Brazilian company registry identification) number.
 * 
 * @param formatted - Whether to return the CNPJ with formatting (default: false)
 * @returns A valid CNPJ number
 * 
 * @example
 * // Generate a valid unformatted CNPJ
 * const cnpj = generateValidCNPJ(); // e.g., '12345678000199'
 * 
 * // Generate a valid formatted CNPJ
 * const formattedCnpj = generateValidCNPJ(true); // e.g., '12.345.678/0001-99'
 */
export function generateValidCNPJ(formatted = false): string {
  // Generate 8 random digits for the base
  const baseDigits = generateRandomNumericString(8);
  
  // Add the branch number (typically 0001 for headquarters)
  const withBranch = baseDigits + '0001';
  
  // Calculate check digits
  const checkDigits = calculateCNPJCheckDigits(withBranch);
  
  // Combine all digits
  const cnpj = withBranch + checkDigits;
  
  // Format if requested
  if (formatted) {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  
  return cnpj;
}

/**
 * Generates an invalid CNPJ number with incorrect check digits.
 * 
 * @param formatted - Whether to return the CNPJ with formatting (default: false)
 * @returns An invalid CNPJ number
 * 
 * @example
 * // Generate an invalid unformatted CNPJ
 * const invalidCnpj = generateInvalidCNPJ();
 * 
 * // Generate an invalid formatted CNPJ
 * const invalidFormattedCnpj = generateInvalidCNPJ(true);
 */
export function generateInvalidCNPJ(formatted = false): string {
  // Generate 8 random digits for the base
  const baseDigits = generateRandomNumericString(8);
  
  // Add the branch number (typically 0001 for headquarters)
  const withBranch = baseDigits + '0001';
  
  // Calculate correct check digits
  const correctCheckDigits = calculateCNPJCheckDigits(withBranch);
  
  // Generate incorrect check digits by adding 1 to the first digit (mod 10)
  let incorrectDigit1 = (parseInt(correctCheckDigits[0]) + 1) % 10;
  let incorrectDigit2 = parseInt(correctCheckDigits[1]);
  
  // Ensure the check digits are different from the correct ones
  if (incorrectDigit1 === parseInt(correctCheckDigits[0]) && 
      incorrectDigit2 === parseInt(correctCheckDigits[1])) {
    incorrectDigit2 = (incorrectDigit2 + 1) % 10;
  }
  
  // Combine all digits with incorrect check digits
  const invalidCnpj = withBranch + incorrectDigit1 + incorrectDigit2;
  
  // Format if requested
  if (formatted) {
    return invalidCnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  
  return invalidCnpj;
}

/**
 * Calculates the check digit for an RG number (São Paulo state algorithm).
 * 
 * @param baseDigits - The base digits of the RG (typically 8 digits)
 * @returns The check digit as a string (can be 'X' for value 10)
 */
function calculateRGCheckDigit(baseDigits: string): string {
  if (!/^\d+$/.test(baseDigits)) {
    throw new Error('Base digits must be a numeric string');
  }
  
  // Weights for São Paulo RG calculation (2 to 9)
  const weights = [2, 3, 4, 5, 6, 7, 8, 9];
  let sum = 0;
  
  // Calculate weighted sum, starting from the rightmost digit
  for (let i = 0; i < baseDigits.length; i++) {
    const digit = parseInt(baseDigits.charAt(i));
    const weight = weights[i % weights.length];
    sum += digit * weight;
  }
  
  // Calculate remainder of division by 11
  const remainder = sum % 11;
  
  // Calculate check digit (11 - remainder, or 0 if remainder is 0)
  const checkDigit = 11 - remainder;
  
  // Return 'X' for check digit 10, otherwise the digit as string
  if (checkDigit === 10) {
    return 'X';
  } else if (checkDigit === 11) {
    return '0';
  } else {
    return checkDigit.toString();
  }
}

/**
 * Generates a valid RG (Brazilian ID card) number using the São Paulo algorithm.
 * 
 * @param formatted - Whether to return the RG with formatting (default: false)
 * @returns A valid RG number
 * 
 * @example
 * // Generate a valid unformatted RG
 * const rg = generateValidRG(); // e.g., '123456789'
 * 
 * // Generate a valid formatted RG
 * const formattedRg = generateValidRG(true); // e.g., '12.345.678-9'
 */
export function generateValidRG(formatted = false): string {
  // Generate 8 random digits for the base
  const baseDigits = generateRandomNumericString(8);
  
  // Calculate check digit
  const checkDigit = calculateRGCheckDigit(baseDigits);
  
  // Combine base digits and check digit
  const rg = baseDigits + checkDigit;
  
  // Format if requested
  if (formatted) {
    return rg.replace(/^(\d{2})(\d{3})(\d{3})(\w)$/, '$1.$2.$3-$4');
  }
  
  return rg;
}

/**
 * Generates an invalid RG number with an incorrect check digit.
 * 
 * @param formatted - Whether to return the RG with formatting (default: false)
 * @returns An invalid RG number
 * 
 * @example
 * // Generate an invalid unformatted RG
 * const invalidRg = generateInvalidRG();
 * 
 * // Generate an invalid formatted RG
 * const invalidFormattedRg = generateInvalidRG(true);
 */
export function generateInvalidRG(formatted = false): string {
  // Generate 8 random digits for the base
  const baseDigits = generateRandomNumericString(8);
  
  // Calculate correct check digit
  const correctCheckDigit = calculateRGCheckDigit(baseDigits);
  
  // Generate an incorrect check digit
  let incorrectCheckDigit: string;
  
  if (correctCheckDigit === 'X') {
    // If correct digit is 'X', use a random digit
    incorrectCheckDigit = Math.floor(Math.random() * 10).toString();
  } else {
    // Otherwise, add 1 and take modulo 11, using 'X' for 10
    const newDigit = (parseInt(correctCheckDigit) + 1) % 11;
    incorrectCheckDigit = newDigit === 10 ? 'X' : newDigit.toString();
  }
  
  // Combine base digits and incorrect check digit
  const invalidRg = baseDigits + incorrectCheckDigit;
  
  // Format if requested
  if (formatted) {
    return invalidRg.replace(/^(\d{2})(\d{3})(\d{3})(\w)$/, '$1.$2.$3-$4');
  }
  
  return invalidRg;
}

/**
 * Generates a string with repeated characters.
 * 
 * @param char - The character to repeat
 * @param length - The number of times to repeat the character
 * @returns A string with the character repeated the specified number of times
 * 
 * @example
 * // Generate a string with 'a' repeated 5 times
 * const repeated = generateRepeatedString('a', 5); // 'aaaaa'
 */
export function generateRepeatedString(char: string, length: number): string {
  if (char.length !== 1) {
    throw new Error('Character must be a single character');
  }
  
  if (length < 0) {
    throw new Error('Length must be a non-negative number');
  }
  
  return char.repeat(length);
}

/**
 * Generates a string with a specific length that is guaranteed to be invalid for a specific validation function.
 * 
 * @param validationFn - The validation function to test against
 * @param length - The length of the string to generate
 * @param maxAttempts - Maximum number of attempts to generate an invalid string
 * @returns A string that is invalid according to the validation function
 * 
 * @example
 * // Generate a string that is invalid for isEmail validation
 * const invalidEmail = generateInvalidStringForValidation(isEmail, 10);
 */
export function generateInvalidStringForValidation(
  validationFn: (value: string) => boolean,
  length: number,
  maxAttempts = 100
): string {
  for (let i = 0; i < maxAttempts; i++) {
    const testString = generateRandomString(length);
    if (!validationFn(testString)) {
      return testString;
    }
  }
  
  throw new Error(`Failed to generate an invalid string after ${maxAttempts} attempts`);
}

/**
 * Generates a valid email address for testing.
 * 
 * @param domain - Optional domain to use (defaults to a random domain)
 * @returns A valid email address
 * 
 * @example
 * // Generate a random valid email
 * const email = generateValidEmail(); // e.g., 'user123@example.com'
 * 
 * // Generate a valid email with a specific domain
 * const specificEmail = generateValidEmail('austa.com.br'); // e.g., 'user456@austa.com.br'
 */
export function generateValidEmail(domain?: string): string {
  const username = generateRandomAlphabeticString(8).toLowerCase();
  const randomDomain = domain || `${generateRandomAlphabeticString(5).toLowerCase()}.com`;
  
  return `${username}@${randomDomain}`;
}

/**
 * Generates a valid Brazilian email address (with .br domain).
 * 
 * @returns A valid Brazilian email address
 * 
 * @example
 * // Generate a valid Brazilian email
 * const brEmail = generateValidBrazilianEmail(); // e.g., 'usuario@empresa.com.br'
 */
export function generateValidBrazilianEmail(): string {
  const username = generateRandomAlphabeticString(8).toLowerCase();
  const domains = ['com.br', 'org.br', 'edu.br', 'gov.br'];
  const randomDomain = domains[Math.floor(Math.random() * domains.length)];
  const company = generateRandomAlphabeticString(6).toLowerCase();
  
  return `${username}@${company}.${randomDomain}`;
}

/**
 * Generates an invalid email address for testing.
 * 
 * @returns An invalid email address
 * 
 * @example
 * // Generate an invalid email
 * const invalidEmail = generateInvalidEmail(); // e.g., 'user123example.com' (missing @)
 */
export function generateInvalidEmail(): string {
  const invalidFormats = [
    // Missing @ symbol
    () => {
      const username = generateRandomAlphabeticString(8).toLowerCase();
      const domain = generateRandomAlphabeticString(5).toLowerCase();
      return `${username}${domain}.com`;
    },
    // Missing domain
    () => {
      const username = generateRandomAlphabeticString(8).toLowerCase();
      return `${username}@`;
    },
    // Invalid characters
    () => {
      const username = generateRandomAlphabeticString(8).toLowerCase();
      return `${username}@domain with spaces.com`;
    },
    // Missing TLD
    () => {
      const username = generateRandomAlphabeticString(8).toLowerCase();
      const domain = generateRandomAlphabeticString(5).toLowerCase();
      return `${username}@${domain}`;
    },
    // Double @ symbol
    () => {
      const username = generateRandomAlphabeticString(8).toLowerCase();
      const domain = generateRandomAlphabeticString(5).toLowerCase();
      return `${username}@@${domain}.com`;
    }
  ];
  
  // Choose a random invalid format
  const randomFormat = invalidFormats[Math.floor(Math.random() * invalidFormats.length)];
  return randomFormat();
}

/**
 * Generates a valid URL for testing.
 * 
 * @param useHttps - Whether to use HTTPS protocol (default: true)
 * @returns A valid URL
 * 
 * @example
 * // Generate a valid HTTPS URL
 * const url = generateValidUrl(); // e.g., 'https://example.com/path'
 * 
 * // Generate a valid HTTP URL
 * const httpUrl = generateValidUrl(false); // e.g., 'http://example.com/path'
 */
export function generateValidUrl(useHttps = true): string {
  const protocol = useHttps ? 'https' : 'http';
  const domain = generateRandomAlphabeticString(8).toLowerCase();
  const tld = ['com', 'org', 'net', 'io', 'gov'][Math.floor(Math.random() * 5)];
  const path = Math.random() > 0.5 ? `/${generateRandomAlphabeticString(6).toLowerCase()}` : '';
  
  return `${protocol}://${domain}.${tld}${path}`;
}

/**
 * Generates an invalid URL for testing.
 * 
 * @returns An invalid URL
 * 
 * @example
 * // Generate an invalid URL
 * const invalidUrl = generateInvalidUrl(); // e.g., 'http:/example.com' (missing slash)
 */
export function generateInvalidUrl(): string {
  const invalidFormats = [
    // Missing protocol
    () => {
      const domain = generateRandomAlphabeticString(8).toLowerCase();
      return `${domain}.com`;
    },
    // Invalid protocol
    () => {
      const domain = generateRandomAlphabeticString(8).toLowerCase();
      return `htp://${domain}.com`;
    },
    // Missing domain
    () => {
      return 'https://';
    },
    // Invalid characters
    () => {
      const domain = generateRandomAlphabeticString(8).toLowerCase();
      return `https://${domain} space.com`;
    },
    // Missing slash after protocol
    () => {
      const domain = generateRandomAlphabeticString(8).toLowerCase();
      return `http:${domain}.com`;
    }
  ];
  
  // Choose a random invalid format
  const randomFormat = invalidFormats[Math.floor(Math.random() * invalidFormats.length)];
  return randomFormat();
}

/**
 * Generates a string that matches a specific regular expression pattern.
 * 
 * @param pattern - The regular expression pattern to match
 * @param maxLength - Maximum length of the generated string
 * @param maxAttempts - Maximum number of attempts to generate a matching string
 * @returns A string that matches the pattern
 * 
 * @example
 * // Generate a string matching a specific pattern
 * const matchingStr = generateStringMatchingPattern(/^[A-Z]{3}\d{4}$/); // e.g., 'ABC1234'
 */
export function generateStringMatchingPattern(
  pattern: RegExp,
  maxLength = 100,
  maxAttempts = 1000
): string {
  for (let i = 0; i < maxAttempts; i++) {
    const testString = generateRandomString(Math.floor(Math.random() * maxLength) + 1);
    if (pattern.test(testString)) {
      return testString;
    }
  }
  
  throw new Error(`Failed to generate a string matching the pattern after ${maxAttempts} attempts`);
}

/**
 * Generates a string that does NOT match a specific regular expression pattern.
 * 
 * @param pattern - The regular expression pattern to avoid matching
 * @param length - Length of the generated string
 * @param maxAttempts - Maximum number of attempts to generate a non-matching string
 * @returns A string that does not match the pattern
 * 
 * @example
 * // Generate a string not matching a specific pattern
 * const nonMatchingStr = generateStringNotMatchingPattern(/^[A-Z]{3}\d{4}$/, 7); // e.g., 'abc1234'
 */
export function generateStringNotMatchingPattern(
  pattern: RegExp,
  length = 10,
  maxAttempts = 100
): string {
  for (let i = 0; i < maxAttempts; i++) {
    const testString = generateRandomString(length);
    if (!pattern.test(testString)) {
      return testString;
    }
  }
  
  throw new Error(`Failed to generate a string not matching the pattern after ${maxAttempts} attempts`);
}

/**
 * Generates a valid strong password for testing.
 * 
 * @param length - Length of the password (default: 12)
 * @returns A valid strong password
 * 
 * @example
 * // Generate a strong password
 * const password = generateValidStrongPassword(); // e.g., 'P@ssw0rd123!'
 */
export function generateValidStrongPassword(length = 12): string {
  // Ensure minimum length for a strong password
  if (length < 8) {
    length = 8;
  }
  
  // Character sets for different requirements
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '@$!%*?&#';
  
  // Start with one character from each required set
  let password = '';
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  // Fill the rest with random characters from all sets
  const allChars = lowercase + uppercase + numbers + special;
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password characters
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Generates an invalid password that doesn't meet strong password requirements.
 * 
 * @returns An invalid password
 * 
 * @example
 * // Generate a weak password
 * const weakPassword = generateInvalidStrongPassword(); // e.g., 'password123'
 */
export function generateInvalidStrongPassword(): string {
  const weakPasswordTypes = [
    // Only lowercase
    () => generateRandomString(8, 'abcdefghijklmnopqrstuvwxyz'),
    // Only uppercase
    () => generateRandomString(8, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
    // Only numbers
    () => generateRandomString(8, '0123456789'),
    // No special characters
    () => generateRandomString(8, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
    // Too short
    () => generateRandomString(5, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&#')
  ];
  
  // Choose a random weak password type
  const randomType = weakPasswordTypes[Math.floor(Math.random() * weakPasswordTypes.length)];
  return randomType();
}

/**
 * Generates a string with a specific byte length when encoded as UTF-8.
 * 
 * @param byteLength - The desired byte length
 * @returns A string with the specified byte length
 * 
 * @example
 * // Generate a string with 10 bytes
 * const tenByteString = generateStringWithByteLength(10);
 */
export function generateStringWithByteLength(byteLength: number): string {
  // Start with an empty string
  let result = '';
  let currentByteLength = 0;
  
  // Add characters until we reach the desired byte length
  while (currentByteLength < byteLength) {
    // Choose a random ASCII character (1 byte in UTF-8)
    const char = String.fromCharCode(Math.floor(Math.random() * 128));
    
    // Calculate new byte length if we add this character
    const newByteLength = currentByteLength + 1; // ASCII chars are 1 byte
    
    // If adding this character would exceed the desired byte length, stop
    if (newByteLength > byteLength) {
      break;
    }
    
    // Add the character and update the current byte length
    result += char;
    currentByteLength = newByteLength;
  }
  
  return result;
}

/**
 * Generates a string with multi-byte Unicode characters.
 * 
 * @param length - The number of characters to generate
 * @returns A string with multi-byte Unicode characters
 * 
 * @example
 * // Generate a string with 5 multi-byte characters
 * const multiByteString = generateMultiByteString(5);
 */
export function generateMultiByteString(length: number): string {
  // Unicode ranges for multi-byte characters
  const ranges = [
    [0x0080, 0x07FF], // 2-byte UTF-8 characters
    [0x0800, 0xFFFF], // 3-byte UTF-8 characters
    [0x10000, 0x10FFFF] // 4-byte UTF-8 characters
  ];
  
  let result = '';
  
  for (let i = 0; i < length; i++) {
    // Choose a random range
    const range = ranges[Math.floor(Math.random() * ranges.length)];
    
    // Generate a random code point within the range
    const codePoint = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    
    // Convert the code point to a character and add it to the result
    result += String.fromCodePoint(codePoint);
  }
  
  return result;
}

/**
 * Generates a string with a specific number of words.
 * 
 * @param wordCount - The number of words to generate
 * @param minWordLength - Minimum length of each word
 * @param maxWordLength - Maximum length of each word
 * @returns A string with the specified number of words
 * 
 * @example
 * // Generate a string with 5 words
 * const fiveWords = generateStringWithWordCount(5); // e.g., 'lorem ipsum dolor sit amet'
 */
export function generateStringWithWordCount(
  wordCount: number,
  minWordLength = 3,
  maxWordLength = 10
): string {
  const words: string[] = [];
  
  for (let i = 0; i < wordCount; i++) {
    const wordLength = Math.floor(Math.random() * (maxWordLength - minWordLength + 1)) + minWordLength;
    words.push(generateRandomAlphabeticString(wordLength).toLowerCase());
  }
  
  return words.join(' ');
}

/**
 * Generates a string with a specific number of lines.
 * 
 * @param lineCount - The number of lines to generate
 * @param wordsPerLine - Number of words per line
 * @returns A string with the specified number of lines
 * 
 * @example
 * // Generate a string with 3 lines
 * const threeLines = generateStringWithLineCount(3); // e.g., 'line one\nline two\nline three'
 */
export function generateStringWithLineCount(
  lineCount: number,
  wordsPerLine = 5
): string {
  const lines: string[] = [];
  
  for (let i = 0; i < lineCount; i++) {
    lines.push(generateStringWithWordCount(wordsPerLine));
  }
  
  return lines.join('\n');
}

/**
 * Generates a string with HTML content for testing.
 * 
 * @param tagCount - The number of HTML tags to include
 * @returns A string with HTML content
 * 
 * @example
 * // Generate HTML content with 3 tags
 * const htmlContent = generateHTMLString(3);
 */
export function generateHTMLString(tagCount = 3): string {
  const tags = ['div', 'p', 'span', 'h1', 'h2', 'ul', 'li', 'a', 'strong', 'em'];
  let result = '';
  
  for (let i = 0; i < tagCount; i++) {
    const tag = tags[Math.floor(Math.random() * tags.length)];
    const content = generateStringWithWordCount(Math.floor(Math.random() * 5) + 1);
    result += `<${tag}>${content}</${tag}>`;
  }
  
  return result;
}

/**
 * Generates a string with SQL content for testing.
 * 
 * @returns A string with SQL content
 * 
 * @example
 * // Generate SQL content
 * const sqlContent = generateSQLString();
 */
export function generateSQLString(): string {
  const tables = ['users', 'products', 'orders', 'customers', 'categories'];
  const columns = ['id', 'name', 'email', 'created_at', 'status', 'price', 'quantity'];
  const operators = ['=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL'];
  
  const table = tables[Math.floor(Math.random() * tables.length)];
  const column1 = columns[Math.floor(Math.random() * columns.length)];
  const column2 = columns[Math.floor(Math.random() * columns.length)];
  const column3 = columns[Math.floor(Math.random() * columns.length)];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  
  return `SELECT ${column1}, ${column2}, ${column3} FROM ${table} WHERE ${column1} ${operator} ?`;
}

/**
 * Generates a string with JSON content for testing.
 * 
 * @param depth - The depth of nested objects
 * @returns A string with JSON content
 * 
 * @example
 * // Generate JSON content with depth 2
 * const jsonContent = generateJSONString(2);
 */
export function generateJSONString(depth = 2): string {
  function generateObject(currentDepth: number): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    const propertyCount = Math.floor(Math.random() * 5) + 1;
    
    for (let i = 0; i < propertyCount; i++) {
      const key = generateRandomAlphabeticString(5).toLowerCase();
      
      if (currentDepth > 0 && Math.random() > 0.5) {
        obj[key] = generateObject(currentDepth - 1);
      } else {
        const valueType = Math.floor(Math.random() * 4);
        
        switch (valueType) {
          case 0: // String
            obj[key] = generateRandomAlphabeticString(8);
            break;
          case 1: // Number
            obj[key] = Math.floor(Math.random() * 1000);
            break;
          case 2: // Boolean
            obj[key] = Math.random() > 0.5;
            break;
          case 3: // Array
            const arrayLength = Math.floor(Math.random() * 3) + 1;
            const array = [];
            
            for (let j = 0; j < arrayLength; j++) {
              array.push(generateRandomAlphabeticString(4));
            }
            
            obj[key] = array;
            break;
        }
      }
    }
    
    return obj;
  }
  
  return JSON.stringify(generateObject(depth), null, 2);
}

/**
 * Generates a string with XML content for testing.
 * 
 * @param depth - The depth of nested elements
 * @returns A string with XML content
 * 
 * @example
 * // Generate XML content with depth 2
 * const xmlContent = generateXMLString(2);
 */
export function generateXMLString(depth = 2): string {
  function generateElement(name: string, currentDepth: number): string {
    const content = generateRandomAlphabeticString(8);
    
    if (currentDepth <= 0) {
      return `<${name}>${content}</${name}>`;
    }
    
    const childCount = Math.floor(Math.random() * 3) + 1;
    let children = '';
    
    for (let i = 0; i < childCount; i++) {
      const childName = generateRandomAlphabeticString(5).toLowerCase();
      children += generateElement(childName, currentDepth - 1);
    }
    
    return `<${name}>${children}</${name}>`;
  }
  
  const rootName = generateRandomAlphabeticString(5).toLowerCase();
  return `<?xml version="1.0" encoding="UTF-8"?>${generateElement(rootName, depth)}`;
}

/**
 * Generates a string with CSV content for testing.
 * 
 * @param rows - The number of rows to generate
 * @param columns - The number of columns to generate
 * @returns A string with CSV content
 * 
 * @example
 * // Generate CSV content with 3 rows and 4 columns
 * const csvContent = generateCSVString(3, 4);
 */
export function generateCSVString(rows = 3, columns = 4): string {
  const result: string[] = [];
  
  // Generate header row
  const header: string[] = [];
  for (let i = 0; i < columns; i++) {
    header.push(`Column${i + 1}`);
  }
  result.push(header.join(','));
  
  // Generate data rows
  for (let i = 0; i < rows; i++) {
    const row: string[] = [];
    for (let j = 0; j < columns; j++) {
      row.push(generateRandomAlphabeticString(5));
    }
    result.push(row.join(','));
  }
  
  return result.join('\n');
}

/**
 * Generates a string with base64 content for testing.
 * 
 * @param length - The length of the original string before encoding
 * @returns A base64 encoded string
 * 
 * @example
 * // Generate base64 content
 * const base64Content = generateBase64String(10);
 */
export function generateBase64String(length = 10): string {
  // Generate a random string
  const originalString = generateRandomString(length);
  
  // Convert to base64 (using Buffer in Node.js)
  // This is a simplified version that works in browsers too
  return btoa(originalString);
}

/**
 * Generates a string with URL-encoded content for testing.
 * 
 * @param length - The length of the original string before encoding
 * @returns A URL-encoded string
 * 
 * @example
 * // Generate URL-encoded content
 * const urlEncodedContent = generateURLEncodedString(10);
 */
export function generateURLEncodedString(length = 10): string {
  // Generate a random string with special characters
  const specialChars = '!@#$%^&*()=+[]{}\\|;:'",./<>?`~ ';
  const originalString = generateRandomString(length, 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' + specialChars);
  
  // URL encode the string
  return encodeURIComponent(originalString);
}

/**
 * Generates a string with emoji characters for testing.
 * 
 * @param count - The number of emoji characters to include
 * @returns A string with emoji characters
 * 
 * @example
 * // Generate a string with 3 emoji characters
 * const emojiString = generateEmojiString(3);
 */
export function generateEmojiString(count = 3): string {
  // Common emoji Unicode ranges
  const emojiRanges = [
    [0x1F600, 0x1F64F], // Emoticons
    [0x1F300, 0x1F5FF], // Misc Symbols and Pictographs
    [0x1F680, 0x1F6FF], // Transport and Map
    [0x2600, 0x26FF],   // Misc symbols
    [0x2700, 0x27BF],   // Dingbats
    [0x1F900, 0x1F9FF]  // Supplemental Symbols and Pictographs
  ];
  
  let result = '';
  
  for (let i = 0; i < count; i++) {
    // Choose a random emoji range
    const range = emojiRanges[Math.floor(Math.random() * emojiRanges.length)];
    
    // Generate a random code point within the range
    const codePoint = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    
    // Convert the code point to a character and add it to the result
    result += String.fromCodePoint(codePoint);
  }
  
  return result;
}

/**
 * Generates a string with control characters for testing.
 * 
 * @param length - The length of the string to generate
 * @returns A string with control characters
 * 
 * @example
 * // Generate a string with 5 control characters
 * const controlString = generateControlCharacterString(5);
 */
export function generateControlCharacterString(length = 5): string {
  // Control characters (ASCII 0-31, excluding common whitespace)
  const controlChars = [0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
  
  let result = '';
  
  for (let i = 0; i < length; i++) {
    // Choose a random control character
    const charCode = controlChars[Math.floor(Math.random() * controlChars.length)];
    
    // Convert the code to a character and add it to the result
    result += String.fromCharCode(charCode);
  }
  
  return result;
}

/**
 * Generates a string with whitespace characters for testing.
 * 
 * @param length - The length of the string to generate
 * @returns A string with whitespace characters
 * 
 * @example
 * // Generate a string with 5 whitespace characters
 * const whitespaceString = generateWhitespaceString(5);
 */
export function generateWhitespaceString(length = 5): string {
  // Whitespace characters
  const whitespaceChars = [' ', '\t', '\n', '\r', '\f', '\v'];
  
  let result = '';
  
  for (let i = 0; i < length; i++) {
    // Choose a random whitespace character
    const char = whitespaceChars[Math.floor(Math.random() * whitespaceChars.length)];
    
    // Add it to the result
    result += char;
  }
  
  return result;
}

/**
 * Generates a string with a specific character set for testing.
 * 
 * @param length - The length of the string to generate
 * @param charset - The character set to use
 * @returns A string with characters from the specified character set
 * 
 * @example
 * // Generate a string with 10 hexadecimal characters
 * const hexString = generateStringWithCharset(10, '0123456789ABCDEF');
 */
export function generateStringWithCharset(length: number, charset: string): string {
  return generateRandomString(length, charset);
}

/**
 * Generates a string with a specific prefix for testing.
 * 
 * @param prefix - The prefix to use
 * @param length - The total length of the string (including prefix)
 * @returns A string with the specified prefix
 * 
 * @example
 * // Generate a string with prefix 'test-' and total length 10
 * const prefixedString = generateStringWithPrefix('test-', 10); // e.g., 'test-abcde'
 */
export function generateStringWithPrefix(prefix: string, length: number): string {
  if (prefix.length >= length) {
    return prefix.substring(0, length);
  }
  
  const remainingLength = length - prefix.length;
  return prefix + generateRandomString(remainingLength);
}

/**
 * Generates a string with a specific suffix for testing.
 * 
 * @param suffix - The suffix to use
 * @param length - The total length of the string (including suffix)
 * @returns A string with the specified suffix
 * 
 * @example
 * // Generate a string with suffix '.txt' and total length 10
 * const suffixedString = generateStringWithSuffix('.txt', 10); // e.g., 'abcde.txt'
 */
export function generateStringWithSuffix(suffix: string, length: number): string {
  if (suffix.length >= length) {
    return suffix.substring(suffix.length - length);
  }
  
  const remainingLength = length - suffix.length;
  return generateRandomString(remainingLength) + suffix;
}

/**
 * Generates a string with a specific substring at a random position for testing.
 * 
 * @param substring - The substring to include
 * @param totalLength - The total length of the string
 * @returns A string containing the specified substring
 * 
 * @example
 * // Generate a string of length 15 containing the substring 'test'
 * const containingString = generateStringContainingSubstring('test', 15);
 */
export function generateStringContainingSubstring(substring: string, totalLength: number): string {
  if (substring.length >= totalLength) {
    return substring.substring(0, totalLength);
  }
  
  const remainingLength = totalLength - substring.length;
  const prefixLength = Math.floor(Math.random() * (remainingLength + 1));
  const suffixLength = remainingLength - prefixLength;
  
  const prefix = generateRandomString(prefixLength);
  const suffix = generateRandomString(suffixLength);
  
  return prefix + substring + suffix;
}

/**
 * Generates a palindrome string for testing.
 * 
 * @param length - The length of the palindrome to generate
 * @returns A palindrome string
 * 
 * @example
 * // Generate a palindrome of length 7
 * const palindrome = generatePalindrome(7); // e.g., 'abcdcba'
 */
export function generatePalindrome(length: number): string {
  if (length <= 0) {
    return '';
  }
  
  const halfLength = Math.floor(length / 2);
  const isOdd = length % 2 === 1;
  
  const firstHalf = generateRandomString(halfLength);
  let secondHalf = firstHalf.split('').reverse().join('');
  
  if (isOdd) {
    const middle = generateRandomString(1);
    return firstHalf + middle + secondHalf;
  } else {
    return firstHalf + secondHalf;
  }
}

/**
 * Generates a string with alternating case for testing.
 * 
 * @param length - The length of the string to generate
 * @returns A string with alternating case
 * 
 * @example
 * // Generate a string with alternating case of length 10
 * const alternatingCase = generateAlternatingCase(10); // e.g., 'AbCdEfGhIj'
 */
export function generateAlternatingCase(length: number): string {
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const char = generateRandomAlphabeticString(1);
    result += i % 2 === 0 ? char.toUpperCase() : char.toLowerCase();
  }
  
  return result;
}

/**
 * Generates a camelCase string for testing.
 * 
 * @param wordCount - The number of words in the camelCase string
 * @returns A camelCase string
 * 
 * @example
 * // Generate a camelCase string with 3 words
 * const camelCase = generateCamelCaseString(3); // e.g., 'firstSecondThird'
 */
export function generateCamelCaseString(wordCount = 3): string {
  if (wordCount <= 0) {
    return '';
  }
  
  const words: string[] = [];
  
  for (let i = 0; i < wordCount; i++) {
    const word = generateRandomAlphabeticString(Math.floor(Math.random() * 5) + 3).toLowerCase();
    
    if (i === 0) {
      words.push(word);
    } else {
      words.push(word.charAt(0).toUpperCase() + word.slice(1));
    }
  }
  
  return words.join('');
}

/**
 * Generates a snake_case string for testing.
 * 
 * @param wordCount - The number of words in the snake_case string
 * @returns A snake_case string
 * 
 * @example
 * // Generate a snake_case string with 3 words
 * const snakeCase = generateSnakeCaseString(3); // e.g., 'first_second_third'
 */
export function generateSnakeCaseString(wordCount = 3): string {
  if (wordCount <= 0) {
    return '';
  }
  
  const words: string[] = [];
  
  for (let i = 0; i < wordCount; i++) {
    const word = generateRandomAlphabeticString(Math.floor(Math.random() * 5) + 3).toLowerCase();
    words.push(word);
  }
  
  return words.join('_');
}

/**
 * Generates a kebab-case string for testing.
 * 
 * @param wordCount - The number of words in the kebab-case string
 * @returns A kebab-case string
 * 
 * @example
 * // Generate a kebab-case string with 3 words
 * const kebabCase = generateKebabCaseString(3); // e.g., 'first-second-third'
 */
export function generateKebabCaseString(wordCount = 3): string {
  if (wordCount <= 0) {
    return '';
  }
  
  const words: string[] = [];
  
  for (let i = 0; i < wordCount; i++) {
    const word = generateRandomAlphabeticString(Math.floor(Math.random() * 5) + 3).toLowerCase();
    words.push(word);
  }
  
  return words.join('-');
}

/**
 * Generates a PascalCase string for testing.
 * 
 * @param wordCount - The number of words in the PascalCase string
 * @returns A PascalCase string
 * 
 * @example
 * // Generate a PascalCase string with 3 words
 * const pascalCase = generatePascalCaseString(3); // e.g., 'FirstSecondThird'
 */
export function generatePascalCaseString(wordCount = 3): string {
  if (wordCount <= 0) {
    return '';
  }
  
  const words: string[] = [];
  
  for (let i = 0; i < wordCount; i++) {
    const word = generateRandomAlphabeticString(Math.floor(Math.random() * 5) + 3).toLowerCase();
    words.push(word.charAt(0).toUpperCase() + word.slice(1));
  }
  
  return words.join('');
}

/**
 * Generates a string with a specific Levenshtein distance from a target string.
 * 
 * @param target - The target string
 * @param distance - The desired Levenshtein distance
 * @returns A string with the specified Levenshtein distance from the target
 * 
 * @example
 * // Generate a string with Levenshtein distance 2 from 'hello'
 * const similarString = generateStringWithLevenshteinDistance('hello', 2); // e.g., 'hallo'
 */
export function generateStringWithLevenshteinDistance(target: string, distance: number): string {
  if (distance <= 0) {
    return target;
  }
  
  if (distance >= target.length) {
    // If distance is greater than or equal to target length, generate a completely different string
    return generateRandomString(target.length);
  }
  
  // Make a copy of the target string as an array of characters
  const result = target.split('');
  
  // Apply random operations (substitution, insertion, deletion) to achieve the desired distance
  let currentDistance = 0;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  while (currentDistance < distance) {
    const operation = Math.floor(Math.random() * 3); // 0: substitution, 1: insertion, 2: deletion
    
    switch (operation) {
      case 0: // Substitution
        if (result.length > 0) {
          const index = Math.floor(Math.random() * result.length);
          const originalChar = result[index];
          let newChar = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
          
          // Ensure the new character is different from the original
          while (newChar === originalChar) {
            newChar = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
          }
          
          result[index] = newChar;
          currentDistance++;
        }
        break;
        
      case 1: // Insertion
        const insertIndex = Math.floor(Math.random() * (result.length + 1));
        const charToInsert = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        result.splice(insertIndex, 0, charToInsert);
        currentDistance++;
        break;
        
      case 2: // Deletion
        if (result.length > 0) {
          const deleteIndex = Math.floor(Math.random() * result.length);
          result.splice(deleteIndex, 1);
          currentDistance++;
        }
        break;
    }
  }
  
  return result.join('');
}

/**
 * Generates a string with a specific Hamming distance from a target string.
 * 
 * @param target - The target string
 * @param distance - The desired Hamming distance
 * @returns A string with the specified Hamming distance from the target
 * 
 * @example
 * // Generate a string with Hamming distance 2 from 'hello'
 * const similarString = generateStringWithHammingDistance('hello', 2); // e.g., 'helxo'
 */
export function generateStringWithHammingDistance(target: string, distance: number): string {
  if (distance <= 0) {
    return target;
  }
  
  if (distance > target.length) {
    throw new Error('Hamming distance cannot be greater than string length');
  }
  
  // Make a copy of the target string as an array of characters
  const result = target.split('');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  // Create an array of indices to modify
  const indices = Array.from({ length: target.length }, (_, i) => i);
  
  // Shuffle the indices
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  // Modify the first 'distance' indices
  for (let i = 0; i < distance; i++) {
    const index = indices[i];
    const originalChar = result[index];
    let newChar = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    
    // Ensure the new character is different from the original
    while (newChar === originalChar) {
      newChar = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    
    result[index] = newChar;
  }
  
  return result.join('');
}

/**
 * Generates a string with a specific Jaro-Winkler similarity to a target string.
 * 
 * @param target - The target string
 * @param similarity - The desired Jaro-Winkler similarity (0-1)
 * @returns A string with approximately the specified similarity to the target
 * 
 * @example
 * // Generate a string with Jaro-Winkler similarity of about 0.8 to 'hello'
 * const similarString = generateStringWithJaroWinklerSimilarity('hello', 0.8);
 */
export function generateStringWithJaroWinklerSimilarity(target: string, similarity: number): string {
  if (similarity < 0 || similarity > 1) {
    throw new Error('Similarity must be between 0 and 1');
  }
  
  if (similarity === 1) {
    return target;
  }
  
  if (similarity === 0) {
    // Generate a completely different string of the same length
    return generateRandomString(target.length);
  }
  
  // For simplicity, we'll approximate by using Hamming distance
  // Jaro-Winkler is complex, but we can roughly map similarity to Hamming distance
  const maxDistance = target.length;
  const approximateDistance = Math.round(maxDistance * (1 - similarity));
  
  // Ensure we have at least some difference for similarity < 1
  const distance = Math.max(1, approximateDistance);
  
  return generateStringWithHammingDistance(target, distance);
}

/**
 * Generates a string with a specific percentage of characters from a target string.
 * 
 * @param target - The target string
 * @param percentage - The percentage of characters to keep (0-100)
 * @returns A string with the specified percentage of characters from the target
 * 
 * @example
 * // Generate a string with 70% of characters from 'hello world'
 * const partialString = generateStringWithPercentageOfCharacters('hello world', 70);
 */
export function generateStringWithPercentageOfCharacters(target: string, percentage: number): string {
  if (percentage < 0 || percentage > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }
  
  if (percentage === 100) {
    return target;
  }
  
  if (percentage === 0) {
    // Generate a completely different string of the same length
    return generateRandomString(target.length);
  }
  
  // Calculate how many characters to keep
  const charsToKeep = Math.round((percentage / 100) * target.length);
  
  // Make a copy of the target string as an array of characters
  const result = target.split('');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  // Create an array of indices to modify
  const indices = Array.from({ length: target.length }, (_, i) => i);
  
  // Shuffle the indices
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  // Modify all but the first 'charsToKeep' indices
  for (let i = charsToKeep; i < indices.length; i++) {
    const index = indices[i];
    const originalChar = result[index];
    let newChar = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    
    // Ensure the new character is different from the original
    while (newChar === originalChar) {
      newChar = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    
    result[index] = newChar;
  }
  
  return result.join('');
}