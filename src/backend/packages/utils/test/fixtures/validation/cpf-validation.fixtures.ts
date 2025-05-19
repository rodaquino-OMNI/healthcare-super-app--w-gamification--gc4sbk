/**
 * Test fixtures for Brazilian CPF validation
 * 
 * This file provides comprehensive test fixtures for validating Brazilian CPF numbers,
 * including valid CPFs with different formatting, invalid CPFs with format errors,
 * checksum failures, and edge cases.
 * 
 * These fixtures are used to test the isValidCPF utility function across all journey
 * services that handle Brazilian user data.
 */

/**
 * Interface for CPF test cases
 */
export interface CPFTestCase {
  /** The CPF string to test */
  cpf: string;
  /** Description of the test case */
  description: string;
  /** Expected validation result */
  isValid: boolean;
}

/**
 * Valid CPF test cases with different formatting options
 */
export const validCPFs: CPFTestCase[] = [
  {
    cpf: '529.982.247-25',
    description: 'Valid CPF with standard formatting (xxx.xxx.xxx-xx)',
    isValid: true
  },
  {
    cpf: '52998224725',
    description: 'Valid CPF with no formatting (xxxxxxxxxxx)',
    isValid: true
  },
  {
    cpf: '529982247-25',
    description: 'Valid CPF with partial formatting (xxxxxxxxx-xx)',
    isValid: true
  },
  {
    cpf: '529.982.24725',
    description: 'Valid CPF with partial formatting (xxx.xxx.xxxxx)',
    isValid: true
  },
  {
    cpf: '529.98224725',
    description: 'Valid CPF with partial formatting (xxx.xxxxxxxx)',
    isValid: true
  },
  {
    cpf: '074.815.686-40',
    description: 'Another valid CPF with standard formatting',
    isValid: true
  },
  {
    cpf: '07481568640',
    description: 'Another valid CPF with no formatting',
    isValid: true
  },
  {
    cpf: '987.654.321-00',
    description: 'Valid CPF with sequential digits',
    isValid: true
  },
  {
    cpf: '98765432100',
    description: 'Valid CPF with sequential digits and no formatting',
    isValid: true
  },
];

/**
 * Invalid CPF test cases with format errors
 */
export const invalidFormatCPFs: CPFTestCase[] = [
  {
    cpf: '123.456.789',
    description: 'CPF with too few digits (9 digits)',
    isValid: false
  },
  {
    cpf: '123.456.789-0',
    description: 'CPF with too few digits (10 digits)',
    isValid: false
  },
  {
    cpf: '123.456.789-012',
    description: 'CPF with too many digits (12 digits)',
    isValid: false
  },
  {
    cpf: '12345678901234',
    description: 'CPF with too many digits (14 digits)',
    isValid: false
  },
  {
    cpf: '123.456.789-AB',
    description: 'CPF with non-numeric characters',
    isValid: false
  },
  {
    cpf: 'ABC.DEF.GHI-JK',
    description: 'CPF with all non-numeric characters',
    isValid: false
  },
  {
    cpf: '123 456 789 00',
    description: 'CPF with spaces instead of proper formatting',
    isValid: false
  },
];

/**
 * Invalid CPF test cases with checksum failures
 */
export const invalidChecksumCPFs: CPFTestCase[] = [
  {
    cpf: '529.982.247-26', // Changed last digit from 25 to 26
    description: 'CPF with invalid second check digit',
    isValid: false
  },
  {
    cpf: '529.982.248-25', // Changed digit before check digits
    description: 'CPF with invalid first check digit',
    isValid: false
  },
  {
    cpf: '123.456.789-10', // Random invalid CPF
    description: 'CPF with invalid check digits',
    isValid: false
  },
  {
    cpf: '987.654.321-01', // Changed valid CPF check digits
    description: 'Valid sequence with invalid check digits',
    isValid: false
  },
];

/**
 * Invalid CPF test cases with repeating digits (all same digits)
 */
export const repeatingDigitCPFs: CPFTestCase[] = [
  {
    cpf: '111.111.111-11',
    description: 'CPF with all digits as 1',
    isValid: false
  },
  {
    cpf: '222.222.222-22',
    description: 'CPF with all digits as 2',
    isValid: false
  },
  {
    cpf: '333.333.333-33',
    description: 'CPF with all digits as 3',
    isValid: false
  },
  {
    cpf: '444.444.444-44',
    description: 'CPF with all digits as 4',
    isValid: false
  },
  {
    cpf: '555.555.555-55',
    description: 'CPF with all digits as 5',
    isValid: false
  },
  {
    cpf: '666.666.666-66',
    description: 'CPF with all digits as 6',
    isValid: false
  },
  {
    cpf: '777.777.777-77',
    description: 'CPF with all digits as 7',
    isValid: false
  },
  {
    cpf: '888.888.888-88',
    description: 'CPF with all digits as 8',
    isValid: false
  },
  {
    cpf: '999.999.999-99',
    description: 'CPF with all digits as 9',
    isValid: false
  },
  {
    cpf: '000.000.000-00',
    description: 'CPF with all digits as 0',
    isValid: false
  },
  {
    cpf: '11111111111',
    description: 'CPF with all digits as 1 (no formatting)',
    isValid: false
  },
];

/**
 * Edge cases for CPF validation
 */
export const edgeCaseCPFs: CPFTestCase[] = [
  {
    cpf: '',
    description: 'Empty string',
    isValid: false
  },
  {
    cpf: '   ',
    description: 'String with only spaces',
    isValid: false
  },
  {
    cpf: '...-',
    description: 'String with only formatting characters',
    isValid: false
  },
  {
    cpf: '123.456',
    description: 'Partial CPF (less than half)',
    isValid: false
  },
];

/**
 * All CPF test cases combined
 */
export const allCPFTestCases: CPFTestCase[] = [
  ...validCPFs,
  ...invalidFormatCPFs,
  ...invalidChecksumCPFs,
  ...repeatingDigitCPFs,
  ...edgeCaseCPFs
];

/**
 * Get all valid CPF test cases
 * @returns Array of valid CPF test cases
 */
export const getValidCPFTestCases = (): CPFTestCase[] => validCPFs;

/**
 * Get all invalid CPF test cases
 * @returns Array of invalid CPF test cases
 */
export const getInvalidCPFTestCases = (): CPFTestCase[] => [
  ...invalidFormatCPFs,
  ...invalidChecksumCPFs,
  ...repeatingDigitCPFs,
  ...edgeCaseCPFs
];

/**
 * Get test cases by expected validation result
 * @param isValid Whether to return valid or invalid test cases
 * @returns Array of CPF test cases filtered by expected validation result
 */
export const getCPFTestCasesByValidity = (isValid: boolean): CPFTestCase[] => {
  return allCPFTestCases.filter(testCase => testCase.isValid === isValid);
};