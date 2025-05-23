/**
 * @file mock-spans.ts
 * @description Provides a collection of pre-configured mock spans for different journey contexts
 * (health, care, plan) to facilitate consistent testing of tracing functionality across services.
 * Includes sample spans for common operations like database queries, API calls, and message processing
 * with appropriate attributes and timing characteristics.
 */

import { SpanStatusCode, SpanKind, Span, SpanStatus } from '@opentelemetry/api';
import { JourneyType } from '../../src/interfaces/journey-context.interface';
import {
  JOURNEY_TYPES,
  JOURNEY_STEP_STATUS,
  GAMIFICATION_EVENT_TYPES,
  ERROR_CATEGORIES,
  DB_SYSTEMS,
  MESSAGING_SYSTEMS,
  HTTP_METHODS,
  HEALTH_METRIC_TYPES,
  CARE_APPOINTMENT_TYPES,
  CARE_APPOINTMENT_STATUSES,
  PLAN_TYPES,
  CLAIM_STATUSES,
} from '../../src/interfaces/span-attributes.interface';

/**
 * Interface for mock span configuration
 */
export interface MockSpanConfig {
  name: string;
  kind?: SpanKind;
  startTime?: [number, number]; // [seconds, nanoseconds]
  endTime?: [number, number]; // [seconds, nanoseconds]
  status?: SpanStatus;
  attributes?: Record<string, string | number | boolean | string[] | number[] | boolean[]>;
  events?: Array<{
    name: string;
    time?: [number, number]; // [seconds, nanoseconds]
    attributes?: Record<string, string | number | boolean | string[] | number[] | boolean[]>;
  }>;
  links?: Array<{
    context: {
      traceId: string;
      spanId: string;
      traceFlags?: number;
    };
    attributes?: Record<string, string | number | boolean | string[] | number[] | boolean[]>;
  }>;
  parentSpanId?: string;
  traceId?: string;
  spanId?: string;
}

/**
 * Base class for mock spans
 */
export class MockSpan implements Span {
  private _name: string;
  private _kind: SpanKind;
  private _startTime: [number, number];
  private _endTime: [number, number];
  private _status: SpanStatus;
  private _attributes: Record<string, string | number | boolean | string[] | number[] | boolean[]>;
  private _events: Array<{
    name: string;
    time: [number, number];
    attributes?: Record<string, string | number | boolean | string[] | number[] | boolean[]>;
  }>;
  private _links: Array<{
    context: {
      traceId: string;
      spanId: string;
      traceFlags?: number;
    };
    attributes?: Record<string, string | number | boolean | string[] | number[] | boolean[]>;
  }>;
  private _parentSpanId: string;
  private _traceId: string;
  private _spanId: string;
  private _ended: boolean = false;
  private _recording: boolean = true;

  constructor(config: MockSpanConfig) {
    this._name = config.name;
    this._kind = config.kind || SpanKind.INTERNAL;
    this._startTime = config.startTime || [Math.floor(Date.now() / 1000), 0];
    this._endTime = config.endTime || [this._startTime[0] + 1, 0];
    this._status = config.status || { code: SpanStatusCode.OK };
    this._attributes = config.attributes || {};
    this._events = config.events || [];
    this._links = config.links || [];
    this._parentSpanId = config.parentSpanId || '';
    this._traceId = config.traceId || generateMockTraceId();
    this._spanId = config.spanId || generateMockSpanId();
  }

  // Implement Span interface methods
  setAttribute(key: string, value: string | number | boolean | string[] | number[] | boolean[]): this {
    this._attributes[key] = value;
    return this;
  }

  setAttributes(attributes: Record<string, string | number | boolean | string[] | number[] | boolean[]>): this {
    Object.assign(this._attributes, attributes);
    return this;
  }

  addEvent(name: string, attributesOrStartTime?: Record<string, string | number | boolean | string[] | number[] | boolean[]> | [number, number], startTime?: [number, number]): this {
    const eventTime = Array.isArray(attributesOrStartTime) ? attributesOrStartTime : (startTime || [Math.floor(Date.now() / 1000), 0]);
    const attributes = Array.isArray(attributesOrStartTime) ? {} : attributesOrStartTime || {};
    
    this._events.push({
      name,
      time: eventTime,
      attributes
    });
    
    return this;
  }

  setStatus(status: SpanStatus): this {
    this._status = status;
    return this;
  }

  updateName(name: string): this {
    this._name = name;
    return this;
  }

  end(endTime?: [number, number]): void {
    if (endTime) {
      this._endTime = endTime;
    }
    this._ended = true;
    this._recording = false;
  }

  isRecording(): boolean {
    return this._recording;
  }

  recordException(exception: Error, time?: [number, number]): void {
    this.addEvent('exception', {
      'exception.type': exception.name,
      'exception.message': exception.message,
      'exception.stacktrace': exception.stack || '',
    }, time);
  }

  // Additional methods for testing
  get name(): string {
    return this._name;
  }

  get kind(): SpanKind {
    return this._kind;
  }

  get startTime(): [number, number] {
    return this._startTime;
  }

  get endTime(): [number, number] {
    return this._endTime;
  }

  get status(): SpanStatus {
    return this._status;
  }

