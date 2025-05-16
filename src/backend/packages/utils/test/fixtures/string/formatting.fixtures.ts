/**
 * Test fixtures for string formatting utilities
 * 
 * This file contains comprehensive test fixtures for string formatting utility functions
 * (capitalizeFirstLetter and truncate) with various test cases covering normal usage,
 * edge cases, and error scenarios. These fixtures enable thorough testing of string
 * formatting behavior across the application.
 */

/**
 * Interface for capitalization test fixtures
 */
export interface CapitalizeFixtures {
  normal: {
    input: string;
    expected: string;
  }[];
  alreadyCapitalized: {
    input: string;
    expected: string;
  }[];
  edgeCases: {
    input: string;
    expected: string;
  }[];
  errorCases: {
    input: any;
    expected: string;
  }[];
}

/**
 * Interface for truncation test fixtures
 */
export interface TruncateFixtures {
  normal: {
    input: string;
    length: number;
    expected: string;
  }[];
  noTruncationNeeded: {
    input: string;
    length: number;
    expected: string;
  }[];
  edgeCases: {
    input: string;
    length: number;
    expected: string;
  }[];
  errorCases: {
    input: any;
    length: number;
    expected: string;
  }[];
}

/**
 * Test fixtures for capitalizeFirstLetter function
 */
export const capitalizeFixtures: CapitalizeFixtures = {
  // Normal capitalization cases
  normal: [
    { input: 'hello', expected: 'Hello' },
    { input: 'world', expected: 'World' },
    { input: 'journey', expected: 'Journey' },
    { input: 'austa', expected: 'Austa' }
  ],
  // Already capitalized strings
  alreadyCapitalized: [
    { input: 'Hello', expected: 'Hello' },
    { input: 'World', expected: 'World' },
    { input: 'Journey', expected: 'Journey' },
    { input: 'Austa', expected: 'Austa' }
  ],
  // Edge cases
  edgeCases: [
    { input: '', expected: '' },                // Empty string
    { input: 'a', expected: 'A' },              // Single character
    { input: '1hello', expected: '1hello' },     // Starts with number
    { input: '_hello', expected: '_hello' },     // Starts with symbol
    { input: 'josé', expected: 'José' },         // Accented character
    { input: 'çedilha', expected: 'Çedilha' },   // Special character
    { input: ' hello', expected: ' hello' }      // Starts with space
  ],
  // Error cases
  errorCases: [
    { input: null, expected: '' },              // Null input
    { input: undefined, expected: '' },         // Undefined input
    { input: 123, expected: '' },               // Number input
    { input: {}, expected: '' },                // Object input
    { input: [], expected: '' }                 // Array input
  ]
};

/**
 * Test fixtures for truncate function
 */
export const truncateFixtures: TruncateFixtures = {
  // Normal truncation cases
  normal: [
    { 
      input: 'This is a long string that needs to be truncated', 
      length: 10, 
      expected: 'This is a ...' 
    },
    { 
      input: 'Another example of a string that exceeds the limit', 
      length: 15, 
      expected: 'Another example...' 
    },
    { 
      input: 'Short text with many words to be cut off at some point', 
      length: 20, 
      expected: 'Short text with many...' 
    }
  ],
  // Cases where no truncation is needed
  noTruncationNeeded: [
    { 
      input: 'Short', 
      length: 10, 
      expected: 'Short' 
    },
    { 
      input: 'Hello World', 
      length: 11, 
      expected: 'Hello World' 
    },
    { 
      input: 'Exact length', 
      length: 12, 
      expected: 'Exact length' 
    }
  ],
  // Edge cases
  edgeCases: [
    { input: '', length: 5, expected: '' },                // Empty string
    { input: 'Hello', length: 0, expected: '...' },        // Zero length
    { input: 'Hello', length: -5, expected: '...' },       // Negative length
    { input: '12345', length: 5, expected: '12345' },      // Exact match
    { input: 'Hello World', length: 5, expected: 'Hello...' }, // Cut in middle of word
    { 
      input: 'Special characters: áéíóú', 
      length: 20, 
      expected: 'Special characters:...' 
    }
  ],
  // Error cases
  errorCases: [
    { input: null, length: 5, expected: '' },             // Null input
    { input: undefined, length: 5, expected: '' },        // Undefined input
    { input: 123, length: 5, expected: '' },              // Number input
    { input: {}, length: 5, expected: '' },               // Object input
    { input: [], length: 5, expected: '' }                // Array input
  ]
};

/**
 * Export all formatting fixtures
 */
export const formattingFixtures = {
  capitalize: capitalizeFixtures,
  truncate: truncateFixtures
};