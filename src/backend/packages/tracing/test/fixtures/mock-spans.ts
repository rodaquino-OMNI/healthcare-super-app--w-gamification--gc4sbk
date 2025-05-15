/**
 * Mock Spans for Testing
 *
 * This file provides a collection of pre-configured mock spans for different journey contexts
 * (health, care, plan) to facilitate consistent testing of tracing functionality across services.
 * Includes sample spans for common operations like database queries, API calls, and message processing
 * with appropriate attributes and timing characteristics.
 */

import { SpanStatusCode, SpanKind, Span, Context } from '@opentelemetry/api';
import {
  JourneyType,
  HealthJourneyContext,
  CareJourneyContext,
  PlanJourneyContext,
  GamificationContext
} from '../../src/interfaces/journey-context.interface';
import {
  HttpSpanAttributes,
  DatabaseSpanAttributes,
  MessagingSpanAttributes,
  HealthJourneySpanAttributes,
  CareJourneySpanAttributes,
  PlanJourneySpanAttributes,
  GamificationSpanAttributes,
  JOURNEY_NAMES,
  DATABASE_SYSTEMS,
  MESSAGING_SYSTEMS,
  GAMIFICATION_EVENT_TYPES
} from '../../src/interfaces/span-attributes.interface';

/**
 * Interface for mock span configuration
 */
export interface MockSpanConfig {
  name: string;
  kind: SpanKind;
  startTime: [number, number]; // [seconds, nanoseconds]
  endTime: [number, number]; // [seconds, nanoseconds]
  attributes: Record<string, any>;
  status?: {
    code: SpanStatusCode;
    message?: string;
  };
  events?: Array<{
    name: string;
    time: [number, number]; // [seconds, nanoseconds]
    attributes?: Record<string, any>;
  }>;
  links?: Array<{
    context: Context;
    attributes?: Record<string, any>;
  }>;
}

/**
 * Base class for creating mock spans
 */
export class MockSpan implements Partial<Span> {
  private _config: MockSpanConfig;
  private _isRecording: boolean = true;

  constructor(config: MockSpanConfig) {
    this._config = config;
  }

  // Implement basic Span interface methods
  setAttribute(key: string, value: any): this {
    this._config.attributes[key] = value;
    return this;
  }

  setAttributes(attributes: Record<string, any>): this {
    Object.assign(this._config.attributes, attributes);
    return this;
  }

  addEvent(name: string, attributesOrTime?: Record<string, any> | [number, number], attributes?: Record<string, any>): this {
    const time = Array.isArray(attributesOrTime) ? attributesOrTime : [Math.floor(Date.now() / 1000), 0];
    const eventAttributes = Array.isArray(attributesOrTime) ? attributes : attributesOrTime;
    
    this._config.events = this._config.events || [];
    this._config.events.push({
      name,
      time,
      attributes: eventAttributes
    });
    
    return this;
  }

  setStatus(status: { code: SpanStatusCode; message?: string }): this {
    this._config.status = status;
    return this;
  }

  updateName(name: string): this {
    this._config.name = name;
    return this;
  }

  end(endTime?: [number, number]): void {
    if (endTime) {
      this._config.endTime = endTime;
    }
    this._isRecording = false;
  }

  isRecording(): boolean {
    return this._isRecording;
  }

  recordException(exception: Error, time?: [number, number]): void {
    this.addEvent('exception', time || [Math.floor(Date.now() / 1000), 0], {
      'exception.type': exception.name,
      'exception.message': exception.message,
      'exception.stacktrace': exception.stack
    });
  }

  // Additional methods for testing
  getConfig(): MockSpanConfig {
    return this._config;
  }

  getDurationMs(): number {
    const startTimeMs = this._config.startTime[0] * 1000 + this._config.startTime[1] / 1000000;
    const endTimeMs = this._config.endTime[0] * 1000 + this._config.endTime[1] / 1000000;
    return endTimeMs - startTimeMs;
  }
}

/**
 * Factory function to create a mock HTTP span
 */
