import {
  COMMON_ATTRIBUTES,
  HEALTH_JOURNEY_ATTRIBUTES,
  CARE_JOURNEY_ATTRIBUTES,
  PLAN_JOURNEY_ATTRIBUTES,
  GAMIFICATION_ATTRIBUTES,
  NOTIFICATION_ATTRIBUTES,
  DATABASE_ATTRIBUTES,
  HTTP_ATTRIBUTES,
  GRAPHQL_ATTRIBUTES,
  KAFKA_ATTRIBUTES
} from '../../../src/constants/span-attributes';

describe('Span Attribute Constants', () => {
  describe('Common Attributes', () => {
    it('should define common attributes with proper naming convention', () => {
      // Check that all common attributes follow the dot notation naming convention
      Object.values(COMMON_ATTRIBUTES).forEach(attributeName => {
        expect(attributeName).toMatch(/^[a-z]+(?:\.[a-z]+)+$/i);
      });
    });

    it('should include essential request context attributes', () => {
      expect(COMMON_ATTRIBUTES.REQUEST_ID).toBeDefined();
      expect(COMMON_ATTRIBUTES.CORRELATION_ID).toBeDefined();
      expect(COMMON_ATTRIBUTES.USER_ID).toBeDefined();
      expect(COMMON_ATTRIBUTES.SESSION_ID).toBeDefined();
    });

    it('should include service information attributes', () => {
      expect(COMMON_ATTRIBUTES.SERVICE_NAME).toBeDefined();
      expect(COMMON_ATTRIBUTES.SERVICE_VERSION).toBeDefined();
      expect(COMMON_ATTRIBUTES.SERVICE_NAMESPACE).toBeDefined();
    });

    it('should include operation detail attributes', () => {
      expect(COMMON_ATTRIBUTES.OPERATION_NAME).toBeDefined();
      expect(COMMON_ATTRIBUTES.OPERATION_TYPE).toBeDefined();
      expect(COMMON_ATTRIBUTES.OPERATION_RESULT).toBeDefined();
      expect(COMMON_ATTRIBUTES.OPERATION_STATUS).toBeDefined();
    });

    it('should include error information attributes', () => {
      expect(COMMON_ATTRIBUTES.ERROR_TYPE).toBeDefined();
      expect(COMMON_ATTRIBUTES.ERROR_MESSAGE).toBeDefined();
      expect(COMMON_ATTRIBUTES.ERROR_STACK).toBeDefined();
      expect(COMMON_ATTRIBUTES.ERROR_CODE).toBeDefined();
    });

    it('should include journey context attributes', () => {
      expect(COMMON_ATTRIBUTES.JOURNEY_TYPE).toBeDefined();
      expect(COMMON_ATTRIBUTES.JOURNEY_STEP).toBeDefined();
      expect(COMMON_ATTRIBUTES.JOURNEY_CONTEXT_ID).toBeDefined();
    });
  });

  describe('Journey-Specific Attributes', () => {
    it('should define health journey attributes with proper naming convention', () => {
      // Check that all health journey attributes follow the dot notation naming convention
      Object.values(HEALTH_JOURNEY_ATTRIBUTES).forEach(attributeName => {
        expect(attributeName).toMatch(/^[a-z]+(?:\.[a-z]+)+$/i);
      });

      // Check that health journey attributes have the 'health' prefix where appropriate
      const healthPrefixAttributes = [
        HEALTH_JOURNEY_ATTRIBUTES.HEALTH_PROFILE_ID,
        HEALTH_JOURNEY_ATTRIBUTES.HEALTH_METRIC_TYPE,
        HEALTH_JOURNEY_ATTRIBUTES.HEALTH_METRIC_VALUE,
        HEALTH_JOURNEY_ATTRIBUTES.HEALTH_GOAL_ID,
        HEALTH_JOURNEY_ATTRIBUTES.HEALTH_GOAL_TYPE
      ];

      healthPrefixAttributes.forEach(attributeName => {
        expect(attributeName).toMatch(/^health\./i);
      });
    });

    it('should define care journey attributes with proper naming convention', () => {
      // Check that all care journey attributes follow the dot notation naming convention
      Object.values(CARE_JOURNEY_ATTRIBUTES).forEach(attributeName => {
        expect(attributeName).toMatch(/^[a-z]+(?:\.[a-z]+)+$/i);
      });

      // Check that care journey attributes have appropriate domain prefixes
      expect(CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_ID).toMatch(/^appointment\./i);
      expect(CARE_JOURNEY_ATTRIBUTES.PROVIDER_ID).toMatch(/^provider\./i);
      expect(CARE_JOURNEY_ATTRIBUTES.MEDICATION_ID).toMatch(/^medication\./i);
      expect(CARE_JOURNEY_ATTRIBUTES.TELEMEDICINE_SESSION_ID).toMatch(/^telemedicine\./i);
      expect(CARE_JOURNEY_ATTRIBUTES.TREATMENT_ID).toMatch(/^treatment\./i);
    });

    it('should define plan journey attributes with proper naming convention', () => {
      // Check that all plan journey attributes follow the dot notation naming convention
      Object.values(PLAN_JOURNEY_ATTRIBUTES).forEach(attributeName => {
        expect(attributeName).toMatch(/^[a-z]+(?:\.[a-z]+)+$/i);
      });

      // Check that plan journey attributes have appropriate domain prefixes
      expect(PLAN_JOURNEY_ATTRIBUTES.PLAN_ID).toMatch(/^plan\./i);
      expect(PLAN_JOURNEY_ATTRIBUTES.BENEFIT_ID).toMatch(/^benefit\./i);
      expect(PLAN_JOURNEY_ATTRIBUTES.CLAIM_ID).toMatch(/^claim\./i);
      expect(PLAN_JOURNEY_ATTRIBUTES.COVERAGE_ID).toMatch(/^coverage\./i);
      expect(PLAN_JOURNEY_ATTRIBUTES.DOCUMENT_ID).toMatch(/^document\./i);
    });
  });

  describe('Gamification Attributes', () => {
    it('should define gamification attributes with proper naming convention', () => {
      // Check that all gamification attributes follow the dot notation naming convention
      Object.values(GAMIFICATION_ATTRIBUTES).forEach(attributeName => {
        expect(attributeName).toMatch(/^[a-z]+(?:\.[a-z]+)+$/i);
      });

      // Check that gamification profile attributes have the 'gamification' prefix
      expect(GAMIFICATION_ATTRIBUTES.GAMIFICATION_PROFILE_ID).toMatch(/^gamification\./i);
      expect(GAMIFICATION_ATTRIBUTES.GAMIFICATION_LEVEL).toMatch(/^gamification\./i);
      expect(GAMIFICATION_ATTRIBUTES.GAMIFICATION_XP).toMatch(/^gamification\./i);

      // Check other gamification domain prefixes
      expect(GAMIFICATION_ATTRIBUTES.ACHIEVEMENT_ID).toMatch(/^achievement\./i);
      expect(GAMIFICATION_ATTRIBUTES.QUEST_ID).toMatch(/^quest\./i);
      expect(GAMIFICATION_ATTRIBUTES.REWARD_ID).toMatch(/^reward\./i);
      expect(GAMIFICATION_ATTRIBUTES.EVENT_ID).toMatch(/^event\./i);
      expect(GAMIFICATION_ATTRIBUTES.RULE_ID).toMatch(/^rule\./i);
      expect(GAMIFICATION_ATTRIBUTES.LEADERBOARD_ID).toMatch(/^leaderboard\./i);
    });
  });

  describe('Notification Attributes', () => {
    it('should define notification attributes with proper naming convention', () => {
      // Check that all notification attributes follow the dot notation naming convention
      Object.values(NOTIFICATION_ATTRIBUTES).forEach(attributeName => {
        expect(attributeName).toMatch(/^[a-z]+(?:\.[a-z]+)+$/i);
      });

      // Check notification domain prefixes
      expect(NOTIFICATION_ATTRIBUTES.NOTIFICATION_ID).toMatch(/^notification\./i);
      expect(NOTIFICATION_ATTRIBUTES.TEMPLATE_ID).toMatch(/^template\./i);
      expect(NOTIFICATION_ATTRIBUTES.DELIVERY_ATTEMPT).toMatch(/^delivery\./i);
      expect(NOTIFICATION_ATTRIBUTES.RETRY_COUNT).toMatch(/^retry\./i);
      expect(NOTIFICATION_ATTRIBUTES.PREFERENCE_ID).toMatch(/^preference\./i);
    });
  });

  describe('Technical Domain Attributes', () => {
    it('should define database attributes with proper naming convention', () => {
      // Check that all database attributes follow the dot notation naming convention
      Object.values(DATABASE_ATTRIBUTES).forEach(attributeName => {
        expect(attributeName).toMatch(/^[a-z]+(?:\.[a-z]+)+$/i);
      });

      // Check database domain prefixes
      expect(DATABASE_ATTRIBUTES.DB_SYSTEM).toMatch(/^db\./i);
      expect(DATABASE_ATTRIBUTES.DB_TRANSACTION_ID).toMatch(/^db\.transaction\./i);
      expect(DATABASE_ATTRIBUTES.PRISMA_MODEL).toMatch(/^prisma\./i);
    });

    it('should define HTTP attributes with proper naming convention', () => {
      // Check that all HTTP attributes follow the dot notation naming convention
      Object.values(HTTP_ATTRIBUTES).forEach(attributeName => {
        expect(attributeName).toMatch(/^[a-z]+(?:\.[a-z]+)+$/i);
      });

      // Check HTTP domain prefixes
      expect(HTTP_ATTRIBUTES.HTTP_METHOD).toMatch(/^http\./i);
      expect(HTTP_ATTRIBUTES.HTTP_REQUEST_CONTENT_LENGTH).toMatch(/^http\.request\./i);
      expect(HTTP_ATTRIBUTES.HTTP_RESPONSE_CONTENT_LENGTH).toMatch(/^http\.response\./i);
      expect(HTTP_ATTRIBUTES.HTTP_CLIENT_IP).toMatch(/^http\.client\./i);
      expect(HTTP_ATTRIBUTES.HTTP_SERVER_IP).toMatch(/^http\.server\./i);
    });

    it('should define GraphQL attributes with proper naming convention', () => {
      // Check that all GraphQL attributes follow the dot notation naming convention
      Object.values(GRAPHQL_ATTRIBUTES).forEach(attributeName => {
        expect(attributeName).toMatch(/^[a-z]+(?:\.[a-z]+)+$/i);
      });

      // Check GraphQL domain prefixes
      expect(GRAPHQL_ATTRIBUTES.GRAPHQL_OPERATION_TYPE).toMatch(/^graphql\.operation\./i);
      expect(GRAPHQL_ATTRIBUTES.GRAPHQL_DOCUMENT).toMatch(/^graphql\./i);
      expect(GRAPHQL_ATTRIBUTES.GRAPHQL_RESOLVER_PATH).toMatch(/^graphql\.resolver\./i);
      expect(GRAPHQL_ATTRIBUTES.GRAPHQL_PARSING_TIME_MS).toMatch(/^graphql\.parsing\./i);
    });

    it('should define Kafka attributes with proper naming convention', () => {
      // Check that all Kafka attributes follow the dot notation naming convention
      Object.values(KAFKA_ATTRIBUTES).forEach(attributeName => {
        expect(attributeName).toMatch(/^[a-z]+(?:\.[a-z]+)+$/i);
      });

      // Check Kafka domain prefixes
      expect(KAFKA_ATTRIBUTES.KAFKA_TOPIC).toMatch(/^kafka\./i);
      expect(KAFKA_ATTRIBUTES.KAFKA_CONSUMER_GROUP).toMatch(/^kafka\.consumer\./i);
      expect(KAFKA_ATTRIBUTES.KAFKA_PRODUCER_ID).toMatch(/^kafka\.producer\./i);
      expect(KAFKA_ATTRIBUTES.KAFKA_MESSAGE_SIZE).toMatch(/^kafka\.message\./i);
    });
  });

  describe('Attribute Consistency', () => {
    it('should use consistent naming patterns for ID attributes across all domains', () => {
      const idAttributes = [
        COMMON_ATTRIBUTES.REQUEST_ID,
        COMMON_ATTRIBUTES.USER_ID,
        COMMON_ATTRIBUTES.SESSION_ID,
        COMMON_ATTRIBUTES.TENANT_ID,
        HEALTH_JOURNEY_ATTRIBUTES.HEALTH_PROFILE_ID,
        HEALTH_JOURNEY_ATTRIBUTES.HEALTH_GOAL_ID,
        HEALTH_JOURNEY_ATTRIBUTES.DEVICE_ID,
        CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_ID,
        CARE_JOURNEY_ATTRIBUTES.PROVIDER_ID,
        CARE_JOURNEY_ATTRIBUTES.MEDICATION_ID,
        PLAN_JOURNEY_ATTRIBUTES.PLAN_ID,
        PLAN_JOURNEY_ATTRIBUTES.BENEFIT_ID,
        PLAN_JOURNEY_ATTRIBUTES.CLAIM_ID,
        GAMIFICATION_ATTRIBUTES.GAMIFICATION_PROFILE_ID,
        GAMIFICATION_ATTRIBUTES.ACHIEVEMENT_ID,
        GAMIFICATION_ATTRIBUTES.QUEST_ID,
        NOTIFICATION_ATTRIBUTES.NOTIFICATION_ID,
        NOTIFICATION_ATTRIBUTES.TEMPLATE_ID,
        DATABASE_ATTRIBUTES.DB_TRANSACTION_ID,
        KAFKA_ATTRIBUTES.KAFKA_PRODUCER_ID
      ];

      // All ID attributes should end with '.id'
      idAttributes.forEach(attributeName => {
        expect(attributeName).toMatch(/\.id$/);
      });
    });

    it('should use consistent naming patterns for status attributes across all domains', () => {
      const statusAttributes = [
        COMMON_ATTRIBUTES.OPERATION_STATUS,
        CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_STATUS,
        CARE_JOURNEY_ATTRIBUTES.TELEMEDICINE_SESSION_STATUS,
        CARE_JOURNEY_ATTRIBUTES.TREATMENT_STATUS,
        PLAN_JOURNEY_ATTRIBUTES.PLAN_STATUS,
        PLAN_JOURNEY_ATTRIBUTES.CLAIM_STATUS,
        PLAN_JOURNEY_ATTRIBUTES.DOCUMENT_STATUS,
        GAMIFICATION_ATTRIBUTES.ACHIEVEMENT_STATUS,
        GAMIFICATION_ATTRIBUTES.QUEST_STATUS,
        NOTIFICATION_ATTRIBUTES.NOTIFICATION_STATUS,
        NOTIFICATION_ATTRIBUTES.DELIVERY_STATUS
      ];

      // All status attributes should end with '.status'
      statusAttributes.forEach(attributeName => {
        expect(attributeName).toMatch(/\.status$/);
      });
    });

    it('should use consistent naming patterns for type attributes across all domains', () => {
      const typeAttributes = [
        COMMON_ATTRIBUTES.OPERATION_TYPE,
        COMMON_ATTRIBUTES.ERROR_TYPE,
        COMMON_ATTRIBUTES.RESOURCE_TYPE,
        COMMON_ATTRIBUTES.JOURNEY_TYPE,
        HEALTH_JOURNEY_ATTRIBUTES.HEALTH_METRIC_TYPE,
        HEALTH_JOURNEY_ATTRIBUTES.HEALTH_GOAL_TYPE,
        HEALTH_JOURNEY_ATTRIBUTES.DEVICE_TYPE,
        CARE_JOURNEY_ATTRIBUTES.APPOINTMENT_TYPE,
        CARE_JOURNEY_ATTRIBUTES.PROVIDER_TYPE,
        CARE_JOURNEY_ATTRIBUTES.TREATMENT_TYPE,
        PLAN_JOURNEY_ATTRIBUTES.PLAN_TYPE,
        PLAN_JOURNEY_ATTRIBUTES.BENEFIT_TYPE,
        PLAN_JOURNEY_ATTRIBUTES.CLAIM_TYPE,
        PLAN_JOURNEY_ATTRIBUTES.COVERAGE_TYPE,
        PLAN_JOURNEY_ATTRIBUTES.DOCUMENT_TYPE,
        GAMIFICATION_ATTRIBUTES.ACHIEVEMENT_TYPE,
        GAMIFICATION_ATTRIBUTES.QUEST_TYPE,
        GAMIFICATION_ATTRIBUTES.REWARD_TYPE,
        GAMIFICATION_ATTRIBUTES.EVENT_TYPE,
        GAMIFICATION_ATTRIBUTES.RULE_TYPE,
        GAMIFICATION_ATTRIBUTES.LEADERBOARD_TYPE,
        NOTIFICATION_ATTRIBUTES.NOTIFICATION_TYPE,
        DATABASE_ATTRIBUTES.DB_TRANSACTION_TYPE,
        GRAPHQL_ATTRIBUTES.GRAPHQL_OPERATION_TYPE
      ];

      // All type attributes should end with '.type'
      typeAttributes.forEach(attributeName => {
        expect(attributeName).toMatch(/\.type$/);
      });
    });

    it('should use consistent naming patterns for time/duration attributes across all domains', () => {
      const timeAttributes = [
        COMMON_ATTRIBUTES.DURATION_MS,
        COMMON_ATTRIBUTES.DB_QUERY_TIME_MS,
        COMMON_ATTRIBUTES.EXTERNAL_CALL_TIME_MS,
        HEALTH_JOURNEY_ATTRIBUTES.HEALTH_METRIC_TIMESTAMP,
        CARE_JOURNEY_ATTRIBUTES.TELEMEDICINE_SESSION_DURATION,
        PLAN_JOURNEY_ATTRIBUTES.CLAIM_PROCESSING_TIME,
        NOTIFICATION_ATTRIBUTES.DELIVERY_TIMESTAMP,
        NOTIFICATION_ATTRIBUTES.RETRY_DELAY_MS,
        GRAPHQL_ATTRIBUTES.GRAPHQL_PARSING_TIME_MS,
        GRAPHQL_ATTRIBUTES.GRAPHQL_VALIDATION_TIME_MS,
        GRAPHQL_ATTRIBUTES.GRAPHQL_EXECUTION_TIME_MS,
        KAFKA_ATTRIBUTES.KAFKA_TIMESTAMP,
        KAFKA_ATTRIBUTES.KAFKA_PROCESSING_TIME_MS
      ];

      // All time attributes should end with either '.ms', '.time', '.timestamp', or '.duration'
      timeAttributes.forEach(attributeName => {
        expect(attributeName).toMatch(/\.(ms|time|timestamp|duration)/);
      });
    });
  });

  describe('Attribute Exports', () => {
    it('should export all attribute constant objects', () => {
      expect(COMMON_ATTRIBUTES).toBeDefined();
      expect(HEALTH_JOURNEY_ATTRIBUTES).toBeDefined();
      expect(CARE_JOURNEY_ATTRIBUTES).toBeDefined();
      expect(PLAN_JOURNEY_ATTRIBUTES).toBeDefined();
      expect(GAMIFICATION_ATTRIBUTES).toBeDefined();
      expect(NOTIFICATION_ATTRIBUTES).toBeDefined();
      expect(DATABASE_ATTRIBUTES).toBeDefined();
      expect(HTTP_ATTRIBUTES).toBeDefined();
      expect(GRAPHQL_ATTRIBUTES).toBeDefined();
      expect(KAFKA_ATTRIBUTES).toBeDefined();
    });

    it('should ensure all attribute objects contain at least one attribute', () => {
      expect(Object.keys(COMMON_ATTRIBUTES).length).toBeGreaterThan(0);
      expect(Object.keys(HEALTH_JOURNEY_ATTRIBUTES).length).toBeGreaterThan(0);
      expect(Object.keys(CARE_JOURNEY_ATTRIBUTES).length).toBeGreaterThan(0);
      expect(Object.keys(PLAN_JOURNEY_ATTRIBUTES).length).toBeGreaterThan(0);
      expect(Object.keys(GAMIFICATION_ATTRIBUTES).length).toBeGreaterThan(0);
      expect(Object.keys(NOTIFICATION_ATTRIBUTES).length).toBeGreaterThan(0);
      expect(Object.keys(DATABASE_ATTRIBUTES).length).toBeGreaterThan(0);
      expect(Object.keys(HTTP_ATTRIBUTES).length).toBeGreaterThan(0);
      expect(Object.keys(GRAPHQL_ATTRIBUTES).length).toBeGreaterThan(0);
      expect(Object.keys(KAFKA_ATTRIBUTES).length).toBeGreaterThan(0);
    });

    it('should ensure all attribute values are strings', () => {
      // Check that all attribute values across all objects are strings
      const allAttributeObjects = [
        COMMON_ATTRIBUTES,
        HEALTH_JOURNEY_ATTRIBUTES,
        CARE_JOURNEY_ATTRIBUTES,
        PLAN_JOURNEY_ATTRIBUTES,
        GAMIFICATION_ATTRIBUTES,
        NOTIFICATION_ATTRIBUTES,
        DATABASE_ATTRIBUTES,
        HTTP_ATTRIBUTES,
        GRAPHQL_ATTRIBUTES,
        KAFKA_ATTRIBUTES
      ];

      allAttributeObjects.forEach(attributeObject => {
        Object.values(attributeObject).forEach(attributeValue => {
          expect(typeof attributeValue).toBe('string');
        });
      });
    });
  });
});