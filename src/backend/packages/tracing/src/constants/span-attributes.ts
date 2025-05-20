/**
 * Constants for OpenTelemetry span attributes used throughout the AUSTA SuperApp.
 * These attributes provide standardized context for distributed tracing.
 */

// Common attribute namespace prefix for all AUSTA-specific attributes
export const AUSTA_ATTRIBUTE_NAMESPACE = 'austa';

// General attributes for all spans
export const GENERAL_ATTRIBUTES = {
  // Service and component identification
  SERVICE_NAME: 'service.name',
  SERVICE_VERSION: 'service.version',
  COMPONENT_NAME: 'component.name',
  COMPONENT_TYPE: 'component.type',
  
  // Request context
  REQUEST_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.request.id`,
  SESSION_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.session.id`,
  USER_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.user.id`,
  TENANT_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.tenant.id`,
  
  // Operation metadata
  OPERATION_NAME: `${AUSTA_ATTRIBUTE_NAMESPACE}.operation.name`,
  OPERATION_TYPE: `${AUSTA_ATTRIBUTE_NAMESPACE}.operation.type`,
  OPERATION_RESULT: `${AUSTA_ATTRIBUTE_NAMESPACE}.operation.result`,
  OPERATION_STATUS: `${AUSTA_ATTRIBUTE_NAMESPACE}.operation.status`,
  
  // Error information
  ERROR_TYPE: `${AUSTA_ATTRIBUTE_NAMESPACE}.error.type`,
  ERROR_CODE: `${AUSTA_ATTRIBUTE_NAMESPACE}.error.code`,
  ERROR_MESSAGE: `${AUSTA_ATTRIBUTE_NAMESPACE}.error.message`,
};

// Journey-specific attributes
export const JOURNEY_ATTRIBUTES = {
  // Journey identification
  JOURNEY_TYPE: `${AUSTA_ATTRIBUTE_NAMESPACE}.journey.type`,
  JOURNEY_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.journey.id`,
  JOURNEY_STEP: `${AUSTA_ATTRIBUTE_NAMESPACE}.journey.step`,
  JOURNEY_STEP_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.journey.step.id`,
};

// Health journey specific attributes
export const HEALTH_JOURNEY_ATTRIBUTES = {
  // Health metrics
  METRIC_TYPE: `${AUSTA_ATTRIBUTE_NAMESPACE}.health.metric.type`,
  METRIC_VALUE: `${AUSTA_ATTRIBUTE_NAMESPACE}.health.metric.value`,
  METRIC_UNIT: `${AUSTA_ATTRIBUTE_NAMESPACE}.health.metric.unit`,
  
  // Health goals
  GOAL_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.health.goal.id`,
  GOAL_TYPE: `${AUSTA_ATTRIBUTE_NAMESPACE}.health.goal.type`,
  GOAL_PROGRESS: `${AUSTA_ATTRIBUTE_NAMESPACE}.health.goal.progress`,
  
  // Device integration
  DEVICE_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.health.device.id`,
  DEVICE_TYPE: `${AUSTA_ATTRIBUTE_NAMESPACE}.health.device.type`,
  SYNC_STATUS: `${AUSTA_ATTRIBUTE_NAMESPACE}.health.device.sync.status`,
};

// Care journey specific attributes
export const CARE_JOURNEY_ATTRIBUTES = {
  // Appointments
  APPOINTMENT_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.care.appointment.id`,
  APPOINTMENT_TYPE: `${AUSTA_ATTRIBUTE_NAMESPACE}.care.appointment.type`,
  APPOINTMENT_STATUS: `${AUSTA_ATTRIBUTE_NAMESPACE}.care.appointment.status`,
  
  // Telemedicine
  TELEMEDICINE_SESSION_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.care.telemedicine.session.id`,
  TELEMEDICINE_PROVIDER_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.care.telemedicine.provider.id`,
  TELEMEDICINE_STATUS: `${AUSTA_ATTRIBUTE_NAMESPACE}.care.telemedicine.status`,
  
  // Medication
  MEDICATION_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.care.medication.id`,
  MEDICATION_NAME: `${AUSTA_ATTRIBUTE_NAMESPACE}.care.medication.name`,
  MEDICATION_ADHERENCE: `${AUSTA_ATTRIBUTE_NAMESPACE}.care.medication.adherence`,
};