export function createMockHttpSpan({
  name = 'HTTP GET',
  method = 'GET',
  url = 'https://api.austa.health/v1/users',
  statusCode = 200,
  requestSize = 256,
  responseSize = 1024,
  durationMs = 45,
  error = null,
  userId = 'user-123',
  sessionId = 'session-456',
  journeyName = JOURNEY_NAMES.HEALTH
}: {
  name?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  requestSize?: number;
  responseSize?: number;
  durationMs?: number;
  error?: Error | null;
  userId?: string;
  sessionId?: string;
  journeyName?: string;
} = {}): MockSpan {
  const now = Date.now();
  const startTime: [number, number] = [Math.floor(now / 1000), (now % 1000) * 1000000];
  const endTime: [number, number] = [
    Math.floor((now + durationMs) / 1000),
    ((now + durationMs) % 1000) * 1000000
  ];

  const attributes: HttpSpanAttributes & Record<string, any> = {
    'http.method': method,
    'http.url': url,
    'http.target': new URL(url).pathname,
    'http.host': new URL(url).host,
    'http.scheme': new URL(url).protocol.replace(':', ''),
    'http.status_code': statusCode,
    'http.request_content_length': requestSize,
    'http.response_content_length': responseSize,
    'austa.journey.name': journeyName,
    'austa.journey.user_id': userId,
    'austa.journey.session_id': sessionId,
    'austa.journey.operation': 'api_request'
  };

  const status = error
    ? { code: SpanStatusCode.ERROR, message: error.message }
    : { code: SpanStatusCode.OK };

  const config: MockSpanConfig = {
    name,
    kind: SpanKind.CLIENT,
    startTime,
    endTime,
    attributes,
    status
  };

  if (error) {
    const span = new MockSpan(config);
    span.recordException(error);
    return span;
  }

  return new MockSpan(config);
}

/**
 * Factory function to create a mock database span
 */
export function createMockDatabaseSpan({
  name = 'DB Query',
  system = DATABASE_SYSTEMS.POSTGRES,
  operation = 'SELECT',
  table = 'users',
  statement = 'SELECT * FROM users WHERE id = $1',
  durationMs = 25,
  error = null,
  userId = 'user-123',
  sessionId = 'session-456',
  journeyName = JOURNEY_NAMES.HEALTH
}: {
  name?: string;
  system?: string;
  operation?: string;
  table?: string;
  statement?: string;
  durationMs?: number;
  error?: Error | null;
  userId?: string;
  sessionId?: string;
  journeyName?: string;
} = {}): MockSpan {
  const now = Date.now();
  const startTime: [number, number] = [Math.floor(now / 1000), (now % 1000) * 1000000];
  const endTime: [number, number] = [
    Math.floor((now + durationMs) / 1000),
    ((now + durationMs) % 1000) * 1000000
  ];

  const attributes: DatabaseSpanAttributes & Record<string, any> = {
    'db.system': system,
    'db.operation': operation,
    'db.statement': statement,
    'db.sql.table': table,
    'austa.journey.name': journeyName,
    'austa.journey.user_id': userId,
    'austa.journey.session_id': sessionId,
    'austa.journey.operation': 'database_operation'
  };

  const status = error
    ? { code: SpanStatusCode.ERROR, message: error.message }
    : { code: SpanStatusCode.OK };

  const config: MockSpanConfig = {
    name,
    kind: SpanKind.CLIENT,
    startTime,
    endTime,
    attributes,
    status
  };

  if (error) {
    const span = new MockSpan(config);
    span.recordException(error);
    return span;
  }

  return new MockSpan(config);
}

/**
 * Factory function to create a mock messaging span
 */
