/**
 * Test fixtures for span attributes used in tracing tests
 * 
 * This file defines common span attributes used across different journeys (health, care, plan)
 * for consistent testing of attribute management in traces. It provides standard attribute sets
 * for different operation types including HTTP requests, database operations, and message processing,
 * ensuring traces can be properly filtered and analyzed.
 */

import {
  SpanAttributes,
  HttpSpanAttributes,
  DatabaseSpanAttributes,
  MessagingSpanAttributes,
  JourneySpanAttributes,
  HealthJourneySpanAttributes,
  CareJourneySpanAttributes,
  PlanJourneySpanAttributes,
  GamificationSpanAttributes,
  ErrorSpanAttributes,
  JOURNEY_NAMES,
  DATABASE_SYSTEMS,
  MESSAGING_SYSTEMS,
  ERROR_TYPES,
  GAMIFICATION_EVENT_TYPES,
} from '../../src/interfaces/span-attributes.interface';

import { JourneyType } from '../../src/interfaces/journey-context.interface';

// Common test user IDs
const TEST_USER_ID = 'test-user-123';
const TEST_SESSION_ID = 'test-session-456';
const TEST_REQUEST_ID = 'test-request-789';

/**
 * Common base attributes for all spans
 */
export const COMMON_ATTRIBUTES: SpanAttributes = {
  'service.name': 'austa-test-service',
  'service.version': '1.0.0',
  'deployment.environment': 'test',
};

/**
 * HTTP request attributes for testing
 */
export const HTTP_ATTRIBUTES: HttpSpanAttributes = {
  'http.method': 'GET',
  'http.url': 'https://api.austa.health/v1/users',
  'http.host': 'api.austa.health',
  'http.scheme': 'https',
  'http.target': '/v1/users',
  'http.status_code': 200,
  'http.flavor': '1.1',
  'http.user_agent': 'AUSTA-SuperApp/1.0',
  'http.request_content_length': 0,
  'http.response_content_length': 1024,
  'http.route': '/v1/users',
};

/**
 * HTTP error attributes for testing
 */
export const HTTP_ERROR_ATTRIBUTES: HttpSpanAttributes = {
  'http.method': 'POST',
  'http.url': 'https://api.austa.health/v1/users',
  'http.host': 'api.austa.health',
  'http.scheme': 'https',
  'http.target': '/v1/users',
  'http.status_code': 400,
  'http.flavor': '1.1',
  'http.user_agent': 'AUSTA-SuperApp/1.0',
  'http.request_content_length': 256,
  'http.response_content_length': 128,
  'http.route': '/v1/users',
};

/**
 * Database operation attributes for testing
 */
export const DATABASE_ATTRIBUTES: DatabaseSpanAttributes = {
  'db.system': DATABASE_SYSTEMS.POSTGRES,
  'db.name': 'austa_db',
  'db.user': 'austa_service',
  'db.statement': 'SELECT * FROM users WHERE id = $1',
  'db.operation': 'SELECT',
  'db.instance': 'austa-db-instance',
  'db.sql.table': 'users',
};

/**
 * Redis database operation attributes for testing
 */
export const REDIS_ATTRIBUTES: DatabaseSpanAttributes = {
  'db.system': DATABASE_SYSTEMS.REDIS,
  'db.name': 'austa_cache',
  'db.statement': 'GET user:123',
  'db.operation': 'GET',
  'db.instance': 'austa-redis-instance',
};

/**
 * Kafka messaging attributes for testing
 */
export const KAFKA_ATTRIBUTES: MessagingSpanAttributes = {
  'messaging.system': MESSAGING_SYSTEMS.KAFKA,
  'messaging.destination': 'austa.events',
  'messaging.destination_kind': 'topic',
  'messaging.temp_destination': false,
  'messaging.protocol': 'kafka',
  'messaging.protocol_version': '2.0',
  'messaging.message_id': 'msg-123',
  'messaging.conversation_id': 'conv-456',
  'messaging.message_payload_size_bytes': 512,
};

/**
 * Base journey attributes for testing
 */
export const BASE_JOURNEY_ATTRIBUTES: JourneySpanAttributes = {
  'austa.journey.user_id': TEST_USER_ID,
  'austa.journey.session_id': TEST_SESSION_ID,
  'austa.journey.feature': 'test-feature',
  'austa.journey.step': 'test-step',
};

/**
 * Health journey attributes for testing
 */
export const HEALTH_JOURNEY_ATTRIBUTES: HealthJourneySpanAttributes = {
  ...BASE_JOURNEY_ATTRIBUTES,
  'austa.journey.name': JOURNEY_NAMES.HEALTH,
  'austa.journey.operation': 'record_metric',
  'austa.health.metric_type': 'blood_pressure',
  'austa.health.metric_value': 120,
  'austa.health.goal_id': 'goal-123',
  'austa.health.device_id': 'device-456',
  'austa.health.integration_type': 'fitbit',
};

/**
 * Care journey attributes for testing
 */