  get attributes(): Record<string, string | number | boolean | string[] | number[] | boolean[]> {
    return { ...this._attributes };
  }

  get events(): Array<{
    name: string;
    time: [number, number];
    attributes?: Record<string, string | number | boolean | string[] | number[] | boolean[]>;
  }> {
    return [...this._events];
  }

  get links(): Array<{
    context: {
      traceId: string;
      spanId: string;
      traceFlags?: number;
    };
    attributes?: Record<string, string | number | boolean | string[] | number[] | boolean[]>;
  }> {
    return [...this._links];
  }

  get parentSpanId(): string {
    return this._parentSpanId;
  }

  get traceId(): string {
    return this._traceId;
  }

  get spanId(): string {
    return this._spanId;
  }

  get ended(): boolean {
    return this._ended;
  }

  get duration(): number {
    // Calculate duration in milliseconds
    const startMs = this._startTime[0] * 1000 + this._startTime[1] / 1000000;
    const endMs = this._endTime[0] * 1000 + this._endTime[1] / 1000000;
    return endMs - startMs;
  }
}

/**
 * Generate a mock trace ID
 */
export function generateMockTraceId(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

/**
 * Generate a mock span ID
 */
export function generateMockSpanId(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

/**
 * Generate a mock user ID
 */
export function generateMockUserId(): string {
  return `user-${Math.floor(Math.random() * 10000)}`;
}

/**
 * Generate a mock journey ID
 */
export function generateMockJourneyId(): string {
  return `journey-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a mock span for a database operation
 */
export function createDatabaseSpan(config: {
  operation: string;
  table: string;
  system?: string;
  statement?: string;
  duration?: number; // in milliseconds
  status?: SpanStatus;
  journeyType?: JourneyType;
  journeyId?: string;
  userId?: string;
}): MockSpan {
  const {
    operation,
    table,
    system = DB_SYSTEMS.POSTGRESQL,
    statement,
    duration = 25, // Default to 25ms for database operations
    status = { code: SpanStatusCode.OK },
    journeyType,
    journeyId,
    userId,
  } = config;

  const now = Date.now();
  const startTime: [number, number] = [Math.floor(now / 1000), (now % 1000) * 1000000];
  const endTimeMs = now + duration;
  const endTime: [number, number] = [Math.floor(endTimeMs / 1000), (endTimeMs % 1000) * 1000000];

  const attributes: Record<string, string | number | boolean | string[] | number[] | boolean[]> = {
    'db.system': system,
    'db.operation': operation,
    'db.sql.table': table,
  };

  if (statement) {
    attributes['db.statement'] = statement;
  }

  if (journeyType) {
    attributes['journey.type'] = journeyType;
  }

  if (journeyId) {
    attributes['journey.id'] = journeyId;
  }

  if (userId) {
    attributes['user.id'] = userId;
  }

  return new MockSpan({
    name: `${system}.${table}.${operation}`,
    kind: SpanKind.CLIENT,
    startTime,
    endTime,
    status,
    attributes,
  });
}

/**
 * Create a mock span for an HTTP request
 */
export function createHttpSpan(config: {
  method: string;
  url: string;
  statusCode?: number;
  duration?: number; // in milliseconds
  status?: SpanStatus;
  journeyType?: JourneyType;
  journeyId?: string;
  userId?: string;
}): MockSpan {
  const {
    method,
    url,
    statusCode = 200,
    duration = 75, // Default to 75ms for HTTP requests
    status = { code: SpanStatusCode.OK },
    journeyType,
    journeyId,
    userId,
  } = config;

  const now = Date.now();
  const startTime: [number, number] = [Math.floor(now / 1000), (now % 1000) * 1000000];
  const endTimeMs = now + duration;
  const endTime: [number, number] = [Math.floor(endTimeMs / 1000), (endTimeMs % 1000) * 1000000];

  const urlObj = new URL(url);
  const attributes: Record<string, string | number | boolean | string[] | number[] | boolean[]> = {
    'http.method': method,
    'http.url': url,
    'http.host': urlObj.host,
    'http.scheme': urlObj.protocol.replace(':', ''),
    'http.target': urlObj.pathname + urlObj.search,
    'http.status_code': statusCode,
  };

  if (journeyType) {
    attributes['journey.type'] = journeyType;
  }

  if (journeyId) {
    attributes['journey.id'] = journeyId;
  }

  if (userId) {
    attributes['user.id'] = userId;
  }

  return new MockSpan({
    name: `HTTP ${method} ${urlObj.pathname}`,
    kind: SpanKind.CLIENT,
    startTime,
    endTime,
    status,
    attributes,
  });
}

/**
 * Create a mock span for a messaging operation
 */
export function createMessagingSpan(config: {
  system: string;
  destination: string;
  operation: 'send' | 'receive' | 'process';
  duration?: number; // in milliseconds
  status?: SpanStatus;
  journeyType?: JourneyType;
  journeyId?: string;
  userId?: string;
  messageId?: string;
}): MockSpan {
  const {
    system,
    destination,
    operation,
    duration = 35, // Default to 35ms for messaging operations
    status = { code: SpanStatusCode.OK },
    journeyType,
    journeyId,
    userId,
    messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  } = config;

  const now = Date.now();
  const startTime: [number, number] = [Math.floor(now / 1000), (now % 1000) * 1000000];
  const endTimeMs = now + duration;
  const endTime: [number, number] = [Math.floor(endTimeMs / 1000), (endTimeMs % 1000) * 1000000];

  const attributes: Record<string, string | number | boolean | string[] | number[] | boolean[]> = {
    'messaging.system': system,
    'messaging.destination': destination,
    'messaging.operation': operation,
    'messaging.message_id': messageId,
  };

  if (journeyType) {
    attributes['journey.type'] = journeyType;
  }

  if (journeyId) {
    attributes['journey.id'] = journeyId;
  }

  if (userId) {
    attributes['user.id'] = userId;
  }

  let kind = SpanKind.INTERNAL;
  if (operation === 'send') {
    kind = SpanKind.PRODUCER;
  } else if (operation === 'receive') {
    kind = SpanKind.CONSUMER;
  }

  return new MockSpan({
    name: `${system}.${destination}.${operation}`,
    kind,
    startTime,
    endTime,
    status,
    attributes,
  });
}

/**
 * Create a mock span for a health journey operation
 */
export function createHealthJourneySpan(config: {
  operation: string;
  step?: string;
  metricType?: string;
  deviceId?: string;
  goalId?: string;
  duration?: number; // in milliseconds
  status?: SpanStatus;
  userId?: string;
}): MockSpan {
  const {
    operation,
    step,
    metricType,
    deviceId,
    goalId,
    duration = 45, // Default to 45ms for health journey operations
    status = { code: SpanStatusCode.OK },
    userId = generateMockUserId(),
  } = config;

  const journeyId = generateMockJourneyId();
  const now = Date.now();
  const startTime: [number, number] = [Math.floor(now / 1000), (now % 1000) * 1000000];
  const endTimeMs = now + duration;
  const endTime: [number, number] = [Math.floor(endTimeMs / 1000), (endTimeMs % 1000) * 1000000];

  const attributes: Record<string, string | number | boolean | string[] | number[] | boolean[]> = {
    'journey.type': JOURNEY_TYPES.HEALTH,
    'journey.id': journeyId,
    'user.id': userId,
  };

  if (step) {
    attributes['journey.step'] = step;
    attributes['journey.step.status'] = JOURNEY_STEP_STATUS.COMPLETED;
  }

  if (metricType) {
    attributes['health.metric.type'] = metricType;
  }

  if (deviceId) {
    attributes['health.device.id'] = deviceId;
  }

  if (goalId) {
    attributes['health.goal.id'] = goalId;
  }

  return new MockSpan({
    name: `health.journey.${operation}`,
    kind: SpanKind.INTERNAL,
    startTime,
    endTime,
    status,
    attributes,
  });
}

/**
 * Create a mock span for a care journey operation
 */
export function createCareJourneySpan(config: {
  operation: string;
  step?: string;
  appointmentId?: string;
  appointmentType?: string;
  appointmentStatus?: string;
  providerId?: string;
  telemedicineSessionId?: string;
  duration?: number; // in milliseconds
  status?: SpanStatus;
  userId?: string;
}): MockSpan {
  const {
    operation,
    step,
    appointmentId,
    appointmentType,
    appointmentStatus,
    providerId,
    telemedicineSessionId,
    duration = 55, // Default to 55ms for care journey operations
    status = { code: SpanStatusCode.OK },
    userId = generateMockUserId(),
  } = config;

  const journeyId = generateMockJourneyId();
  const now = Date.now();
  const startTime: [number, number] = [Math.floor(now / 1000), (now % 1000) * 1000000];
  const endTimeMs = now + duration;
  const endTime: [number, number] = [Math.floor(endTimeMs / 1000), (endTimeMs % 1000) * 1000000];

  const attributes: Record<string, string | number | boolean | string[] | number[] | boolean[]> = {
    'journey.type': JOURNEY_TYPES.CARE,
    'journey.id': journeyId,
    'user.id': userId,
  };

  if (step) {
    attributes['journey.step'] = step;
    attributes['journey.step.status'] = JOURNEY_STEP_STATUS.COMPLETED;
  }

  if (appointmentId) {
    attributes['care.appointment.id'] = appointmentId;
  }

  if (appointmentType) {
    attributes['care.appointment.type'] = appointmentType;
  }

  if (appointmentStatus) {
    attributes['care.appointment.status'] = appointmentStatus;
  }

  if (providerId) {
    attributes['care.provider.id'] = providerId;
  }

  if (telemedicineSessionId) {
    attributes['care.telemedicine.session.id'] = telemedicineSessionId;
  }

  return new MockSpan({
    name: `care.journey.${operation}`,
    kind: SpanKind.INTERNAL,
    startTime,
    endTime,
    status,
    attributes,
  });
}

/**
 * Create a mock span for a plan journey operation
 */
export function createPlanJourneySpan(config: {
  operation: string;
  step?: string;
  planId?: string;
  planType?: string;
  claimId?: string;
  claimStatus?: string;
  benefitId?: string;
  duration?: number; // in milliseconds
  status?: SpanStatus;
  userId?: string;
}): MockSpan {
  const {
    operation,
    step,
    planId,
    planType,
    claimId,
    claimStatus,
    benefitId,
    duration = 40, // Default to 40ms for plan journey operations
    status = { code: SpanStatusCode.OK },
    userId = generateMockUserId(),
  } = config;

  const journeyId = generateMockJourneyId();
  const now = Date.now();
  const startTime: [number, number] = [Math.floor(now / 1000), (now % 1000) * 1000000];
  const endTimeMs = now + duration;
  const endTime: [number, number] = [Math.floor(endTimeMs / 1000), (endTimeMs % 1000) * 1000000];

  const attributes: Record<string, string | number | boolean | string[] | number[] | boolean[]> = {
    'journey.type': JOURNEY_TYPES.PLAN,
    'journey.id': journeyId,
    'user.id': userId,
  };

  if (step) {
    attributes['journey.step'] = step;
    attributes['journey.step.status'] = JOURNEY_STEP_STATUS.COMPLETED;
  }

  if (planId) {
    attributes['plan.id'] = planId;
  }

  if (planType) {
    attributes['plan.type'] = planType;
  }

  if (claimId) {
    attributes['plan.claim.id'] = claimId;
  }

  if (claimStatus) {
    attributes['plan.claim.status'] = claimStatus;
  }

  if (benefitId) {
    attributes['plan.benefit.id'] = benefitId;
  }

  return new MockSpan({
    name: `plan.journey.${operation}`,
    kind: SpanKind.INTERNAL,
    startTime,
    endTime,
    status,
    attributes,
  });
}

/**
 * Create a mock span for a gamification operation
 */
export function createGamificationSpan(config: {
  operation: string;
  eventType?: string;
  achievementId?: string;
  questId?: string;
  rewardId?: string;
  pointsEarned?: number;
  levelCurrent?: number;
  duration?: number; // in milliseconds
  status?: SpanStatus;
  userId?: string;
  journeyType?: JourneyType;
}): MockSpan {
  const {
    operation,
    eventType,
    achievementId,
    questId,
    rewardId,
    pointsEarned,
    levelCurrent,
    duration = 30, // Default to 30ms for gamification operations
    status = { code: SpanStatusCode.OK },
    userId = generateMockUserId(),
    journeyType,
  } = config;

  const now = Date.now();
  const startTime: [number, number] = [Math.floor(now / 1000), (now % 1000) * 1000000];
  const endTimeMs = now + duration;
  const endTime: [number, number] = [Math.floor(endTimeMs / 1000), (endTimeMs % 1000) * 1000000];

  const attributes: Record<string, string | number | boolean | string[] | number[] | boolean[]> = {
    'user.id': userId,
  };

  if (journeyType) {
    attributes['journey.type'] = journeyType;
  }

  if (eventType) {
    attributes['gamification.event.type'] = eventType;
  }

  if (achievementId) {
    attributes['gamification.achievement.id'] = achievementId;
  }

  if (questId) {
    attributes['gamification.quest.id'] = questId;
  }

  if (rewardId) {
    attributes['gamification.reward.id'] = rewardId;
  }

  if (pointsEarned !== undefined) {
    attributes['gamification.points.earned'] = pointsEarned;
  }

  if (levelCurrent !== undefined) {
    attributes['gamification.level.current'] = levelCurrent;
  }

  return new MockSpan({
    name: `gamification.${operation}`,
    kind: SpanKind.INTERNAL,
    startTime,
    endTime,
    status,
    attributes,
  });
}

/**
 * Create a mock span for an error scenario
 */
export function createErrorSpan(config: {
  operation: string;
  errorType: string;
  errorMessage: string;
  errorCategory?: string;
  retryCount?: number;
  duration?: number; // in milliseconds
  journeyType?: JourneyType;
  userId?: string;
}): MockSpan {
  const {
    operation,
    errorType,
    errorMessage,
    errorCategory = ERROR_CATEGORIES.UNKNOWN,
    retryCount,
    duration = 65, // Default to 65ms for error scenarios
    journeyType,
    userId,
  } = config;

  const now = Date.now();
  const startTime: [number, number] = [Math.floor(now / 1000), (now % 1000) * 1000000];
  const endTimeMs = now + duration;
  const endTime: [number, number] = [Math.floor(endTimeMs / 1000), (endTimeMs % 1000) * 1000000];

  const attributes: Record<string, string | number | boolean | string[] | number[] | boolean[]> = {
    'error.type': errorType,
    'error.message': errorMessage,
    'error.category': errorCategory,
    'error.handled': true,
  };

  if (retryCount !== undefined) {
    attributes['error.retry_count'] = retryCount;
  }

  if (journeyType) {
    attributes['journey.type'] = journeyType;
  }

  if (userId) {
    attributes['user.id'] = userId;
  }

  return new MockSpan({
    name: `error.${operation}`,
    kind: SpanKind.INTERNAL,
    startTime,
    endTime,
    status: { code: SpanStatusCode.ERROR, message: errorMessage },
    attributes,
  });
}

/**
 * Create a complete trace with multiple spans for a health journey scenario
 */
export function createHealthJourneyTrace(): {
  rootSpan: MockSpan;
  childSpans: MockSpan[];
  traceId: string;
} {
  const traceId = generateMockTraceId();
  const userId = generateMockUserId();
  const journeyId = generateMockJourneyId();
  
  // Root span for the health journey
  const rootSpan = new MockSpan({
    name: 'health.journey.record_metrics',
    kind: SpanKind.SERVER,
    attributes: {
      'journey.type': JOURNEY_TYPES.HEALTH,
      'journey.id': journeyId,
      'user.id': userId,
      'journey.step': 'record_health_metrics',
      'journey.step.status': JOURNEY_STEP_STATUS.IN_PROGRESS,
    },
    traceId,
  });
  
  const rootSpanId = rootSpan.spanId;
  
  // Child spans
  const childSpans: MockSpan[] = [
    // API request to validate user
    createHttpSpan({
      method: HTTP_METHODS.GET,
      url: 'https://api.austa.health/users/validate',
      statusCode: 200,
      duration: 45,
      journeyType: JourneyType.HEALTH,
      journeyId,
      userId,
    }),
    
    // Database query to get user's health profile
    createDatabaseSpan({
      operation: 'SELECT',
      table: 'health_profiles',
      statement: 'SELECT * FROM health_profiles WHERE user_id = $1',
      duration: 22,
      journeyType: JourneyType.HEALTH,
      journeyId,
      userId,
    }),
    
    // Record heart rate metric
    createHealthJourneySpan({
      operation: 'record_metric',
      step: 'record_heart_rate',
      metricType: HEALTH_METRIC_TYPES.HEART_RATE,
      deviceId: 'device-123',
      duration: 38,
      userId,
    }),
    
    // Database operation to save the metric
    createDatabaseSpan({
      operation: 'INSERT',
      table: 'health_metrics',
      statement: 'INSERT INTO health_metrics (user_id, metric_type, value, recorded_at) VALUES ($1, $2, $3, $4)',
      duration: 18,
      journeyType: JourneyType.HEALTH,
      journeyId,
      userId,
    }),
    
    // Send event to gamification engine
    createMessagingSpan({
      system: MESSAGING_SYSTEMS.KAFKA,
      destination: 'health-metrics-recorded',
      operation: 'send',
      duration: 28,
      journeyType: JourneyType.HEALTH,
      journeyId,
      userId,
    }),
    
    // Process gamification event
    createGamificationSpan({
      operation: 'process_event',
      eventType: GAMIFICATION_EVENT_TYPES.POINTS_EARNED,
      pointsEarned: 10,
      levelCurrent: 3,
      duration: 32,
      userId,
      journeyType: JourneyType.HEALTH,
    }),
  ];
  
  // Set parent span ID and trace ID for all child spans
  childSpans.forEach(span => {
    (span as any)._parentSpanId = rootSpanId;
    (span as any)._traceId = traceId;
  });
  
  return { rootSpan, childSpans, traceId };
}

/**
 * Create a complete trace with multiple spans for a care journey scenario
 */
export function createCareJourneyTrace(): {
  rootSpan: MockSpan;
  childSpans: MockSpan[];
  traceId: string;
} {
  const traceId = generateMockTraceId();
  const userId = generateMockUserId();
  const journeyId = generateMockJourneyId();
  const appointmentId = `appt-${Date.now()}`;
  const providerId = `provider-${Math.floor(Math.random() * 1000)}`;
  
  // Root span for the care journey
  const rootSpan = new MockSpan({
    name: 'care.journey.book_appointment',
    kind: SpanKind.SERVER,
    attributes: {
      'journey.type': JOURNEY_TYPES.CARE,
      'journey.id': journeyId,
      'user.id': userId,
      'journey.step': 'book_appointment',
      'journey.step.status': JOURNEY_STEP_STATUS.IN_PROGRESS,
      'care.appointment.type': CARE_APPOINTMENT_TYPES.TELEMEDICINE,
    },
    traceId,
  });
  
  const rootSpanId = rootSpan.spanId;
  
  // Child spans
  const childSpans: MockSpan[] = [
    // API request to validate user
    createHttpSpan({
      method: HTTP_METHODS.GET,
      url: 'https://api.austa.care/users/validate',
      statusCode: 200,
      duration: 48,
      journeyType: JourneyType.CARE,
      journeyId,
      userId,
    }),
    
    // Database query to get available providers
    createDatabaseSpan({
      operation: 'SELECT',
      table: 'providers',
      statement: 'SELECT * FROM providers WHERE specialty = $1 AND is_available = true',
      duration: 35,
      journeyType: JourneyType.CARE,
      journeyId,
      userId,
    }),
    
    // API request to check provider availability
    createHttpSpan({
      method: HTTP_METHODS.GET,
      url: `https://api.austa.care/providers/${providerId}/availability`,
      statusCode: 200,
      duration: 62,
      journeyType: JourneyType.CARE,
      journeyId,
      userId,
    }),
    
    // Create appointment
    createCareJourneySpan({
      operation: 'create_appointment',
      step: 'select_time_slot',
      appointmentId,
      appointmentType: CARE_APPOINTMENT_TYPES.TELEMEDICINE,
      appointmentStatus: CARE_APPOINTMENT_STATUSES.SCHEDULED,
      providerId,
      duration: 42,
      userId,
    }),
    
    // Database operation to save the appointment
    createDatabaseSpan({
      operation: 'INSERT',
      table: 'appointments',
      statement: 'INSERT INTO appointments (id, user_id, provider_id, appointment_type, status, scheduled_at) VALUES ($1, $2, $3, $4, $5, $6)',
      duration: 28,
      journeyType: JourneyType.CARE,
      journeyId,
      userId,
    }),
    
    // Send notification event
    createMessagingSpan({
      system: MESSAGING_SYSTEMS.KAFKA,
      destination: 'appointment-created',
      operation: 'send',
      duration: 25,
      journeyType: JourneyType.CARE,
      journeyId,
      userId,
    }),
    
    // Process gamification event
    createGamificationSpan({
      operation: 'process_event',
      eventType: GAMIFICATION_EVENT_TYPES.QUEST_COMPLETED,
      questId: 'quest-first-appointment',
      pointsEarned: 50,
      levelCurrent: 2,
      duration: 38,
      userId,
      journeyType: JourneyType.CARE,
    }),
  ];
  
  // Set parent span ID and trace ID for all child spans
  childSpans.forEach(span => {
    (span as any)._parentSpanId = rootSpanId;
    (span as any)._traceId = traceId;
  });
  
  return { rootSpan, childSpans, traceId };
}

