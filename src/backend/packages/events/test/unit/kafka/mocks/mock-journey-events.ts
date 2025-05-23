/**
 * @file mock-journey-events.ts
 * @description Mock generators for journey-specific events used in testing Kafka event processing.
 * This file provides factory functions to create standardized event objects for Health, Care, and Plan
 * journeys that match the expected schema for the gamification engine and notification service.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  BaseEvent, 
  EventMetadata, 
  createEvent,
  validateEvent 
} from '../../../../../src/interfaces/base-event.interface';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';
import {
  HealthEventType,
  CareEventType,
  PlanEventType,
  MetricType,
  GoalType,
  GoalStatus,
  AppointmentStatus,
  AppointmentType,
  ClaimStatus
} from '@austa/interfaces/journey';

// ===== HELPER FUNCTIONS =====

/**
 * Generate a random ISO timestamp within the last 30 days
 */
export function mockTimestamp(daysAgo = 30): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
}

/**
 * Generate a random version string following semantic versioning
 */
export function mockVersion(options?: { major?: number; minor?: number; patch?: number }): string {
  const major = options?.major ?? 1;
  const minor = options?.minor ?? Math.floor(Math.random() * 5);
  const patch = options?.patch ?? Math.floor(Math.random() * 10);
  return `${major}.${minor}.${patch}`;
}

/**
 * Generate random event metadata
 */
export function mockMetadata(options?: Partial<EventMetadata>): EventMetadata {
  return {
    correlationId: options?.correlationId ?? `corr-${uuidv4()}`,
    traceId: options?.traceId ?? `trace-${uuidv4()}`,
    spanId: options?.spanId ?? `span-${uuidv4()}`,
    priority: options?.priority ?? 'medium',
    isRetry: options?.isRetry ?? false,
    retryCount: options?.retryCount ?? 0,
    ...options
  };
}

// ===== MOCK USER DATA =====

/**
 * Mock user data for testing
 */
export const mockUsers = {
  standard: {
    userId: 'user_12345',
    name: 'Test User',
    email: 'user@austa.com.br'
  },
  premium: {
    userId: 'user_67890',
    name: 'Premium User',
    email: 'premium@austa.com.br'
  },
  new: {
    userId: 'user_new123',
    name: 'New User',
    email: 'new@austa.com.br'
  }
};

// ===== HEALTH JOURNEY EVENTS =====

/**
 * Create a mock health metric recorded event
 */
export function mockHealthMetricRecordedEvent(options?: {
  userId?: string;
  metricType?: MetricType;
  value?: number;
  unit?: string;
  source?: string;
  previousValue?: number;
  version?: string;
  metadata?: Partial<EventMetadata>;
}): BaseEvent {
  const metricType = options?.metricType ?? MetricType.HEART_RATE;
  const value = options?.value ?? (metricType === MetricType.HEART_RATE ? 75 : 8000);
  const unit = options?.unit ?? (metricType === MetricType.HEART_RATE ? 'bpm' : 'steps');
  
  return createEvent(
    HealthEventType.METRIC_RECORDED,
    'health-service',
    {
      metric: {
        id: uuidv4(),
        userId: options?.userId ?? mockUsers.standard.userId,
        type: metricType,
        value,
        unit,
        timestamp: mockTimestamp(1) // Recent metric
      },
      metricType,
      value,
      unit,
      timestamp: mockTimestamp(1),
      source: options?.source ?? 'manual',
      previousValue: options?.previousValue ?? (value - Math.floor(Math.random() * 10)),
      change: options?.previousValue ? value - options.previousValue : Math.floor(Math.random() * 10),
      isImprovement: true
    },
    {
      userId: options?.userId ?? mockUsers.standard.userId,
      journey: JourneyType.HEALTH,
      version: options?.version ?? '1.0.0',
      metadata: mockMetadata(options?.metadata)
    }
  );
}

/**
 * Create a mock health goal created event
 */
