import { Span, SpanStatusCode } from '@opentelemetry/api';
import { AttributeValue } from '@opentelemetry/api/build/src/trace/attributes';

/**
 * Namespace containing utility functions for adding standardized attributes to OpenTelemetry spans.
 * These utilities enable consistent and searchable trace data across the AUSTA SuperApp.
 */
export namespace SpanAttributes {
  /**
   * Common attribute keys used across all spans
   */
  export enum CommonAttributeKeys {
    USER_ID = 'user.id',
    REQUEST_ID = 'request.id',
    SESSION_ID = 'session.id',
    SERVICE_NAME = 'service.name',
    SERVICE_VERSION = 'service.version',
    ENVIRONMENT = 'deployment.environment',
    JOURNEY = 'austa.journey',
    FEATURE = 'austa.feature',
    OPERATION = 'austa.operation',
  }

  /**
   * Health journey specific attribute keys
   */
  export enum HealthJourneyAttributeKeys {
    METRIC_TYPE = 'health.metric.type',
    METRIC_VALUE = 'health.metric.value',
    METRIC_UNIT = 'health.metric.unit',
    GOAL_ID = 'health.goal.id',
    GOAL_TYPE = 'health.goal.type',
    DEVICE_ID = 'health.device.id',
    DEVICE_TYPE = 'health.device.type',
    INSIGHT_ID = 'health.insight.id',
    INSIGHT_TYPE = 'health.insight.type',
  }

  /**
   * Care journey specific attribute keys
   */
  export enum CareJourneyAttributeKeys {
    APPOINTMENT_ID = 'care.appointment.id',
    APPOINTMENT_TYPE = 'care.appointment.type',
    PROVIDER_ID = 'care.provider.id',
    PROVIDER_TYPE = 'care.provider.type',
    MEDICATION_ID = 'care.medication.id',
    TELEMEDICINE_SESSION_ID = 'care.telemedicine.session_id',
    SYMPTOM_CHECKER_ID = 'care.symptom_checker.id',
    TREATMENT_ID = 'care.treatment.id',
    TREATMENT_TYPE = 'care.treatment.type',
  }

  /**
   * Plan journey specific attribute keys
   */
  export enum PlanJourneyAttributeKeys {
    PLAN_ID = 'plan.id',
    PLAN_TYPE = 'plan.type',
    BENEFIT_ID = 'plan.benefit.id',
    BENEFIT_TYPE = 'plan.benefit.type',
    CLAIM_ID = 'plan.claim.id',
    CLAIM_STATUS = 'plan.claim.status',
    COVERAGE_ID = 'plan.coverage.id',
    DOCUMENT_ID = 'plan.document.id',
    DOCUMENT_TYPE = 'plan.document.type',
  }

  /**
   * Error attribute keys
   */
  export enum ErrorAttributeKeys {
    ERROR_TYPE = 'error.type',
    ERROR_MESSAGE = 'error.message',
    ERROR_STACK = 'error.stack',
    ERROR_CODE = 'error.code',
    ERROR_CATEGORY = 'error.category',
    ERROR_RETRYABLE = 'error.retryable',
    ERROR_HANDLED = 'error.handled',
  }

  /**
   * Performance metric attribute keys
   */
  export enum PerformanceAttributeKeys {
    OPERATION_DURATION_MS = 'performance.duration_ms',
    DATABASE_QUERY_DURATION_MS = 'performance.db.duration_ms',
    EXTERNAL_API_DURATION_MS = 'performance.api.duration_ms',
    CACHE_HIT = 'performance.cache.hit',
    ITEMS_PROCESSED = 'performance.items_processed',
    MEMORY_USAGE_MB = 'performance.memory_usage_mb',
    CPU_USAGE_PERCENT = 'performance.cpu_usage_percent',
  }

  /**
   * Adds common attributes to a span that are relevant across all services
   * 
   * @param span The OpenTelemetry span to add attributes to
   * @param attributes Object containing common attributes to add
   */
  export function addCommonAttributes(span: Span, attributes: {
    userId?: string;
    requestId?: string;
    sessionId?: string;
    serviceName?: string;
    serviceVersion?: string;
    environment?: string;
    journey?: string;
    feature?: string;
    operation?: string;
  }): void {
    if (!span.isRecording()) return;

    const {
      userId,
      requestId,
      sessionId,
      serviceName,
      serviceVersion,
      environment,
      journey,
      feature,
      operation,
    } = attributes;

    const attributesToAdd: Record<string, AttributeValue> = {};

    if (userId) attributesToAdd[CommonAttributeKeys.USER_ID] = userId;
    if (requestId) attributesToAdd[CommonAttributeKeys.REQUEST_ID] = requestId;
    if (sessionId) attributesToAdd[CommonAttributeKeys.SESSION_ID] = sessionId;
    if (serviceName) attributesToAdd[CommonAttributeKeys.SERVICE_NAME] = serviceName;
    if (serviceVersion) attributesToAdd[CommonAttributeKeys.SERVICE_VERSION] = serviceVersion;
    if (environment) attributesToAdd[CommonAttributeKeys.ENVIRONMENT] = environment;
    if (journey) attributesToAdd[CommonAttributeKeys.JOURNEY] = journey;
    if (feature) attributesToAdd[CommonAttributeKeys.FEATURE] = feature;
    if (operation) attributesToAdd[CommonAttributeKeys.OPERATION] = operation;

    span.setAttributes(attributesToAdd);
  }