/**
 * Create a complete trace with multiple spans for a plan journey scenario
 */
export function createPlanJourneyTrace(): {
  rootSpan: MockSpan;
  childSpans: MockSpan[];
  traceId: string;
} {
  const traceId = generateMockTraceId();
  const userId = generateMockUserId();
  const journeyId = generateMockJourneyId();
  const planId = `plan-${Math.floor(Math.random() * 1000)}`;
  const claimId = `claim-${Date.now()}`;
  
  // Root span for the plan journey
  const rootSpan = new MockSpan({
    name: 'plan.journey.submit_claim',
    kind: SpanKind.SERVER,
    attributes: {
      'journey.type': JOURNEY_TYPES.PLAN,
      'journey.id': journeyId,
      'user.id': userId,
      'journey.step': 'submit_claim',
      'journey.step.status': JOURNEY_STEP_STATUS.IN_PROGRESS,
      'plan.id': planId,
      'plan.type': PLAN_TYPES.HEALTH,
    },
    traceId,
  });
  
  const rootSpanId = rootSpan.spanId;
  
  // Child spans
  const childSpans: MockSpan[] = [
    // API request to validate user
    createHttpSpan({
      method: HTTP_METHODS.GET,
      url: 'https://api.austa.plan/users/validate',
      statusCode: 200,
      duration: 52,
      journeyType: JourneyType.PLAN,
      journeyId,
      userId,
    }),
    
    // Database query to get user's plan details
    createDatabaseSpan({
      operation: 'SELECT',
      table: 'plans',
      statement: 'SELECT * FROM plans WHERE id = $1 AND user_id = $2',
      duration: 30,
      journeyType: JourneyType.PLAN,
      journeyId,
      userId,
    }),
    
    // Validate claim data
    createPlanJourneySpan({
      operation: 'validate_claim',
      step: 'validate_claim_data',
      planId,
      planType: PLAN_TYPES.HEALTH,
      claimId,
      duration: 45,
      userId,
    }),
    
    // API request to external insurance system
    createHttpSpan({
      method: HTTP_METHODS.POST,
      url: 'https://api.insurance-partner.com/claims/submit',
      statusCode: 201,
      duration: 120,
      journeyType: JourneyType.PLAN,
      journeyId,
      userId,
    }),
    
    // Database operation to save the claim
    createDatabaseSpan({
      operation: 'INSERT',
      table: 'claims',
      statement: 'INSERT INTO claims (id, user_id, plan_id, amount, status, submitted_at) VALUES ($1, $2, $3, $4, $5, $6)',
      duration: 25,
      journeyType: JourneyType.PLAN,
      journeyId,
      userId,
    }),
    
    // Send notification event
    createMessagingSpan({
      system: MESSAGING_SYSTEMS.KAFKA,
      destination: 'claim-submitted',
      operation: 'send',
      duration: 22,
      journeyType: JourneyType.PLAN,
      journeyId,
      userId,
    }),
    
    // Process gamification event
    createGamificationSpan({
      operation: 'process_event',
      eventType: GAMIFICATION_EVENT_TYPES.ACHIEVEMENT_UNLOCKED,
      achievementId: 'achievement-first-claim',
      pointsEarned: 100,
      levelCurrent: 4,
      duration: 35,
      userId,
      journeyType: JourneyType.PLAN,
    }),
  ];
  
  // Set parent span ID and trace ID for all child spans
  childSpans.forEach(span => {
    (span as any)._parentSpanId = rootSpanId;
    (span as any)._traceId = traceId;
  });
  
  return { rootSpan, childSpans, traceId };
}

