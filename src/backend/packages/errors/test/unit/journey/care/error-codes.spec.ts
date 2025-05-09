/**
 * @file error-codes.spec.ts
 * @description Unit tests for Care journey error code definitions.
 * Verifies that all error codes are properly defined with the correct prefixes,
 * follow the standardized format, and cover all required error scenarios across domains.
 */

import {
  CARE_APPT_VALIDATION_ERRORS,
  CARE_APPT_BUSINESS_ERRORS,
  CARE_APPT_TECHNICAL_ERRORS,
  CARE_APPT_EXTERNAL_ERRORS,
  CARE_PROV_VALIDATION_ERRORS,
  CARE_PROV_BUSINESS_ERRORS,
  CARE_PROV_TECHNICAL_ERRORS,
  CARE_PROV_EXTERNAL_ERRORS,
  CARE_TELE_VALIDATION_ERRORS,
  CARE_TELE_BUSINESS_ERRORS,
  CARE_TELE_TECHNICAL_ERRORS,
  CARE_TELE_EXTERNAL_ERRORS,
  CARE_MED_VALIDATION_ERRORS,
  CARE_MED_BUSINESS_ERRORS,
  CARE_MED_TECHNICAL_ERRORS,
  CARE_MED_EXTERNAL_ERRORS,
  CARE_SYMP_VALIDATION_ERRORS,
  CARE_SYMP_BUSINESS_ERRORS,
  CARE_SYMP_TECHNICAL_ERRORS,
  CARE_SYMP_EXTERNAL_ERRORS,
  CARE_TREAT_VALIDATION_ERRORS,
  CARE_TREAT_BUSINESS_ERRORS,
  CARE_TREAT_TECHNICAL_ERRORS,
  CARE_TREAT_EXTERNAL_ERRORS,
  CARE_VALIDATION_ERRORS,
  CARE_BUSINESS_ERRORS,
  CARE_TECHNICAL_ERRORS,
  CARE_EXTERNAL_ERRORS,
  CARE_ERROR_CODES
} from '../../../../src/journey/care/error-codes';

/**
 * Helper function to check if error code follows the correct format pattern:
 * CARE_[DOMAIN]_[TYPE][NUMBER]
 * 
 * @param errorCode The error code to validate
 * @param domain The expected domain prefix (APPT, PROV, etc.)
 * @param type The expected error type (V, B, T, E)
 * @returns boolean indicating if the format is valid
 */
const isValidErrorCodeFormat = (errorCode: string, domain: string, type: string): boolean => {
  const regex = new RegExp(`^CARE_${domain}_${type}\d{3}$`);
  return regex.test(errorCode);
};

/**
 * Helper function to extract all error codes from an error object
 * 
 * @param errorObj The error object containing error codes
 * @returns Array of error code strings
 */
const getErrorCodes = (errorObj: Record<string, string>): string[] => {
  return Object.values(errorObj);
};

/**
 * Helper function to check if all error codes in an object have the correct domain prefix
 * 
 * @param errorObj The error object containing error codes
 * @param domain The expected domain prefix (APPT, PROV, etc.)
 * @returns boolean indicating if all codes have the correct prefix
 */
const allCodesHaveCorrectDomainPrefix = (errorObj: Record<string, string>, domain: string): boolean => {
  const prefix = `CARE_${domain}_`;
  return Object.values(errorObj).every(code => code.startsWith(prefix));
};

