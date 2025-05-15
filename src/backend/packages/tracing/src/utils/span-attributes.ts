/**
 * Utility functions for adding standardized attributes to OpenTelemetry spans.
 * 
 * This module provides helper functions for enriching spans with consistent
 * attributes across the application, including common attributes, journey-specific
 * attributes, error information, and performance metrics.
 */

import { Span, SpanStatusCode } from '@opentelemetry/api';

/**
 * Adds common attributes to a span that are relevant across all services.
 * 
 * @param span - The span to add attributes to
 * @param attributes - Object containing common attributes
 */
export function addCommonAttributes(span: Span, attributes: {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  serviceName?: string;
  serviceVersion?: string;
  environment?: string;
}): void {
  if (!span.isRecording()) return;

  if (attributes.userId) {
    span.setAttribute('user.id', attributes.userId);
  }

  if (attributes.requestId) {
    span.setAttribute('request.id', attributes.requestId);
  }

  if (attributes.sessionId) {
    span.setAttribute('session.id', attributes.sessionId);
  }

  if (attributes.serviceName) {
    span.setAttribute('service.name', attributes.serviceName);
  }

  if (attributes.serviceVersion) {
    span.setAttribute('service.version', attributes.serviceVersion);
  }

  if (attributes.environment) {
    span.setAttribute('deployment.environment', attributes.environment);
  }
}

/**
 * Adds HTTP-specific attributes to a span.
 * 
 * @param span - The span to add attributes to
 * @param attributes - Object containing HTTP attributes
 */
export function addHttpAttributes(span: Span, attributes: {
  method?: string;
  url?: string;
  statusCode?: number;
  route?: string;
  userAgent?: string;
  clientIp?: string;
}): void {
  if (!span.isRecording()) return;

  if (attributes.method) {
    span.setAttribute('http.method', attributes.method);
  }

  if (attributes.url) {
    span.setAttribute('http.url', attributes.url);
  }

  if (attributes.statusCode) {
    span.setAttribute('http.status_code', attributes.statusCode);
    
    // Set span status based on HTTP status code
    if (attributes.statusCode >= 400) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: `HTTP error ${attributes.statusCode}`
      });
    }
  }

  if (attributes.route) {
    span.setAttribute('http.route', attributes.route);
  }

  if (attributes.userAgent) {
    span.setAttribute('http.user_agent', attributes.userAgent);
  }

  if (attributes.clientIp) {
    span.setAttribute('http.client_ip', attributes.clientIp);
  }
}

/**
 * Adds database-specific attributes to a span.
 * 
 * @param span - The span to add attributes to
 * @param attributes - Object containing database attributes
 */
export function addDatabaseAttributes(span: Span, attributes: {
  system?: string;
  operation?: string;
  statement?: string;
  table?: string;
  connectionString?: string;
}): void {
  if (!span.isRecording()) return;

  if (attributes.system) {
    span.setAttribute('db.system', attributes.system);
  }

  if (attributes.operation) {
    span.setAttribute('db.operation', attributes.operation);
  }

  if (attributes.statement) {
    span.setAttribute('db.statement', attributes.statement);
  }

  if (attributes.table) {
    span.setAttribute('db.sql.table', attributes.table);
  }

  if (attributes.connectionString) {
    // Sanitize connection string to remove sensitive information
    const sanitizedConnectionString = sanitizeConnectionString(attributes.connectionString);
    span.setAttribute('db.connection_string', sanitizedConnectionString);
  }
}

/**
 * Sanitizes a database connection string to remove sensitive information.
 * 
 * @param connectionString - The connection string to sanitize
 * @returns A sanitized connection string with passwords and sensitive data removed
 */
function sanitizeConnectionString(connectionString: string): string {
  // Replace password in connection strings
  return connectionString.replace(/password=([^;]+)/gi, 'password=***');
}

/**
 * Adds Health journey-specific attributes to a span.
 * 
 * @param span - The span to add attributes to
 * @param attributes - Object containing Health journey attributes
 */
export function addHealthJourneyAttributes(span: Span, attributes: {
  metricType?: string;
  metricValue?: number;
  metricUnit?: string;
  goalId?: string;
  goalType?: string;
  deviceId?: string;
  deviceType?: string;
}): void {
  if (!span.isRecording()) return;

  span.setAttribute('journey.type', 'health');

  if (attributes.metricType) {
    span.setAttribute('health.metric.type', attributes.metricType);
  }

  if (attributes.metricValue !== undefined) {
    span.setAttribute('health.metric.value', attributes.metricValue);
  }

  if (attributes.metricUnit) {
    span.setAttribute('health.metric.unit', attributes.metricUnit);
  }

  if (attributes.goalId) {
    span.setAttribute('health.goal.id', attributes.goalId);
  }

  if (attributes.goalType) {
    span.setAttribute('health.goal.type', attributes.goalType);
  }

  if (attributes.deviceId) {
    span.setAttribute('health.device.id', attributes.deviceId);
  }

  if (attributes.deviceType) {
    span.setAttribute('health.device.type', attributes.deviceType);
  }
}

/**
 * Adds Care journey-specific attributes to a span.
 * 
 * @param span - The span to add attributes to
 * @param attributes - Object containing Care journey attributes
 */