  /**
   * Adds health journey specific attributes to a span
   * 
   * @param span The OpenTelemetry span to add attributes to
   * @param attributes Object containing health journey attributes to add
   */
  export function addHealthJourneyAttributes(span: Span, attributes: {
    metricType?: string;
    metricValue?: number | string;
    metricUnit?: string;
    goalId?: string;
    goalType?: string;
    deviceId?: string;
    deviceType?: string;
    insightId?: string;
    insightType?: string;
  }): void {
    if (!span.isRecording()) return;

    const {
      metricType,
      metricValue,
      metricUnit,
      goalId,
      goalType,
      deviceId,
      deviceType,
      insightId,
      insightType,
    } = attributes;

    const attributesToAdd: Record<string, AttributeValue> = {};

    if (metricType) attributesToAdd[HealthJourneyAttributeKeys.METRIC_TYPE] = metricType;
    if (metricValue !== undefined) attributesToAdd[HealthJourneyAttributeKeys.METRIC_VALUE] = metricValue;
    if (metricUnit) attributesToAdd[HealthJourneyAttributeKeys.METRIC_UNIT] = metricUnit;
    if (goalId) attributesToAdd[HealthJourneyAttributeKeys.GOAL_ID] = goalId;
    if (goalType) attributesToAdd[HealthJourneyAttributeKeys.GOAL_TYPE] = goalType;
    if (deviceId) attributesToAdd[HealthJourneyAttributeKeys.DEVICE_ID] = deviceId;
    if (deviceType) attributesToAdd[HealthJourneyAttributeKeys.DEVICE_TYPE] = deviceType;
    if (insightId) attributesToAdd[HealthJourneyAttributeKeys.INSIGHT_ID] = insightId;
    if (insightType) attributesToAdd[HealthJourneyAttributeKeys.INSIGHT_TYPE] = insightType;

    span.setAttributes(attributesToAdd);
  }

  /**
   * Adds care journey specific attributes to a span
   * 
   * @param span The OpenTelemetry span to add attributes to
   * @param attributes Object containing care journey attributes to add
   */
  export function addCareJourneyAttributes(span: Span, attributes: {
    appointmentId?: string;
    appointmentType?: string;
    providerId?: string;
    providerType?: string;
    medicationId?: string;
    telemedicineSessionId?: string;
    symptomCheckerId?: string;
    treatmentId?: string;
    treatmentType?: string;
  }): void {
    if (!span.isRecording()) return;

    const {
      appointmentId,
      appointmentType,
      providerId,
      providerType,
      medicationId,
      telemedicineSessionId,
      symptomCheckerId,
      treatmentId,
      treatmentType,
    } = attributes;

    const attributesToAdd: Record<string, AttributeValue> = {};

    if (appointmentId) attributesToAdd[CareJourneyAttributeKeys.APPOINTMENT_ID] = appointmentId;
    if (appointmentType) attributesToAdd[CareJourneyAttributeKeys.APPOINTMENT_TYPE] = appointmentType;
    if (providerId) attributesToAdd[CareJourneyAttributeKeys.PROVIDER_ID] = providerId;
    if (providerType) attributesToAdd[CareJourneyAttributeKeys.PROVIDER_TYPE] = providerType;
    if (medicationId) attributesToAdd[CareJourneyAttributeKeys.MEDICATION_ID] = medicationId;
    if (telemedicineSessionId) attributesToAdd[CareJourneyAttributeKeys.TELEMEDICINE_SESSION_ID] = telemedicineSessionId;
    if (symptomCheckerId) attributesToAdd[CareJourneyAttributeKeys.SYMPTOM_CHECKER_ID] = symptomCheckerId;
    if (treatmentId) attributesToAdd[CareJourneyAttributeKeys.TREATMENT_ID] = treatmentId;
    if (treatmentType) attributesToAdd[CareJourneyAttributeKeys.TREATMENT_TYPE] = treatmentType;

    span.setAttributes(attributesToAdd);
  }

