/**
 * Test fixtures for string formatting utilities.
 * These fixtures are used to test formatting functions across all journey services.
 */

/**
 * Test fixture for capitalizeFirstLetter function
 */
export interface CapitalizeFixture {
  input: string | null | undefined;
  expected: string;
  description: string;
}

/**
 * Collection of test fixtures for capitalizeFirstLetter function
 */
export const capitalizeFixtures: CapitalizeFixture[] = [
  {
    input: 'hello',
    expected: 'Hello',
    description: 'Basic lowercase string'
  },
  {
    input: 'Hello',
    expected: 'Hello',
    description: 'Already capitalized string'
  },
  {
    input: 'hELLO',
    expected: 'HELLO',
    description: 'Mixed case string'
  },
  {
    input: 'h',
    expected: 'H',
    description: 'Single character'
  },
  {
    input: '123abc',
    expected: '123abc',
    description: 'String starting with number'
  },
  {
    input: ' hello',
    expected: ' hello',
    description: 'String starting with space'
  },
  {
    input: '',
    expected: '',
    description: 'Empty string'
  },
  {
    input: null,
    expected: '',
    description: 'Null input'
  },
  {
    input: undefined,
    expected: '',
    description: 'Undefined input'
  },
  {
    input: 'café',
    expected: 'Café',
    description: 'String with accent'
  },
  {
    input: 'água',
    expected: 'Água',
    description: 'Portuguese word with accent'
  },
  {
    input: 'ñandu',
    expected: 'Ñandu',
    description: 'Spanish word with tilde'
  }
];

/**
 * Test fixture for truncate function
 */
export interface TruncateFixture {
  input: string | null | undefined;
  length: number;
  expected: string;
  description: string;
}

/**
 * Collection of test fixtures for truncate function
 */
export const truncateFixtures: TruncateFixture[] = [
  {
    input: 'Hello world',
    length: 5,
    expected: 'Hello...',
    description: 'Basic truncation'
  },
  {
    input: 'Hello',
    length: 5,
    expected: 'Hello',
    description: 'String equal to max length'
  },
  {
    input: 'Hi',
    length: 5,
    expected: 'Hi',
    description: 'String shorter than max length'
  },
  {
    input: 'Hello world',
    length: 0,
    expected: '...',
    description: 'Zero length truncation'
  },
  {
    input: 'Hello world',
    length: -1,
    expected: '...',
    description: 'Negative length truncation'
  },
  {
    input: '',
    length: 5,
    expected: '',
    description: 'Empty string'
  },
  {
    input: null,
    length: 5,
    expected: '',
    description: 'Null input'
  },
  {
    input: undefined,
    length: 5,
    expected: '',
    description: 'Undefined input'
  },
  {
    input: 'Olá mundo',
    length: 3,
    expected: 'Olá...',
    description: 'String with accented characters'
  },
  {
    input: '😀 Emoji test',
    length: 7,
    expected: '😀 Emoji...',
    description: 'String with emoji'
  },
  {
    input: 'A very long string that needs to be truncated for display purposes',
    length: 20,
    expected: 'A very long string t...',
    description: 'Long string truncation'
  }
];