export function mockHealthGoalCreatedEvent(options?: {
  userId?: string;
  goalType?: GoalType;
  targetValue?: number;
  unit?: string;
  version?: string;
  metadata?: Partial<EventMetadata>;
}): BaseEvent {
  const goalType = options?.goalType ?? GoalType.STEPS;
  const targetValue = options?.targetValue ?? (goalType === GoalType.STEPS ? 10000 : 60);
  const unit = options?.unit ?? (goalType === GoalType.STEPS ? 'steps' : 'bpm');
  
  return createEvent(
    HealthEventType.GOAL_CREATED,
    'health-service',
    {
      goal: {
        id: uuidv4(),
        userId: options?.userId ?? mockUsers.standard.userId,
        type: goalType,
        targetValue,
        currentValue: 0,
        unit,
        status: GoalStatus.IN_PROGRESS,
        startDate: mockTimestamp(1),
        endDate: null
      },
      goalType,
      targetValue,
      unit,
      startDate: mockTimestamp(1)
    },
    {
      userId: options?.userId ?? mockUsers.standard.userId,
      journey: JourneyType.HEALTH,
      version: options?.version ?? '1.0.0',
      metadata: mockMetadata(options?.metadata)
    }
  );
}

/**
 * Create a mock health goal achieved event
 */
export function mockHealthGoalAchievedEvent(options?: {
  userId?: string;
  goalType?: GoalType;
  targetValue?: number;
  achievedValue?: number;
  unit?: string;
  daysToAchieve?: number;
  isEarlyCompletion?: boolean;
  version?: string;
  metadata?: Partial<EventMetadata>;
}): BaseEvent {
  const goalType = options?.goalType ?? GoalType.STEPS;
  const targetValue = options?.targetValue ?? (goalType === GoalType.STEPS ? 10000 : 60);
  const achievedValue = options?.achievedValue ?? targetValue;
  const unit = options?.unit ?? (goalType === GoalType.STEPS ? 'steps' : 'bpm');
  const daysToAchieve = options?.daysToAchieve ?? 7;
  
  return createEvent(
    HealthEventType.GOAL_ACHIEVED,
    'health-service',
    {
      goal: {
        id: uuidv4(),
        userId: options?.userId ?? mockUsers.standard.userId,
        type: goalType,
        targetValue,
        currentValue: achievedValue,
        unit,
        status: GoalStatus.ACHIEVED,
        startDate: mockTimestamp(daysToAchieve + 1),
        endDate: mockTimestamp(1)
      },
      goalType,
      achievedValue,
      targetValue,
      daysToAchieve,
      isEarlyCompletion: options?.isEarlyCompletion ?? true
    },
    {
      userId: options?.userId ?? mockUsers.standard.userId,
      journey: JourneyType.HEALTH,
      version: options?.version ?? '1.0.0',
      metadata: mockMetadata(options?.metadata)
    }
  );
}

/**
 * Create a mock health device connected event
 */
export function mockHealthDeviceConnectedEvent(options?: {
  userId?: string;
  deviceType?: string;
  isFirstConnection?: boolean;
  version?: string;
  metadata?: Partial<EventMetadata>;
}): BaseEvent {
  const deviceType = options?.deviceType ?? 'Smartwatch';
  
  return createEvent(
    HealthEventType.DEVICE_CONNECTED,
    'health-service',
    {
      deviceConnection: {
        id: uuidv4(),
        userId: options?.userId ?? mockUsers.standard.userId,
        deviceId: `device_${uuidv4().substring(0, 8)}`,
        deviceType,
        connectionDate: mockTimestamp(1),
        lastSyncDate: mockTimestamp(1),
        status: 'connected'
      },
      deviceId: `device_${uuidv4().substring(0, 8)}`,
      deviceType,
      connectionDate: mockTimestamp(1),
      isFirstConnection: options?.isFirstConnection ?? true
    },
    {
      userId: options?.userId ?? mockUsers.standard.userId,
      journey: JourneyType.HEALTH,
      version: options?.version ?? '1.0.0',
      metadata: mockMetadata(options?.metadata)
    }
  );
}

