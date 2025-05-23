/**
 * Standard attribute names for OpenTelemetry spans to ensure consistent attribute naming across all services.
 * These constants should be used when adding attributes to spans to maintain consistency in tracing data.
 */

/**
 * Common span attributes that apply to all services and journeys
 */
export const COMMON_ATTRIBUTES = {
  // Request context attributes
  REQUEST_ID: 'request.id',
  CORRELATION_ID: 'correlation.id',
  TRACE_ID: 'trace.id',
  USER_ID: 'user.id',
  SESSION_ID: 'session.id',
  TENANT_ID: 'tenant.id',
  
  // Service information
  SERVICE_NAME: 'service.name',
  SERVICE_VERSION: 'service.version',
  SERVICE_NAMESPACE: 'service.namespace',
  
  // Operation details
  OPERATION_NAME: 'operation.name',
  OPERATION_TYPE: 'operation.type',
  OPERATION_RESULT: 'operation.result',
  OPERATION_STATUS: 'operation.status',
  
  // Error information
  ERROR_TYPE: 'error.type',
  ERROR_MESSAGE: 'error.message',
  ERROR_STACK: 'error.stack',
  ERROR_CODE: 'error.code',
  
  // Performance metrics
  DURATION_MS: 'duration.ms',
  DB_QUERY_TIME_MS: 'db.query.time.ms',
  EXTERNAL_CALL_TIME_MS: 'external.call.time.ms',
  
  // Resource information
  RESOURCE_TYPE: 'resource.type',
  RESOURCE_ID: 'resource.id',
  RESOURCE_NAME: 'resource.name',
  
  // Environment information
  ENVIRONMENT: 'environment',
  DEPLOYMENT_ID: 'deployment.id',
  
  // Journey context
  JOURNEY_TYPE: 'journey.type',
  JOURNEY_STEP: 'journey.step',
  JOURNEY_CONTEXT_ID: 'journey.context.id',
};

/**
 * Health journey-specific span attributes
 */
export const HEALTH_JOURNEY_ATTRIBUTES = {
  // User health context
  HEALTH_PROFILE_ID: 'health.profile.id',
  HEALTH_METRIC_TYPE: 'health.metric.type',
  HEALTH_METRIC_VALUE: 'health.metric.value',
  HEALTH_METRIC_UNIT: 'health.metric.unit',
  HEALTH_METRIC_TIMESTAMP: 'health.metric.timestamp',
  
  // Health goals
  HEALTH_GOAL_ID: 'health.goal.id',
  HEALTH_GOAL_TYPE: 'health.goal.type',
  HEALTH_GOAL_TARGET: 'health.goal.target',
  HEALTH_GOAL_PROGRESS: 'health.goal.progress',
  
  // Device integration
  DEVICE_ID: 'device.id',
  DEVICE_TYPE: 'device.type',
  DEVICE_MANUFACTURER: 'device.manufacturer',
  DEVICE_CONNECTION_STATUS: 'device.connection.status',
  
  // FHIR integration
  FHIR_RESOURCE_TYPE: 'fhir.resource.type',
  FHIR_RESOURCE_ID: 'fhir.resource.id',
  FHIR_OPERATION: 'fhir.operation',
};

/**
 * Care journey-specific span attributes
 */
export const CARE_JOURNEY_ATTRIBUTES = {
  // Appointment information
  APPOINTMENT_ID: 'appointment.id',
  APPOINTMENT_TYPE: 'appointment.type',
  APPOINTMENT_STATUS: 'appointment.status',
  APPOINTMENT_DATETIME: 'appointment.datetime',
  
  // Provider information
  PROVIDER_ID: 'provider.id',
  PROVIDER_TYPE: 'provider.type',
  PROVIDER_SPECIALTY: 'provider.specialty',
  
  // Medication information
  MEDICATION_ID: 'medication.id',
  MEDICATION_NAME: 'medication.name',
  MEDICATION_DOSAGE: 'medication.dosage',
  MEDICATION_FREQUENCY: 'medication.frequency',
  
  // Telemedicine
  TELEMEDICINE_SESSION_ID: 'telemedicine.session.id',
  TELEMEDICINE_SESSION_STATUS: 'telemedicine.session.status',
  TELEMEDICINE_SESSION_DURATION: 'telemedicine.session.duration',
  
  // Symptom checker
  SYMPTOM_CHECKER_SESSION_ID: 'symptom.checker.session.id',
  SYMPTOM_CHECKER_RESULT: 'symptom.checker.result',
  
  // Treatment information
  TREATMENT_ID: 'treatment.id',
  TREATMENT_TYPE: 'treatment.type',
  TREATMENT_STATUS: 'treatment.status',
};