/**
 * Create a complete trace with multiple spans for a cross-journey scenario
 */
export function createCrossJourneyTrace(): {
  rootSpan: MockSpan;
  childSpans: MockSpan[];
  traceId: string;
} {
  const traceId = generateMockTraceId();
  const userId = generateMockUserId();
  
  // Root span for the gamification event processing
  const rootSpan = new MockSpan({
    name: 'gamification.process_cross_journey_achievement',
    kind: SpanKind.CONSUMER,
    attributes: {
      'user.id': userId,
      'gamification.event.type': GAMIFICATION_EVENT_TYPES.ACHIEVEMENT_UNLOCKED,
      'gamification.achievement.id': 'achievement-wellness-master',
      'gamification.achievement.name': 'Wellness Master',
    },
    traceId,
  });
  
  const rootSpanId = rootSpan.spanId;
  
  // Child spans
  const childSpans: MockSpan[] = [
    // Check health journey progress
    createHealthJourneySpan({
      operation: 'check_progress',
      step: 'verify_health_metrics',
      duration: 28,
      userId,
    }),
    
    // Check care journey progress
    createCareJourneySpan({
      operation: 'check_progress',
      step: 'verify_appointments',
      duration: 32,
      userId,
    }),
    
    // Check plan journey progress
    createPlanJourneySpan({
      operation: 'check_progress',
      step: 'verify_benefits_usage',
      duration: 30,
      userId,
    }),
    
    // Database query to get user's gamification profile
    createDatabaseSpan({
      operation: 'SELECT',
      table: 'gamification_profiles',
      statement: 'SELECT * FROM gamification_profiles WHERE user_id = $1',
      duration: 18,
      userId,
    }),
    
    // Update achievement status
    createGamificationSpan({
      operation: 'unlock_achievement',
      eventType: GAMIFICATION_EVENT_TYPES.ACHIEVEMENT_UNLOCKED,
      achievementId: 'achievement-wellness-master',
      pointsEarned: 500,
      levelCurrent: 10,
      duration: 25,
      userId,
    }),
    
    // Database operation to save the achievement
    createDatabaseSpan({
      operation: 'INSERT',
      table: 'user_achievements',
      statement: 'INSERT INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES ($1, $2, $3)',
      duration: 20,
      userId,
    }),
    
    // Send notification event
    createMessagingSpan({
      system: MESSAGING_SYSTEMS.KAFKA,
      destination: 'achievement-unlocked',
      operation: 'send',
      duration: 18,
      userId,
    }),
  ];
  
  // Set parent span ID and trace ID for all child spans
  childSpans.forEach(span => {
    (span as any)._parentSpanId = rootSpanId;
    (span as any)._traceId = traceId;
  });
  
  return { rootSpan, childSpans, traceId };
}