  /**
   * Adds plan journey specific attributes to a span
   * 
   * @param span The OpenTelemetry span to add attributes to
   * @param attributes Object containing plan journey attributes to add
   */
  export function addPlanJourneyAttributes(span: Span, attributes: {
    planId?: string;
    planType?: string;
    benefitId?: string;
    benefitType?: string;
    claimId?: string;
    claimStatus?: string;
    coverageId?: string;
    documentId?: string;
    documentType?: string;
  }): void {
    if (!span.isRecording()) return;

    const {
      planId,
      planType,
      benefitId,
      benefitType,
      claimId,
      claimStatus,
      coverageId,
      documentId,
      documentType,
    } = attributes;

    const attributesToAdd: Record<string, AttributeValue> = {};

    if (planId) attributesToAdd[PlanJourneyAttributeKeys.PLAN_ID] = planId;
    if (planType) attributesToAdd[PlanJourneyAttributeKeys.PLAN_TYPE] = planType;
    if (benefitId) attributesToAdd[PlanJourneyAttributeKeys.BENEFIT_ID] = benefitId;
    if (benefitType) attributesToAdd[PlanJourneyAttributeKeys.BENEFIT_TYPE] = benefitType;
    if (claimId) attributesToAdd[PlanJourneyAttributeKeys.CLAIM_ID] = claimId;
    if (claimStatus) attributesToAdd[PlanJourneyAttributeKeys.CLAIM_STATUS] = claimStatus;
    if (coverageId) attributesToAdd[PlanJourneyAttributeKeys.COVERAGE_ID] = coverageId;
    if (documentId) attributesToAdd[PlanJourneyAttributeKeys.DOCUMENT_ID] = documentId;
    if (documentType) attributesToAdd[PlanJourneyAttributeKeys.DOCUMENT_TYPE] = documentType;

    span.setAttributes(attributesToAdd);
  }

  /**
   * Adds error information to a span
   * 
   * @param span The OpenTelemetry span to add error attributes to
   * @param error The error object to extract information from
   * @param options Additional options for error handling
   */
  export function addErrorAttributes(span: Span, error: Error, options?: {
    errorCode?: string | number;
    errorCategory?: string;
    isRetryable?: boolean;
    isHandled?: boolean;
  }): void {
    if (!span.isRecording()) return;

    // Set span status to error
    span.setStatus({ code: SpanStatusCode.ERROR });
    
    // Record the exception
    span.recordException(error);

    // Add detailed error attributes
    const attributesToAdd: Record<string, AttributeValue> = {
      [ErrorAttributeKeys.ERROR_TYPE]: error.name || 'Error',
      [ErrorAttributeKeys.ERROR_MESSAGE]: error.message,
    };

    // Add stack trace if available
    if (error.stack) {
      attributesToAdd[ErrorAttributeKeys.ERROR_STACK] = error.stack;
    }

    // Add optional error attributes
    if (options) {
      const { errorCode, errorCategory, isRetryable, isHandled } = options;

      if (errorCode !== undefined) attributesToAdd[ErrorAttributeKeys.ERROR_CODE] = String(errorCode);
      if (errorCategory) attributesToAdd[ErrorAttributeKeys.ERROR_CATEGORY] = errorCategory;
      if (isRetryable !== undefined) attributesToAdd[ErrorAttributeKeys.ERROR_RETRYABLE] = isRetryable;
      if (isHandled !== undefined) attributesToAdd[ErrorAttributeKeys.ERROR_HANDLED] = isHandled;
    }

    span.setAttributes(attributesToAdd);
  }

  /**
   * Adds performance metric attributes to a span
   * 
   * @param span The OpenTelemetry span to add performance attributes to
   * @param attributes Object containing performance metrics to add
   */
  export function addPerformanceAttributes(span: Span, attributes: {
    durationMs?: number;
    dbDurationMs?: number;
    apiDurationMs?: number;
    cacheHit?: boolean;
    itemsProcessed?: number;
    memoryUsageMb?: number;
    cpuUsagePercent?: number;
  }): void {
    if (!span.isRecording()) return;

    const {
      durationMs,
      dbDurationMs,
      apiDurationMs,
      cacheHit,
      itemsProcessed,
      memoryUsageMb,
      cpuUsagePercent,
    } = attributes;

    const attributesToAdd: Record<string, AttributeValue> = {};

    if (durationMs !== undefined) attributesToAdd[PerformanceAttributeKeys.OPERATION_DURATION_MS] = durationMs;
    if (dbDurationMs !== undefined) attributesToAdd[PerformanceAttributeKeys.DATABASE_QUERY_DURATION_MS] = dbDurationMs;
    if (apiDurationMs !== undefined) attributesToAdd[PerformanceAttributeKeys.EXTERNAL_API_DURATION_MS] = apiDurationMs;
    if (cacheHit !== undefined) attributesToAdd[PerformanceAttributeKeys.CACHE_HIT] = cacheHit;
    if (itemsProcessed !== undefined) attributesToAdd[PerformanceAttributeKeys.ITEMS_PROCESSED] = itemsProcessed;
    if (memoryUsageMb !== undefined) attributesToAdd[PerformanceAttributeKeys.MEMORY_USAGE_MB] = memoryUsageMb;
    if (cpuUsagePercent !== undefined) attributesToAdd[PerformanceAttributeKeys.CPU_USAGE_PERCENT] = cpuUsagePercent;

    span.setAttributes(attributesToAdd);
  }

