/**
 * Test fixtures for string validation utilities.
 * These fixtures are used to test validation functions across all journey services.
 */

/**
 * Test fixtures for CPF (Brazilian tax ID) validation
 */
export interface CPFFixture {
  value: string;
  isValid: boolean;
  description: string;
}

/**
 * Collection of valid CPF test fixtures
 */
export const validCPFFixtures: CPFFixture[] = [
  {
    value: '529.982.247-25',
    isValid: true,
    description: 'Valid CPF with punctuation'
  },
  {
    value: '52998224725',
    isValid: true,
    description: 'Valid CPF without punctuation'
  },
  {
    value: '111.444.777-35',
    isValid: true,
    description: 'Valid CPF with repeated digits and punctuation'
  },
  {
    value: '11144477735',
    isValid: true,
    description: 'Valid CPF with repeated digits without punctuation'
  },
  {
    value: '071.488.954-23',
    isValid: true,
    description: 'Valid CPF starting with zero'
  }
];

/**
 * Collection of invalid CPF test fixtures
 */
export const invalidCPFFixtures: CPFFixture[] = [
  {
    value: '111.111.111-11',
    isValid: false,
    description: 'Invalid CPF with all same digits'
  },
  {
    value: '123.456.789-10',
    isValid: false,
    description: 'Invalid CPF with incorrect check digits'
  },
  {
    value: '529.982.247-26', // Changed last digit from valid CPF
    isValid: false,
    description: 'Invalid CPF with wrong check digit'
  },
  {
    value: '123.456.789',
    isValid: false,
    description: 'Invalid CPF with insufficient digits'
  },
  {
    value: '123.456.789-0',
    isValid: false,
    description: 'Invalid CPF with insufficient digits'
  },
  {
    value: '123.456.789-000',
    isValid: false,
    description: 'Invalid CPF with too many digits'
  },
  {
    value: 'ABC.DEF.GHI-JK',
    isValid: false,
    description: 'Invalid CPF with non-numeric characters'
  },
  {
    value: '',
    isValid: false,
    description: 'Empty string'
  }
];

/**
 * Combined collection of all CPF test fixtures
 */
export const cpfFixtures: CPFFixture[] = [...validCPFFixtures, ...invalidCPFFixtures];