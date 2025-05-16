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
  isValid: boolean;
  /** Description of the test case */
  description: string;
}

/**
 * Valid CPF test cases
 * These CPFs pass the validation algorithm with correct verification digits
 */
export const validCPFTestCases: CPFTestCase[] = [
  // Formatted CPFs (with dots and hyphen)
  {
    input: '529.982.247-25',
    isValid: true,
    description: 'Valid CPF with standard formatting (dots and hyphen)'
  },
  {
    input: '111.444.777-35',
    isValid: true,
    description: 'Valid CPF with standard formatting and repeated digit groups'
  },
  
  // Unformatted CPFs (just digits)
  {
    input: '52998224725',
    isValid: true,
    description: 'Valid CPF without formatting (just digits)'
  },
  {
    input: '11144477735',
    isValid: true,
    description: 'Valid CPF without formatting and with repeated digit groups'
  },
  
  // CPFs with different spacing and formatting
  {
    input: '529 982 247 25',
    isValid: true,
    description: 'Valid CPF with spaces instead of dots and hyphen'
  },
  {
    input: '529-982-247-25',
    isValid: true,
    description: 'Valid CPF with all hyphens as separators'
  },
  
  // Known valid CPFs for testing
  {
    input: '987.654.321-00',
    isValid: true,
    description: 'Valid CPF with descending sequence and specific check digits'
  },
  {
    input: '248.438.034-80',
    isValid: true,
    description: 'Valid CPF with mixed digits'
  }
];

/**
 * Invalid CPF test cases
 * These CPFs fail the validation for various reasons
 */
export const invalidCPFTestCases: CPFTestCase[] = [
  // CPFs with incorrect length
  {
    input: '1234567890', // 10 digits (too short)
    isValid: false,
    description: 'Invalid CPF with only 10 digits (too short)'
  },
  {
    input: '123456789012', // 12 digits (too long)
    isValid: false,
    description: 'Invalid CPF with 12 digits (too long)'
  },
  
  // CPFs with all digits the same (invalid by rule)
  {
    input: '111.111.111-11',
    isValid: false,
    description: 'Invalid CPF with all digits being 1 (fails same-digit check)'
  },
  {
    input: '000.000.000-00',
    isValid: false,
    description: 'Invalid CPF with all digits being 0 (fails same-digit check)'
  },
  {
    input: '999.999.999-99',
    isValid: false,
    description: 'Invalid CPF with all digits being 9 (fails same-digit check)'
  },
  
  // CPFs with incorrect verification digits
  {
    input: '529.982.247-26', // Last digit should be 25
    isValid: false,
    description: 'Invalid CPF with incorrect verification digit'
  },
  {
    input: '529.982.247-35', // Both verification digits are wrong
    isValid: false,
    description: 'Invalid CPF with both verification digits incorrect'
  },
  
  // CPFs with invalid characters
  {
    input: '529.982.24A-25', // Contains a letter
    isValid: false,
    description: 'Invalid CPF containing a letter'
  },
  {
    input: '529.982.247-2', // Missing last digit
    isValid: false,
    description: 'Invalid CPF missing the last digit'
  }
];

/**
 * Edge cases for CPF validation
 * These test boundary conditions and potential error inputs
 */
export const cpfEdgeCases: CPFTestCase[] = [
  // Empty or null-like inputs
  {
    input: '',
    isValid: false,
    description: 'Empty string should be invalid'
  },
  {
    input: ' ',
    isValid: false,
    description: 'String with only whitespace should be invalid'
  },
  
  // Malformed inputs
  {
    input: '529.982.247',
    isValid: false,
    description: 'Partial CPF (missing verification digits)'
  },
  {
    input: '529.982.247-',
    isValid: false,
    description: 'CPF with missing verification digits after hyphen'
  },
  {
    input: '.982.247-25',
    isValid: false,
    description: 'CPF with missing first group of digits'
  },
  
  // Unusual formatting
  {
    input: '52998224725', // Valid but unusual format
    isValid: true,
    description: 'Valid CPF without any separators'
  },
  {
    input: '5.2.9.9.8.2.2.4.7.2.5', // Each digit separated
    isValid: true,
    description: 'Valid CPF with each digit separated by a dot'
  },
  
  // Special sequences
  {
    input: '123.456.789-09', // Sequential digits with valid check digits
    isValid: true,
    description: 'Valid CPF with sequential digits and correct check digits'
  },
  {
    input: '987.654.321-00', // Reverse sequential with valid check digits
    isValid: true,
    description: 'Valid CPF with reverse sequential digits and correct check digits'
  }
];

/**
 * All CPF test cases combined
 */
export const allCPFTestCases: CPFTestCase[] = [
  ...validCPFTestCases,
  ...invalidCPFTestCases,
  ...cpfEdgeCases
];