/**
 * Plan journey-specific span attributes
 */
export const PLAN_JOURNEY_ATTRIBUTES = {
  // Insurance plan information
  PLAN_ID: 'plan.id',
  PLAN_TYPE: 'plan.type',
  PLAN_NAME: 'plan.name',
  PLAN_STATUS: 'plan.status',
  
  // Benefits information
  BENEFIT_ID: 'benefit.id',
  BENEFIT_TYPE: 'benefit.type',
  BENEFIT_CATEGORY: 'benefit.category',
  BENEFIT_COVERAGE_PERCENTAGE: 'benefit.coverage.percentage',
  
  // Claims information
  CLAIM_ID: 'claim.id',
  CLAIM_TYPE: 'claim.type',
  CLAIM_STATUS: 'claim.status',
  CLAIM_AMOUNT: 'claim.amount',
  CLAIM_SUBMISSION_DATE: 'claim.submission.date',
  CLAIM_PROCESSING_TIME: 'claim.processing.time',
  
  // Coverage information
  COVERAGE_ID: 'coverage.id',
  COVERAGE_TYPE: 'coverage.type',
  COVERAGE_START_DATE: 'coverage.start.date',
  COVERAGE_END_DATE: 'coverage.end.date',
  
  // Document information
  DOCUMENT_ID: 'document.id',
  DOCUMENT_TYPE: 'document.type',
  DOCUMENT_STATUS: 'document.status',
};

/**
 * Gamification-specific span attributes
 */
export const GAMIFICATION_ATTRIBUTES = {
  // Profile information
  GAMIFICATION_PROFILE_ID: 'gamification.profile.id',
  GAMIFICATION_LEVEL: 'gamification.level',
  GAMIFICATION_XP: 'gamification.xp',
  
  // Achievement information
  ACHIEVEMENT_ID: 'achievement.id',
  ACHIEVEMENT_TYPE: 'achievement.type',
  ACHIEVEMENT_STATUS: 'achievement.status',
  
  // Quest information
  QUEST_ID: 'quest.id',
  QUEST_TYPE: 'quest.type',
  QUEST_STATUS: 'quest.status',
  QUEST_PROGRESS: 'quest.progress',
  
  // Reward information
  REWARD_ID: 'reward.id',
  REWARD_TYPE: 'reward.type',
  REWARD_VALUE: 'reward.value',
  
  // Event information
  EVENT_ID: 'event.id',
  EVENT_TYPE: 'event.type',
  EVENT_SOURCE: 'event.source',
  EVENT_TIMESTAMP: 'event.timestamp',
  
  // Rule information
  RULE_ID: 'rule.id',
  RULE_TYPE: 'rule.type',
  RULE_TRIGGER: 'rule.trigger',
  
  // Leaderboard information
  LEADERBOARD_ID: 'leaderboard.id',
  LEADERBOARD_TYPE: 'leaderboard.type',
  LEADERBOARD_POSITION: 'leaderboard.position',
};

/**
 * Notification-specific span attributes
 */
export const NOTIFICATION_ATTRIBUTES = {
  // Notification information
  NOTIFICATION_ID: 'notification.id',
  NOTIFICATION_TYPE: 'notification.type',
  NOTIFICATION_CHANNEL: 'notification.channel',
  NOTIFICATION_STATUS: 'notification.status',
  NOTIFICATION_PRIORITY: 'notification.priority',
  
  // Template information
  TEMPLATE_ID: 'template.id',
  TEMPLATE_VERSION: 'template.version',
  
  // Delivery information
  DELIVERY_ATTEMPT: 'delivery.attempt',
  DELIVERY_STATUS: 'delivery.status',
  DELIVERY_TIMESTAMP: 'delivery.timestamp',
  
  // Retry information
  RETRY_COUNT: 'retry.count',
  RETRY_STRATEGY: 'retry.strategy',
  RETRY_DELAY_MS: 'retry.delay.ms',
  
  // Preference information
  PREFERENCE_ID: 'preference.id',
  PREFERENCE_SETTING: 'preference.setting',
};

