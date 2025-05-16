/**
 * Test fixtures for string validation utilities
 * 
 * This file contains test fixtures for Brazilian CPF validation (isValidCPF function),
 * with valid and invalid CPF numbers in various formats. These fixtures ensure the validation
 * logic correctly identifies legitimate Brazilian tax IDs across all journey services.
 */

/**
 * Interface for CPF validation test fixtures
 */
export interface CPFValidationFixtures {
  valid: {
    formatted: string[];
    unformatted: string[];
  };
  invalid: {
    wrongCheckDigits: string[];
    invalidFormat: string[];
    repeatedDigits: string[];
    edgeCases: string[];
  };
}

/**
 * Test fixtures for CPF validation
 */
export const cpfFixtures: CPFValidationFixtures = {
  valid: {
    // Valid CPFs with proper formatting (dots and dash)
    formatted: [
      '529.982.247-25',
      '077.797.827-89',
      '111.444.777-35'
    ],
    // Valid CPFs without formatting (just digits)
    unformatted: [
      '52998224725',
      '07779782789',
      '11144477735'
    ]
  },
  invalid: {
    // CPFs with incorrect check digits
    wrongCheckDigits: [
      '529.982.247-26', // Last digit should be 25
      '077.797.827-88', // Last digit should be 89
      '11144477736'     // Last digit should be 35
    ],
    // CPFs with invalid format (wrong length, non-digits)
    invalidFormat: [
      '529.982.247',    // Too short
      '077.797.827-8',  // Too short
      '111444777355',   // Too long
      '111.444.777-3A', // Contains non-digit
      'ABC.DEF.GHI-JK'  // Non-numeric
    ],
    // CPFs with all repeated digits (invalid by algorithm)
    repeatedDigits: [
      '111.111.111-11',
      '222.222.222-22',
      '333.333.333-33',
      '444.444.444-44',
      '555.555.555-55',
      '666.666.666-66',
      '777.777.777-77',
      '888.888.888-88',
      '999.999.999-99',
      '000.000.000-00'
    ],
    // Edge cases and potential error inputs
    edgeCases: [
      '',              // Empty string
      ' ',             // Whitespace
      '123',           // Too few digits
      '123456789012',  // Too many digits
      null as unknown as string,  // Null (for testing error handling)
      undefined as unknown as string  // Undefined (for testing error handling)
    ]
  }
};

/**
 * Export all validation fixtures
 */
export const validationFixtures = {
  cpf: cpfFixtures
};