/**
 * Create a mock health device synced event
 */
export function mockHealthDeviceSyncedEvent(options?: {
  userId?: string;
  deviceType?: string;
  metricsCount?: number;
  metricTypes?: MetricType[];
  syncSuccessful?: boolean;
  errorMessage?: string;
  version?: string;
  metadata?: Partial<EventMetadata>;
}): BaseEvent {
  const deviceType = options?.deviceType ?? 'Smartwatch';
  const metricsCount = options?.metricsCount ?? 5;
  const metricTypes = options?.metricTypes ?? [MetricType.HEART_RATE, MetricType.STEPS];
  const syncSuccessful = options?.syncSuccessful ?? true;
  
  return createEvent(
    HealthEventType.DEVICE_SYNCED,
    'health-service',
    {
      deviceConnection: {
        id: uuidv4(),
        userId: options?.userId ?? mockUsers.standard.userId,
        deviceId: `device_${uuidv4().substring(0, 8)}`,
        deviceType,
        connectionDate: mockTimestamp(7),
        lastSyncDate: mockTimestamp(1),
        status: 'connected'
      },
      deviceId: `device_${uuidv4().substring(0, 8)}`,
      deviceType,
      syncDate: mockTimestamp(1),
      metricsCount,
      metricTypes,
      syncSuccessful,
      errorMessage: syncSuccessful ? undefined : (options?.errorMessage ?? 'Connection timeout')
    },
    {
      userId: options?.userId ?? mockUsers.standard.userId,
      journey: JourneyType.HEALTH,
      version: options?.version ?? '1.0.0',
      metadata: mockMetadata(options?.metadata)
    }
  );
}

// ===== CARE JOURNEY EVENTS =====

/**
 * Create a mock care appointment booked event
 */
export function mockCareAppointmentBookedEvent(options?: {
  userId?: string;
  appointmentType?: AppointmentType;
  providerId?: string;
  isFirstAppointment?: boolean;
  isUrgent?: boolean;
  version?: string;
  metadata?: Partial<EventMetadata>;
}): BaseEvent {
  const appointmentType = options?.appointmentType ?? AppointmentType.IN_PERSON;
  const providerId = options?.providerId ?? `provider_${uuidv4().substring(0, 8)}`;
  const scheduledDate = mockTimestamp(-7); // Future date
  
  return createEvent(
    CareEventType.APPOINTMENT_BOOKED,
    'care-service',
    {
      appointment: {
        id: uuidv4(),
        userId: options?.userId ?? mockUsers.standard.userId,
        providerId,
        type: appointmentType,
        status: AppointmentStatus.SCHEDULED,
        scheduledDate,
        createdAt: mockTimestamp(1),
        notes: 'Regular checkup'
      },
      appointmentType,
      providerId,
      scheduledDate,
      isFirstAppointment: options?.isFirstAppointment ?? false,
      isUrgent: options?.isUrgent ?? false
    },
    {
      userId: options?.userId ?? mockUsers.standard.userId,
      journey: JourneyType.CARE,
      version: options?.version ?? '1.0.0',
      metadata: mockMetadata(options?.metadata)
    }
  );
}

/**
 * Create a mock care appointment completed event
 */
