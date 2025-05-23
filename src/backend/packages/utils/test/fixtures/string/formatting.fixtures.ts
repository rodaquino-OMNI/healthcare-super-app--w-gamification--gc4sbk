/**
 * Test fixtures for string formatting utility functions.
 * These fixtures provide standardized test cases for the string formatting utilities
 * used across all journey services, ensuring consistent text presentation in UI components and logs.
 */

/**
 * Interface for capitalizeFirstLetter test cases
 */
export interface CapitalizeFirstLetterTestCase {
  /** Description of the test case */
  description: string;
  /** Input string to be capitalized */
  input: string | null | undefined;
  /** Expected output after capitalization */
  expected: string;
  /** Category of the test case */
  category: 'normal' | 'edge' | 'error' | 'multilingual';
}

/**
 * Interface for truncate test cases
 */
export interface TruncateTestCase {
  /** Description of the test case */
  description: string;
  /** Input string to be truncated */
  input: string | null | undefined;
  /** Maximum length for truncation */
  length: number;
  /** Expected output after truncation */
  expected: string;
  /** Category of the test case */
  category: 'normal' | 'edge' | 'error' | 'special';
}

/**
 * Test fixtures for the capitalizeFirstLetter function.
 * Covers normal usage, edge cases, error scenarios, and multilingual strings.
 */
export const capitalizeFirstLetterFixtures: CapitalizeFirstLetterTestCase[] = [
  // Normal cases
  {
    description: 'Capitalizes first letter of a lowercase string',
    input: 'hello world',
    expected: 'Hello world',
    category: 'normal',
  },
  {
    description: 'Capitalizes first letter of a mixed case string',
    input: 'hello World',
    expected: 'Hello World',
    category: 'normal',
  },
  {
    description: 'Handles single character string',
    input: 'a',
    expected: 'A',
    category: 'normal',
  },

  // Edge cases
  {
    description: 'Returns empty string for empty input',
    input: '',
    expected: '',
    category: 'edge',
  },
  {
    description: 'Preserves already capitalized string',
    input: 'Hello world',
    expected: 'Hello world',
    category: 'edge',
  },
  {
    description: 'Handles string with non-alphabetic first character',
    input: '123abc',
    expected: '123abc',
    category: 'edge',
  },
  {
    description: 'Handles string with special character at start',
    input: '@twitter',
    expected: '@twitter',
    category: 'edge',
  },

  // Error cases
  {
    description: 'Returns empty string for null input',
    input: null,
    expected: '',
    category: 'error',
  },
  {
    description: 'Returns empty string for undefined input',
    input: undefined,
    expected: '',
    category: 'error',
  },

  // Multilingual cases
  {
    description: 'Handles Portuguese characters correctly',
    input: 'ação',
    expected: 'Ação',
    category: 'multilingual',
  },
  {
    description: 'Handles Spanish characters correctly',
    input: 'ñandu',
    expected: 'Ñandu',
    category: 'multilingual',
  },
  {
    description: 'Handles French characters correctly',
    input: 'être',
    expected: 'Être',
    category: 'multilingual',
  },
];

/**
 * Test fixtures for the truncate function.
 * Covers normal usage, edge cases, error scenarios, and special character handling.
 */
export const truncateFixtures: TruncateTestCase[] = [
  // Normal cases
  {
    description: 'Does not truncate string shorter than limit',
    input: 'Hello',
    length: 10,
    expected: 'Hello',
    category: 'normal',
  },
  {
    description: 'Does not truncate string equal to limit',
    input: 'Hello',
    length: 5,
    expected: 'Hello',
    category: 'normal',
  },
  {
    description: 'Truncates string longer than limit and adds ellipsis',
    input: 'Hello world',
    length: 5,
    expected: 'Hello...',
    category: 'normal',
  },
  {
    description: 'Truncates long string to specified length',
    input: 'This is a very long string that needs to be truncated',
    length: 10,
    expected: 'This is a ...',
    category: 'normal',
  },

  // Edge cases
  {
    description: 'Handles empty string',
    input: '',
    length: 5,
    expected: '',
    category: 'edge',
  },
  {
    description: 'Handles zero length limit',
    input: 'Hello',
    length: 0,
    expected: '...',
    category: 'edge',
  },
  {
    description: 'Handles negative length limit (treats as zero)',
    input: 'Hello',
    length: -5,
    expected: '...',
    category: 'edge',
  },

  // Error cases
  {
    description: 'Returns empty string for null input',
    input: null,
    length: 5,
    expected: '',
    category: 'error',
  },
  {
    description: 'Returns empty string for undefined input',
    input: undefined,
    length: 5,
    expected: '',
    category: 'error',
  },

  // Special character cases
  {
    description: 'Handles string with emoji correctly',
    input: '😀 Hello world',
    length: 7,
    expected: '😀 Hello...',
    category: 'special',
  },
  {
    description: 'Handles multilingual text correctly',
    input: 'Olá mundo! こんにちは世界!',
    length: 10,
    expected: 'Olá mundo!...',
    category: 'special',
  },
  {
    description: 'Preserves HTML entities when truncating',
    input: '&lt;div&gt;Hello world&lt;/div&gt;',
    length: 15,
    expected: '&lt;div&gt;Hello w...',
    category: 'special',
  },
];