/**
 * Create a trace with an error scenario
 */
export function createErrorTrace(): {
  rootSpan: MockSpan;
  childSpans: MockSpan[];
  traceId: string;
} {
  const traceId = generateMockTraceId();
  const userId = generateMockUserId();
  const journeyId = generateMockJourneyId();
  
  // Root span for the operation that will fail
  const rootSpan = new MockSpan({
    name: 'health.journey.sync_device_data',
    kind: SpanKind.SERVER,
    attributes: {
      'journey.type': JOURNEY_TYPES.HEALTH,
      'journey.id': journeyId,
      'user.id': userId,
      'journey.step': 'sync_device_data',
      'journey.step.status': JOURNEY_STEP_STATUS.IN_PROGRESS,
    },
    traceId,
    status: { code: SpanStatusCode.ERROR, message: 'Failed to sync device data' },
  });
  
  const rootSpanId = rootSpan.spanId;
  
  // Child spans
  const childSpans: MockSpan[] = [
    // API request to validate user
    createHttpSpan({
      method: HTTP_METHODS.GET,
      url: 'https://api.austa.health/users/validate',
      statusCode: 200,
      duration: 45,
      journeyType: JourneyType.HEALTH,
      journeyId,
      userId,
    }),
    
    // Database query to get user's device connections
    createDatabaseSpan({
      operation: 'SELECT',
      table: 'device_connections',
      statement: 'SELECT * FROM device_connections WHERE user_id = $1',
      duration: 22,
      journeyType: JourneyType.HEALTH,
      journeyId,
      userId,
    }),
    
    // Failed API request to external device API
    createHttpSpan({
      method: HTTP_METHODS.GET,
      url: 'https://api.wearable-device.com/data/sync',
      statusCode: 503,
      duration: 2500, // Long duration indicating timeout
      status: { code: SpanStatusCode.ERROR, message: 'Service unavailable' },
      journeyType: JourneyType.HEALTH,
      journeyId,
      userId,
    }),
    
    // Error handling span
    createErrorSpan({
      operation: 'handle_device_sync_error',
      errorType: 'ServiceUnavailableError',
      errorMessage: 'External device API is currently unavailable',
      errorCategory: ERROR_CATEGORIES.EXTERNAL_SERVICE,
      retryCount: 3,
      duration: 55,
      journeyType: JourneyType.HEALTH,
      userId,
    }),
    
    // Fallback to cached data
    createDatabaseSpan({
      operation: 'SELECT',
      table: 'cached_device_data',
      statement: 'SELECT * FROM cached_device_data WHERE user_id = $1 ORDER BY recorded_at DESC LIMIT 1',
      duration: 28,
      journeyType: JourneyType.HEALTH,
      journeyId,
      userId,
    }),
    
    // Send notification about sync failure
    createMessagingSpan({
      system: MESSAGING_SYSTEMS.KAFKA,
      destination: 'device-sync-failed',
      operation: 'send',
      duration: 20,
      journeyType: JourneyType.HEALTH,
      journeyId,
      userId,
    }),
  ];
  
  // Set parent span ID and trace ID for all child spans
  childSpans.forEach(span => {
    (span as any)._parentSpanId = rootSpanId;
    (span as any)._traceId = traceId;
  });
  
  return { rootSpan, childSpans, traceId };
}