export function mockCareAppointmentCompletedEvent(options?: {
  userId?: string;
  appointmentType?: AppointmentType;
  providerId?: string;
  duration?: number;
  followUpScheduled?: boolean;
  version?: string;
  metadata?: Partial<EventMetadata>;
}): BaseEvent {
  const appointmentType = options?.appointmentType ?? AppointmentType.IN_PERSON;
  const providerId = options?.providerId ?? `provider_${uuidv4().substring(0, 8)}`;
  const duration = options?.duration ?? 30;
  
  return createEvent(
    CareEventType.APPOINTMENT_COMPLETED,
    'care-service',
    {
      appointment: {
        id: uuidv4(),
        userId: options?.userId ?? mockUsers.standard.userId,
        providerId,
        type: appointmentType,
        status: AppointmentStatus.COMPLETED,
        scheduledDate: mockTimestamp(1),
        completedDate: mockTimestamp(1),
        createdAt: mockTimestamp(7),
        notes: 'Regular checkup completed'
      },
      appointmentType,
      providerId,
      completionDate: mockTimestamp(1),
      duration,
      followUpScheduled: options?.followUpScheduled ?? false
    },
    {
      userId: options?.userId ?? mockUsers.standard.userId,
      journey: JourneyType.CARE,
      version: options?.version ?? '1.0.0',
      metadata: mockMetadata(options?.metadata)
    }
  );
}

/**
 * Create a mock care medication added event
 */
export function mockCareMedicationAddedEvent(options?: {
  userId?: string;
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  isChronicMedication?: boolean;
  version?: string;
  metadata?: Partial<EventMetadata>;
}): BaseEvent {
  const medicationName = options?.medicationName ?? 'Medication Name';
  const dosage = options?.dosage ?? '10mg';
  const frequency = options?.frequency ?? 'Once daily';
  
  return createEvent(
    CareEventType.MEDICATION_ADDED,
    'care-service',
    {
      medication: {
        id: uuidv4(),
        userId: options?.userId ?? mockUsers.standard.userId,
        name: medicationName,
        dosage,
        frequency,
        startDate: mockTimestamp(1),
        endDate: options?.isChronicMedication ? null : mockTimestamp(-30),
        instructions: 'Take with food',
        createdAt: mockTimestamp(1)
      },
      startDate: mockTimestamp(1),
      endDate: options?.isChronicMedication ? undefined : mockTimestamp(-30),
      dosage,
      frequency,
      isChronicMedication: options?.isChronicMedication ?? false
    },
    {
      userId: options?.userId ?? mockUsers.standard.userId,
      journey: JourneyType.CARE,
      version: options?.version ?? '1.0.0',
      metadata: mockMetadata(options?.metadata)
    }
  );
}

/**
 * Create a mock care medication adherence streak event
 */
export function mockCareMedicationAdherenceStreakEvent(options?: {
  userId?: string;
  medicationId?: string;
  medicationName?: string;
  streakDays?: number;
  adherencePercentage?: number;
  version?: string;
  metadata?: Partial<EventMetadata>;
}): BaseEvent {
  const medicationId = options?.medicationId ?? uuidv4();
  const medicationName = options?.medicationName ?? 'Medication Name';
  const streakDays = options?.streakDays ?? 7;
  const adherencePercentage = options?.adherencePercentage ?? 100;
  
  return createEvent(
    CareEventType.MEDICATION_ADHERENCE_STREAK,
    'care-service',
    {
      medicationId,
      medicationName,
      streakDays,
      adherencePercentage,
      startDate: mockTimestamp(streakDays),
      endDate: mockTimestamp(1)
    },
    {
      userId: options?.userId ?? mockUsers.standard.userId,
      journey: JourneyType.CARE,
      version: options?.version ?? '1.0.0',
      metadata: mockMetadata(options?.metadata)
    }
  );
}

/**
 * Create a mock care telemedicine session completed event
 */
export function mockCareTelemedicineSessionCompletedEvent(options?: {
  userId?: string;
  providerId?: string;
  duration?: number;
  technicalIssues?: boolean;
  version?: string;
  metadata?: Partial<EventMetadata>;
}): BaseEvent {
  const providerId = options?.providerId ?? `provider_${uuidv4().substring(0, 8)}`;
  const duration = options?.duration ?? 20;
  const sessionId = uuidv4();
  const startTime = mockTimestamp(1);
  const endTime = new Date(new Date(startTime).getTime() + duration * 60000).toISOString();
  
  return createEvent(
    CareEventType.TELEMEDICINE_SESSION_COMPLETED,
    'care-service',
    {
      session: {
        id: sessionId,
        userId: options?.userId ?? mockUsers.standard.userId,
        providerId,
        startTime,
        endTime,
        status: 'completed',
        notes: 'Telemedicine session completed successfully'
      },
      sessionId,
      providerId,
      startTime,
      endTime,
      duration,
      appointmentId: uuidv4(),
      technicalIssues: options?.technicalIssues ?? false
    },
    {
      userId: options?.userId ?? mockUsers.standard.userId,
      journey: JourneyType.CARE,
      version: options?.version ?? '1.0.0',
      metadata: mockMetadata(options?.metadata)
    }
  );
}