export function createMockMessagingSpan({
  name = 'Process Message',
  system = MESSAGING_SYSTEMS.KAFKA,
  destination = 'gamification-events',
  messageId = 'msg-789',
  payloadSize = 512,
  durationMs = 35,
  error = null,
  userId = 'user-123',
  sessionId = 'session-456',
  journeyName = JOURNEY_NAMES.HEALTH
}: {
  name?: string;
  system?: string;
  destination?: string;
  messageId?: string;
  payloadSize?: number;
  durationMs?: number;
  error?: Error | null;
  userId?: string;
  sessionId?: string;
  journeyName?: string;
} = {}): MockSpan {
  const now = Date.now();
  const startTime: [number, number] = [Math.floor(now / 1000), (now % 1000) * 1000000];
  const endTime: [number, number] = [
    Math.floor((now + durationMs) / 1000),
    ((now + durationMs) % 1000) * 1000000
  ];

  const attributes: MessagingSpanAttributes & Record<string, any> = {
    'messaging.system': system,
    'messaging.destination': destination,
    'messaging.destination_kind': 'topic',
    'messaging.message_id': messageId,
    'messaging.message_payload_size_bytes': payloadSize,
    'austa.journey.name': journeyName,
    'austa.journey.user_id': userId,
    'austa.journey.session_id': sessionId,
    'austa.journey.operation': 'message_processing'
  };

  const status = error
    ? { code: SpanStatusCode.ERROR, message: error.message }
    : { code: SpanStatusCode.OK };

  const config: MockSpanConfig = {
    name,
    kind: SpanKind.CONSUMER,
    startTime,
    endTime,
    attributes,
    status
  };

  if (error) {
    const span = new MockSpan(config);
    span.recordException(error);
    return span;
  }

  return new MockSpan(config);
}

/**
 * Factory function to create a mock health journey span
 */
export function createMockHealthJourneySpan({
  name = 'Health Metric Recording',
  operation = 'record_health_metric',
  metricType = 'heart_rate',
  metricValue = 75,
  deviceId = 'device-123',
  durationMs = 30,
  error = null,
  userId = 'user-123',
  sessionId = 'session-456'
}: {
  name?: string;
  operation?: string;
  metricType?: string;
  metricValue?: number;
  deviceId?: string;
  durationMs?: number;
  error?: Error | null;
  userId?: string;
  sessionId?: string;
} = {}): MockSpan {
  const now = Date.now();
  const startTime: [number, number] = [Math.floor(now / 1000), (now % 1000) * 1000000];
  const endTime: [number, number] = [
    Math.floor((now + durationMs) / 1000),
    ((now + durationMs) % 1000) * 1000000
  ];

  const attributes: HealthJourneySpanAttributes & Record<string, any> = {
    'austa.journey.name': JOURNEY_NAMES.HEALTH,
    'austa.journey.operation': operation,
    'austa.journey.user_id': userId,
    'austa.journey.session_id': sessionId,
    'austa.health.metric_type': metricType,
    'austa.health.metric_value': metricValue,
    'austa.health.device_id': deviceId
  };

  const status = error
    ? { code: SpanStatusCode.ERROR, message: error.message }
    : { code: SpanStatusCode.OK };

  const config: MockSpanConfig = {
    name,
    kind: SpanKind.INTERNAL,
    startTime,
    endTime,
    attributes,
    status
  };

  if (error) {
    const span = new MockSpan(config);
    span.recordException(error);
    return span;
  }

  return new MockSpan(config);
}

/**
 * Factory function to create a mock care journey span
 */
export function createMockCareJourneySpan({
  name = 'Appointment Booking',
  operation = 'book_appointment',
  appointmentId = 'appt-123',
  providerId = 'provider-456',
  durationMs = 40,
  error = null,
  userId = 'user-123',
  sessionId = 'session-456'
}: {
  name?: string;
  operation?: string;
  appointmentId?: string;
  providerId?: string;
  durationMs?: number;
  error?: Error | null;
  userId?: string;
  sessionId?: string;
} = {}): MockSpan {
  const now = Date.now();
  const startTime: [number, number] = [Math.floor(now / 1000), (now % 1000) * 1000000];
  const endTime: [number, number] = [
    Math.floor((now + durationMs) / 1000),
    ((now + durationMs) % 1000) * 1000000
  ];

  const attributes: CareJourneySpanAttributes & Record<string, any> = {
    'austa.journey.name': JOURNEY_NAMES.CARE,
    'austa.journey.operation': operation,
    'austa.journey.user_id': userId,
    'austa.journey.session_id': sessionId,
    'austa.care.appointment_id': appointmentId,
    'austa.care.provider_id': providerId
  };

  const status = error
    ? { code: SpanStatusCode.ERROR, message: error.message }
    : { code: SpanStatusCode.OK };

  const config: MockSpanConfig = {
    name,
    kind: SpanKind.INTERNAL,
    startTime,
    endTime,
    attributes,
    status
  };

  if (error) {
    const span = new MockSpan(config);
    span.recordException(error);
    return span;
  }

  return new MockSpan(config);
}