// Plan journey specific attributes
export const PLAN_JOURNEY_ATTRIBUTES = {
  // Insurance plan
  PLAN_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.plan.id`,
  PLAN_TYPE: `${AUSTA_ATTRIBUTE_NAMESPACE}.plan.type`,
  PLAN_TIER: `${AUSTA_ATTRIBUTE_NAMESPACE}.plan.tier`,
  
  // Claims
  CLAIM_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.plan.claim.id`,
  CLAIM_TYPE: `${AUSTA_ATTRIBUTE_NAMESPACE}.plan.claim.type`,
  CLAIM_STATUS: `${AUSTA_ATTRIBUTE_NAMESPACE}.plan.claim.status`,
  CLAIM_AMOUNT: `${AUSTA_ATTRIBUTE_NAMESPACE}.plan.claim.amount`,
  
  // Benefits
  BENEFIT_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.plan.benefit.id`,
  BENEFIT_TYPE: `${AUSTA_ATTRIBUTE_NAMESPACE}.plan.benefit.type`,
  BENEFIT_USAGE: `${AUSTA_ATTRIBUTE_NAMESPACE}.plan.benefit.usage`,
};

// Gamification attributes
export const GAMIFICATION_ATTRIBUTES = {
  // Events
  EVENT_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.gamification.event.id`,
  EVENT_TYPE: `${AUSTA_ATTRIBUTE_NAMESPACE}.gamification.event.type`,
  
  // Achievements
  ACHIEVEMENT_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.gamification.achievement.id`,
  ACHIEVEMENT_TYPE: `${AUSTA_ATTRIBUTE_NAMESPACE}.gamification.achievement.type`,
  
  // Rewards
  REWARD_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.gamification.reward.id`,
  REWARD_TYPE: `${AUSTA_ATTRIBUTE_NAMESPACE}.gamification.reward.type`,
  REWARD_AMOUNT: `${AUSTA_ATTRIBUTE_NAMESPACE}.gamification.reward.amount`,
  
  // User progress
  USER_LEVEL: `${AUSTA_ATTRIBUTE_NAMESPACE}.gamification.user.level`,
  USER_XP: `${AUSTA_ATTRIBUTE_NAMESPACE}.gamification.user.xp`,
  USER_RANK: `${AUSTA_ATTRIBUTE_NAMESPACE}.gamification.user.rank`,
};

// Database operation attributes
export const DATABASE_ATTRIBUTES = {
  // General database information
  DB_SYSTEM: 'db.system',
  DB_NAME: 'db.name',
  DB_OPERATION: 'db.operation',
  
  // Query information
  DB_STATEMENT: 'db.statement',
  DB_OPERATION_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.db.operation.id`,
  DB_TABLE: `${AUSTA_ATTRIBUTE_NAMESPACE}.db.table`,
  DB_ENTITY: `${AUSTA_ATTRIBUTE_NAMESPACE}.db.entity`,
  
  // Performance metrics
  DB_ROWS_AFFECTED: `${AUSTA_ATTRIBUTE_NAMESPACE}.db.rows.affected`,
  DB_ROWS_RETURNED: `${AUSTA_ATTRIBUTE_NAMESPACE}.db.rows.returned`,
};

// External API call attributes
export const EXTERNAL_API_ATTRIBUTES = {
  // General API information
  API_NAME: `${AUSTA_ATTRIBUTE_NAMESPACE}.api.name`,
  API_VERSION: `${AUSTA_ATTRIBUTE_NAMESPACE}.api.version`,
  API_ENDPOINT: `${AUSTA_ATTRIBUTE_NAMESPACE}.api.endpoint`,
  
  // Request information
  REQUEST_METHOD: `${AUSTA_ATTRIBUTE_NAMESPACE}.api.request.method`,
  REQUEST_SIZE: `${AUSTA_ATTRIBUTE_NAMESPACE}.api.request.size`,
  
  // Response information
  RESPONSE_STATUS: `${AUSTA_ATTRIBUTE_NAMESPACE}.api.response.status`,
  RESPONSE_SIZE: `${AUSTA_ATTRIBUTE_NAMESPACE}.api.response.size`,
  
  // Integration specific
  INTEGRATION_TYPE: `${AUSTA_ATTRIBUTE_NAMESPACE}.integration.type`,
  INTEGRATION_PARTNER: `${AUSTA_ATTRIBUTE_NAMESPACE}.integration.partner`,
};

// Notification attributes
export const NOTIFICATION_ATTRIBUTES = {
  // Notification metadata
  NOTIFICATION_ID: `${AUSTA_ATTRIBUTE_NAMESPACE}.notification.id`,
  NOTIFICATION_TYPE: `${AUSTA_ATTRIBUTE_NAMESPACE}.notification.type`,
  NOTIFICATION_CHANNEL: `${AUSTA_ATTRIBUTE_NAMESPACE}.notification.channel`,
  
  // Delivery information
  DELIVERY_STATUS: `${AUSTA_ATTRIBUTE_NAMESPACE}.notification.delivery.status`,
  DELIVERY_ATTEMPT: `${AUSTA_ATTRIBUTE_NAMESPACE}.notification.delivery.attempt`,
  DELIVERY_TIMESTAMP: `${AUSTA_ATTRIBUTE_NAMESPACE}.notification.delivery.timestamp`,
};

// Export all attribute groups
export const SPAN_ATTRIBUTES = {
  GENERAL: GENERAL_ATTRIBUTES,
  JOURNEY: JOURNEY_ATTRIBUTES,
  HEALTH: HEALTH_JOURNEY_ATTRIBUTES,
  CARE: CARE_JOURNEY_ATTRIBUTES,
  PLAN: PLAN_JOURNEY_ATTRIBUTES,
  GAMIFICATION: GAMIFICATION_ATTRIBUTES,
  DATABASE: DATABASE_ATTRIBUTES,
  EXTERNAL_API: EXTERNAL_API_ATTRIBUTES,
  NOTIFICATION: NOTIFICATION_ATTRIBUTES,
};