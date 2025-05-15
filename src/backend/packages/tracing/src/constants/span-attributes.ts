/**
 * Standard attribute names for OpenTelemetry spans to ensure consistent attribute naming
 * across all services in the AUSTA SuperApp.
 * 
 * These constants should be used when adding attributes to spans to maintain
 * consistency and enable effective filtering and analysis in observability tools.
 */

/**
 * Common attributes that apply to all services
 */
export const COMMON_ATTRIBUTES = {
  // User and request context
  USER_ID: 'user.id',
  REQUEST_ID: 'request.id',
  SESSION_ID: 'session.id',
  CORRELATION_ID: 'correlation.id',
  TENANT_ID: 'tenant.id',
  
  // Service information
  SERVICE_NAME: 'service.name',
  SERVICE_VERSION: 'service.version',
  SERVICE_INSTANCE_ID: 'service.instance.id',
  
  // Operation details
  OPERATION_NAME: 'operation.name',
  OPERATION_TYPE: 'operation.type',
  OPERATION_RESULT: 'operation.result',
  OPERATION_STATUS: 'operation.status',
  OPERATION_ERROR_CODE: 'operation.error.code',
  OPERATION_ERROR_MESSAGE: 'operation.error.message',
  
  // Performance metrics
  DURATION_MS: 'duration.ms',
  DB_QUERY_COUNT: 'db.query.count',
  CACHE_HIT: 'cache.hit',
  
  // External dependencies
  DEPENDENCY_NAME: 'dependency.name',
  DEPENDENCY_TYPE: 'dependency.type',
  DEPENDENCY_VERSION: 'dependency.version',
  
  // HTTP specific
  HTTP_METHOD: 'http.method',
  HTTP_URL: 'http.url',
  HTTP_STATUS_CODE: 'http.status_code',
  HTTP_ROUTE: 'http.route',
  HTTP_REQUEST_SIZE: 'http.request.size',
  HTTP_RESPONSE_SIZE: 'http.response.size',
  HTTP_USER_AGENT: 'http.user_agent',
  
  // Database specific
  DB_SYSTEM: 'db.system',
  DB_NAME: 'db.name',
  DB_OPERATION: 'db.operation',
  DB_STATEMENT: 'db.statement',
  DB_INSTANCE: 'db.instance',
  
  // Messaging specific
  MESSAGING_SYSTEM: 'messaging.system',
  MESSAGING_DESTINATION: 'messaging.destination',
  MESSAGING_DESTINATION_KIND: 'messaging.destination.kind',
  MESSAGING_MESSAGE_ID: 'messaging.message.id',
  MESSAGING_OPERATION: 'messaging.operation',
  
  // Journey context
  JOURNEY_TYPE: 'journey.type',
  JOURNEY_STEP: 'journey.step',
  JOURNEY_STEP_INDEX: 'journey.step.index',
  JOURNEY_COMPLETION_PERCENTAGE: 'journey.completion.percentage',
};

/**
 * Health journey specific attributes
 */
export const HEALTH_JOURNEY_ATTRIBUTES = {
  // Health metrics
  HEALTH_METRIC_TYPE: 'health.metric.type',
  HEALTH_METRIC_VALUE: 'health.metric.value',
  HEALTH_METRIC_UNIT: 'health.metric.unit',
  HEALTH_METRIC_TIMESTAMP: 'health.metric.timestamp',
  HEALTH_METRIC_SOURCE: 'health.metric.source',
  
  // Health goals
  HEALTH_GOAL_ID: 'health.goal.id',
  HEALTH_GOAL_TYPE: 'health.goal.type',
  HEALTH_GOAL_TARGET: 'health.goal.target',
  HEALTH_GOAL_PROGRESS: 'health.goal.progress',
  HEALTH_GOAL_STATUS: 'health.goal.status',
  
  // Device connections
  DEVICE_ID: 'device.id',
  DEVICE_TYPE: 'device.type',
  DEVICE_MANUFACTURER: 'device.manufacturer',
  DEVICE_MODEL: 'device.model',
  DEVICE_CONNECTION_STATUS: 'device.connection.status',
  DEVICE_SYNC_STATUS: 'device.sync.status',
  
  // Medical events
  MEDICAL_EVENT_ID: 'medical.event.id',
  MEDICAL_EVENT_TYPE: 'medical.event.type',
  MEDICAL_EVENT_SEVERITY: 'medical.event.severity',
  MEDICAL_EVENT_TIMESTAMP: 'medical.event.timestamp',
  
  // FHIR integration
  FHIR_RESOURCE_TYPE: 'fhir.resource.type',
  FHIR_RESOURCE_ID: 'fhir.resource.id',
  FHIR_OPERATION: 'fhir.operation',
  FHIR_VERSION: 'fhir.version',
};

/**
 * Care journey specific attributes
 */
