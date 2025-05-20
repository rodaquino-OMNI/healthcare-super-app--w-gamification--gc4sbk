/**
 * Standard span attributes for testing tracing functionality across different journeys.
 * These fixtures provide consistent attribute sets for various operation types and journeys.
 */

import { SpanAttributes } from '@opentelemetry/api';

/**
 * Common attributes that should be present in all spans
 */
export const commonAttributes: SpanAttributes = {
  'service.name': 'austa-service',
  'service.version': '1.0.0',
  'deployment.environment': 'test',
};

/**
 * Base attributes for HTTP operations
 */
export const httpAttributes: SpanAttributes = {
  'http.method': 'GET',
  'http.url': 'https://api.austa.health/v1/resource',
  'http.status_code': 200,
  'http.flavor': '1.1',
  'http.user_agent': 'AUSTA-SuperApp/1.0',
  'net.peer.name': 'api.austa.health',
  'net.peer.port': 443,
};

/**
 * Base attributes for database operations
 */
export const dbAttributes: SpanAttributes = {
  'db.system': 'postgresql',
  'db.name': 'austa_db',
  'db.user': 'austa_service',
  'db.operation': 'SELECT',
  'db.statement': 'SELECT * FROM users WHERE id = $1',
  'db.connection_string': 'postgresql://localhost:5432/austa_db',
};

/**
 * Base attributes for messaging operations
 */
export const messagingAttributes: SpanAttributes = {
  'messaging.system': 'kafka',
  'messaging.destination': 'austa-events',
  'messaging.destination_kind': 'topic',
  'messaging.operation': 'publish',
  'messaging.message_id': '1234567890',
  'messaging.conversation_id': 'conv-123456',
};

/**
 * Health journey specific attributes
 */
export const healthJourneyAttributes: SpanAttributes = {
  'austa.journey': 'health',
  'austa.journey.context': 'metrics',
  'austa.user.id': 'user-123456',
  'austa.tenant.id': 'tenant-123456',
};

/**
 * Health journey specific attributes for different contexts
 */
export const healthMetricsAttributes: SpanAttributes = {
  ...healthJourneyAttributes,
  'austa.journey.context': 'metrics',
  'austa.health.metric.type': 'blood_pressure',
  'austa.health.device.id': 'device-123456',
};

export const healthHistoryAttributes: SpanAttributes = {
  ...healthJourneyAttributes,
  'austa.journey.context': 'history',
  'austa.health.record.type': 'medication',
  'austa.health.record.id': 'record-123456',
};

export const healthDeviceAttributes: SpanAttributes = {
  ...healthJourneyAttributes,
  'austa.journey.context': 'device',
  'austa.health.device.type': 'smartwatch',
  'austa.health.device.manufacturer': 'FitBit',
  'austa.health.device.model': 'Sense',
};

/**
 * Care journey specific attributes
 */
export const careJourneyAttributes: SpanAttributes = {
  'austa.journey': 'care',
  'austa.journey.context': 'appointments',
  'austa.user.id': 'user-123456',
  'austa.tenant.id': 'tenant-123456',
};

/**
 * Care journey specific attributes for different contexts
 */
export const careAppointmentAttributes: SpanAttributes = {
  ...careJourneyAttributes,
  'austa.journey.context': 'appointments',
  'austa.care.appointment.id': 'appointment-123456',
  'austa.care.provider.id': 'provider-123456',
};

export const careTelemedicineAttributes: SpanAttributes = {
  ...careJourneyAttributes,
  'austa.journey.context': 'telemedicine',
  'austa.care.session.id': 'session-123456',
  'austa.care.provider.id': 'provider-123456',
};

export const careTreatmentAttributes: SpanAttributes = {
  ...careJourneyAttributes,
  'austa.journey.context': 'treatment',
  'austa.care.treatment.id': 'treatment-123456',
  'austa.care.treatment.type': 'medication',
};

/**
 * Plan journey specific attributes
 */
export const planJourneyAttributes: SpanAttributes = {
  'austa.journey': 'plan',
  'austa.journey.context': 'coverage',
  'austa.user.id': 'user-123456',
  'austa.tenant.id': 'tenant-123456',
};