export function addCareJourneyAttributes(span: Span, attributes: {
  appointmentId?: string;
  appointmentType?: string;
  providerId?: string;
  providerSpecialty?: string;
  medicationId?: string;
  medicationType?: string;
  telemedicineSessionId?: string;
}): void {
  if (!span.isRecording()) return;

  span.setAttribute('journey.type', 'care');

  if (attributes.appointmentId) {
    span.setAttribute('care.appointment.id', attributes.appointmentId);
  }

  if (attributes.appointmentType) {
    span.setAttribute('care.appointment.type', attributes.appointmentType);
  }

  if (attributes.providerId) {
    span.setAttribute('care.provider.id', attributes.providerId);
  }

  if (attributes.providerSpecialty) {
    span.setAttribute('care.provider.specialty', attributes.providerSpecialty);
  }

  if (attributes.medicationId) {
    span.setAttribute('care.medication.id', attributes.medicationId);
  }

  if (attributes.medicationType) {
    span.setAttribute('care.medication.type', attributes.medicationType);
  }

  if (attributes.telemedicineSessionId) {
    span.setAttribute('care.telemedicine.session_id', attributes.telemedicineSessionId);
  }
}

/**
 * Adds Plan journey-specific attributes to a span.
 * 
 * @param span - The span to add attributes to
 * @param attributes - Object containing Plan journey attributes
 */
export function addPlanJourneyAttributes(span: Span, attributes: {
  planId?: string;
  planType?: string;
  benefitId?: string;
  benefitType?: string;
  claimId?: string;
  claimStatus?: string;
  documentId?: string;
}): void {
  if (!span.isRecording()) return;

  span.setAttribute('journey.type', 'plan');

  if (attributes.planId) {
    span.setAttribute('plan.id', attributes.planId);
  }

  if (attributes.planType) {
    span.setAttribute('plan.type', attributes.planType);
  }

  if (attributes.benefitId) {
    span.setAttribute('plan.benefit.id', attributes.benefitId);
  }

  if (attributes.benefitType) {
    span.setAttribute('plan.benefit.type', attributes.benefitType);
  }

  if (attributes.claimId) {
    span.setAttribute('plan.claim.id', attributes.claimId);
  }

  if (attributes.claimStatus) {
    span.setAttribute('plan.claim.status', attributes.claimStatus);
  }

  if (attributes.documentId) {
    span.setAttribute('plan.document.id', attributes.documentId);
  }
}

/**
 * Adds gamification-specific attributes to a span.
 * 
 * @param span - The span to add attributes to
 * @param attributes - Object containing gamification attributes
 */
export function addGamificationAttributes(span: Span, attributes: {
  eventType?: string;
  achievementId?: string;
  achievementType?: string;
  rewardId?: string;
  rewardType?: string;
  questId?: string;
  profileId?: string;
  pointsEarned?: number;
}): void {
  if (!span.isRecording()) return;

  if (attributes.eventType) {
    span.setAttribute('gamification.event.type', attributes.eventType);
  }

  if (attributes.achievementId) {
    span.setAttribute('gamification.achievement.id', attributes.achievementId);
  }

  if (attributes.achievementType) {
    span.setAttribute('gamification.achievement.type', attributes.achievementType);
  }

  if (attributes.rewardId) {
    span.setAttribute('gamification.reward.id', attributes.rewardId);
  }

  if (attributes.rewardType) {
    span.setAttribute('gamification.reward.type', attributes.rewardType);
  }

  if (attributes.questId) {
    span.setAttribute('gamification.quest.id', attributes.questId);
  }

  if (attributes.profileId) {
    span.setAttribute('gamification.profile.id', attributes.profileId);
  }

  if (attributes.pointsEarned !== undefined) {
    span.setAttribute('gamification.points.earned', attributes.pointsEarned);
  }
}

/**
 * Adds error information to a span.
 * 
 * @param span - The span to add error information to
 * @param error - The error object
 * @param attributes - Additional error attributes
 */
export function addErrorAttributes(span: Span, error: Error, attributes?: {
  code?: string;
  type?: string;
  retryable?: boolean;
  component?: string;
}): void {
  if (!span.isRecording()) return;

  // Record the exception on the span
  span.recordException(error);
  
  // Set the span status to error
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message
  });

  // Add standard error attributes
  span.setAttribute('error', true);
  span.setAttribute('error.message', error.message);
  span.setAttribute('error.stack', error.stack || '');
  span.setAttribute('error.type', error.name);

  // Add additional error attributes if provided
  if (attributes) {
    if (attributes.code) {
      span.setAttribute('error.code', attributes.code);
    }

    if (attributes.type) {
      span.setAttribute('error.category', attributes.type);
    }

    if (attributes.retryable !== undefined) {
      span.setAttribute('error.retryable', attributes.retryable);
    }

    if (attributes.component) {
      span.setAttribute('error.component', attributes.component);
    }
  }
}

/**
 * Adds performance metric attributes to a span.
 * 
 * @param span - The span to add performance attributes to
 * @param attributes - Object containing performance metrics
 */
export function addPerformanceAttributes(span: Span, attributes: {
  operationDuration?: number;
  queueTime?: number;
  processingTime?: number;
  resourceUsage?: number;
  cacheHit?: boolean;
  itemCount?: number;
}): void {
  if (!span.isRecording()) return;

  if (attributes.operationDuration !== undefined) {
    span.setAttribute('performance.duration_ms', attributes.operationDuration);
  }

  if (attributes.queueTime !== undefined) {
    span.setAttribute('performance.queue_time_ms', attributes.queueTime);
  }

  if (attributes.processingTime !== undefined) {
    span.setAttribute('performance.processing_time_ms', attributes.processingTime);
  }

  if (attributes.resourceUsage !== undefined) {
    span.setAttribute('performance.resource_usage', attributes.resourceUsage);
  }

  if (attributes.cacheHit !== undefined) {
    span.setAttribute('performance.cache_hit', attributes.cacheHit);
  }

  if (attributes.itemCount !== undefined) {
    span.setAttribute('performance.item_count', attributes.itemCount);
  }
}