/**
 * Database operation span attributes
 */
export const DATABASE_ATTRIBUTES = {
  // Database information
  DB_SYSTEM: 'db.system',
  DB_NAME: 'db.name',
  DB_OPERATION: 'db.operation',
  DB_STATEMENT: 'db.statement',
  DB_INSTANCE: 'db.instance',
  DB_USER: 'db.user',
  
  // Transaction information
  DB_TRANSACTION_ID: 'db.transaction.id',
  DB_TRANSACTION_TYPE: 'db.transaction.type',
  
  // Performance information
  DB_ROWS_AFFECTED: 'db.rows.affected',
  DB_ROWS_RETURNED: 'db.rows.returned',
  DB_CONNECTION_ID: 'db.connection.id',
  
  // Prisma specific
  PRISMA_MODEL: 'prisma.model',
  PRISMA_ACTION: 'prisma.action',
  PRISMA_QUERY_PARAMS: 'prisma.query.params',
};

/**
 * HTTP request span attributes
 */
export const HTTP_ATTRIBUTES = {
  // Request information
  HTTP_METHOD: 'http.method',
  HTTP_URL: 'http.url',
  HTTP_TARGET: 'http.target',
  HTTP_HOST: 'http.host',
  HTTP_SCHEME: 'http.scheme',
  HTTP_STATUS_CODE: 'http.status_code',
  HTTP_FLAVOR: 'http.flavor',
  HTTP_USER_AGENT: 'http.user_agent',
  
  // Request details
  HTTP_REQUEST_CONTENT_LENGTH: 'http.request.content.length',
  HTTP_REQUEST_CONTENT_TYPE: 'http.request.content.type',
  
  // Response details
  HTTP_RESPONSE_CONTENT_LENGTH: 'http.response.content.length',
  HTTP_RESPONSE_CONTENT_TYPE: 'http.response.content.type',
  
  // Client information
  HTTP_CLIENT_IP: 'http.client.ip',
  HTTP_CLIENT_PORT: 'http.client.port',
  
  // Server information
  HTTP_SERVER_IP: 'http.server.ip',
  HTTP_SERVER_PORT: 'http.server.port',
};

/**
 * GraphQL operation span attributes
 */
export const GRAPHQL_ATTRIBUTES = {
  // Operation information
  GRAPHQL_OPERATION_TYPE: 'graphql.operation.type',
  GRAPHQL_OPERATION_NAME: 'graphql.operation.name',
  
  // Document information
  GRAPHQL_DOCUMENT: 'graphql.document',
  GRAPHQL_VARIABLES: 'graphql.variables',
  
  // Resolver information
  GRAPHQL_RESOLVER_PATH: 'graphql.resolver.path',
  GRAPHQL_RESOLVER_PARENT_TYPE: 'graphql.resolver.parent.type',
  GRAPHQL_RESOLVER_FIELD_NAME: 'graphql.resolver.field.name',
  GRAPHQL_RESOLVER_RETURN_TYPE: 'graphql.resolver.return.type',
  
  // Performance information
  GRAPHQL_PARSING_TIME_MS: 'graphql.parsing.time.ms',
  GRAPHQL_VALIDATION_TIME_MS: 'graphql.validation.time.ms',
  GRAPHQL_EXECUTION_TIME_MS: 'graphql.execution.time.ms',
};

/**
 * Kafka message span attributes
 */
export const KAFKA_ATTRIBUTES = {
  // Message information
  KAFKA_TOPIC: 'kafka.topic',
  KAFKA_KEY: 'kafka.key',
  KAFKA_PARTITION: 'kafka.partition',
  KAFKA_OFFSET: 'kafka.offset',
  KAFKA_TIMESTAMP: 'kafka.timestamp',
  
  // Consumer information
  KAFKA_CONSUMER_GROUP: 'kafka.consumer.group',
  KAFKA_CONSUMER_ID: 'kafka.consumer.id',
  
  // Producer information
  KAFKA_PRODUCER_ID: 'kafka.producer.id',
  
  // Message details
  KAFKA_MESSAGE_SIZE: 'kafka.message.size',
  KAFKA_MESSAGE_HEADERS: 'kafka.message.headers',
  
  // Performance information
  KAFKA_PROCESSING_TIME_MS: 'kafka.processing.time.ms',
  KAFKA_BATCH_SIZE: 'kafka.batch.size',
};