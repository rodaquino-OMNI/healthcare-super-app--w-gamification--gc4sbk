/**
 * Test fixtures for string formatting utility functions.
 * These fixtures provide standardized test cases for capitalizeFirstLetter and truncate functions
 * to ensure consistent text presentation across the application.
 */

/**
 * Interface for capitalizeFirstLetter test fixtures
 */
export interface CapitalizeFirstLetterFixture {
  /** Description of the test case */
  description: string;
  /** Input string to be capitalized */
  input: string | null | undefined;
  /** Expected output after capitalization */
  expected: string;
  /** Whether this is an error case */
  isErrorCase?: boolean;
}

/**
 * Interface for truncate test fixtures
 */
export interface TruncateFixture {
  /** Description of the test case */
  description: string;
  /** Input string to be truncated */
  input: string | null | undefined;
  /** Maximum length for truncation */
  length: number;
  /** Expected output after truncation */
  expected: string;
  /** Whether this is an error case */
  isErrorCase?: boolean;
}

/**
 * Test fixtures for capitalizeFirstLetter function
 */
export const capitalizeFirstLetterFixtures: CapitalizeFirstLetterFixture[] = [
  // Normal cases
  {
    description: 'Capitalizes first letter of a lowercase string',
    input: 'hello world',
    expected: 'Hello world',
  },
  {
    description: 'Capitalizes single character string',
    input: 'a',
    expected: 'A',
  },
  {
    description: 'Handles already capitalized string',
    input: 'Hello world',
    expected: 'Hello world',
  },
  {
    description: 'Handles string with first letter already capitalized',
    input: 'Hello',
    expected: 'Hello',
  },
  {
    description: 'Handles mixed case string',
    input: 'hELLO',
    expected: 'HELLO',
  },
  
  // Special character cases
  {
    description: 'Handles string with non-alphabetic first character (number)',
    input: '123 test',
    expected: '123 test',
  },
  {
    description: 'Handles string with non-alphabetic first character (symbol)',
    input: '!test',
    expected: '!test',
  },
  {
    description: 'Handles string with space as first character',
    input: ' test',
    expected: ' test',
  },
  
  // Multilingual cases
  {
    description: 'Handles Portuguese characters',
    input: 'olá mundo',
    expected: 'Olá mundo',
  },
  {
    description: 'Handles accented characters',
    input: 'ética profissional',
    expected: 'Ética profissional',
  },
  {
    description: 'Handles special Portuguese characters',
    input: 'ção iniciada',
    expected: 'Ção iniciada',
  },
  
  // Edge cases
  {
    description: 'Handles empty string',
    input: '',
    expected: '',
  },
  
  // Error cases
  {
    description: 'Handles null input',
    input: null,
    expected: '',
    isErrorCase: true,
  },
  {
    description: 'Handles undefined input',
    input: undefined,
    expected: '',
    isErrorCase: true,
  },
];

/**
 * Test fixtures for truncate function
 */
export const truncateFixtures: TruncateFixture[] = [
  // Normal cases
  {
    description: 'Truncates string longer than specified length',
    input: 'This is a long string that needs to be truncated',
    length: 10,
    expected: 'This is a ...',
  },
  {
    description: 'Does not truncate string shorter than specified length',
    input: 'Short',
    length: 10,
    expected: 'Short',
  },
  {
    description: 'Does not truncate string equal to specified length',
    input: 'Exactly 10',
    length: 10,
    expected: 'Exactly 10',
  },
  {
    description: 'Truncates at exact boundary',
    input: 'Exactly 10!',
    length: 10,
    expected: 'Exactly 10...',
  },
  
  // Special character cases
  {
    description: 'Handles string with special characters',
    input: 'Test with @#$%^&*() special chars',
    length: 15,
    expected: 'Test with @#$%...',
  },
  {
    description: 'Handles string with emojis',
    input: 'Test with 😀 emoji',
    length: 10,
    expected: 'Test with ...',
  },
  
  // Multilingual cases
  {
    description: 'Handles Portuguese text',
    input: 'Olá mundo, como vai você hoje?',
    length: 12,
    expected: 'Olá mundo, c...',
  },
  {
    description: 'Handles text with accented characters',
    input: 'Informações sobre saúde e bem-estar',
    length: 15,
    expected: 'Informações sob...',
  },
  
  // Edge cases
  {
    description: 'Handles empty string',
    input: '',
    length: 10,
    expected: '',
  },
  {
    description: 'Handles zero length truncation',
    input: 'Test string',
    length: 0,
    expected: '...',
  },
  {
    description: 'Handles negative length truncation',
    input: 'Test string',
    length: -5,
    expected: '...',
  },
  
  // Error cases
  {
    description: 'Handles null input',
    input: null,
    length: 10,
    expected: '',
    isErrorCase: true,
  },
  {
    description: 'Handles undefined input',
    input: undefined,
    length: 10,
    expected: '',
    isErrorCase: true,
  },
];