/**
 * Factory function to create a mock plan journey span
 */
export function createMockPlanJourneySpan({
  name = 'Claim Submission',
  operation = 'submit_claim',
  claimId = 'claim-123',
  planId = 'plan-456',
  amount = 150.75,
  durationMs = 45,
  error = null,
  userId = 'user-123',
  sessionId = 'session-456'
}: {
  name?: string;
  operation?: string;
  claimId?: string;
  planId?: string;
  amount?: number;
  durationMs?: number;
  error?: Error | null;
  userId?: string;
  sessionId?: string;
} = {}): MockSpan {
  const now = Date.now();
  const startTime: [number, number] = [Math.floor(now / 1000), (now % 1000) * 1000000];
  const endTime: [number, number] = [
    Math.floor((now + durationMs) / 1000),
    ((now + durationMs) % 1000) * 1000000
  ];

  const attributes: PlanJourneySpanAttributes & Record<string, any> = {
    'austa.journey.name': JOURNEY_NAMES.PLAN,
    'austa.journey.operation': operation,
    'austa.journey.user_id': userId,
    'austa.journey.session_id': sessionId,
    'austa.plan.claim_id': claimId,
    'austa.plan.plan_id': planId,
    'claim.amount': amount
  };

  const status = error
    ? { code: SpanStatusCode.ERROR, message: error.message }
    : { code: SpanStatusCode.OK };

  const config: MockSpanConfig = {
    name,
    kind: SpanKind.INTERNAL,
    startTime,
    endTime,
    attributes,
    status
  };

  if (error) {
    const span = new MockSpan(config);
    span.recordException(error);
    return span;
  }

  return new MockSpan(config);
}

/**
 * Factory function to create a mock gamification span
 */
export function createMockGamificationSpan({
  name = 'Process Gamification Event',
  eventType = GAMIFICATION_EVENT_TYPES.ACHIEVEMENT_UNLOCKED,
  achievementId = 'achievement-123',
  points = 50,
  sourceJourney = JOURNEY_NAMES.HEALTH,
  durationMs = 20,
  error = null,
  userId = 'user-123',
  sessionId = 'session-456'
}: {
  name?: string;
  eventType?: string;
  achievementId?: string;
  points?: number;
  sourceJourney?: string;
  durationMs?: number;
  error?: Error | null;
  userId?: string;
  sessionId?: string;
} = {}): MockSpan {
  const now = Date.now();
  const startTime: [number, number] = [Math.floor(now / 1000), (now % 1000) * 1000000];
  const endTime: [number, number] = [
    Math.floor((now + durationMs) / 1000),
    ((now + durationMs) % 1000) * 1000000
  ];

  const attributes: GamificationSpanAttributes & Record<string, any> = {
    'austa.journey.name': sourceJourney,
    'austa.journey.user_id': userId,
    'austa.journey.session_id': sessionId,
    'austa.journey.operation': 'gamification_event',
    'austa.gamification.event_type': eventType,
    'austa.gamification.achievement_id': achievementId,
    'austa.gamification.points': points
  };

  const status = error
    ? { code: SpanStatusCode.ERROR, message: error.message }
    : { code: SpanStatusCode.OK };

  const config: MockSpanConfig = {
    name,
    kind: SpanKind.INTERNAL,
    startTime,
    endTime,
    attributes,
    status
  };

  if (error) {
    const span = new MockSpan(config);
    span.recordException(error);
    return span;
  }

  return new MockSpan(config);
}

/**
 * Factory function to create a complex trace with multiple spans
 */
