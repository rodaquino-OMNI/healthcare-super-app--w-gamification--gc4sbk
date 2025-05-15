import {
  COMMON_ATTRIBUTES,
  HEALTH_JOURNEY_ATTRIBUTES,
  CARE_JOURNEY_ATTRIBUTES,
  PLAN_JOURNEY_ATTRIBUTES,
  GAMIFICATION_ATTRIBUTES
} from '../../../src/constants/span-attributes';

describe('Span Attribute Constants', () => {
  // Helper function to check if all values in an object follow the dot notation pattern
  const allValuesFollowDotNotation = (obj: Record<string, string>): boolean => {
    return Object.values(obj).every(value => {
      const parts = value.split('.');
      return parts.length >= 2 && parts.every(part => part.length > 0);
    });
  };

  // Helper function to check if all values in an object are unique
  const allValuesAreUnique = (obj: Record<string, string>): boolean => {
    const values = Object.values(obj);
    return values.length === new Set(values).size;
  };

  // Helper function to check if all values in an object are lowercase
  const allValuesAreLowercase = (obj: Record<string, string>): boolean => {
    return Object.values(obj).every(value => value === value.toLowerCase());
  };

  describe('COMMON_ATTRIBUTES', () => {
    it('should be defined', () => {
      expect(COMMON_ATTRIBUTES).toBeDefined();
    });

    it('should contain essential common attributes', () => {
      // Check for essential user and request context attributes
      expect(COMMON_ATTRIBUTES.USER_ID).toBeDefined();
      expect(COMMON_ATTRIBUTES.REQUEST_ID).toBeDefined();
      expect(COMMON_ATTRIBUTES.SESSION_ID).toBeDefined();
      expect(COMMON_ATTRIBUTES.CORRELATION_ID).toBeDefined();

      // Check for essential service information attributes
      expect(COMMON_ATTRIBUTES.SERVICE_NAME).toBeDefined();
      expect(COMMON_ATTRIBUTES.SERVICE_VERSION).toBeDefined();

      // Check for essential operation details attributes
      expect(COMMON_ATTRIBUTES.OPERATION_NAME).toBeDefined();
      expect(COMMON_ATTRIBUTES.OPERATION_TYPE).toBeDefined();
      expect(COMMON_ATTRIBUTES.OPERATION_RESULT).toBeDefined();
      expect(COMMON_ATTRIBUTES.OPERATION_STATUS).toBeDefined();

      // Check for essential HTTP attributes
      expect(COMMON_ATTRIBUTES.HTTP_METHOD).toBeDefined();
      expect(COMMON_ATTRIBUTES.HTTP_URL).toBeDefined();
      expect(COMMON_ATTRIBUTES.HTTP_STATUS_CODE).toBeDefined();

      // Check for essential database attributes
      expect(COMMON_ATTRIBUTES.DB_SYSTEM).toBeDefined();
      expect(COMMON_ATTRIBUTES.DB_NAME).toBeDefined();
      expect(COMMON_ATTRIBUTES.DB_OPERATION).toBeDefined();

      // Check for journey context attributes
      expect(COMMON_ATTRIBUTES.JOURNEY_TYPE).toBeDefined();
      expect(COMMON_ATTRIBUTES.JOURNEY_STEP).toBeDefined();
    });

    it('should follow dot notation naming convention', () => {
      expect(allValuesFollowDotNotation(COMMON_ATTRIBUTES)).toBe(true);
    });

    it('should have all values in lowercase', () => {
      expect(allValuesAreLowercase(COMMON_ATTRIBUTES)).toBe(true);
    });

    it('should have unique attribute values', () => {
      expect(allValuesAreUnique(COMMON_ATTRIBUTES)).toBe(true);
    });

    it('should have user.id attribute with correct value', () => {
      expect(COMMON_ATTRIBUTES.USER_ID).toBe('user.id');
    });

    it('should have request.id attribute with correct value', () => {
      expect(COMMON_ATTRIBUTES.REQUEST_ID).toBe('request.id');
    });

    it('should have correlation.id attribute with correct value', () => {
      expect(COMMON_ATTRIBUTES.CORRELATION_ID).toBe('correlation.id');
    });

    it('should have journey.type attribute with correct value', () => {
      expect(COMMON_ATTRIBUTES.JOURNEY_TYPE).toBe('journey.type');
    });

    it('should have http attributes with correct http prefix', () => {
      Object.entries(COMMON_ATTRIBUTES)
        .filter(([key]) => key.startsWith('HTTP_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('http.')).toBe(true);
        });
    });

    it('should have db attributes with correct db prefix', () => {
      Object.entries(COMMON_ATTRIBUTES)
        .filter(([key]) => key.startsWith('DB_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('db.')).toBe(true);
        });
    });

    it('should have operation attributes with correct operation prefix', () => {
      Object.entries(COMMON_ATTRIBUTES)
        .filter(([key]) => key.startsWith('OPERATION_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('operation.')).toBe(true);
        });
    });
  });

  describe('HEALTH_JOURNEY_ATTRIBUTES', () => {
    it('should be defined', () => {
      expect(HEALTH_JOURNEY_ATTRIBUTES).toBeDefined();
    });

    it('should contain essential health journey attributes', () => {
      // Check for health metrics attributes
      expect(HEALTH_JOURNEY_ATTRIBUTES.HEALTH_METRIC_TYPE).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES.HEALTH_METRIC_VALUE).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES.HEALTH_METRIC_UNIT).toBeDefined();

      // Check for health goals attributes
      expect(HEALTH_JOURNEY_ATTRIBUTES.HEALTH_GOAL_ID).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES.HEALTH_GOAL_TYPE).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES.HEALTH_GOAL_TARGET).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES.HEALTH_GOAL_PROGRESS).toBeDefined();

      // Check for device attributes
      expect(HEALTH_JOURNEY_ATTRIBUTES.DEVICE_ID).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES.DEVICE_TYPE).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES.DEVICE_CONNECTION_STATUS).toBeDefined();

      // Check for medical event attributes
      expect(HEALTH_JOURNEY_ATTRIBUTES.MEDICAL_EVENT_ID).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES.MEDICAL_EVENT_TYPE).toBeDefined();

      // Check for FHIR integration attributes
      expect(HEALTH_JOURNEY_ATTRIBUTES.FHIR_RESOURCE_TYPE).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES.FHIR_RESOURCE_ID).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES.FHIR_OPERATION).toBeDefined();
    });

    it('should follow dot notation naming convention', () => {
      expect(allValuesFollowDotNotation(HEALTH_JOURNEY_ATTRIBUTES)).toBe(true);
    });

    it('should have all values in lowercase', () => {
      expect(allValuesAreLowercase(HEALTH_JOURNEY_ATTRIBUTES)).toBe(true);
    });

    it('should have unique attribute values', () => {
      expect(allValuesAreUnique(HEALTH_JOURNEY_ATTRIBUTES)).toBe(true);
    });

    it('should have health metric attributes with correct health.metric prefix', () => {
      Object.entries(HEALTH_JOURNEY_ATTRIBUTES)
        .filter(([key]) => key.startsWith('HEALTH_METRIC_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('health.metric.')).toBe(true);
        });
    });

    it('should have health goal attributes with correct health.goal prefix', () => {
      Object.entries(HEALTH_JOURNEY_ATTRIBUTES)
        .filter(([key]) => key.startsWith('HEALTH_GOAL_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('health.goal.')).toBe(true);
        });
    });

    it('should have device attributes with correct device prefix', () => {
      Object.entries(HEALTH_JOURNEY_ATTRIBUTES)
        .filter(([key]) => key.startsWith('DEVICE_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('device.')).toBe(true);
        });
    });

    it('should have FHIR attributes with correct fhir prefix', () => {
      Object.entries(HEALTH_JOURNEY_ATTRIBUTES)
        .filter(([key]) => key.startsWith('FHIR_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('fhir.')).toBe(true);
        });
    });
  });

  describe('CARE_JOURNEY_ATTRIBUTES', () => {
    it('should be defined', () => {
      expect(CARE_JOURNEY_ATTRIBUTES).toBeDefined();
    });

    it('should contain essential care journey attributes', () => {
      // Check for appointment attributes
      expect(CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_ID).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_TYPE).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_STATUS).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_PROVIDER_ID).toBeDefined();

      // Check for provider attributes
      expect(CARE_JOURNEY_ATTRIBUTES.PROVIDER_ID).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.PROVIDER_TYPE).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.PROVIDER_SPECIALTY).toBeDefined();

      // Check for medication attributes
      expect(CARE_JOURNEY_ATTRIBUTES.MEDICATION_ID).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.MEDICATION_NAME).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.MEDICATION_DOSAGE).toBeDefined();

      // Check for telemedicine attributes
      expect(CARE_JOURNEY_ATTRIBUTES.TELEMEDICINE_SESSION_ID).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.TELEMEDICINE_SESSION_STATUS).toBeDefined();

      // Check for symptom checker attributes
      expect(CARE_JOURNEY_ATTRIBUTES.SYMPTOM_CHECKER_SESSION_ID).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.SYMPTOM_CHECKER_RESULT).toBeDefined();

      // Check for treatment attributes
      expect(CARE_JOURNEY_ATTRIBUTES.TREATMENT_ID).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.TREATMENT_TYPE).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.TREATMENT_STATUS).toBeDefined();
    });

    it('should follow dot notation naming convention', () => {
      expect(allValuesFollowDotNotation(CARE_JOURNEY_ATTRIBUTES)).toBe(true);
    });

    it('should have all values in lowercase', () => {
      expect(allValuesAreLowercase(CARE_JOURNEY_ATTRIBUTES)).toBe(true);
    });

    it('should have unique attribute values', () => {
      expect(allValuesAreUnique(CARE_JOURNEY_ATTRIBUTES)).toBe(true);
    });

    it('should have appointment attributes with correct appointment prefix', () => {
      Object.entries(CARE_JOURNEY_ATTRIBUTES)
        .filter(([key]) => key.startsWith('APPOINTMENT_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('appointment.')).toBe(true);
        });
    });

    it('should have provider attributes with correct provider prefix', () => {
      Object.entries(CARE_JOURNEY_ATTRIBUTES)
        .filter(([key]) => key.startsWith('PROVIDER_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('provider.')).toBe(true);
        });
    });

    it('should have medication attributes with correct medication prefix', () => {
      Object.entries(CARE_JOURNEY_ATTRIBUTES)
        .filter(([key]) => key.startsWith('MEDICATION_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('medication.')).toBe(true);
        });
    });

    it('should have telemedicine attributes with correct telemedicine prefix', () => {
      Object.entries(CARE_JOURNEY_ATTRIBUTES)
        .filter(([key]) => key.startsWith('TELEMEDICINE_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('telemedicine.')).toBe(true);
        });
    });
  });

  describe('PLAN_JOURNEY_ATTRIBUTES', () => {
    it('should be defined', () => {
      expect(PLAN_JOURNEY_ATTRIBUTES).toBeDefined();
    });

    it('should contain essential plan journey attributes', () => {
      // Check for plan attributes
      expect(PLAN_JOURNEY_ATTRIBUTES.PLAN_ID).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.PLAN_TYPE).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.PLAN_STATUS).toBeDefined();

      // Check for benefit attributes
      expect(PLAN_JOURNEY_ATTRIBUTES.BENEFIT_ID).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.BENEFIT_TYPE).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.BENEFIT_CATEGORY).toBeDefined();

      // Check for coverage attributes
      expect(PLAN_JOURNEY_ATTRIBUTES.COVERAGE_ID).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.COVERAGE_TYPE).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.COVERAGE_STATUS).toBeDefined();

      // Check for claim attributes
      expect(PLAN_JOURNEY_ATTRIBUTES.CLAIM_ID).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.CLAIM_TYPE).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.CLAIM_STATUS).toBeDefined();

      // Check for document attributes
      expect(PLAN_JOURNEY_ATTRIBUTES.DOCUMENT_ID).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.DOCUMENT_TYPE).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.DOCUMENT_STATUS).toBeDefined();
    });

    it('should follow dot notation naming convention', () => {
      expect(allValuesFollowDotNotation(PLAN_JOURNEY_ATTRIBUTES)).toBe(true);
    });

    it('should have all values in lowercase', () => {
      expect(allValuesAreLowercase(PLAN_JOURNEY_ATTRIBUTES)).toBe(true);
    });

    it('should have unique attribute values', () => {
      expect(allValuesAreUnique(PLAN_JOURNEY_ATTRIBUTES)).toBe(true);
    });

    it('should have plan attributes with correct plan prefix', () => {
      Object.entries(PLAN_JOURNEY_ATTRIBUTES)
        .filter(([key]) => key.startsWith('PLAN_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('plan.')).toBe(true);
        });
    });

    it('should have benefit attributes with correct benefit prefix', () => {
      Object.entries(PLAN_JOURNEY_ATTRIBUTES)
        .filter(([key]) => key.startsWith('BENEFIT_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('benefit.')).toBe(true);
        });
    });

    it('should have coverage attributes with correct coverage prefix', () => {
      Object.entries(PLAN_JOURNEY_ATTRIBUTES)
        .filter(([key]) => key.startsWith('COVERAGE_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('coverage.')).toBe(true);
        });
    });

    it('should have claim attributes with correct claim prefix', () => {
      Object.entries(PLAN_JOURNEY_ATTRIBUTES)
        .filter(([key]) => key.startsWith('CLAIM_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('claim.')).toBe(true);
        });
    });

    it('should have document attributes with correct document prefix', () => {
      Object.entries(PLAN_JOURNEY_ATTRIBUTES)
        .filter(([key]) => key.startsWith('DOCUMENT_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('document.')).toBe(true);
        });
    });
  });

  describe('GAMIFICATION_ATTRIBUTES', () => {
    it('should be defined', () => {
      expect(GAMIFICATION_ATTRIBUTES).toBeDefined();
    });

    it('should contain essential gamification attributes', () => {
      // Check for profile attributes
      expect(GAMIFICATION_ATTRIBUTES.PROFILE_ID).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.PROFILE_LEVEL).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.PROFILE_XP).toBeDefined();

      // Check for achievement attributes
      expect(GAMIFICATION_ATTRIBUTES.ACHIEVEMENT_ID).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.ACHIEVEMENT_TYPE).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.ACHIEVEMENT_PROGRESS).toBeDefined();

      // Check for quest attributes
      expect(GAMIFICATION_ATTRIBUTES.QUEST_ID).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.QUEST_TYPE).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.QUEST_PROGRESS).toBeDefined();

      // Check for reward attributes
      expect(GAMIFICATION_ATTRIBUTES.REWARD_ID).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.REWARD_TYPE).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.REWARD_VALUE).toBeDefined();

      // Check for event attributes
      expect(GAMIFICATION_ATTRIBUTES.EVENT_ID).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.EVENT_TYPE).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.EVENT_SOURCE).toBeDefined();

      // Check for leaderboard attributes
      expect(GAMIFICATION_ATTRIBUTES.LEADERBOARD_ID).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.LEADERBOARD_TYPE).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.LEADERBOARD_POSITION).toBeDefined();
    });

    it('should follow dot notation naming convention', () => {
      expect(allValuesFollowDotNotation(GAMIFICATION_ATTRIBUTES)).toBe(true);
    });

    it('should have all values in lowercase', () => {
      expect(allValuesAreLowercase(GAMIFICATION_ATTRIBUTES)).toBe(true);
    });

    it('should have unique attribute values', () => {
      expect(allValuesAreUnique(GAMIFICATION_ATTRIBUTES)).toBe(true);
    });

    it('should have profile attributes with correct profile prefix', () => {
      Object.entries(GAMIFICATION_ATTRIBUTES)
        .filter(([key]) => key.startsWith('PROFILE_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('profile.')).toBe(true);
        });
    });

    it('should have achievement attributes with correct achievement prefix', () => {
      Object.entries(GAMIFICATION_ATTRIBUTES)
        .filter(([key]) => key.startsWith('ACHIEVEMENT_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('achievement.')).toBe(true);
        });
    });

    it('should have quest attributes with correct quest prefix', () => {
      Object.entries(GAMIFICATION_ATTRIBUTES)
        .filter(([key]) => key.startsWith('QUEST_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('quest.')).toBe(true);
        });
    });

    it('should have reward attributes with correct reward prefix', () => {
      Object.entries(GAMIFICATION_ATTRIBUTES)
        .filter(([key]) => key.startsWith('REWARD_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('reward.')).toBe(true);
        });
    });

    it('should have event attributes with correct event prefix', () => {
      Object.entries(GAMIFICATION_ATTRIBUTES)
        .filter(([key]) => key.startsWith('EVENT_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('event.')).toBe(true);
        });
    });

    it('should have leaderboard attributes with correct leaderboard prefix', () => {
      Object.entries(GAMIFICATION_ATTRIBUTES)
        .filter(([key]) => key.startsWith('LEADERBOARD_'))
        .forEach(([_, value]) => {
          expect(value.startsWith('leaderboard.')).toBe(true);
        });
    });
  });

  describe('Cross-attribute relationships', () => {
    it('should have no duplicate attribute values across different attribute groups', () => {
      const allValues = [
        ...Object.values(COMMON_ATTRIBUTES),
        ...Object.values(HEALTH_JOURNEY_ATTRIBUTES),
        ...Object.values(CARE_JOURNEY_ATTRIBUTES),
        ...Object.values(PLAN_JOURNEY_ATTRIBUTES),
        ...Object.values(GAMIFICATION_ATTRIBUTES)
      ];
      
      expect(allValues.length).toBe(new Set(allValues).size);
    });

    it('should have consistent naming patterns across all attribute groups', () => {
      // All attribute groups should follow dot notation
      expect(allValuesFollowDotNotation(COMMON_ATTRIBUTES)).toBe(true);
      expect(allValuesFollowDotNotation(HEALTH_JOURNEY_ATTRIBUTES)).toBe(true);
      expect(allValuesFollowDotNotation(CARE_JOURNEY_ATTRIBUTES)).toBe(true);
      expect(allValuesFollowDotNotation(PLAN_JOURNEY_ATTRIBUTES)).toBe(true);
      expect(allValuesFollowDotNotation(GAMIFICATION_ATTRIBUTES)).toBe(true);

      // All attribute groups should be lowercase
      expect(allValuesAreLowercase(COMMON_ATTRIBUTES)).toBe(true);
      expect(allValuesAreLowercase(HEALTH_JOURNEY_ATTRIBUTES)).toBe(true);
      expect(allValuesAreLowercase(CARE_JOURNEY_ATTRIBUTES)).toBe(true);
      expect(allValuesAreLowercase(PLAN_JOURNEY_ATTRIBUTES)).toBe(true);
      expect(allValuesAreLowercase(GAMIFICATION_ATTRIBUTES)).toBe(true);
    });

    it('should have ID attributes consistently named across all attribute groups', () => {
      // Check that all ID attributes end with '.id'
      const idAttributes = [
        ...Object.entries(COMMON_ATTRIBUTES),
        ...Object.entries(HEALTH_JOURNEY_ATTRIBUTES),
        ...Object.entries(CARE_JOURNEY_ATTRIBUTES),
        ...Object.entries(PLAN_JOURNEY_ATTRIBUTES),
        ...Object.entries(GAMIFICATION_ATTRIBUTES)
      ].filter(([key]) => key.endsWith('_ID'));

      idAttributes.forEach(([_, value]) => {
        expect(value.endsWith('.id')).toBe(true);
      });
    });

    it('should have TYPE attributes consistently named across all attribute groups', () => {
      // Check that all TYPE attributes end with '.type'
      const typeAttributes = [
        ...Object.entries(COMMON_ATTRIBUTES),
        ...Object.entries(HEALTH_JOURNEY_ATTRIBUTES),
        ...Object.entries(CARE_JOURNEY_ATTRIBUTES),
        ...Object.entries(PLAN_JOURNEY_ATTRIBUTES),
        ...Object.entries(GAMIFICATION_ATTRIBUTES)
      ].filter(([key]) => key.endsWith('_TYPE'));

      typeAttributes.forEach(([_, value]) => {
        expect(value.endsWith('.type')).toBe(true);
      });
    });

    it('should have STATUS attributes consistently named across all attribute groups', () => {
      // Check that all STATUS attributes end with '.status'
      const statusAttributes = [
        ...Object.entries(COMMON_ATTRIBUTES),
        ...Object.entries(HEALTH_JOURNEY_ATTRIBUTES),
        ...Object.entries(CARE_JOURNEY_ATTRIBUTES),
        ...Object.entries(PLAN_JOURNEY_ATTRIBUTES),
        ...Object.entries(GAMIFICATION_ATTRIBUTES)
      ].filter(([key]) => key.endsWith('_STATUS'));

      statusAttributes.forEach(([_, value]) => {
        expect(value.endsWith('.status')).toBe(true);
      });
    });
  });

  describe('OpenTelemetry semantic conventions', () => {
    it('should follow OpenTelemetry semantic conventions for HTTP attributes', () => {
      expect(COMMON_ATTRIBUTES.HTTP_METHOD).toBe('http.method');
      expect(COMMON_ATTRIBUTES.HTTP_URL).toBe('http.url');
      expect(COMMON_ATTRIBUTES.HTTP_STATUS_CODE).toBe('http.status_code');
    });

    it('should follow OpenTelemetry semantic conventions for database attributes', () => {
      expect(COMMON_ATTRIBUTES.DB_SYSTEM).toBe('db.system');
      expect(COMMON_ATTRIBUTES.DB_NAME).toBe('db.name');
      expect(COMMON_ATTRIBUTES.DB_OPERATION).toBe('db.operation');
      expect(COMMON_ATTRIBUTES.DB_STATEMENT).toBe('db.statement');
    });

    it('should follow OpenTelemetry semantic conventions for messaging attributes', () => {
      expect(COMMON_ATTRIBUTES.MESSAGING_SYSTEM).toBe('messaging.system');
      expect(COMMON_ATTRIBUTES.MESSAGING_DESTINATION).toBe('messaging.destination');
      expect(COMMON_ATTRIBUTES.MESSAGING_DESTINATION_KIND).toBe('messaging.destination.kind');
      expect(COMMON_ATTRIBUTES.MESSAGING_MESSAGE_ID).toBe('messaging.message.id');
    });
  });
});