export const CARE_JOURNEY_ATTRIBUTES: CareJourneySpanAttributes = {
  ...BASE_JOURNEY_ATTRIBUTES,
  'austa.journey.name': JOURNEY_NAMES.CARE,
  'austa.journey.operation': 'book_appointment',
  'austa.care.appointment_id': 'appt-123',
  'austa.care.provider_id': 'provider-456',
  'austa.care.telemedicine_session_id': 'tele-789',
  'austa.care.medication_id': 'med-123',
  'austa.care.treatment_id': 'treatment-456',
};

/**
 * Plan journey attributes for testing
 */
export const PLAN_JOURNEY_ATTRIBUTES: PlanJourneySpanAttributes = {
  ...BASE_JOURNEY_ATTRIBUTES,
  'austa.journey.name': JOURNEY_NAMES.PLAN,
  'austa.journey.operation': 'submit_claim',
  'austa.plan.plan_id': 'plan-123',
  'austa.plan.benefit_id': 'benefit-456',
  'austa.plan.claim_id': 'claim-789',
  'austa.plan.coverage_id': 'coverage-123',
  'austa.plan.document_id': 'document-456',
};

/**
 * Gamification attributes for testing
 */
export const GAMIFICATION_ATTRIBUTES: GamificationSpanAttributes = {
  'austa.gamification.event_type': GAMIFICATION_EVENT_TYPES.ACHIEVEMENT_UNLOCKED,
  'austa.gamification.profile_id': 'profile-123',
  'austa.gamification.achievement_id': 'achievement-456',
  'austa.gamification.quest_id': 'quest-789',
  'austa.gamification.reward_id': 'reward-123',
  'austa.gamification.points': 100,
  'austa.gamification.level': 5,
};

/**
 * Error attributes for testing
 */
export const ERROR_ATTRIBUTES: ErrorSpanAttributes = {
  'error.type': ERROR_TYPES.VALIDATION,
  'error.message': 'Invalid input data',
  'error.stack': 'Error: Invalid input data\n    at validateInput (/app/src/validator.ts:42:11)',
  'error.code': 'ERR_VALIDATION_FAILED',
  'error.retry_count': 0,
  'error.is_retryable': false,
};

/**
 * Dependency error attributes for testing
 */
export const DEPENDENCY_ERROR_ATTRIBUTES: ErrorSpanAttributes = {
  'error.type': ERROR_TYPES.DEPENDENCY,
  'error.message': 'External service unavailable',
  'error.stack': 'Error: External service unavailable\n    at callExternalService (/app/src/service.ts:123:11)',
  'error.code': 'ERR_EXTERNAL_SERVICE',
  'error.retry_count': 3,
  'error.is_retryable': true,
};

/**
 * Helper function to combine multiple attribute sets
 * @param attributeSets - Array of attribute sets to combine
 * @returns Combined attributes object
 */
export function combineAttributes(...attributeSets: SpanAttributes[]): SpanAttributes {
  return attributeSets.reduce((combined, current) => {
    return { ...combined, ...current };
  }, {});
}

/**
 * Creates HTTP attributes with journey context
 * @param journeyType - Type of journey (health, care, plan)
 * @param operation - Operation being performed
 * @param method - HTTP method
 * @param path - API path
 * @returns Combined HTTP and journey attributes
 */
export function createHttpJourneyAttributes(
  journeyType: JourneyType,
  operation: string,
  method = 'GET',
  path = '/v1/users'
): SpanAttributes {
  const baseHttp: HttpSpanAttributes = {
    ...HTTP_ATTRIBUTES,
    'http.method': method,
    'http.target': path,
    'http.route': path,
    'http.url': `https://api.austa.health${path}`,
  };
  
  let journeyAttributes: JourneySpanAttributes;
  
  switch (journeyType) {
    case JourneyType.HEALTH:
      journeyAttributes = HEALTH_JOURNEY_ATTRIBUTES;
      break;
    case JourneyType.CARE:
      journeyAttributes = CARE_JOURNEY_ATTRIBUTES;
      break;
    case JourneyType.PLAN:
      journeyAttributes = PLAN_JOURNEY_ATTRIBUTES;
      break;
    default:
      journeyAttributes = BASE_JOURNEY_ATTRIBUTES;
  }
  
  return combineAttributes(
    COMMON_ATTRIBUTES,
    baseHttp,
    {
      ...journeyAttributes,
      'austa.journey.operation': operation,
    }
  );
}

/**
 * Creates database attributes with journey context
 * @param journeyType - Type of journey (health, care, plan)
 * @param operation - Database operation
 * @param table - Database table
 * @param dbSystem - Database system
 * @returns Combined database and journey attributes
 */