// ===== PLAN JOURNEY EVENTS =====

/**
 * Create a mock plan claim submitted event
 */
export function mockPlanClaimSubmittedEvent(options?: {
  userId?: string;
  amount?: number;
  claimType?: string;
  hasDocuments?: boolean;
  isComplete?: boolean;
  version?: string;
  metadata?: Partial<EventMetadata>;
}): BaseEvent {
  const amount = options?.amount ?? 150.0;
  const claimType = options?.claimType ?? 'Consulta Médica';
  const hasDocuments = options?.hasDocuments ?? true;
  const isComplete = options?.isComplete ?? true;
  
  return createEvent(
    PlanEventType.CLAIM_SUBMITTED,
    'plan-service',
    {
      claim: {
        id: uuidv4(),
        userId: options?.userId ?? mockUsers.standard.userId,
        amount,
        claimType,
        status: ClaimStatus.SUBMITTED,
        submissionDate: mockTimestamp(1),
        description: 'Regular checkup claim',
        hasDocuments
      },
      submissionDate: mockTimestamp(1),
      amount,
      claimType,
      hasDocuments,
      isComplete
    },
    {
      userId: options?.userId ?? mockUsers.standard.userId,
      journey: JourneyType.PLAN,
      version: options?.version ?? '1.0.0',
      metadata: mockMetadata(options?.metadata)
    }
  );
}

/**
 * Create a mock plan claim approved event
 */
export function mockPlanClaimApprovedEvent(options?: {
  userId?: string;
  claimId?: string;
  amount?: number;
  approvedAmount?: number;
  processingDays?: number;
  paymentMethod?: string;
  version?: string;
  metadata?: Partial<EventMetadata>;
}): BaseEvent {
  const claimId = options?.claimId ?? uuidv4();
  const amount = options?.amount ?? 150.0;
  const approvedAmount = options?.approvedAmount ?? amount;
  const processingDays = options?.processingDays ?? 3;
  const paymentMethod = options?.paymentMethod ?? 'Bank Transfer';
  
  return createEvent(
    PlanEventType.CLAIM_APPROVED,
    'plan-service',
    {
      claimId,
      approvalDate: mockTimestamp(1),
      amount,
      approvedAmount,
      processingDays,
      paymentMethod,
      paymentDate: mockTimestamp(-7) // Future date
    },
    {
      userId: options?.userId ?? mockUsers.standard.userId,
      journey: JourneyType.PLAN,
      version: options?.version ?? '1.0.0',
      metadata: mockMetadata(options?.metadata)
    }
  );
}

/**
 * Create a mock plan benefit utilized event
 */