export const CARE_JOURNEY_ATTRIBUTES = {
  // Appointments
  APPOINTMENT_ID: 'appointment.id',
  APPOINTMENT_TYPE: 'appointment.type',
  APPOINTMENT_STATUS: 'appointment.status',
  APPOINTMENT_PROVIDER_ID: 'appointment.provider.id',
  APPOINTMENT_SCHEDULED_TIME: 'appointment.scheduled.time',
  APPOINTMENT_DURATION: 'appointment.duration',
  APPOINTMENT_LOCATION: 'appointment.location',
  
  // Providers
  PROVIDER_ID: 'provider.id',
  PROVIDER_TYPE: 'provider.type',
  PROVIDER_SPECIALTY: 'provider.specialty',
  PROVIDER_AVAILABILITY: 'provider.availability',
  
  // Medications
  MEDICATION_ID: 'medication.id',
  MEDICATION_NAME: 'medication.name',
  MEDICATION_DOSAGE: 'medication.dosage',
  MEDICATION_FREQUENCY: 'medication.frequency',
  MEDICATION_ADHERENCE: 'medication.adherence',
  MEDICATION_REFILL_STATUS: 'medication.refill.status',
  
  // Telemedicine
  TELEMEDICINE_SESSION_ID: 'telemedicine.session.id',
  TELEMEDICINE_SESSION_STATUS: 'telemedicine.session.status',
  TELEMEDICINE_SESSION_QUALITY: 'telemedicine.session.quality',
  TELEMEDICINE_SESSION_DURATION: 'telemedicine.session.duration',
  
  // Symptom checker
  SYMPTOM_CHECKER_SESSION_ID: 'symptom.checker.session.id',
  SYMPTOM_CHECKER_INPUT: 'symptom.checker.input',
  SYMPTOM_CHECKER_RESULT: 'symptom.checker.result',
  SYMPTOM_CHECKER_CONFIDENCE: 'symptom.checker.confidence',
  
  // Treatments
  TREATMENT_ID: 'treatment.id',
  TREATMENT_TYPE: 'treatment.type',
  TREATMENT_STATUS: 'treatment.status',
  TREATMENT_PROGRESS: 'treatment.progress',
};

/**
 * Plan journey specific attributes
 */
export const PLAN_JOURNEY_ATTRIBUTES = {
  // Insurance plans
  PLAN_ID: 'plan.id',
  PLAN_TYPE: 'plan.type',
  PLAN_TIER: 'plan.tier',
  PLAN_STATUS: 'plan.status',
  PLAN_EFFECTIVE_DATE: 'plan.effective.date',
  PLAN_EXPIRATION_DATE: 'plan.expiration.date',
  
  // Benefits
  BENEFIT_ID: 'benefit.id',
  BENEFIT_TYPE: 'benefit.type',
  BENEFIT_CATEGORY: 'benefit.category',
  BENEFIT_COVERAGE_PERCENTAGE: 'benefit.coverage.percentage',
  BENEFIT_REMAINING_AMOUNT: 'benefit.remaining.amount',
  BENEFIT_USED_AMOUNT: 'benefit.used.amount',
  
  // Coverage
  COVERAGE_ID: 'coverage.id',
  COVERAGE_TYPE: 'coverage.type',
  COVERAGE_STATUS: 'coverage.status',
  COVERAGE_LIMIT: 'coverage.limit',
  COVERAGE_DEDUCTIBLE: 'coverage.deductible',
  COVERAGE_OUT_OF_POCKET: 'coverage.out.of.pocket',
  
  // Claims
  CLAIM_ID: 'claim.id',
  CLAIM_TYPE: 'claim.type',
  CLAIM_STATUS: 'claim.status',
  CLAIM_AMOUNT: 'claim.amount',
  CLAIM_SUBMISSION_DATE: 'claim.submission.date',
  CLAIM_PROCESSING_TIME: 'claim.processing.time',
  CLAIM_DECISION: 'claim.decision',
  
  // Documents
  DOCUMENT_ID: 'document.id',
  DOCUMENT_TYPE: 'document.type',
  DOCUMENT_STATUS: 'document.status',
  DOCUMENT_UPLOAD_DATE: 'document.upload.date',
  DOCUMENT_SIZE: 'document.size',
};

/**
 * Gamification specific attributes
 */
export const GAMIFICATION_ATTRIBUTES = {
  // Profiles
  PROFILE_ID: 'profile.id',
  PROFILE_LEVEL: 'profile.level',
  PROFILE_XP: 'profile.xp',
  PROFILE_STREAK: 'profile.streak',
  
  // Achievements
  ACHIEVEMENT_ID: 'achievement.id',
  ACHIEVEMENT_TYPE: 'achievement.type',
  ACHIEVEMENT_PROGRESS: 'achievement.progress',
  ACHIEVEMENT_COMPLETED: 'achievement.completed',
  ACHIEVEMENT_COMPLETION_DATE: 'achievement.completion.date',
  
  // Quests
  QUEST_ID: 'quest.id',
  QUEST_TYPE: 'quest.type',
  QUEST_PROGRESS: 'quest.progress',
  QUEST_STATUS: 'quest.status',
  QUEST_EXPIRATION: 'quest.expiration',
  
  // Rewards
  REWARD_ID: 'reward.id',
  REWARD_TYPE: 'reward.type',
  REWARD_VALUE: 'reward.value',
  REWARD_STATUS: 'reward.status',
  REWARD_REDEMPTION_DATE: 'reward.redemption.date',
  
  // Events
  EVENT_ID: 'event.id',
  EVENT_TYPE: 'event.type',
  EVENT_SOURCE: 'event.source',
  EVENT_POINTS: 'event.points',
  EVENT_TIMESTAMP: 'event.timestamp',
  
  // Leaderboard
  LEADERBOARD_ID: 'leaderboard.id',
  LEADERBOARD_TYPE: 'leaderboard.type',
  LEADERBOARD_POSITION: 'leaderboard.position',
  LEADERBOARD_SCORE: 'leaderboard.score',
};