export function createDatabaseJourneyAttributes(
  journeyType: JourneyType,
  operation: string,
  table: string,
  dbSystem = DATABASE_SYSTEMS.POSTGRES
): SpanAttributes {
  const baseDb: DatabaseSpanAttributes = {
    ...DATABASE_ATTRIBUTES,
    'db.system': dbSystem,
    'db.operation': operation,
    'db.sql.table': table,
  };
  
  let journeyAttributes: JourneySpanAttributes;
  
  switch (journeyType) {
    case JourneyType.HEALTH:
      journeyAttributes = HEALTH_JOURNEY_ATTRIBUTES;
      break;
    case JourneyType.CARE:
      journeyAttributes = CARE_JOURNEY_ATTRIBUTES;
      break;
    case JourneyType.PLAN:
      journeyAttributes = PLAN_JOURNEY_ATTRIBUTES;
      break;
    default:
      journeyAttributes = BASE_JOURNEY_ATTRIBUTES;
  }
  
  return combineAttributes(
    COMMON_ATTRIBUTES,
    baseDb,
    {
      ...journeyAttributes,
      'austa.journey.operation': `db_${operation.toLowerCase()}`,
    }
  );
}

/**
 * Creates messaging attributes with journey context
 * @param journeyType - Type of journey (health, care, plan)
 * @param eventType - Type of event being processed
 * @param topic - Kafka topic
 * @returns Combined messaging and journey attributes
 */
export function createMessagingJourneyAttributes(
  journeyType: JourneyType,
  eventType: string,
  topic = 'austa.events'
): SpanAttributes {
  const baseMessaging: MessagingSpanAttributes = {
    ...KAFKA_ATTRIBUTES,
    'messaging.destination': topic,
  };
  
  let journeyAttributes: JourneySpanAttributes;
  
  switch (journeyType) {
    case JourneyType.HEALTH:
      journeyAttributes = HEALTH_JOURNEY_ATTRIBUTES;
      break;
    case JourneyType.CARE:
      journeyAttributes = CARE_JOURNEY_ATTRIBUTES;
      break;
    case JourneyType.PLAN:
      journeyAttributes = PLAN_JOURNEY_ATTRIBUTES;
      break;
    default:
      journeyAttributes = BASE_JOURNEY_ATTRIBUTES;
  }
  
  return combineAttributes(
    COMMON_ATTRIBUTES,
    baseMessaging,
    {
      ...journeyAttributes,
      'austa.journey.operation': `process_${eventType}`,
    },
    {
      'austa.gamification.event_type': eventType,
    }
  );
}

/**
 * Creates error attributes with journey context
 * @param journeyType - Type of journey (health, care, plan)
 * @param errorType - Type of error
 * @param message - Error message
 * @param code - Error code
 * @param isRetryable - Whether the error is retryable
 * @returns Combined error and journey attributes
 */
export function createErrorJourneyAttributes(
  journeyType: JourneyType,
  errorType: string,
  message: string,
  code: string,
  isRetryable = false
): SpanAttributes {
  const baseError: ErrorSpanAttributes = {
    'error.type': errorType,
    'error.message': message,
    'error.code': code,
    'error.is_retryable': isRetryable,
  };
  
  let journeyAttributes: JourneySpanAttributes;
  
  switch (journeyType) {
    case JourneyType.HEALTH:
      journeyAttributes = HEALTH_JOURNEY_ATTRIBUTES;
      break;
    case JourneyType.CARE:
      journeyAttributes = CARE_JOURNEY_ATTRIBUTES;
      break;
    case JourneyType.PLAN:
      journeyAttributes = PLAN_JOURNEY_ATTRIBUTES;
      break;
    default:
      journeyAttributes = BASE_JOURNEY_ATTRIBUTES;
  }
  
  return combineAttributes(
    COMMON_ATTRIBUTES,
    baseError,
    {
      ...journeyAttributes,
      'austa.journey.error_code': code,
      'austa.journey.error_message': message,
    }
  );
}

/**
 * Creates gamification attributes with journey context
 * @param journeyType - Type of journey (health, care, plan)
 * @param gamificationEventType - Type of gamification event
 * @param achievementId - Achievement ID (optional)
 * @param points - Points earned (optional)
 * @returns Combined gamification and journey attributes
 */
export function createGamificationJourneyAttributes(
  journeyType: JourneyType,
  gamificationEventType: string,
  achievementId?: string,
  points?: number
): SpanAttributes {
  const baseGamification: GamificationSpanAttributes = {
    'austa.gamification.event_type': gamificationEventType,
    'austa.gamification.profile_id': `profile-${TEST_USER_ID}`,
    ...(achievementId && { 'austa.gamification.achievement_id': achievementId }),
    ...(points !== undefined && { 'austa.gamification.points': points }),
  };
  
  let journeyAttributes: JourneySpanAttributes;
  
  switch (journeyType) {
    case JourneyType.HEALTH:
      journeyAttributes = HEALTH_JOURNEY_ATTRIBUTES;
      break;
    case JourneyType.CARE:
      journeyAttributes = CARE_JOURNEY_ATTRIBUTES;
      break;
    case JourneyType.PLAN:
      journeyAttributes = PLAN_JOURNEY_ATTRIBUTES;
      break;
    default:
      journeyAttributes = BASE_JOURNEY_ATTRIBUTES;
  }
  
  return combineAttributes(
    COMMON_ATTRIBUTES,
    baseGamification,
    {
      ...journeyAttributes,
      'austa.journey.operation': `gamification_${gamificationEventType}`,
    }
  );
}