/**
 * Plan journey specific attributes for different contexts
 */
export const planCoverageAttributes: SpanAttributes = {
  ...planJourneyAttributes,
  'austa.journey.context': 'coverage',
  'austa.plan.coverage.id': 'coverage-123456',
  'austa.plan.provider.id': 'provider-123456',
};

export const planClaimAttributes: SpanAttributes = {
  ...planJourneyAttributes,
  'austa.journey.context': 'claim',
  'austa.plan.claim.id': 'claim-123456',
  'austa.plan.claim.type': 'medical',
  'austa.plan.claim.status': 'submitted',
};

export const planBenefitAttributes: SpanAttributes = {
  ...planJourneyAttributes,
  'austa.journey.context': 'benefit',
  'austa.plan.benefit.id': 'benefit-123456',
  'austa.plan.benefit.type': 'wellness',
};

/**
 * Gamification specific attributes
 */
export const gamificationAttributes: SpanAttributes = {
  'austa.system': 'gamification',
  'austa.gamification.event.type': 'achievement',
  'austa.gamification.user.id': 'user-123456',
  'austa.gamification.achievement.id': 'achievement-123456',
};

/**
 * Business transaction attributes for tracking operations across services
 */
export const businessTransactionAttributes: SpanAttributes = {
  'austa.transaction.id': 'tx-123456789',
  'austa.transaction.name': 'CompleteHealthCheckup',
  'austa.transaction.origin': 'mobile-app',
  'austa.correlation.id': 'corr-123456789',
};

/**
 * Helper function to combine multiple attribute sets
 */
export function combineAttributes(...attributeSets: SpanAttributes[]): SpanAttributes {
  return attributeSets.reduce((combined, current) => {
    return { ...combined, ...current };
  }, {});
}

/**
 * Helper function to create HTTP attributes with custom values
 */
export function createHttpAttributes(method: string, url: string, statusCode: number): SpanAttributes {
  return {
    ...httpAttributes,
    'http.method': method,
    'http.url': url,
    'http.status_code': statusCode,
  };
}

/**
 * Helper function to create database attributes with custom values
 */
export function createDbAttributes(operation: string, statement: string): SpanAttributes {
  return {
    ...dbAttributes,
    'db.operation': operation,
    'db.statement': statement,
  };
}

/**
 * Helper function to create messaging attributes with custom values
 */
export function createMessagingAttributes(destination: string, operation: string, messageId: string): SpanAttributes {
  return {
    ...messagingAttributes,
    'messaging.destination': destination,
    'messaging.operation': operation,
    'messaging.message_id': messageId,
  };
}

/**
 * Helper function to create journey-specific attributes with custom user and tenant
 */
export function createJourneyAttributes(journey: 'health' | 'care' | 'plan', context: string, userId: string, tenantId: string): SpanAttributes {
  const baseAttributes = {
    'austa.journey': journey,
    'austa.journey.context': context,
    'austa.user.id': userId,
    'austa.tenant.id': tenantId,
  };
  
  return baseAttributes;
}

/**
 * Helper function to create business transaction attributes
 */
export function createBusinessTransactionAttributes(transactionId: string, transactionName: string, origin: string): SpanAttributes {
  return {
    'austa.transaction.id': transactionId,
    'austa.transaction.name': transactionName,
    'austa.transaction.origin': origin,
    'austa.correlation.id': `corr-${transactionId}`,
  };
}

/**
 * Predefined attribute combinations for common testing scenarios
 */
export const healthMetricsHttpAttributes = combineAttributes(
  commonAttributes,
  httpAttributes,
  healthMetricsAttributes,
  businessTransactionAttributes
);

export const careAppointmentDbAttributes = combineAttributes(
  commonAttributes,
  dbAttributes,
  careAppointmentAttributes,
  businessTransactionAttributes
);

export const planClaimMessagingAttributes = combineAttributes(
  commonAttributes,
  messagingAttributes,
  planClaimAttributes,
  businessTransactionAttributes
);

export const gamificationEventAttributes = combineAttributes(
  commonAttributes,
  messagingAttributes,
  gamificationAttributes,
  businessTransactionAttributes
);