export function createMockComplexTrace({
  userId = 'user-123',
  sessionId = 'session-456',
  journeyName = JOURNEY_NAMES.HEALTH,
  includeError = false
}: {
  userId?: string;
  sessionId?: string;
  journeyName?: string;
  includeError?: boolean;
} = {}): MockSpan[] {
  // Create a root HTTP span
  const rootSpan = createMockHttpSpan({
    name: 'HTTP POST /api/v1/health/metrics',
    method: 'POST',
    url: `https://api.austa.health/v1/${journeyName}/metrics`,
    durationMs: 120,
    userId,
    sessionId,
    journeyName
  });

  // Create child database spans
  const dbSpan1 = createMockDatabaseSpan({
    name: 'DB Query - Get User Profile',
    operation: 'SELECT',
    table: 'user_profiles',
    statement: 'SELECT * FROM user_profiles WHERE user_id = $1',
    durationMs: 15,
    userId,
    sessionId,
    journeyName
  });

  const dbSpan2 = createMockDatabaseSpan({
    name: 'DB Query - Insert Metric',
    operation: 'INSERT',
    table: `${journeyName}_metrics`,
    statement: `INSERT INTO ${journeyName}_metrics (user_id, metric_type, value, recorded_at) VALUES ($1, $2, $3, $4)`,
    durationMs: 20,
    userId,
    sessionId,
    journeyName,
    error: includeError ? new Error('Database connection timeout') : null
  });

  // Create a messaging span for gamification
  const messagingSpan = createMockMessagingSpan({
    name: 'Send Gamification Event',
    destination: 'gamification-events',
    durationMs: 10,
    userId,
    sessionId,
    journeyName
  });

  // Create a journey-specific span
  let journeySpan;
  switch (journeyName) {
    case JOURNEY_NAMES.HEALTH:
      journeySpan = createMockHealthJourneySpan({
        name: 'Record Health Metric',
        metricType: 'blood_pressure',
        metricValue: 120,
        userId,
        sessionId
      });
      break;
    case JOURNEY_NAMES.CARE:
      journeySpan = createMockCareJourneySpan({
        name: 'Schedule Appointment',
        appointmentId: 'appt-789',
        providerId: 'provider-456',
        userId,
        sessionId
      });
      break;
    case JOURNEY_NAMES.PLAN:
      journeySpan = createMockPlanJourneySpan({
        name: 'Submit Insurance Claim',
        claimId: 'claim-789',
        planId: 'plan-456',
        amount: 250.50,
        userId,
        sessionId
      });
      break;
    default:
      journeySpan = createMockHealthJourneySpan({
        userId,
        sessionId
      });
  }

  // Create a gamification span
  const gamificationSpan = createMockGamificationSpan({
    name: 'Process Achievement',
    eventType: GAMIFICATION_EVENT_TYPES.ACHIEVEMENT_UNLOCKED,
    achievementId: 'achievement-789',
    points: 100,
    sourceJourney: journeyName,
    userId,
    sessionId
  });

  return [rootSpan, dbSpan1, dbSpan2, messagingSpan, journeySpan, gamificationSpan];
}

/**
 * Pre-configured mock spans for common testing scenarios
 */