/**
 * Collection of pre-configured mock spans for common testing scenarios
 */
export const mockSpans = {
  // Health journey spans
  health: {
    recordMetric: createHealthJourneySpan({
      operation: 'record_metric',
      metricType: HEALTH_METRIC_TYPES.HEART_RATE,
      deviceId: 'device-123',
    }),
    syncDevice: createHealthJourneySpan({
      operation: 'sync_device',
      deviceId: 'device-456',
    }),
    createGoal: createHealthJourneySpan({
      operation: 'create_goal',
      goalId: 'goal-789',
    }),
  },
  
  // Care journey spans
  care: {
    bookAppointment: createCareJourneySpan({
      operation: 'book_appointment',
      appointmentId: 'appt-123',
      appointmentType: CARE_APPOINTMENT_TYPES.TELEMEDICINE,
      providerId: 'provider-456',
    }),
    startTelemedicine: createCareJourneySpan({
      operation: 'start_telemedicine',
      appointmentId: 'appt-123',
      telemedicineSessionId: 'tele-789',
      providerId: 'provider-456',
    }),
    prescribeMedication: createCareJourneySpan({
      operation: 'prescribe_medication',
      providerId: 'provider-456',
    }),
  },
  
  // Plan journey spans
  plan: {
    viewBenefits: createPlanJourneySpan({
      operation: 'view_benefits',
      planId: 'plan-123',
      planType: PLAN_TYPES.HEALTH,
    }),
    submitClaim: createPlanJourneySpan({
      operation: 'submit_claim',
      planId: 'plan-123',
      claimId: 'claim-456',
      claimStatus: CLAIM_STATUSES.SUBMITTED,
    }),
    checkCoverage: createPlanJourneySpan({
      operation: 'check_coverage',
      planId: 'plan-123',
      benefitId: 'benefit-789',
    }),
  },
  
  // Gamification spans
  gamification: {
    earnPoints: createGamificationSpan({
      operation: 'earn_points',
      eventType: GAMIFICATION_EVENT_TYPES.POINTS_EARNED,
      pointsEarned: 10,
    }),
    unlockAchievement: createGamificationSpan({
      operation: 'unlock_achievement',
      eventType: GAMIFICATION_EVENT_TYPES.ACHIEVEMENT_UNLOCKED,
      achievementId: 'achievement-123',
    }),
    completeQuest: createGamificationSpan({
      operation: 'complete_quest',
      eventType: GAMIFICATION_EVENT_TYPES.QUEST_COMPLETED,
      questId: 'quest-456',
    }),
  },
  
  // Database operation spans
  database: {
    select: createDatabaseSpan({
      operation: 'SELECT',
      table: 'users',
      statement: 'SELECT * FROM users WHERE id = $1',
    }),
    insert: createDatabaseSpan({
      operation: 'INSERT',
      table: 'health_metrics',
      statement: 'INSERT INTO health_metrics (user_id, type, value) VALUES ($1, $2, $3)',
    }),
    update: createDatabaseSpan({
      operation: 'UPDATE',
      table: 'appointments',
      statement: 'UPDATE appointments SET status = $1 WHERE id = $2',
    }),
  },
  
  // HTTP request spans
  http: {
    get: createHttpSpan({
      method: HTTP_METHODS.GET,
      url: 'https://api.austa.health/users/123',
    }),
    post: createHttpSpan({
      method: HTTP_METHODS.POST,
      url: 'https://api.austa.care/appointments',
    }),
    put: createHttpSpan({
      method: HTTP_METHODS.PUT,
      url: 'https://api.austa.plan/claims/456',
    }),
  },
  
  // Messaging spans
  messaging: {
    send: createMessagingSpan({
      system: MESSAGING_SYSTEMS.KAFKA,
      destination: 'health-metrics',
      operation: 'send',
    }),
    receive: createMessagingSpan({
      system: MESSAGING_SYSTEMS.KAFKA,
      destination: 'appointment-notifications',
      operation: 'receive',
    }),
    process: createMessagingSpan({
      system: MESSAGING_SYSTEMS.KAFKA,
      destination: 'gamification-events',
      operation: 'process',
    }),
  },
  
  // Error spans
  errors: {
    databaseError: createErrorSpan({
      operation: 'database_query',
      errorType: 'DatabaseError',
      errorMessage: 'Failed to execute query',
      errorCategory: ERROR_CATEGORIES.DATABASE,
    }),
    networkError: createErrorSpan({
      operation: 'api_request',
      errorType: 'NetworkError',
      errorMessage: 'Failed to connect to API',
      errorCategory: ERROR_CATEGORIES.NETWORK,
    }),
    validationError: createErrorSpan({
      operation: 'validate_input',
      errorType: 'ValidationError',
      errorMessage: 'Invalid input data',
      errorCategory: ERROR_CATEGORIES.VALIDATION,
    }),
  },
  
  // Complete traces
  traces: {
    healthJourney: createHealthJourneyTrace(),
    careJourney: createCareJourneyTrace(),
    planJourney: createPlanJourneyTrace(),
    crossJourney: createCrossJourneyTrace(),
    errorScenario: createErrorTrace(),
  },
};

export default mockSpans;