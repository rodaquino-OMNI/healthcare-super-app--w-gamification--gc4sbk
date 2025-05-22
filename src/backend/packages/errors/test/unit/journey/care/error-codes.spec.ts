import * as ErrorCodes from '../../../../src/journey/care/error-codes';

describe('Care Journey Error Codes', () => {
  // Helper function to get all error codes
  const getAllErrorCodes = () => {
    return Object.keys(ErrorCodes).filter(key => typeof ErrorCodes[key] === 'string');
  };

  describe('Error Code Format', () => {
    it('should follow the CARE_[DOMAIN]_[TYPE]_[SPECIFIC_ERROR] pattern', () => {
      const errorCodes = getAllErrorCodes();
      
      errorCodes.forEach(codeKey => {
        const code = ErrorCodes[codeKey];
        expect(code).toMatch(/^CARE_[A-Z]+_[A-Z]+_[A-Z_]+$/);
      });
    });

    it('should have consistent domain prefixes', () => {
      const validDomains = [
        'APPOINTMENT',
        'PROVIDER',
        'TELEMEDICINE',
        'MEDICATION',
        'SYMPTOM',
        'TREATMENT'
      ];

      const errorCodes = getAllErrorCodes();
      
      errorCodes.forEach(codeKey => {
        const code = ErrorCodes[codeKey];
        const parts = code.split('_');
        expect(parts[0]).toBe('CARE');
        expect(validDomains).toContain(parts[1]);
      });
    });

    it('should have consistent error type classifications', () => {
      const validTypes = [
        'VALIDATION',
        'BUSINESS',
        'TECHNICAL',
        'EXTERNAL'
      ];

      const errorCodes = getAllErrorCodes();
      
      errorCodes.forEach(codeKey => {
        const code = ErrorCodes[codeKey];
        const parts = code.split('_');
        expect(validTypes).toContain(parts[2]);
      });
    });
  });

  describe('Error Code Uniqueness', () => {
    it('should have unique error code values', () => {
      const errorCodes = getAllErrorCodes();
      const codeValues = errorCodes.map(key => ErrorCodes[key]);
      const uniqueValues = new Set(codeValues);
      
      expect(uniqueValues.size).toBe(codeValues.length);
    });

    it('should have unique error code keys', () => {
      const errorCodes = getAllErrorCodes();
      const uniqueKeys = new Set(errorCodes);
      
      expect(uniqueKeys.size).toBe(errorCodes.length);
    });
  });

  describe('Domain Coverage', () => {
    it('should have error codes for all domains in the Care journey', () => {
      const domains = [
        'APPOINTMENT',
        'PROVIDER',
        'TELEMEDICINE',
        'MEDICATION',
        'SYMPTOM',
        'TREATMENT'
      ];

      domains.forEach(domain => {
        const domainCodes = getAllErrorCodes().filter(key => {
          return ErrorCodes[key].includes(`CARE_${domain}_`);
        });
        
        expect(domainCodes.length).toBeGreaterThan(0);
      });
    });

    it('should have error codes for all error types in each domain', () => {
      const domains = [
        'APPOINTMENT',
        'PROVIDER',
        'TELEMEDICINE',
        'MEDICATION',
        'SYMPTOM',
        'TREATMENT'
      ];

      const errorTypes = [
        'VALIDATION',
        'BUSINESS',
        'TECHNICAL',
        'EXTERNAL'
      ];

      domains.forEach(domain => {
        errorTypes.forEach(errorType => {
          const matchingCodes = getAllErrorCodes().filter(key => {
            return ErrorCodes[key].includes(`CARE_${domain}_${errorType}_`);
          });
          
          expect(matchingCodes.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Appointment Domain Error Codes', () => {
    it('should have validation error codes', () => {
      const validationCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_APPOINTMENT_VALIDATION_');
      });
      
      expect(validationCodes.length).toBeGreaterThan(0);
      validationCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_APPOINTMENT_VALIDATION_[A-Z_]+$/);
      });
    });

    it('should have business error codes', () => {
      const businessCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_APPOINTMENT_BUSINESS_');
      });
      
      expect(businessCodes.length).toBeGreaterThan(0);
      businessCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_APPOINTMENT_BUSINESS_[A-Z_]+$/);
      });
    });

    it('should have technical error codes', () => {
      const technicalCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_APPOINTMENT_TECHNICAL_');
      });
      
      expect(technicalCodes.length).toBeGreaterThan(0);
      technicalCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_APPOINTMENT_TECHNICAL_[A-Z_]+$/);
      });
    });

    it('should have external error codes', () => {
      const externalCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_APPOINTMENT_EXTERNAL_');
      });
      
      expect(externalCodes.length).toBeGreaterThan(0);
      externalCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_APPOINTMENT_EXTERNAL_[A-Z_]+$/);
      });
    });
  });

  describe('Provider Domain Error Codes', () => {
    it('should have validation error codes', () => {
      const validationCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_PROVIDER_VALIDATION_');
      });
      
      expect(validationCodes.length).toBeGreaterThan(0);
      validationCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_PROVIDER_VALIDATION_[A-Z_]+$/);
      });
    });

    it('should have business error codes', () => {
      const businessCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_PROVIDER_BUSINESS_');
      });
      
      expect(businessCodes.length).toBeGreaterThan(0);
      businessCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_PROVIDER_BUSINESS_[A-Z_]+$/);
      });
    });

    it('should have technical error codes', () => {
      const technicalCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_PROVIDER_TECHNICAL_');
      });
      
      expect(technicalCodes.length).toBeGreaterThan(0);
      technicalCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_PROVIDER_TECHNICAL_[A-Z_]+$/);
      });
    });

    it('should have external error codes', () => {
      const externalCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_PROVIDER_EXTERNAL_');
      });
      
      expect(externalCodes.length).toBeGreaterThan(0);
      externalCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_PROVIDER_EXTERNAL_[A-Z_]+$/);
      });
    });
  });

  describe('Telemedicine Domain Error Codes', () => {
    it('should have validation error codes', () => {
      const validationCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_TELEMEDICINE_VALIDATION_');
      });
      
      expect(validationCodes.length).toBeGreaterThan(0);
      validationCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_TELEMEDICINE_VALIDATION_[A-Z_]+$/);
      });
    });

    it('should have business error codes', () => {
      const businessCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_TELEMEDICINE_BUSINESS_');
      });
      
      expect(businessCodes.length).toBeGreaterThan(0);
      businessCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_TELEMEDICINE_BUSINESS_[A-Z_]+$/);
      });
    });

    it('should have technical error codes', () => {
      const technicalCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_TELEMEDICINE_TECHNICAL_');
      });
      
      expect(technicalCodes.length).toBeGreaterThan(0);
      technicalCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_TELEMEDICINE_TECHNICAL_[A-Z_]+$/);
      });
    });

    it('should have external error codes', () => {
      const externalCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_TELEMEDICINE_EXTERNAL_');
      });
      
      expect(externalCodes.length).toBeGreaterThan(0);
      externalCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_TELEMEDICINE_EXTERNAL_[A-Z_]+$/);
      });
    });
  });

  describe('Medication Domain Error Codes', () => {
    it('should have validation error codes', () => {
      const validationCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_MEDICATION_VALIDATION_');
      });
      
      expect(validationCodes.length).toBeGreaterThan(0);
      validationCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_MEDICATION_VALIDATION_[A-Z_]+$/);
      });
    });

    it('should have business error codes', () => {
      const businessCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_MEDICATION_BUSINESS_');
      });
      
      expect(businessCodes.length).toBeGreaterThan(0);
      businessCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_MEDICATION_BUSINESS_[A-Z_]+$/);
      });
    });

    it('should have technical error codes', () => {
      const technicalCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_MEDICATION_TECHNICAL_');
      });
      
      expect(technicalCodes.length).toBeGreaterThan(0);
      technicalCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_MEDICATION_TECHNICAL_[A-Z_]+$/);
      });
    });

    it('should have external error codes', () => {
      const externalCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_MEDICATION_EXTERNAL_');
      });
      
      expect(externalCodes.length).toBeGreaterThan(0);
      externalCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_MEDICATION_EXTERNAL_[A-Z_]+$/);
      });
    });
  });

  describe('Symptom Domain Error Codes', () => {
    it('should have validation error codes', () => {
      const validationCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_SYMPTOM_VALIDATION_');
      });
      
      expect(validationCodes.length).toBeGreaterThan(0);
      validationCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_SYMPTOM_VALIDATION_[A-Z_]+$/);
      });
    });

    it('should have business error codes', () => {
      const businessCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_SYMPTOM_BUSINESS_');
      });
      
      expect(businessCodes.length).toBeGreaterThan(0);
      businessCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_SYMPTOM_BUSINESS_[A-Z_]+$/);
      });
    });

    it('should have technical error codes', () => {
      const technicalCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_SYMPTOM_TECHNICAL_');
      });
      
      expect(technicalCodes.length).toBeGreaterThan(0);
      technicalCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_SYMPTOM_TECHNICAL_[A-Z_]+$/);
      });
    });

    it('should have external error codes', () => {
      const externalCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_SYMPTOM_EXTERNAL_');
      });
      
      expect(externalCodes.length).toBeGreaterThan(0);
      externalCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_SYMPTOM_EXTERNAL_[A-Z_]+$/);
      });
    });
  });

  describe('Treatment Domain Error Codes', () => {
    it('should have validation error codes', () => {
      const validationCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_TREATMENT_VALIDATION_');
      });
      
      expect(validationCodes.length).toBeGreaterThan(0);
      validationCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_TREATMENT_VALIDATION_[A-Z_]+$/);
      });
    });

    it('should have business error codes', () => {
      const businessCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_TREATMENT_BUSINESS_');
      });
      
      expect(businessCodes.length).toBeGreaterThan(0);
      businessCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_TREATMENT_BUSINESS_[A-Z_]+$/);
      });
    });

    it('should have technical error codes', () => {
      const technicalCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_TREATMENT_TECHNICAL_');
      });
      
      expect(technicalCodes.length).toBeGreaterThan(0);
      technicalCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_TREATMENT_TECHNICAL_[A-Z_]+$/);
      });
    });

    it('should have external error codes', () => {
      const externalCodes = getAllErrorCodes().filter(key => {
        return ErrorCodes[key].startsWith('CARE_TREATMENT_EXTERNAL_');
      });
      
      expect(externalCodes.length).toBeGreaterThan(0);
      externalCodes.forEach(code => {
        expect(ErrorCodes[code]).toMatch(/^CARE_TREATMENT_EXTERNAL_[A-Z_]+$/);
      });
    });
  });

  describe('Error Code Consistency', () => {
    it('should have consistent variable names matching error code values', () => {
      const errorCodes = getAllErrorCodes();
      
      errorCodes.forEach(codeKey => {
        const codeValue = ErrorCodes[codeKey];
        // Variable name should match the error code value
        expect(codeKey).toBe(codeValue);
      });
    });

    it('should have error codes with specific error descriptions', () => {
      const errorCodes = getAllErrorCodes();
      
      errorCodes.forEach(codeKey => {
        const parts = codeKey.split('_');
        // There should be at least 4 parts: CARE, DOMAIN, TYPE, and SPECIFIC_ERROR
        expect(parts.length).toBeGreaterThanOrEqual(4);
        // The specific error part should be descriptive
        expect(parts.slice(3).join('_').length).toBeGreaterThan(0);
      });
    });
  });
});