import {
  AUSTA_ATTRIBUTE_NAMESPACE,
  GENERAL_ATTRIBUTES,
  JOURNEY_ATTRIBUTES,
  HEALTH_JOURNEY_ATTRIBUTES,
  CARE_JOURNEY_ATTRIBUTES,
  PLAN_JOURNEY_ATTRIBUTES,
  GAMIFICATION_ATTRIBUTES,
  DATABASE_ATTRIBUTES,
  EXTERNAL_API_ATTRIBUTES,
  NOTIFICATION_ATTRIBUTES,
  SPAN_ATTRIBUTES
} from '../../../src/constants/span-attributes';

describe('Span Attribute Constants', () => {
  describe('Namespace', () => {
    it('should define the AUSTA attribute namespace', () => {
      expect(AUSTA_ATTRIBUTE_NAMESPACE).toBeDefined();
      expect(AUSTA_ATTRIBUTE_NAMESPACE).toBe('austa');
    });
  });

  describe('Naming Conventions', () => {
    it('should follow consistent naming pattern for AUSTA-specific attributes', () => {
      // Test a sample of attributes from each category to ensure they follow the pattern
      const austaAttributes = [
        GENERAL_ATTRIBUTES.REQUEST_ID,
        JOURNEY_ATTRIBUTES.JOURNEY_TYPE,
        HEALTH_JOURNEY_ATTRIBUTES.METRIC_TYPE,
        CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_ID,
        PLAN_JOURNEY_ATTRIBUTES.PLAN_ID,
        GAMIFICATION_ATTRIBUTES.EVENT_ID,
        DATABASE_ATTRIBUTES.DB_ENTITY,
        EXTERNAL_API_ATTRIBUTES.API_NAME,
        NOTIFICATION_ATTRIBUTES.NOTIFICATION_ID
      ];

      // All AUSTA-specific attributes should start with the namespace
      austaAttributes.forEach(attribute => {
        expect(attribute).toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.`));
      });
    });

    it('should use standard OpenTelemetry attribute names where applicable', () => {
      // Standard OpenTelemetry attributes should not have the AUSTA namespace
      const standardAttributes = [
        GENERAL_ATTRIBUTES.SERVICE_NAME,
        GENERAL_ATTRIBUTES.SERVICE_VERSION,
        DATABASE_ATTRIBUTES.DB_SYSTEM,
        DATABASE_ATTRIBUTES.DB_NAME,
        DATABASE_ATTRIBUTES.DB_OPERATION,
        DATABASE_ATTRIBUTES.DB_STATEMENT
      ];

      standardAttributes.forEach(attribute => {
        expect(attribute).not.toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.`));
      });
    });

    it('should use dot notation for attribute hierarchy', () => {
      // All attributes should use dot notation for hierarchy
      Object.values(SPAN_ATTRIBUTES).forEach(category => {
        Object.values(category).forEach(attribute => {
          if (typeof attribute === 'string') {
            expect(attribute).toMatch(/^[a-z]+\.[a-z]+/);
            expect(attribute).not.toContain('-');
            expect(attribute).not.toContain('_');
          }
        });
      });
    });
  });

  describe('General Attributes', () => {
    it('should define service and component identification attributes', () => {
      expect(GENERAL_ATTRIBUTES.SERVICE_NAME).toBeDefined();
      expect(GENERAL_ATTRIBUTES.SERVICE_VERSION).toBeDefined();
      expect(GENERAL_ATTRIBUTES.COMPONENT_NAME).toBeDefined();
      expect(GENERAL_ATTRIBUTES.COMPONENT_TYPE).toBeDefined();
    });

    it('should define request context attributes', () => {
      expect(GENERAL_ATTRIBUTES.REQUEST_ID).toBeDefined();
      expect(GENERAL_ATTRIBUTES.SESSION_ID).toBeDefined();
      expect(GENERAL_ATTRIBUTES.USER_ID).toBeDefined();
      expect(GENERAL_ATTRIBUTES.TENANT_ID).toBeDefined();
    });

    it('should define operation metadata attributes', () => {
      expect(GENERAL_ATTRIBUTES.OPERATION_NAME).toBeDefined();
      expect(GENERAL_ATTRIBUTES.OPERATION_TYPE).toBeDefined();
      expect(GENERAL_ATTRIBUTES.OPERATION_RESULT).toBeDefined();
      expect(GENERAL_ATTRIBUTES.OPERATION_STATUS).toBeDefined();
    });

    it('should define error information attributes', () => {
      expect(GENERAL_ATTRIBUTES.ERROR_TYPE).toBeDefined();
      expect(GENERAL_ATTRIBUTES.ERROR_CODE).toBeDefined();
      expect(GENERAL_ATTRIBUTES.ERROR_MESSAGE).toBeDefined();
    });
  });

  describe('Journey Attributes', () => {
    it('should define journey identification attributes', () => {
      expect(JOURNEY_ATTRIBUTES.JOURNEY_TYPE).toBeDefined();
      expect(JOURNEY_ATTRIBUTES.JOURNEY_ID).toBeDefined();
      expect(JOURNEY_ATTRIBUTES.JOURNEY_STEP).toBeDefined();
      expect(JOURNEY_ATTRIBUTES.JOURNEY_STEP_ID).toBeDefined();
    });

    it('should follow the journey namespace pattern', () => {
      Object.values(JOURNEY_ATTRIBUTES).forEach(attribute => {
        expect(attribute).toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.journey\.`));
      });
    });
  });

  describe('Health Journey Attributes', () => {
    it('should define health metric attributes', () => {
      expect(HEALTH_JOURNEY_ATTRIBUTES.METRIC_TYPE).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES.METRIC_VALUE).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES.METRIC_UNIT).toBeDefined();
    });

    it('should define health goal attributes', () => {
      expect(HEALTH_JOURNEY_ATTRIBUTES.GOAL_ID).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES.GOAL_TYPE).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES.GOAL_PROGRESS).toBeDefined();
    });

    it('should define device integration attributes', () => {
      expect(HEALTH_JOURNEY_ATTRIBUTES.DEVICE_ID).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES.DEVICE_TYPE).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES.SYNC_STATUS).toBeDefined();
    });

    it('should follow the health namespace pattern', () => {
      Object.values(HEALTH_JOURNEY_ATTRIBUTES).forEach(attribute => {
        expect(attribute).toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.health\.`));
      });
    });
  });

  describe('Care Journey Attributes', () => {
    it('should define appointment attributes', () => {
      expect(CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_ID).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_TYPE).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_STATUS).toBeDefined();
    });

    it('should define telemedicine attributes', () => {
      expect(CARE_JOURNEY_ATTRIBUTES.TELEMEDICINE_SESSION_ID).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.TELEMEDICINE_PROVIDER_ID).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.TELEMEDICINE_STATUS).toBeDefined();
    });

    it('should define medication attributes', () => {
      expect(CARE_JOURNEY_ATTRIBUTES.MEDICATION_ID).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.MEDICATION_NAME).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES.MEDICATION_ADHERENCE).toBeDefined();
    });

    it('should follow the care namespace pattern', () => {
      Object.values(CARE_JOURNEY_ATTRIBUTES).forEach(attribute => {
        expect(attribute).toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.care\.`));
      });
    });
  });

  describe('Plan Journey Attributes', () => {
    it('should define insurance plan attributes', () => {
      expect(PLAN_JOURNEY_ATTRIBUTES.PLAN_ID).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.PLAN_TYPE).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.PLAN_TIER).toBeDefined();
    });

    it('should define claim attributes', () => {
      expect(PLAN_JOURNEY_ATTRIBUTES.CLAIM_ID).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.CLAIM_TYPE).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.CLAIM_STATUS).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.CLAIM_AMOUNT).toBeDefined();
    });

    it('should define benefit attributes', () => {
      expect(PLAN_JOURNEY_ATTRIBUTES.BENEFIT_ID).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.BENEFIT_TYPE).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES.BENEFIT_USAGE).toBeDefined();
    });

    it('should follow the plan namespace pattern', () => {
      Object.values(PLAN_JOURNEY_ATTRIBUTES).forEach(attribute => {
        expect(attribute).toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.plan\.`));
      });
    });
  });

  describe('Gamification Attributes', () => {
    it('should define event attributes', () => {
      expect(GAMIFICATION_ATTRIBUTES.EVENT_ID).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.EVENT_TYPE).toBeDefined();
    });

    it('should define achievement attributes', () => {
      expect(GAMIFICATION_ATTRIBUTES.ACHIEVEMENT_ID).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.ACHIEVEMENT_TYPE).toBeDefined();
    });

    it('should define reward attributes', () => {
      expect(GAMIFICATION_ATTRIBUTES.REWARD_ID).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.REWARD_TYPE).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.REWARD_AMOUNT).toBeDefined();
    });

    it('should define user progress attributes', () => {
      expect(GAMIFICATION_ATTRIBUTES.USER_LEVEL).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.USER_XP).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES.USER_RANK).toBeDefined();
    });

    it('should follow the gamification namespace pattern', () => {
      Object.values(GAMIFICATION_ATTRIBUTES).forEach(attribute => {
        expect(attribute).toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.gamification\.`));
      });
    });
  });

  describe('Database Attributes', () => {
    it('should define general database information attributes', () => {
      expect(DATABASE_ATTRIBUTES.DB_SYSTEM).toBeDefined();
      expect(DATABASE_ATTRIBUTES.DB_NAME).toBeDefined();
      expect(DATABASE_ATTRIBUTES.DB_OPERATION).toBeDefined();
    });

    it('should define query information attributes', () => {
      expect(DATABASE_ATTRIBUTES.DB_STATEMENT).toBeDefined();
      expect(DATABASE_ATTRIBUTES.DB_OPERATION_ID).toBeDefined();
      expect(DATABASE_ATTRIBUTES.DB_TABLE).toBeDefined();
      expect(DATABASE_ATTRIBUTES.DB_ENTITY).toBeDefined();
    });

    it('should define performance metrics attributes', () => {
      expect(DATABASE_ATTRIBUTES.DB_ROWS_AFFECTED).toBeDefined();
      expect(DATABASE_ATTRIBUTES.DB_ROWS_RETURNED).toBeDefined();
    });

    it('should use standard OpenTelemetry DB attributes where applicable', () => {
      expect(DATABASE_ATTRIBUTES.DB_SYSTEM).not.toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.`));
      expect(DATABASE_ATTRIBUTES.DB_NAME).not.toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.`));
      expect(DATABASE_ATTRIBUTES.DB_OPERATION).not.toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.`));
      expect(DATABASE_ATTRIBUTES.DB_STATEMENT).not.toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.`));
    });

    it('should use AUSTA namespace for custom DB attributes', () => {
      expect(DATABASE_ATTRIBUTES.DB_OPERATION_ID).toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.db\.`));
      expect(DATABASE_ATTRIBUTES.DB_TABLE).toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.db\.`));
      expect(DATABASE_ATTRIBUTES.DB_ENTITY).toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.db\.`));
      expect(DATABASE_ATTRIBUTES.DB_ROWS_AFFECTED).toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.db\.`));
      expect(DATABASE_ATTRIBUTES.DB_ROWS_RETURNED).toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.db\.`));
    });
  });

  describe('External API Attributes', () => {
    it('should define general API information attributes', () => {
      expect(EXTERNAL_API_ATTRIBUTES.API_NAME).toBeDefined();
      expect(EXTERNAL_API_ATTRIBUTES.API_VERSION).toBeDefined();
      expect(EXTERNAL_API_ATTRIBUTES.API_ENDPOINT).toBeDefined();
    });

    it('should define request information attributes', () => {
      expect(EXTERNAL_API_ATTRIBUTES.REQUEST_METHOD).toBeDefined();
      expect(EXTERNAL_API_ATTRIBUTES.REQUEST_SIZE).toBeDefined();
    });

    it('should define response information attributes', () => {
      expect(EXTERNAL_API_ATTRIBUTES.RESPONSE_STATUS).toBeDefined();
      expect(EXTERNAL_API_ATTRIBUTES.RESPONSE_SIZE).toBeDefined();
    });

    it('should define integration specific attributes', () => {
      expect(EXTERNAL_API_ATTRIBUTES.INTEGRATION_TYPE).toBeDefined();
      expect(EXTERNAL_API_ATTRIBUTES.INTEGRATION_PARTNER).toBeDefined();
    });

    it('should follow the API namespace pattern', () => {
      const apiAttributes = [
        EXTERNAL_API_ATTRIBUTES.API_NAME,
        EXTERNAL_API_ATTRIBUTES.API_VERSION,
        EXTERNAL_API_ATTRIBUTES.API_ENDPOINT,
        EXTERNAL_API_ATTRIBUTES.REQUEST_METHOD,
        EXTERNAL_API_ATTRIBUTES.REQUEST_SIZE,
        EXTERNAL_API_ATTRIBUTES.RESPONSE_STATUS,
        EXTERNAL_API_ATTRIBUTES.RESPONSE_SIZE
      ];

      apiAttributes.forEach(attribute => {
        expect(attribute).toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.api\.`));
      });
    });

    it('should follow the integration namespace pattern for integration attributes', () => {
      expect(EXTERNAL_API_ATTRIBUTES.INTEGRATION_TYPE).toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.integration\.`));
      expect(EXTERNAL_API_ATTRIBUTES.INTEGRATION_PARTNER).toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.integration\.`));
    });
  });

  describe('Notification Attributes', () => {
    it('should define notification metadata attributes', () => {
      expect(NOTIFICATION_ATTRIBUTES.NOTIFICATION_ID).toBeDefined();
      expect(NOTIFICATION_ATTRIBUTES.NOTIFICATION_TYPE).toBeDefined();
      expect(NOTIFICATION_ATTRIBUTES.NOTIFICATION_CHANNEL).toBeDefined();
    });

    it('should define delivery information attributes', () => {
      expect(NOTIFICATION_ATTRIBUTES.DELIVERY_STATUS).toBeDefined();
      expect(NOTIFICATION_ATTRIBUTES.DELIVERY_ATTEMPT).toBeDefined();
      expect(NOTIFICATION_ATTRIBUTES.DELIVERY_TIMESTAMP).toBeDefined();
    });

    it('should follow the notification namespace pattern', () => {
      Object.values(NOTIFICATION_ATTRIBUTES).forEach(attribute => {
        expect(attribute).toMatch(new RegExp(`^${AUSTA_ATTRIBUTE_NAMESPACE}\.notification\.`));
      });
    });
  });

  describe('SPAN_ATTRIBUTES Export', () => {
    it('should export all attribute categories in SPAN_ATTRIBUTES object', () => {
      expect(SPAN_ATTRIBUTES.GENERAL).toBe(GENERAL_ATTRIBUTES);
      expect(SPAN_ATTRIBUTES.JOURNEY).toBe(JOURNEY_ATTRIBUTES);
      expect(SPAN_ATTRIBUTES.HEALTH).toBe(HEALTH_JOURNEY_ATTRIBUTES);
      expect(SPAN_ATTRIBUTES.CARE).toBe(CARE_JOURNEY_ATTRIBUTES);
      expect(SPAN_ATTRIBUTES.PLAN).toBe(PLAN_JOURNEY_ATTRIBUTES);
      expect(SPAN_ATTRIBUTES.GAMIFICATION).toBe(GAMIFICATION_ATTRIBUTES);
      expect(SPAN_ATTRIBUTES.DATABASE).toBe(DATABASE_ATTRIBUTES);
      expect(SPAN_ATTRIBUTES.EXTERNAL_API).toBe(EXTERNAL_API_ATTRIBUTES);
      expect(SPAN_ATTRIBUTES.NOTIFICATION).toBe(NOTIFICATION_ATTRIBUTES);
    });
  });

  describe('Cross-Journey Consistency', () => {
    it('should use consistent attribute naming across journeys for similar concepts', () => {
      // ID attributes should follow the same pattern across journeys
      expect(HEALTH_JOURNEY_ATTRIBUTES.GOAL_ID).toMatch(/\.goal\.id$/);
      expect(CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_ID).toMatch(/\.appointment\.id$/);
      expect(PLAN_JOURNEY_ATTRIBUTES.PLAN_ID).toMatch(/\.id$/);
      expect(PLAN_JOURNEY_ATTRIBUTES.CLAIM_ID).toMatch(/\.claim\.id$/);
      expect(PLAN_JOURNEY_ATTRIBUTES.BENEFIT_ID).toMatch(/\.benefit\.id$/);
      
      // Type attributes should follow the same pattern across journeys
      expect(HEALTH_JOURNEY_ATTRIBUTES.METRIC_TYPE).toMatch(/\.metric\.type$/);
      expect(CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_TYPE).toMatch(/\.appointment\.type$/);
      expect(PLAN_JOURNEY_ATTRIBUTES.PLAN_TYPE).toMatch(/\.type$/);
      expect(PLAN_JOURNEY_ATTRIBUTES.CLAIM_TYPE).toMatch(/\.claim\.type$/);
      expect(PLAN_JOURNEY_ATTRIBUTES.BENEFIT_TYPE).toMatch(/\.benefit\.type$/);
      
      // Status attributes should follow the same pattern across journeys
      expect(HEALTH_JOURNEY_ATTRIBUTES.SYNC_STATUS).toMatch(/\.sync\.status$/);
      expect(CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_STATUS).toMatch(/\.appointment\.status$/);
      expect(CARE_JOURNEY_ATTRIBUTES.TELEMEDICINE_STATUS).toMatch(/\.telemedicine\.status$/);
      expect(PLAN_JOURNEY_ATTRIBUTES.CLAIM_STATUS).toMatch(/\.claim\.status$/);
    });
  });
});