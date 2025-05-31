/**
 * Test fixtures for Brazilian CPF validation.
 * These fixtures are used to test the isValidCPF function across all journey services.
 */

/**
 * Interface for CPF validation test cases
 */
export interface CPFTestCase {
  /** The CPF string to test */
  input: string;
  /** The expected validation result */
  expected: boolean;
  /** Optional description of the test case */
  description?: string;
}

/**
 * Valid CPF test cases with different formats
 */
export const validCPFTestCases: CPFTestCase[] = [
  {
    input: '529.982.247-25',
    expected: true,
    description: 'Valid CPF with standard formatting (dots and dash)'
  },
  {
    input: '52998224725',
    expected: true,
    description: 'Valid CPF without formatting'
  },
  {
    input: '529 982 247 25',
    expected: true,
    description: 'Valid CPF with spaces'
  },
  {
    input: '529-982-247-25',
    expected: true,
    description: 'Valid CPF with all dashes'
  },
  {
    input: '111.444.777-35',
    expected: true,
    description: 'Valid CPF with repeating digit patterns but valid check digits'
  },
  {
    input: '071.488.954-23',
    expected: true,
    description: 'Valid CPF starting with zero'
  },
  {
    input: '  539.315.127-22  ',
    expected: true,
    description: 'Valid CPF with surrounding whitespace'
  },
  {
    input: '987.654.321-00',
    expected: true,
    description: 'Valid CPF with sequential digits but valid check digits'
  }
];

/**
 * Invalid CPF test cases covering various error scenarios
 */
export const invalidCPFTestCases: CPFTestCase[] = [
  {
    input: '529.982.247-26', // Changed last digit
    expected: false,
    description: 'Invalid CPF with incorrect verification digit'
  },
  {
    input: '111.111.111-11',
    expected: false,
    description: 'Invalid CPF with all digits the same'
  },
  {
    input: '000.000.000-00',
    expected: false,
    description: 'Invalid CPF with all zeros'
  },
  {
    input: '123.456.789-10',
    expected: false,
    description: 'Invalid CPF with incorrect check digits'
  },
  {
    input: '529.982.247',
    expected: false,
    description: 'Invalid CPF with fewer than 11 digits'
  },
  {
    input: '529.982.247-25-01',
    expected: false,
    description: 'Invalid CPF with more than 11 digits'
  },
  {
    input: '222.222.222-22',
    expected: false,
    description: 'Invalid CPF with repeated digits (2)'
  },
  {
    input: '333.333.333-33',
    expected: false,
    description: 'Invalid CPF with repeated digits (3)'
  },
  {
    input: '444.444.444-44',
    expected: false,
    description: 'Invalid CPF with repeated digits (4)'
  },
  {
    input: '555.555.555-55',
    expected: false,
    description: 'Invalid CPF with repeated digits (5)'
  },
  {
    input: '666.666.666-66',
    expected: false,
    description: 'Invalid CPF with repeated digits (6)'
  },
  {
    input: '777.777.777-77',
    expected: false,
    description: 'Invalid CPF with repeated digits (7)'
  },
  {
    input: '888.888.888-88',
    expected: false,
    description: 'Invalid CPF with repeated digits (8)'
  },
  {
    input: '999.999.999-99',
    expected: false,
    description: 'Invalid CPF with repeated digits (9)'
  }
];

/**
 * Edge cases for CPF validation
 */
export const cpfEdgeCases: CPFTestCase[] = [
  {
    input: '',
    expected: false,
    description: 'Empty string'
  },
  {
    input: '   ',
    expected: false,
    description: 'Whitespace only'
  },
  {
    input: 'ABC.DEF.GHI-JK',
    expected: false,
    description: 'Non-numeric characters that cannot be cleaned'
  },
  {
    input: '529.982.247-2A',
    expected: false,
    description: 'CPF with letters mixed with numbers'
  },
  {
    input: '529.982.247-2',
    expected: false,
    description: 'CPF missing the last digit'
  },
  {
    input: '12345678901234567890',
    expected: false,
    description: 'Very long numeric string'
  },
  {
    input: '1',
    expected: false,
    description: 'Single digit'
  },
  {
    input: '5299822472525',
    expected: false,
    description: 'Valid CPF with extra digits'
  }
];

/**
 * Combined test cases for comprehensive testing
 */
export const allCPFTestCases: CPFTestCase[] = [
  ...validCPFTestCases,
  ...invalidCPFTestCases,
  ...cpfEdgeCases
];

/**
 * Common invalid CPF sequences that should always fail validation
 */
export const commonInvalidCPFSequences: string[] = [
  '00000000000',
  '11111111111',
  '22222222222',
  '33333333333',
  '44444444444',
  '55555555555',
  '66666666666',
  '77777777777',
  '88888888888',
  '99999999999',
  '12345678900' // Sequential digits with incorrect check digits
];