describe('Care Journey Error Codes', () => {
  // Test suite for error code format validation
  describe('Error Code Format', () => {
    // Appointments domain error code format tests
    describe('Appointments Domain', () => {
      it('should have validation error codes with correct format', () => {
        const codes = getErrorCodes(CARE_APPT_VALIDATION_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'APPT', 'V'))).toBe(true);
      });

      it('should have business error codes with correct format', () => {
        const codes = getErrorCodes(CARE_APPT_BUSINESS_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'APPT', 'B'))).toBe(true);
      });

      it('should have technical error codes with correct format', () => {
        const codes = getErrorCodes(CARE_APPT_TECHNICAL_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'APPT', 'T'))).toBe(true);
      });

      it('should have external error codes with correct format', () => {
        const codes = getErrorCodes(CARE_APPT_EXTERNAL_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'APPT', 'E'))).toBe(true);
      });
    });

    // Providers domain error code format tests
    describe('Providers Domain', () => {
      it('should have validation error codes with correct format', () => {
        const codes = getErrorCodes(CARE_PROV_VALIDATION_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'PROV', 'V'))).toBe(true);
      });

      it('should have business error codes with correct format', () => {
        const codes = getErrorCodes(CARE_PROV_BUSINESS_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'PROV', 'B'))).toBe(true);
      });

      it('should have technical error codes with correct format', () => {
        const codes = getErrorCodes(CARE_PROV_TECHNICAL_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'PROV', 'T'))).toBe(true);
      });

      it('should have external error codes with correct format', () => {
        const codes = getErrorCodes(CARE_PROV_EXTERNAL_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'PROV', 'E'))).toBe(true);
      });
    });

    // Telemedicine domain error code format tests
    describe('Telemedicine Domain', () => {
      it('should have validation error codes with correct format', () => {
        const codes = getErrorCodes(CARE_TELE_VALIDATION_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'TELE', 'V'))).toBe(true);
      });

      it('should have business error codes with correct format', () => {
        const codes = getErrorCodes(CARE_TELE_BUSINESS_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'TELE', 'B'))).toBe(true);
      });

      it('should have technical error codes with correct format', () => {
        const codes = getErrorCodes(CARE_TELE_TECHNICAL_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'TELE', 'T'))).toBe(true);
      });

      it('should have external error codes with correct format', () => {
        const codes = getErrorCodes(CARE_TELE_EXTERNAL_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'TELE', 'E'))).toBe(true);
      });
    });

    // Medications domain error code format tests
    describe('Medications Domain', () => {
      it('should have validation error codes with correct format', () => {
        const codes = getErrorCodes(CARE_MED_VALIDATION_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'MED', 'V'))).toBe(true);
      });

      it('should have business error codes with correct format', () => {
        const codes = getErrorCodes(CARE_MED_BUSINESS_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'MED', 'B'))).toBe(true);
      });

      it('should have technical error codes with correct format', () => {
        const codes = getErrorCodes(CARE_MED_TECHNICAL_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'MED', 'T'))).toBe(true);
      });

      it('should have external error codes with correct format', () => {
        const codes = getErrorCodes(CARE_MED_EXTERNAL_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'MED', 'E'))).toBe(true);
      });
    });

    // Symptom Checker domain error code format tests
    describe('Symptom Checker Domain', () => {
      it('should have validation error codes with correct format', () => {
        const codes = getErrorCodes(CARE_SYMP_VALIDATION_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'SYMP', 'V'))).toBe(true);
      });

      it('should have business error codes with correct format', () => {
        const codes = getErrorCodes(CARE_SYMP_BUSINESS_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'SYMP', 'B'))).toBe(true);
      });

      it('should have technical error codes with correct format', () => {
        const codes = getErrorCodes(CARE_SYMP_TECHNICAL_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'SYMP', 'T'))).toBe(true);
      });

      it('should have external error codes with correct format', () => {
        const codes = getErrorCodes(CARE_SYMP_EXTERNAL_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'SYMP', 'E'))).toBe(true);
      });
    });

    // Treatments domain error code format tests
    describe('Treatments Domain', () => {
      it('should have validation error codes with correct format', () => {
        const codes = getErrorCodes(CARE_TREAT_VALIDATION_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'TREAT', 'V'))).toBe(true);
      });

      it('should have business error codes with correct format', () => {
        const codes = getErrorCodes(CARE_TREAT_BUSINESS_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'TREAT', 'B'))).toBe(true);
      });

      it('should have technical error codes with correct format', () => {
        const codes = getErrorCodes(CARE_TREAT_TECHNICAL_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'TREAT', 'T'))).toBe(true);
      });

      it('should have external error codes with correct format', () => {
        const codes = getErrorCodes(CARE_TREAT_EXTERNAL_ERRORS);
        expect(codes.length).toBeGreaterThan(0);
        expect(codes.every(code => isValidErrorCodeFormat(code, 'TREAT', 'E'))).toBe(true);
      });
    });
  });

  // Test suite for domain prefix validation
  describe('Domain Prefixes', () => {
    it('should have correct domain prefix for all appointment error codes', () => {
      expect(allCodesHaveCorrectDomainPrefix(CARE_APPT_VALIDATION_ERRORS, 'APPT')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_APPT_BUSINESS_ERRORS, 'APPT')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_APPT_TECHNICAL_ERRORS, 'APPT')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_APPT_EXTERNAL_ERRORS, 'APPT')).toBe(true);
    });

    it('should have correct domain prefix for all provider error codes', () => {
      expect(allCodesHaveCorrectDomainPrefix(CARE_PROV_VALIDATION_ERRORS, 'PROV')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_PROV_BUSINESS_ERRORS, 'PROV')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_PROV_TECHNICAL_ERRORS, 'PROV')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_PROV_EXTERNAL_ERRORS, 'PROV')).toBe(true);
    });

    it('should have correct domain prefix for all telemedicine error codes', () => {
      expect(allCodesHaveCorrectDomainPrefix(CARE_TELE_VALIDATION_ERRORS, 'TELE')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_TELE_BUSINESS_ERRORS, 'TELE')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_TELE_TECHNICAL_ERRORS, 'TELE')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_TELE_EXTERNAL_ERRORS, 'TELE')).toBe(true);
    });

    it('should have correct domain prefix for all medication error codes', () => {
      expect(allCodesHaveCorrectDomainPrefix(CARE_MED_VALIDATION_ERRORS, 'MED')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_MED_BUSINESS_ERRORS, 'MED')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_MED_TECHNICAL_ERRORS, 'MED')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_MED_EXTERNAL_ERRORS, 'MED')).toBe(true);
    });

    it('should have correct domain prefix for all symptom checker error codes', () => {
      expect(allCodesHaveCorrectDomainPrefix(CARE_SYMP_VALIDATION_ERRORS, 'SYMP')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_SYMP_BUSINESS_ERRORS, 'SYMP')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_SYMP_TECHNICAL_ERRORS, 'SYMP')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_SYMP_EXTERNAL_ERRORS, 'SYMP')).toBe(true);
    });

    it('should have correct domain prefix for all treatment error codes', () => {
      expect(allCodesHaveCorrectDomainPrefix(CARE_TREAT_VALIDATION_ERRORS, 'TREAT')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_TREAT_BUSINESS_ERRORS, 'TREAT')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_TREAT_TECHNICAL_ERRORS, 'TREAT')).toBe(true);
      expect(allCodesHaveCorrectDomainPrefix(CARE_TREAT_EXTERNAL_ERRORS, 'TREAT')).toBe(true);
    });
  });

  // Test suite for error code uniqueness
  describe('Error Code Uniqueness', () => {
    it('should have unique error codes across all domains', () => {
      // Collect all error codes from all domains
      const allCodes = [
        ...getErrorCodes(CARE_APPT_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_APPT_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_APPT_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_APPT_EXTERNAL_ERRORS),
        ...getErrorCodes(CARE_PROV_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_PROV_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_PROV_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_PROV_EXTERNAL_ERRORS),
        ...getErrorCodes(CARE_TELE_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_TELE_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_TELE_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_TELE_EXTERNAL_ERRORS),
        ...getErrorCodes(CARE_MED_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_MED_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_MED_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_MED_EXTERNAL_ERRORS),
        ...getErrorCodes(CARE_SYMP_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_SYMP_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_SYMP_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_SYMP_EXTERNAL_ERRORS),
        ...getErrorCodes(CARE_TREAT_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_TREAT_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_TREAT_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_TREAT_EXTERNAL_ERRORS)
      ];

      // Check for duplicates by comparing array length with Set size
      const uniqueCodes = new Set(allCodes);
      expect(uniqueCodes.size).toBe(allCodes.length);
    });

    it('should have unique error codes within each domain', () => {
      // Appointments domain
      const appointmentCodes = [
        ...getErrorCodes(CARE_APPT_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_APPT_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_APPT_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_APPT_EXTERNAL_ERRORS)
      ];
      const uniqueAppointmentCodes = new Set(appointmentCodes);
      expect(uniqueAppointmentCodes.size).toBe(appointmentCodes.length);

      // Providers domain
      const providerCodes = [
        ...getErrorCodes(CARE_PROV_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_PROV_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_PROV_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_PROV_EXTERNAL_ERRORS)
      ];
      const uniqueProviderCodes = new Set(providerCodes);
      expect(uniqueProviderCodes.size).toBe(providerCodes.length);

      // Telemedicine domain
      const telemedicineCodes = [
        ...getErrorCodes(CARE_TELE_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_TELE_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_TELE_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_TELE_EXTERNAL_ERRORS)
      ];
      const uniqueTelemedicineCodes = new Set(telemedicineCodes);
      expect(uniqueTelemedicineCodes.size).toBe(telemedicineCodes.length);

      // Medications domain
      const medicationCodes = [
        ...getErrorCodes(CARE_MED_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_MED_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_MED_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_MED_EXTERNAL_ERRORS)
      ];
      const uniqueMedicationCodes = new Set(medicationCodes);
      expect(uniqueMedicationCodes.size).toBe(medicationCodes.length);

      // Symptom Checker domain
      const symptomCodes = [
        ...getErrorCodes(CARE_SYMP_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_SYMP_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_SYMP_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_SYMP_EXTERNAL_ERRORS)
      ];
      const uniqueSymptomCodes = new Set(symptomCodes);
      expect(uniqueSymptomCodes.size).toBe(symptomCodes.length);

      // Treatments domain
      const treatmentCodes = [
        ...getErrorCodes(CARE_TREAT_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_TREAT_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_TREAT_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_TREAT_EXTERNAL_ERRORS)
      ];
      const uniqueTreatmentCodes = new Set(treatmentCodes);
      expect(uniqueTreatmentCodes.size).toBe(treatmentCodes.length);
    });
  });

  // Test suite for error type coverage
  describe('Error Type Coverage', () => {
    it('should have all error types for each domain', () => {
      // Appointments domain
      expect(Object.keys(CARE_APPT_VALIDATION_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_APPT_BUSINESS_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_APPT_TECHNICAL_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_APPT_EXTERNAL_ERRORS).length).toBeGreaterThan(0);

      // Providers domain
      expect(Object.keys(CARE_PROV_VALIDATION_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_PROV_BUSINESS_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_PROV_TECHNICAL_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_PROV_EXTERNAL_ERRORS).length).toBeGreaterThan(0);

      // Telemedicine domain
      expect(Object.keys(CARE_TELE_VALIDATION_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_TELE_BUSINESS_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_TELE_TECHNICAL_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_TELE_EXTERNAL_ERRORS).length).toBeGreaterThan(0);

      // Medications domain
      expect(Object.keys(CARE_MED_VALIDATION_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_MED_BUSINESS_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_MED_TECHNICAL_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_MED_EXTERNAL_ERRORS).length).toBeGreaterThan(0);

      // Symptom Checker domain
      expect(Object.keys(CARE_SYMP_VALIDATION_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_SYMP_BUSINESS_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_SYMP_TECHNICAL_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_SYMP_EXTERNAL_ERRORS).length).toBeGreaterThan(0);

      // Treatments domain
      expect(Object.keys(CARE_TREAT_VALIDATION_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_TREAT_BUSINESS_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_TREAT_TECHNICAL_ERRORS).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_TREAT_EXTERNAL_ERRORS).length).toBeGreaterThan(0);
    });

    it('should have at least 10 error codes for each error type in each domain', () => {
      // Appointments domain
      expect(Object.keys(CARE_APPT_VALIDATION_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_APPT_BUSINESS_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_APPT_TECHNICAL_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_APPT_EXTERNAL_ERRORS).length).toBeGreaterThanOrEqual(10);

      // Providers domain
      expect(Object.keys(CARE_PROV_VALIDATION_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_PROV_BUSINESS_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_PROV_TECHNICAL_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_PROV_EXTERNAL_ERRORS).length).toBeGreaterThanOrEqual(10);

      // Telemedicine domain
      expect(Object.keys(CARE_TELE_VALIDATION_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_TELE_BUSINESS_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_TELE_TECHNICAL_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_TELE_EXTERNAL_ERRORS).length).toBeGreaterThanOrEqual(10);

      // Medications domain
      expect(Object.keys(CARE_MED_VALIDATION_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_MED_BUSINESS_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_MED_TECHNICAL_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_MED_EXTERNAL_ERRORS).length).toBeGreaterThanOrEqual(10);

      // Symptom Checker domain
      expect(Object.keys(CARE_SYMP_VALIDATION_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_SYMP_BUSINESS_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_SYMP_TECHNICAL_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_SYMP_EXTERNAL_ERRORS).length).toBeGreaterThanOrEqual(10);

      // Treatments domain
      expect(Object.keys(CARE_TREAT_VALIDATION_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_TREAT_BUSINESS_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_TREAT_TECHNICAL_ERRORS).length).toBeGreaterThanOrEqual(10);
      expect(Object.keys(CARE_TREAT_EXTERNAL_ERRORS).length).toBeGreaterThanOrEqual(10);
    });
  });

  // Test suite for combined error code exports
  describe('Combined Error Code Exports', () => {
    it('should include all validation error codes in CARE_VALIDATION_ERRORS', () => {
      const allValidationCodes = [
        ...getErrorCodes(CARE_APPT_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_PROV_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_TELE_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_MED_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_SYMP_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_TREAT_VALIDATION_ERRORS)
      ];

      const combinedValidationCodes = getErrorCodes(CARE_VALIDATION_ERRORS);
      expect(combinedValidationCodes.length).toBe(allValidationCodes.length);
      expect(new Set(combinedValidationCodes).size).toBe(allValidationCodes.length);

      // Check that all individual validation codes are in the combined export
      allValidationCodes.forEach(code => {
        expect(combinedValidationCodes).toContain(code);
      });
    });

    it('should include all business error codes in CARE_BUSINESS_ERRORS', () => {
      const allBusinessCodes = [
        ...getErrorCodes(CARE_APPT_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_PROV_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_TELE_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_MED_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_SYMP_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_TREAT_BUSINESS_ERRORS)
      ];

      const combinedBusinessCodes = getErrorCodes(CARE_BUSINESS_ERRORS);
      expect(combinedBusinessCodes.length).toBe(allBusinessCodes.length);
      expect(new Set(combinedBusinessCodes).size).toBe(allBusinessCodes.length);

      // Check that all individual business codes are in the combined export
      allBusinessCodes.forEach(code => {
        expect(combinedBusinessCodes).toContain(code);
      });
    });

    it('should include all technical error codes in CARE_TECHNICAL_ERRORS', () => {
      const allTechnicalCodes = [
        ...getErrorCodes(CARE_APPT_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_PROV_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_TELE_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_MED_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_SYMP_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_TREAT_TECHNICAL_ERRORS)
      ];

      const combinedTechnicalCodes = getErrorCodes(CARE_TECHNICAL_ERRORS);
      expect(combinedTechnicalCodes.length).toBe(allTechnicalCodes.length);
      expect(new Set(combinedTechnicalCodes).size).toBe(allTechnicalCodes.length);

      // Check that all individual technical codes are in the combined export
      allTechnicalCodes.forEach(code => {
        expect(combinedTechnicalCodes).toContain(code);
      });
    });

    it('should include all external error codes in CARE_EXTERNAL_ERRORS', () => {
      const allExternalCodes = [
        ...getErrorCodes(CARE_APPT_EXTERNAL_ERRORS),
        ...getErrorCodes(CARE_PROV_EXTERNAL_ERRORS),
        ...getErrorCodes(CARE_TELE_EXTERNAL_ERRORS),
        ...getErrorCodes(CARE_MED_EXTERNAL_ERRORS),
        ...getErrorCodes(CARE_SYMP_EXTERNAL_ERRORS),
        ...getErrorCodes(CARE_TREAT_EXTERNAL_ERRORS)
      ];

      const combinedExternalCodes = getErrorCodes(CARE_EXTERNAL_ERRORS);
      expect(combinedExternalCodes.length).toBe(allExternalCodes.length);
      expect(new Set(combinedExternalCodes).size).toBe(allExternalCodes.length);

      // Check that all individual external codes are in the combined export
      allExternalCodes.forEach(code => {
        expect(combinedExternalCodes).toContain(code);
      });
    });

    it('should include all error codes in CARE_ERROR_CODES', () => {
      const allCodes = [
        ...getErrorCodes(CARE_VALIDATION_ERRORS),
        ...getErrorCodes(CARE_BUSINESS_ERRORS),
        ...getErrorCodes(CARE_TECHNICAL_ERRORS),
        ...getErrorCodes(CARE_EXTERNAL_ERRORS)
      ];

      const combinedCodes = getErrorCodes(CARE_ERROR_CODES);
      expect(combinedCodes.length).toBe(allCodes.length);
      expect(new Set(combinedCodes).size).toBe(allCodes.length);

      // Check that all individual codes are in the combined export
      allCodes.forEach(code => {
        expect(combinedCodes).toContain(code);
      });
    });
  });
});