export function mockPlanBenefitUtilizedEvent(options?: {
  userId?: string;
  benefitName?: string;
  serviceProvider?: string;
  amount?: number;
  remainingCoverage?: number;
  isFirstUtilization?: boolean;
  version?: string;
  metadata?: Partial<EventMetadata>;
}): BaseEvent {
  const benefitName = options?.benefitName ?? 'Annual Checkup';
  const serviceProvider = options?.serviceProvider ?? 'Provider Name';
  const amount = options?.amount ?? 100.0;
  const remainingCoverage = options?.remainingCoverage ?? 900.0;
  
  return createEvent(
    PlanEventType.BENEFIT_UTILIZED,
    'plan-service',
    {
      benefit: {
        id: uuidv4(),
        userId: options?.userId ?? mockUsers.standard.userId,
        name: benefitName,
        description: 'Annual health checkup benefit',
        coverageLimit: 1000.0,
        usedAmount: amount,
        remainingAmount: remainingCoverage
      },
      utilizationDate: mockTimestamp(1),
      serviceProvider,
      amount,
      remainingCoverage,
      isFirstUtilization: options?.isFirstUtilization ?? false
    },
    {
      userId: options?.userId ?? mockUsers.standard.userId,
      journey: JourneyType.PLAN,
      version: options?.version ?? '1.0.0',
      metadata: mockMetadata(options?.metadata)
    }
  );
}

/**
 * Create a mock plan document uploaded event
 */
export function mockPlanDocumentUploadedEvent(options?: {
  userId?: string;
  documentType?: string;
  fileSize?: number;
  fileName?: string;
  claimId?: string;
  version?: string;
  metadata?: Partial<EventMetadata>;
}): BaseEvent {
  const documentType = options?.documentType ?? 'Medical Receipt';
  const fileSize = options?.fileSize ?? 1024 * 1024; // 1MB
  const fileName = options?.fileName ?? 'receipt.pdf';
  const claimId = options?.claimId ?? uuidv4();
  
  return createEvent(
    PlanEventType.DOCUMENT_UPLOADED,
    'plan-service',
    {
      document: {
        id: uuidv4(),
        userId: options?.userId ?? mockUsers.standard.userId,
        type: documentType,
        fileName,
        fileSize,
        uploadDate: mockTimestamp(1),
        status: 'active'
      },
      documentId: uuidv4(),
      documentType,
      uploadDate: mockTimestamp(1),
      fileSize,
      fileName,
      claimId
    },
    {
      userId: options?.userId ?? mockUsers.standard.userId,
      journey: JourneyType.PLAN,
      version: options?.version ?? '1.0.0',
      metadata: mockMetadata(options?.metadata)
    }
  );
}

// ===== INVALID EVENTS FOR TESTING =====

/**
 * Create an invalid event missing required fields
 */
export function mockInvalidEvent(missingField: 'eventId' | 'type' | 'timestamp' | 'version' | 'source' | 'payload'): any {
  const validEvent = mockHealthMetricRecordedEvent();
  const invalidEvent = { ...validEvent };
  
  // @ts-ignore - Deliberately removing a required field for testing
  delete invalidEvent[missingField];
  
  return invalidEvent;
}

/**
 * Create an event with an invalid version format
 */
export function mockInvalidVersionEvent(): BaseEvent {
  return {
    ...mockHealthMetricRecordedEvent(),
    version: 'invalid-version'
  };
}

/**
 * Create an event with an unknown event type
 */
export function mockUnknownEventTypeEvent(): BaseEvent {
  return {
    ...mockHealthMetricRecordedEvent(),
    type: 'UNKNOWN_EVENT_TYPE'
  };
}

// ===== CROSS-JOURNEY EVENT CORRELATION =====

/**
 * Create a set of correlated events across different journeys
 */
export function mockCorrelatedEvents(options?: {
  userId?: string;
  correlationId?: string;
  count?: number;
}): BaseEvent[] {
  const userId = options?.userId ?? mockUsers.standard.userId;
  const correlationId = options?.correlationId ?? `corr-${uuidv4()}`;
  const count = options?.count ?? 3;
  const metadata = mockMetadata({ correlationId });
  
  const events: BaseEvent[] = [];
  
  // Add a health event
  events.push(mockHealthMetricRecordedEvent({
    userId,
    metadata
  }));
  
  // Add a care event
  events.push(mockCareAppointmentBookedEvent({
    userId,
    metadata
  }));
  
  // Add a plan event
  events.push(mockPlanClaimSubmittedEvent({
    userId,
    metadata
  }));
  
  // Add additional events if requested
  if (count > 3) {
    for (let i = 3; i < count; i++) {
      const journeyType = i % 3;
      switch (journeyType) {
        case 0:
          events.push(mockHealthGoalAchievedEvent({
            userId,
            metadata
          }));
          break;
        case 1:
          events.push(mockCareMedicationAdherenceStreakEvent({
            userId,
            metadata
          }));
          break;
        case 2:
          events.push(mockPlanBenefitUtilizedEvent({
            userId,
            metadata
          }));
          break;
      }
    }
  }
  
  return events;
}

