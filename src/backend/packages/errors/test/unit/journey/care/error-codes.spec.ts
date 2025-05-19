import * as ErrorCodes from '../../../../src/journey/care/error-codes';

describe('Care Journey Error Codes', () => {
  // Helper function to check if a string follows the CARE_DOMAIN_* pattern
  const hasValidPrefix = (code: string, domain: string): boolean => {
    const expectedPrefix = `CARE_${domain}_`;
    return code.startsWith(expectedPrefix);
  };

  // Helper function to extract all error codes from the error-codes.ts file
  const getAllErrorCodes = (): string[] => {
    return Object.values(ErrorCodes).filter(
      (value): value is string => typeof value === 'string'
    );
  };

  // Helper function to extract error codes for a specific domain
  const getErrorCodesForDomain = (domain: string): string[] => {
    const allCodes = getAllErrorCodes();
    return allCodes.filter(code => hasValidPrefix(code, domain));
  };

  describe('Error Code Structure', () => {
    it('should have all error codes as uppercase strings', () => {
      const allCodes = getAllErrorCodes();
      
      allCodes.forEach(code => {
        expect(code).toBe(code.toUpperCase());
        expect(typeof code).toBe('string');
      });
    });

    it('should have all error codes follow the CARE_DOMAIN_* pattern', () => {
      const allCodes = getAllErrorCodes();
      const validDomains = ['APPOINTMENT', 'PROVIDER', 'TELEMEDICINE', 'MEDICATION', 'SYMPTOM', 'TREATMENT'];
      
      allCodes.forEach(code => {
        const domainMatch = code.match(/^CARE_([A-Z]+)_/);
        expect(domainMatch).not.toBeNull();
        
        if (domainMatch) {
          const [, domain] = domainMatch;
          expect(validDomains).toContain(domain);
        }
      });
    });
  });

  describe('Error Code Uniqueness', () => {
    it('should have unique error codes across all domains', () => {
      const allCodes = getAllErrorCodes();
      const uniqueCodes = new Set(allCodes);
      
      expect(uniqueCodes.size).toBe(allCodes.length);
    });
  });

  describe('Domain-Specific Error Codes', () => {
    describe('Appointment Error Codes', () => {
      it('should have error codes with CARE_APPOINTMENT_ prefix', () => {
        const appointmentCodes = getErrorCodesForDomain('APPOINTMENT');
        expect(appointmentCodes.length).toBeGreaterThan(0);
        
        appointmentCodes.forEach(code => {
          expect(hasValidPrefix(code, 'APPOINTMENT')).toBe(true);
        });
      });

      it('should include essential appointment error scenarios', () => {
        const appointmentCodes = getErrorCodesForDomain('APPOINTMENT');
        const essentialScenarios = [
          'NOT_FOUND',
          'DATE_IN_PAST',
          'OVERLAP',
          'PROVIDER_UNAVAILABLE',
          'PERSISTENCE',
          'CALENDAR_SYNC'
        ];
        
        essentialScenarios.forEach(scenario => {
          const hasScenario = appointmentCodes.some(code => 
            code.includes(`CARE_APPOINTMENT_${scenario}`));
          expect(hasScenario).toBe(true);
        });
      });
    });

    describe('Provider Error Codes', () => {
      it('should have error codes with CARE_PROVIDER_ prefix', () => {
        const providerCodes = getErrorCodesForDomain('PROVIDER');
        expect(providerCodes.length).toBeGreaterThan(0);
        
        providerCodes.forEach(code => {
          expect(hasValidPrefix(code, 'PROVIDER')).toBe(true);
        });
      });

      it('should include essential provider error scenarios', () => {
        const providerCodes = getErrorCodesForDomain('PROVIDER');
        const essentialScenarios = [
          'NOT_FOUND',
          'UNAVAILABLE',
          'SPECIALTY_MISMATCH',
          'CREDENTIALS',
          'DIRECTORY'
        ];
        
        essentialScenarios.forEach(scenario => {
          const hasScenario = providerCodes.some(code => 
            code.includes(`CARE_PROVIDER_${scenario}`));
          expect(hasScenario).toBe(true);
        });
      });
    });

    describe('Telemedicine Error Codes', () => {
      it('should have error codes with CARE_TELEMEDICINE_ prefix', () => {
        const telemedicineCodes = getErrorCodesForDomain('TELEMEDICINE');
        expect(telemedicineCodes.length).toBeGreaterThan(0);
        
        telemedicineCodes.forEach(code => {
          expect(hasValidPrefix(code, 'TELEMEDICINE')).toBe(true);
        });
      });

      it('should include essential telemedicine error scenarios', () => {
        const telemedicineCodes = getErrorCodesForDomain('TELEMEDICINE');
        const essentialScenarios = [
          'SESSION_NOT_FOUND',
          'CONNECTION',
          'DEVICE',
          'PROVIDER_OFFLINE',
          'RECORDING',
          'SERVICE'
        ];
        
        essentialScenarios.forEach(scenario => {
          const hasScenario = telemedicineCodes.some(code => 
            code.includes(`CARE_TELEMEDICINE_${scenario}`));
          expect(hasScenario).toBe(true);
        });
      });
    });

    describe('Medication Error Codes', () => {
      it('should have error codes with CARE_MEDICATION_ prefix', () => {
        const medicationCodes = getErrorCodesForDomain('MEDICATION');
        expect(medicationCodes.length).toBeGreaterThan(0);
        
        medicationCodes.forEach(code => {
          expect(hasValidPrefix(code, 'MEDICATION')).toBe(true);
        });
      });

      it('should include essential medication error scenarios', () => {
        const medicationCodes = getErrorCodesForDomain('MEDICATION');
        const essentialScenarios = [
          'NOT_FOUND',
          'INTERACTION',
          'DOSAGE',
          'ADHERENCE',
          'PERSISTENCE',
          'EXTERNAL_LOOKUP',
          'PHARMACY_INTEGRATION'
        ];
        
        essentialScenarios.forEach(scenario => {
          const hasScenario = medicationCodes.some(code => 
            code.includes(`CARE_MEDICATION_${scenario}`));
          expect(hasScenario).toBe(true);
        });
      });
    });

    describe('Symptom Error Codes', () => {
      it('should have error codes with CARE_SYMPTOM_ prefix', () => {
        const symptomCodes = getErrorCodesForDomain('SYMPTOM');
        expect(symptomCodes.length).toBeGreaterThan(0);
        
        symptomCodes.forEach(code => {
          expect(hasValidPrefix(code, 'SYMPTOM')).toBe(true);
        });
      });

      it('should include essential symptom error scenarios', () => {
        const symptomCodes = getErrorCodesForDomain('SYMPTOM');
        const essentialScenarios = [
          'NOT_FOUND',
          'ASSESSMENT_INCOMPLETE',
          'ENGINE_FUNCTION',
          'URGENT_CARE_RECOMMENDATION',
          'PERSISTENCE',
          'MEDICAL_KNOWLEDGE_BASE'
        ];
        
        essentialScenarios.forEach(scenario => {
          const hasScenario = symptomCodes.some(code => 
            code.includes(`CARE_SYMPTOM_${scenario}`));
          expect(hasScenario).toBe(true);
        });
      });
    });

    describe('Treatment Error Codes', () => {
      it('should have error codes with CARE_TREATMENT_ prefix', () => {
        const treatmentCodes = getErrorCodesForDomain('TREATMENT');
        expect(treatmentCodes.length).toBeGreaterThan(0);
        
        treatmentCodes.forEach(code => {
          expect(hasValidPrefix(code, 'TREATMENT')).toBe(true);
        });
      });

      it('should include essential treatment error scenarios', () => {
        const treatmentCodes = getErrorCodesForDomain('TREATMENT');
        const essentialScenarios = [
          'PLAN_NOT_FOUND',
          'STEP_INVALID',
          'PLAN_CONFLICT',
          'PROGRESS',
          'PERSISTENCE',
          'CLINICAL_GUIDELINES'
        ];
        
        essentialScenarios.forEach(scenario => {
          const hasScenario = treatmentCodes.some(code => 
            code.includes(`CARE_TREATMENT_${scenario}`));
          expect(hasScenario).toBe(true);
        });
      });
    });
  });

  describe('Error Type Classification', () => {
    it('should have error codes for all error types (validation, business, technical, external)', () => {
      const allCodes = getAllErrorCodes();
      const errorTypes = ['VALIDATION', 'BUSINESS', 'TECHNICAL', 'EXTERNAL'];
      
      errorTypes.forEach(type => {
        const hasErrorType = allCodes.some(code => code.includes(`_${type}_`));
        expect(hasErrorType).toBe(true);
      });
    });

    it('should have validation error codes for each domain', () => {
      const domains = ['APPOINTMENT', 'PROVIDER', 'TELEMEDICINE', 'MEDICATION', 'SYMPTOM', 'TREATMENT'];
      
      domains.forEach(domain => {
        const domainCodes = getErrorCodesForDomain(domain);
        const hasValidationError = domainCodes.some(code => code.includes('_VALIDATION_'));
        expect(hasValidationError).toBe(true);
      });
    });

    it('should have business error codes for each domain', () => {
      const domains = ['APPOINTMENT', 'PROVIDER', 'TELEMEDICINE', 'MEDICATION', 'SYMPTOM', 'TREATMENT'];
      
      domains.forEach(domain => {
        const domainCodes = getErrorCodesForDomain(domain);
        const hasBusinessError = domainCodes.some(code => code.includes('_BUSINESS_'));
        expect(hasBusinessError).toBe(true);
      });
    });

    it('should have technical error codes for each domain', () => {
      const domains = ['APPOINTMENT', 'PROVIDER', 'TELEMEDICINE', 'MEDICATION', 'SYMPTOM', 'TREATMENT'];
      
      domains.forEach(domain => {
        const domainCodes = getErrorCodesForDomain(domain);
        const hasTechnicalError = domainCodes.some(code => code.includes('_TECHNICAL_'));
        expect(hasTechnicalError).toBe(true);
      });
    });

    it('should have external error codes for domains with external integrations', () => {
      // Domains that should have external integration error codes
      const domainsWithExternalIntegrations = [
        'APPOINTMENT', // Calendar sync
        'PROVIDER',    // Provider directory
        'TELEMEDICINE', // Video provider
        'MEDICATION',  // Pharmacy integration
        'SYMPTOM',     // Medical knowledge base
        'TREATMENT'    // Clinical guidelines
      ];
      
      domainsWithExternalIntegrations.forEach(domain => {
        const domainCodes = getErrorCodesForDomain(domain);
        const hasExternalError = domainCodes.some(code => code.includes('_EXTERNAL_'));
        expect(hasExternalError).toBe(true);
      });
    });
  });
});