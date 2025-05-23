/**
 * Test fixtures for Brazilian CPF validation
 * 
 * This file provides comprehensive test fixtures for validating Brazilian CPF numbers,
 * including valid CPFs with different formatting, invalid CPFs with format errors,
 * checksum failures, and edge cases.
 * 
 * These fixtures are critical for ensuring the isValidCPF utility properly validates
 * identifiers across all journey services handling Brazilian user data.
 */

/**
 * Interface for CPF test case
 */
export interface CPFTestCase {
  /** The CPF value to test */
  value: string;
  /** Description of the test case */
  description: string;
}

/**
 * Interface for CPF test fixture set
 */
export interface CPFFixtureSet {
  /** Name of the fixture set */
  name: string;
  /** Description of the fixture set */
  description: string;
  /** Test cases in this fixture set */
  cases: CPFTestCase[];
}

/**
 * Valid CPF test fixtures with proper formatting (xxx.xxx.xxx-xx)
 */
export const VALID_FORMATTED_CPFS: CPFTestCase[] = [
  {
    value: '529.982.247-25',
    description: 'Valid CPF with standard formatting',
  },
  {
    value: '100.954.020-90',
    description: 'Valid CPF with standard formatting',
  },
  {
    value: '074.534.930-47',
    description: 'Valid CPF with standard formatting',
  },
];

/**
 * Valid CPF test fixtures without any formatting (xxxxxxxxxxx)
 */
export const VALID_UNFORMATTED_CPFS: CPFTestCase[] = [
  {
    value: '52998224725',
    description: 'Valid CPF without formatting',
  },
  {
    value: '10095402090',
    description: 'Valid CPF without formatting',
  },
  {
    value: '07453493047',
    description: 'Valid CPF without formatting',
  },
];

/**
 * Valid CPF test fixtures with partial formatting
 */
export const VALID_PARTIALLY_FORMATTED_CPFS: CPFTestCase[] = [
  {
    value: '529.98224725',
    description: 'Valid CPF with partial formatting (first dot only)',
  },
  {
    value: '529982.24725',
    description: 'Valid CPF with partial formatting (second dot only)',
  },
  {
    value: '52998224725-',
    description: 'Valid CPF with partial formatting (hyphen only)',
  },
  {
    value: '529.982.24725',
    description: 'Valid CPF with partial formatting (dots but no hyphen)',
  },
  {
    value: '52998224-25',
    description: 'Valid CPF with partial formatting (hyphen but no dots)',
  },
];

/**
 * Invalid CPF test fixtures with incorrect length
 */
export const INVALID_LENGTH_CPFS: CPFTestCase[] = [
  {
    value: '5299822472',
    description: 'Invalid CPF with only 10 digits (too short)',
  },
  {
    value: '529.982.247-2',
    description: 'Invalid CPF with only 10 digits and formatting (too short)',
  },
  {
    value: '529982247256',
    description: 'Invalid CPF with 12 digits (too long)',
  },
  {
    value: '529.982.247-256',
    description: 'Invalid CPF with 12 digits and formatting (too long)',
  },
  {
    value: '',
    description: 'Invalid CPF with empty string',
  },
];

/**
 * Invalid CPF test fixtures with all digits the same (known invalid pattern)
 */
export const INVALID_SAME_DIGITS_CPFS: CPFTestCase[] = [
  {
    value: '00000000000',
    description: 'Invalid CPF with all zeros',
  },
  {
    value: '11111111111',
    description: 'Invalid CPF with all ones',
  },
  {
    value: '22222222222',
    description: 'Invalid CPF with all twos',
  },
  {
    value: '33333333333',
    description: 'Invalid CPF with all threes',
  },
  {
    value: '44444444444',
    description: 'Invalid CPF with all fours',
  },
  {
    value: '55555555555',
    description: 'Invalid CPF with all fives',
  },
  {
    value: '66666666666',
    description: 'Invalid CPF with all sixes',
  },
  {
    value: '77777777777',
    description: 'Invalid CPF with all sevens',
  },
  {
    value: '88888888888',
    description: 'Invalid CPF with all eights',
  },
  {
    value: '99999999999',
    description: 'Invalid CPF with all nines',
  },
  {
    value: '000.000.000-00',
    description: 'Invalid CPF with all zeros (formatted)',
  },
  {
    value: '111.111.111-11',
    description: 'Invalid CPF with all ones (formatted)',
  },
];

/**
 * Invalid CPF test fixtures with incorrect check digits
 */
export const INVALID_CHECKSUM_CPFS: CPFTestCase[] = [
  {
    value: '529.982.247-26', // Changed last digit from 25 to 26
    description: 'Invalid CPF with incorrect second check digit',
  },
  {
    value: '529.982.247-15', // Changed first check digit from 2 to 1
    description: 'Invalid CPF with incorrect first check digit',
  },
  {
    value: '529.982.247-35', // Changed both check digits
    description: 'Invalid CPF with both check digits incorrect',
  },
  {
    value: '52998224726', // Unformatted with incorrect check digit
    description: 'Invalid unformatted CPF with incorrect check digit',
  },
];

/**
 * Invalid CPF test fixtures with invalid characters
 */
export const INVALID_CHARACTER_CPFS: CPFTestCase[] = [
  {
    value: '529.982.247-2A',
    description: 'Invalid CPF with letter character',
  },
  {
    value: '529.982.247@25',
    description: 'Invalid CPF with special character',
  },
  {
    value: '529,982,247-25', // Using commas instead of dots
    description: 'Invalid CPF with incorrect separator characters',
  },
  {
    value: '529.982.247 25', // Space instead of hyphen
    description: 'Invalid CPF with space instead of hyphen',
  },
];

/**
 * Complete set of valid CPF test fixtures
 */
export const VALID_CPF_FIXTURES: CPFFixtureSet = {
  name: 'Valid CPFs',
  description: 'Collection of valid CPF numbers with various formatting styles',
  cases: [
    ...VALID_FORMATTED_CPFS,
    ...VALID_UNFORMATTED_CPFS,
    ...VALID_PARTIALLY_FORMATTED_CPFS,
  ],
};

/**
 * Complete set of invalid CPF test fixtures
 */
export const INVALID_CPF_FIXTURES: CPFFixtureSet = {
  name: 'Invalid CPFs',
  description: 'Collection of invalid CPF numbers with various error conditions',
  cases: [
    ...INVALID_LENGTH_CPFS,
    ...INVALID_SAME_DIGITS_CPFS,
    ...INVALID_CHECKSUM_CPFS,
    ...INVALID_CHARACTER_CPFS,
  ],
};

/**
 * All CPF test fixtures combined
 */
export const ALL_CPF_FIXTURES: CPFFixtureSet[] = [
  VALID_CPF_FIXTURES,
  INVALID_CPF_FIXTURES,
];

/**
 * Edge cases for CPF validation
 */
export const CPF_EDGE_CASES: CPFTestCase[] = [
  {
    value: ' ',
    description: 'CPF with only whitespace',
  },
  {
    value: '   529.982.247-25   ',
    description: 'Valid CPF with surrounding whitespace',
  },
  {
    value: '529. 982. 247- 25',
    description: 'CPF with extra spaces between formatting characters',
  },
];