  /**
   * Adds gamification event attributes to a span
   * 
   * @param span The OpenTelemetry span to add gamification attributes to
   * @param attributes Object containing gamification event attributes to add
   */
  export function addGamificationAttributes(span: Span, attributes: {
    eventId?: string;
    eventType?: string;
    achievementId?: string;
    questId?: string;
    rewardId?: string;
    profileId?: string;
    pointsEarned?: number;
    levelUp?: boolean;
  }): void {
    if (!span.isRecording()) return;

    const {
      eventId,
      eventType,
      achievementId,
      questId,
      rewardId,
      profileId,
      pointsEarned,
      levelUp,
    } = attributes;

    const attributesToAdd: Record<string, AttributeValue> = {};

    if (eventId) attributesToAdd['gamification.event.id'] = eventId;
    if (eventType) attributesToAdd['gamification.event.type'] = eventType;
    if (achievementId) attributesToAdd['gamification.achievement.id'] = achievementId;
    if (questId) attributesToAdd['gamification.quest.id'] = questId;
    if (rewardId) attributesToAdd['gamification.reward.id'] = rewardId;
    if (profileId) attributesToAdd['gamification.profile.id'] = profileId;
    if (pointsEarned !== undefined) attributesToAdd['gamification.points.earned'] = pointsEarned;
    if (levelUp !== undefined) attributesToAdd['gamification.level.up'] = levelUp;

    span.setAttributes(attributesToAdd);
  }

  /**
   * Adds HTTP request attributes to a span
   * 
   * @param span The OpenTelemetry span to add HTTP attributes to
   * @param attributes Object containing HTTP request attributes to add
   */
  export function addHttpAttributes(span: Span, attributes: {
    method?: string;
    url?: string;
    statusCode?: number;
    requestSize?: number;
    responseSize?: number;
    userAgent?: string;
    clientIp?: string;
    route?: string;
  }): void {
    if (!span.isRecording()) return;

    const {
      method,
      url,
      statusCode,
      requestSize,
      responseSize,
      userAgent,
      clientIp,
      route,
    } = attributes;

    const attributesToAdd: Record<string, AttributeValue> = {};

    if (method) attributesToAdd['http.method'] = method;
    if (url) attributesToAdd['http.url'] = url;
    if (statusCode !== undefined) attributesToAdd['http.status_code'] = statusCode;
    if (requestSize !== undefined) attributesToAdd['http.request.size'] = requestSize;
    if (responseSize !== undefined) attributesToAdd['http.response.size'] = responseSize;
    if (userAgent) attributesToAdd['http.user_agent'] = userAgent;
    if (clientIp) attributesToAdd['http.client_ip'] = clientIp;
    if (route) attributesToAdd['http.route'] = route;

    span.setAttributes(attributesToAdd);
  }

  /**
   * Adds database operation attributes to a span
   * 
   * @param span The OpenTelemetry span to add database attributes to
   * @param attributes Object containing database operation attributes to add
   */
  export function addDatabaseAttributes(span: Span, attributes: {
    system?: string;
    operation?: string;
    statement?: string;
    table?: string;
    connectionString?: string;
    rowsAffected?: number;
    journeyContext?: string;
  }): void {
    if (!span.isRecording()) return;

    const {
      system,
      operation,
      statement,
      table,
      connectionString,
      rowsAffected,
      journeyContext,
    } = attributes;

    const attributesToAdd: Record<string, AttributeValue> = {};

    if (system) attributesToAdd['db.system'] = system;
    if (operation) attributesToAdd['db.operation'] = operation;
    if (statement) attributesToAdd['db.statement'] = statement;
    if (table) attributesToAdd['db.table'] = table;
    if (connectionString) attributesToAdd['db.connection_string'] = connectionString;
    if (rowsAffected !== undefined) attributesToAdd['db.rows_affected'] = rowsAffected;
    if (journeyContext) attributesToAdd['db.journey_context'] = journeyContext;

    span.setAttributes(attributesToAdd);
  }
}