export const mockSpans = {
  // Health journey spans
  health: {
    recordMetric: createMockHealthJourneySpan({
      name: 'Record Heart Rate',
      metricType: 'heart_rate',
      metricValue: 72
    }),
    syncDevice: createMockHealthJourneySpan({
      name: 'Sync Wearable Device',
      operation: 'sync_device',
      deviceId: 'fitbit-123',
      durationMs: 150
    }),
    viewGoals: createMockHealthJourneySpan({
      name: 'View Health Goals',
      operation: 'view_goals'
    }),
    errorCase: createMockHealthJourneySpan({
      name: 'Failed Health Metric Recording',
      error: new Error('Invalid metric value')
    })
  },
  
  // Care journey spans
  care: {
    bookAppointment: createMockCareJourneySpan({
      name: 'Book Doctor Appointment',
      appointmentId: 'appt-456',
      providerId: 'doctor-789'
    }),
    startTelemedicine: createMockCareJourneySpan({
      name: 'Start Telemedicine Session',
      operation: 'start_telemedicine',
      appointmentId: 'telemedicine-456'
    }),
    medicationReminder: createMockCareJourneySpan({
      name: 'Medication Reminder',
      operation: 'medication_reminder'
    }),
    errorCase: createMockCareJourneySpan({
      name: 'Failed Appointment Booking',
      error: new Error('Provider not available')
    })
  },
  
  // Plan journey spans
  plan: {
    submitClaim: createMockPlanJourneySpan({
      name: 'Submit Medical Claim',
      claimId: 'claim-456',
      amount: 175.50
    }),
    checkCoverage: createMockPlanJourneySpan({
      name: 'Check Benefit Coverage',
      operation: 'check_coverage',
      planId: 'plan-789'
    }),
    viewBenefits: createMockPlanJourneySpan({
      name: 'View Plan Benefits',
      operation: 'view_benefits'
    }),
    errorCase: createMockPlanJourneySpan({
      name: 'Failed Claim Submission',
      error: new Error('Missing documentation')
    })
  },
  
  // Gamification spans
  gamification: {
    achievementUnlocked: createMockGamificationSpan({
      name: 'Achievement Unlocked',
      eventType: GAMIFICATION_EVENT_TYPES.ACHIEVEMENT_UNLOCKED,
      achievementId: 'first-appointment'
    }),
    questCompleted: createMockGamificationSpan({
      name: 'Quest Completed',
      eventType: GAMIFICATION_EVENT_TYPES.QUEST_COMPLETED,
      achievementId: 'health-tracking-week'
    }),
    pointsEarned: createMockGamificationSpan({
      name: 'Points Earned',
      eventType: GAMIFICATION_EVENT_TYPES.POINTS_EARNED,
      points: 25
    }),
    errorCase: createMockGamificationSpan({
      name: 'Failed Achievement Processing',
      error: new Error('Achievement criteria not met')
    })
  },
  
  // Database operation spans
  database: {
    select: createMockDatabaseSpan({
      name: 'Select User Data',
      operation: 'SELECT',
      table: 'users'
    }),
    insert: createMockDatabaseSpan({
      name: 'Insert Health Record',
      operation: 'INSERT',
      table: 'health_records'
    }),
    update: createMockDatabaseSpan({
      name: 'Update User Profile',
      operation: 'UPDATE',
      table: 'user_profiles'
    }),
    errorCase: createMockDatabaseSpan({
      name: 'Failed Database Query',
      error: new Error('Database connection error')
    })
  },
  
  // HTTP request spans
  http: {
    get: createMockHttpSpan({
      name: 'HTTP GET User Profile',
      method: 'GET',
      url: 'https://api.austa.health/v1/users/profile'
    }),
    post: createMockHttpSpan({
      name: 'HTTP POST Create Appointment',
      method: 'POST',
      url: 'https://api.austa.health/v1/care/appointments'
    }),
    put: createMockHttpSpan({
      name: 'HTTP PUT Update Preferences',
      method: 'PUT',
      url: 'https://api.austa.health/v1/users/preferences'
    }),
    errorCase: createMockHttpSpan({
      name: 'HTTP Error Response',
      statusCode: 500,
      error: new Error('Internal server error')
    })
  },
  
  // Messaging spans
  messaging: {
    publishEvent: createMockMessagingSpan({
      name: 'Publish Health Event',
      destination: 'health-events'
    }),
    consumeNotification: createMockMessagingSpan({
      name: 'Consume Notification',
      destination: 'user-notifications',
      kind: SpanKind.CONSUMER
    }),
    processCommand: createMockMessagingSpan({
      name: 'Process Command',
      destination: 'user-commands'
    }),
    errorCase: createMockMessagingSpan({
      name: 'Failed Message Processing',
      error: new Error('Message deserialization error')
    })
  },
  
  // Complex traces
  traces: {
    healthJourney: createMockComplexTrace({
      journeyName: JOURNEY_NAMES.HEALTH
    }),
    careJourney: createMockComplexTrace({
      journeyName: JOURNEY_NAMES.CARE
    }),
    planJourney: createMockComplexTrace({
      journeyName: JOURNEY_NAMES.PLAN
    }),
    errorTrace: createMockComplexTrace({
      journeyName: JOURNEY_NAMES.HEALTH,
      includeError: true
    })
  }
};