/**
 * Create a sequence of events that represent a user journey flow
 */
export function mockUserJourneyFlow(options?: {
  userId?: string;
  journeyType?: JourneyType;
  includeInvalidEvent?: boolean;
}): BaseEvent[] {
  const userId = options?.userId ?? mockUsers.standard.userId;
  const journeyType = options?.journeyType ?? JourneyType.HEALTH;
  const correlationId = `journey-${uuidv4()}`;
  const metadata = mockMetadata({ correlationId });
  
  const events: BaseEvent[] = [];
  
  switch (journeyType) {
    case JourneyType.HEALTH:
      // Health journey flow: connect device -> record metrics -> create goal -> achieve goal
      events.push(mockHealthDeviceConnectedEvent({ userId, metadata }));
      events.push(mockHealthDeviceSyncedEvent({ userId, metadata }));
      events.push(mockHealthMetricRecordedEvent({ userId, metadata }));
      events.push(mockHealthGoalCreatedEvent({ userId, metadata }));
      events.push(mockHealthGoalAchievedEvent({ userId, metadata }));
      break;
      
    case JourneyType.CARE:
      // Care journey flow: book appointment -> complete appointment -> add medication -> medication adherence
      events.push(mockCareAppointmentBookedEvent({ userId, metadata }));
      events.push(mockCareAppointmentCompletedEvent({ userId, metadata }));
      events.push(mockCareMedicationAddedEvent({ userId, metadata }));
      events.push(mockCareMedicationAdherenceStreakEvent({ userId, metadata }));
      events.push(mockCareTelemedicineSessionCompletedEvent({ userId, metadata }));
      break;
      
    case JourneyType.PLAN:
      // Plan journey flow: submit claim -> upload document -> approve claim -> utilize benefit
      events.push(mockPlanClaimSubmittedEvent({ userId, metadata }));
      events.push(mockPlanDocumentUploadedEvent({ userId, metadata }));
      events.push(mockPlanClaimApprovedEvent({ userId, metadata }));
      events.push(mockPlanBenefitUtilizedEvent({ userId, metadata }));
      break;
  }
  
  // Add an invalid event if requested (for testing error handling)
  if (options?.includeInvalidEvent) {
    events.push(mockInvalidEvent('type'));
  }
  
  return events;
}

/**
 * Create events for testing backward compatibility
 */
export function mockVersionedEvents(options?: {
  userId?: string;
  eventType?: string;
  versions?: string[];
}): BaseEvent[] {
  const userId = options?.userId ?? mockUsers.standard.userId;
  const eventType = options?.eventType ?? HealthEventType.METRIC_RECORDED;
  const versions = options?.versions ?? ['1.0.0', '1.1.0', '2.0.0'];
  
  const events: BaseEvent[] = [];
  
  for (const version of versions) {
    let event: BaseEvent;
    
    // Create appropriate event based on type
    if (eventType.startsWith('HEALTH_')) {
      event = mockHealthMetricRecordedEvent({ userId, version });
    } else if (eventType.startsWith('CARE_')) {
      event = mockCareAppointmentBookedEvent({ userId, version });
    } else if (eventType.startsWith('PLAN_')) {
      event = mockPlanClaimSubmittedEvent({ userId, version });
    } else {
      event = mockHealthMetricRecordedEvent({ userId, version });
    }
    
    // Override the type and version
    event.type = eventType;
    event.version = version;
    
    events.push(event);
  }
  
  return events;
}