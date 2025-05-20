/**
 * @file event-factory.helper.ts
 * @description Factory utilities for generating test event objects that comply with the standardized event schema.
 * This file provides functions to create valid event objects for all journeys (Health, Care, Plan) with
 * appropriate data structures that pass validation. It supports tests by enabling the creation of
 * consistent and valid test events without duplication across test files.
 *
 * @module events/test/unit/helpers
 */

import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';
import { EventMetadataDto, EventVersionDto, EventOriginDto, createEventMetadata } from '../../../src/dto/event-metadata.dto';
import { VersionedEventDto } from '../../../src/dto/version.dto';
import { HealthMetricType, HealthGoalType, DeviceType, HealthInsightType } from '../../../src/dto/health-event.dto';

/**
 * Interface for event factory options
 */
export interface EventFactoryOptions {
  /** Include metadata in the generated event */
  includeMetadata?: boolean;
  /** Include version information in the generated event */
  includeVersion?: boolean;
  /** Specific version to use (format: 'major.minor.patch') */
  version?: string;
  /** Service name to use in event origin */
  serviceName?: string;
  /** Make the event invalid by omitting required fields */
  makeInvalid?: boolean;
  /** Specific fields to omit when making an invalid event */
  omitFields?: string[];
  /** Custom data to merge with the generated event data */
  customData?: Record<string, any>;
  /** Custom metadata to merge with the generated metadata */
  customMetadata?: Partial<EventMetadataDto>;
}

/**
 * Default options for event factory
 */
const DEFAULT_OPTIONS: EventFactoryOptions = {
  includeMetadata: true,
  includeVersion: true,
  version: '1.0.0',
  serviceName: 'test-service',
  makeInvalid: false,
  omitFields: [],
  customData: {},
  customMetadata: {}
};

/**
 * Creates a valid event metadata object for testing
 * 
 * @param options Options for metadata creation
 * @returns A valid EventMetadataDto instance
 */
export function createTestMetadata(options: Partial<EventFactoryOptions> = {}): EventMetadataDto {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create origin information
  const origin = new EventOriginDto();
  origin.service = opts.serviceName || 'test-service';
  origin.instance = 'test-instance';
  origin.component = 'test-component';
  
  // Create version information if needed
  let version: EventVersionDto | undefined;
  if (opts.includeVersion && opts.version) {
    version = EventVersionDto.fromString(opts.version);
  }
  
  // Create the metadata
  const metadata = new EventMetadataDto({
    correlationId: '550e8400-e29b-41d4-a716-446655440000',
    timestamp: new Date(),
    origin,
    version,
    ...opts.customMetadata
  });
  
  return metadata;
}

/**
 * Base function to create a test event with the specified type and data
 * 
 * @param eventType The type of event to create
 * @param data The event data
 * @param options Options for event creation
 * @returns A test event object
 */
export function createTestEvent<T>(
  eventType: EventType | string,
  data: T,
  options: Partial<EventFactoryOptions> = {}
): any {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const eventData = { ...data, ...opts.customData };
  
  // Remove fields if making an invalid event
  if (opts.makeInvalid && opts.omitFields && opts.omitFields.length > 0) {
    for (const field of opts.omitFields) {
      if (field.includes('.')) {
        // Handle nested fields
        const parts = field.split('.');
        let current = eventData as any;
        
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) break;
          current = current[parts[i]];
        }
        
        const lastPart = parts[parts.length - 1];
        if (current && current[lastPart] !== undefined) {
          delete current[lastPart];
        }
      } else {
        // Handle top-level fields
        if (eventData && (eventData as any)[field] !== undefined) {
          delete (eventData as any)[field];
        }
      }
    }
  }
  
  // Create the event object
  const event: any = {
    type: eventType,
    data: eventData
  };
  
  // Add metadata if needed
  if (opts.includeMetadata) {
    event.metadata = createTestMetadata(opts);
  }
  
  return event;
}

/**
 * Creates a versioned test event with the specified type, data, and version
 * 
 * @param eventType The type of event to create
 * @param data The event data
 * @param options Options for event creation
 * @returns A VersionedEventDto instance
 */
export function createVersionedTestEvent<T>(
  eventType: EventType | string,
  data: T,
  options: Partial<EventFactoryOptions> = {}
): VersionedEventDto<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const eventData = { ...data, ...opts.customData };
  
  // Create version object
  let versionObj: EventVersionDto | undefined;
  if (opts.includeVersion && opts.version) {
    versionObj = EventVersionDto.fromString(opts.version);
  }
  
  return new VersionedEventDto<T>(eventType.toString(), eventData, versionObj);
}

/**
 * Creates test data for health metric recorded events
 * 
 * @param options Options for data creation
 * @returns Health metric data object
 */
export function createHealthMetricData(options: Partial<{
  metricType: HealthMetricType;
  value: number;
  unit: string;
  recordedAt: string;
  deviceId: string;
  notes: string;
}> = {}): any {
  return {
    metricType: options.metricType || HealthMetricType.HEART_RATE,
    value: options.value !== undefined ? options.value : 75,
    unit: options.unit || 'bpm',
    recordedAt: options.recordedAt || new Date().toISOString(),
    deviceId: options.deviceId || '550e8400-e29b-41d4-a716-446655440000',
    notes: options.notes || 'Recorded after light exercise'
  };
}

/**
 * Creates test data for health goal achieved events
 * 
 * @param options Options for data creation
 * @returns Health goal data object
 */
export function createHealthGoalData(options: Partial<{
  goalId: string;
  goalType: HealthGoalType;
  description: string;
  targetValue: number;
  unit: string;
  achievedAt: string;
  progressPercentage: number;
}> = {}): any {
  return {
    goalId: options.goalId || '550e8400-e29b-41d4-a716-446655440000',
    goalType: options.goalType || HealthGoalType.STEPS_TARGET,
    description: options.description || 'Walk 10,000 steps daily',
    targetValue: options.targetValue !== undefined ? options.targetValue : 10000,
    unit: options.unit || 'steps',
    achievedAt: options.achievedAt || new Date().toISOString(),
    progressPercentage: options.progressPercentage !== undefined ? options.progressPercentage : 100
  };
}

/**
 * Creates test data for device connection events
 * 
 * @param options Options for data creation
 * @returns Device connection data object
 */
export function createDeviceConnectionData(options: Partial<{
  deviceId: string;
  deviceType: DeviceType;
  deviceName: string;
  syncedAt: string;
  syncSuccessful: boolean;
  dataPointsCount: number;
  metricTypes: HealthMetricType[];
  errorMessage: string;
}> = {}): any {
  return {
    deviceId: options.deviceId || '550e8400-e29b-41d4-a716-446655440000',
    deviceType: options.deviceType || DeviceType.SMARTWATCH,
    deviceName: options.deviceName || 'Apple Watch Series 7',
    syncedAt: options.syncedAt || new Date().toISOString(),
    syncSuccessful: options.syncSuccessful !== undefined ? options.syncSuccessful : true,
    dataPointsCount: options.dataPointsCount !== undefined ? options.dataPointsCount : 150,
    metricTypes: options.metricTypes || [HealthMetricType.HEART_RATE, HealthMetricType.STEPS],
    errorMessage: options.syncSuccessful === false ? (options.errorMessage || 'Connection timeout') : undefined
  };
}

/**
 * Creates test data for health insight events
 * 
 * @param options Options for data creation
 * @returns Health insight data object
 */
export function createHealthInsightData(options: Partial<{
  insightId: string;
  insightType: HealthInsightType;
  title: string;
  description: string;
  relatedMetricTypes: HealthMetricType[];
  confidenceScore: number;
  generatedAt: string;
  userAcknowledged: boolean;
}> = {}): any {
  return {
    insightId: options.insightId || '550e8400-e29b-41d4-a716-446655440000',
    insightType: options.insightType || HealthInsightType.TREND_ANALYSIS,
    title: options.title || 'Improving Sleep Pattern',
    description: options.description || 'Your sleep duration has improved by 15% over the last week.',
    relatedMetricTypes: options.relatedMetricTypes || [HealthMetricType.SLEEP],
    confidenceScore: options.confidenceScore !== undefined ? options.confidenceScore : 85,
    generatedAt: options.generatedAt || new Date().toISOString(),
    userAcknowledged: options.userAcknowledged !== undefined ? options.userAcknowledged : false
  };
}

/**
 * Creates test data for appointment booking events
 * 
 * @param options Options for data creation
 * @returns Appointment booking data object
 */
export function createAppointmentBookingData(options: Partial<{
  appointmentId: string;
  providerId: string;
  specialtyType: string;
  appointmentType: string;
  scheduledAt: string;
  bookedAt: string;
}> = {}): any {
  return {
    appointmentId: options.appointmentId || '550e8400-e29b-41d4-a716-446655440000',
    providerId: options.providerId || '550e8400-e29b-41d4-a716-446655440001',
    specialtyType: options.specialtyType || 'Cardiologia',
    appointmentType: options.appointmentType || 'in_person',
    scheduledAt: options.scheduledAt || new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    bookedAt: options.bookedAt || new Date().toISOString()
  };
}

/**
 * Creates test data for appointment completion events
 * 
 * @param options Options for data creation
 * @returns Appointment completion data object
 */
export function createAppointmentCompletionData(options: Partial<{
  appointmentId: string;
  providerId: string;
  appointmentType: string;
  scheduledAt: string;
  completedAt: string;
  duration: number;
}> = {}): any {
  return {
    appointmentId: options.appointmentId || '550e8400-e29b-41d4-a716-446655440000',
    providerId: options.providerId || '550e8400-e29b-41d4-a716-446655440001',
    appointmentType: options.appointmentType || 'in_person',
    scheduledAt: options.scheduledAt || new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    completedAt: options.completedAt || new Date().toISOString(),
    duration: options.duration !== undefined ? options.duration : 30 // 30 minutes
  };
}

/**
 * Creates test data for medication taken events
 * 
 * @param options Options for data creation
 * @returns Medication taken data object
 */
export function createMedicationTakenData(options: Partial<{
  medicationId: string;
  medicationName: string;
  dosage: string;
  takenAt: string;
  adherence: string;
}> = {}): any {
  return {
    medicationId: options.medicationId || '550e8400-e29b-41d4-a716-446655440000',
    medicationName: options.medicationName || 'Atorvastatina',
    dosage: options.dosage || '20mg',
    takenAt: options.takenAt || new Date().toISOString(),
    adherence: options.adherence || 'on_time'
  };
}

/**
 * Creates test data for telemedicine session events
 * 
 * @param options Options for data creation
 * @returns Telemedicine session data object
 */
export function createTelemedicineSessionData(options: Partial<{
  sessionId: string;
  appointmentId: string;
  providerId: string;
  startedAt: string;
  endedAt: string;
  duration: number;
  deviceType: string;
  quality: string;
}> = {}): any {
  const isCompleted = options.endedAt !== undefined;
  
  const baseData = {
    sessionId: options.sessionId || '550e8400-e29b-41d4-a716-446655440000',
    appointmentId: options.appointmentId || '550e8400-e29b-41d4-a716-446655440001',
    providerId: options.providerId || '550e8400-e29b-41d4-a716-446655440002',
    startedAt: options.startedAt || new Date(Date.now() - (isCompleted ? 1800000 : 0)).toISOString(), // 30 minutes ago if completed
    deviceType: options.deviceType || 'mobile'
  };
  
  // Add completion data if endedAt is provided
  if (isCompleted) {
    return {
      ...baseData,
      endedAt: options.endedAt || new Date().toISOString(),
      duration: options.duration !== undefined ? options.duration : 30, // 30 minutes
      quality: options.quality || 'good'
    };
  }
  
  return baseData;
}

/**
 * Creates test data for claim submission events
 * 
 * @param options Options for data creation
 * @returns Claim submission data object
 */
export function createClaimSubmissionData(options: Partial<{
  claimId: string;
  claimType: string;
  providerId: string;
  serviceDate: string;
  amount: number;
  submittedAt: string;
}> = {}): any {
  return {
    claimId: options.claimId || '550e8400-e29b-41d4-a716-446655440000',
    claimType: options.claimType || 'Consulta Médica',
    providerId: options.providerId || '550e8400-e29b-41d4-a716-446655440001',
    serviceDate: options.serviceDate || new Date(Date.now() - 86400000).toISOString(), // Yesterday
    amount: options.amount !== undefined ? options.amount : 250.00,
    submittedAt: options.submittedAt || new Date().toISOString()
  };
}

/**
 * Creates test data for claim processing events
 * 
 * @param options Options for data creation
 * @returns Claim processing data object
 */
export function createClaimProcessingData(options: Partial<{
  claimId: string;
  status: string;
  amount: number;
  coveredAmount: number;
  processedAt: string;
}> = {}): any {
  return {
    claimId: options.claimId || '550e8400-e29b-41d4-a716-446655440000',
    status: options.status || 'approved',
    amount: options.amount !== undefined ? options.amount : 250.00,
    coveredAmount: options.coveredAmount !== undefined ? options.coveredAmount : 200.00,
    processedAt: options.processedAt || new Date().toISOString()
  };
}

/**
 * Creates test data for plan selection events
 * 
 * @param options Options for data creation
 * @returns Plan selection data object
 */
export function createPlanSelectionData(options: Partial<{
  planId: string;
  planType: string;
  coverageLevel: string;
  premium: number;
  startDate: string;
  selectedAt: string;
}> = {}): any {
  return {
    planId: options.planId || '550e8400-e29b-41d4-a716-446655440000',
    planType: options.planType || 'Premium',
    coverageLevel: options.coverageLevel || 'family',
    premium: options.premium !== undefined ? options.premium : 850.00,
    startDate: options.startDate || new Date(Date.now() + 15 * 86400000).toISOString(), // 15 days from now
    selectedAt: options.selectedAt || new Date().toISOString()
  };
}

/**
 * Creates test data for benefit utilization events
 * 
 * @param options Options for data creation
 * @returns Benefit utilization data object
 */
export function createBenefitUtilizationData(options: Partial<{
  benefitId: string;
  benefitType: string;
  providerId: string;
  utilizationDate: string;
  savingsAmount: number;
}> = {}): any {
  return {
    benefitId: options.benefitId || '550e8400-e29b-41d4-a716-446655440000',
    benefitType: options.benefitType || 'wellness',
    providerId: options.providerId || '550e8400-e29b-41d4-a716-446655440001',
    utilizationDate: options.utilizationDate || new Date().toISOString(),
    savingsAmount: options.savingsAmount !== undefined ? options.savingsAmount : 150.00
  };
}

/**
 * Creates test data for points earned events
 * 
 * @param options Options for data creation
 * @returns Points earned data object
 */
export function createPointsEarnedData(options: Partial<{
  sourceType: string;
  sourceId: string;
  points: number;
  reason: string;
  earnedAt: string;
}> = {}): any {
  return {
    sourceType: options.sourceType || 'health',
    sourceId: options.sourceId || '550e8400-e29b-41d4-a716-446655440000',
    points: options.points !== undefined ? options.points : 50,
    reason: options.reason || 'Completed daily step goal',
    earnedAt: options.earnedAt || new Date().toISOString()
  };
}

/**
 * Creates test data for achievement unlocked events
 * 
 * @param options Options for data creation
 * @returns Achievement unlocked data object
 */
export function createAchievementUnlockedData(options: Partial<{
  achievementId: string;
  achievementType: string;
  tier: string;
  points: number;
  unlockedAt: string;
}> = {}): any {
  return {
    achievementId: options.achievementId || '550e8400-e29b-41d4-a716-446655440000',
    achievementType: options.achievementType || 'health-check-streak',
    tier: options.tier || 'silver',
    points: options.points !== undefined ? options.points : 100,
    unlockedAt: options.unlockedAt || new Date().toISOString()
  };
}

/**
 * Creates test data for level up events
 * 
 * @param options Options for data creation
 * @returns Level up data object
 */
export function createLevelUpData(options: Partial<{
  previousLevel: number;
  newLevel: number;
  totalPoints: number;
  leveledUpAt: string;
}> = {}): any {
  return {
    previousLevel: options.previousLevel !== undefined ? options.previousLevel : 2,
    newLevel: options.newLevel !== undefined ? options.newLevel : 3,
    totalPoints: options.totalPoints !== undefined ? options.totalPoints : 500,
    leveledUpAt: options.leveledUpAt || new Date().toISOString()
  };
}

/**
 * Creates test data for quest completion events
 * 
 * @param options Options for data creation
 * @returns Quest completion data object
 */
export function createQuestCompletionData(options: Partial<{
  questId: string;
  questType: string;
  difficulty: string;
  points: number;
  completedAt: string;
}> = {}): any {
  return {
    questId: options.questId || '550e8400-e29b-41d4-a716-446655440000',
    questType: options.questType || 'weekly_challenge',
    difficulty: options.difficulty || 'medium',
    points: options.points !== undefined ? options.points : 75,
    completedAt: options.completedAt || new Date().toISOString()
  };
}

/**
 * Creates test data for user profile completion events
 * 
 * @param options Options for data creation
 * @returns Profile completion data object
 */
export function createProfileCompletionData(options: Partial<{
  completionPercentage: number;
  completedSections: string[];
  completedAt: string;
}> = {}): any {
  return {
    completionPercentage: options.completionPercentage !== undefined ? options.completionPercentage : 100,
    completedSections: options.completedSections || ['personal', 'medical', 'insurance', 'preferences'],
    completedAt: options.completedAt || new Date().toISOString()
  };
}

/**
 * Creates test data for user login events
 * 
 * @param options Options for data creation
 * @returns Login data object
 */
export function createLoginData(options: Partial<{
  loginMethod: string;
  deviceType: string;
  loginAt: string;
}> = {}): any {
  return {
    loginMethod: options.loginMethod || 'password',
    deviceType: options.deviceType || 'mobile',
    loginAt: options.loginAt || new Date().toISOString()
  };
}

/**
 * Creates test data for user onboarding completion events
 * 
 * @param options Options for data creation
 * @returns Onboarding completion data object
 */
export function createOnboardingCompletionData(options: Partial<{
  completedSteps: string[];
  selectedJourneys: string[];
  duration: number;
  completedAt: string;
}> = {}): any {
  return {
    completedSteps: options.completedSteps || ['welcome', 'profile', 'journeys', 'notifications'],
    selectedJourneys: options.selectedJourneys || ['health', 'care', 'plan'],
    duration: options.duration !== undefined ? options.duration : 300, // 5 minutes
    completedAt: options.completedAt || new Date().toISOString()
  };
}

/**
 * Creates test data for user feedback submission events
 * 
 * @param options Options for data creation
 * @returns Feedback submission data object
 */
export function createFeedbackSubmissionData(options: Partial<{
  feedbackType: string;
  rating: number;
  comments: string;
  submittedAt: string;
}> = {}): any {
  return {
    feedbackType: options.feedbackType || 'app',
    rating: options.rating !== undefined ? options.rating : 4,
    comments: options.comments || 'Great app, very useful for managing my health!',
    submittedAt: options.submittedAt || new Date().toISOString()
  };
}

/**
 * Creates test data for a specific health event type
 * 
 * @param eventType The type of health event
 * @param options Options for data creation
 * @returns Test data for the specified event type
 */
export function createHealthEventData(eventType: JourneyEvents.Health | string, options: Partial<EventFactoryOptions> = {}): any {
  switch (eventType) {
    case JourneyEvents.Health.METRIC_RECORDED:
      return createHealthMetricData(options.customData);
    case JourneyEvents.Health.GOAL_ACHIEVED:
      return createHealthGoalData(options.customData);
    case JourneyEvents.Health.DEVICE_CONNECTED:
      return createDeviceConnectionData(options.customData);
    case JourneyEvents.Health.INSIGHT_GENERATED:
      return createHealthInsightData(options.customData);
    default:
      return {};
  }
}

/**
 * Creates test data for a specific care event type
 * 
 * @param eventType The type of care event
 * @param options Options for data creation
 * @returns Test data for the specified event type
 */
export function createCareEventData(eventType: JourneyEvents.Care | string, options: Partial<EventFactoryOptions> = {}): any {
  switch (eventType) {
    case JourneyEvents.Care.APPOINTMENT_BOOKED:
      return createAppointmentBookingData(options.customData);
    case JourneyEvents.Care.APPOINTMENT_COMPLETED:
      return createAppointmentCompletionData(options.customData);
    case JourneyEvents.Care.MEDICATION_TAKEN:
      return createMedicationTakenData(options.customData);
    case JourneyEvents.Care.TELEMEDICINE_STARTED:
      return createTelemedicineSessionData({ ...options.customData, endedAt: undefined });
    case JourneyEvents.Care.TELEMEDICINE_COMPLETED:
      return createTelemedicineSessionData({ ...options.customData, endedAt: new Date().toISOString() });
    default:
      return {};
  }
}

/**
 * Creates test data for a specific plan event type
 * 
 * @param eventType The type of plan event
 * @param options Options for data creation
 * @returns Test data for the specified event type
 */
export function createPlanEventData(eventType: JourneyEvents.Plan | string, options: Partial<EventFactoryOptions> = {}): any {
  switch (eventType) {
    case JourneyEvents.Plan.CLAIM_SUBMITTED:
      return createClaimSubmissionData(options.customData);
    case JourneyEvents.Plan.CLAIM_PROCESSED:
      return createClaimProcessingData(options.customData);
    case JourneyEvents.Plan.PLAN_SELECTED:
      return createPlanSelectionData(options.customData);
    case JourneyEvents.Plan.BENEFIT_UTILIZED:
      return createBenefitUtilizationData(options.customData);
    default:
      return {};
  }
}

/**
 * Creates test data for a specific gamification event type
 * 
 * @param eventType The type of gamification event
 * @param options Options for data creation
 * @returns Test data for the specified event type
 */
export function createGamificationEventData(eventType: JourneyEvents.Gamification | string, options: Partial<EventFactoryOptions> = {}): any {
  switch (eventType) {
    case JourneyEvents.Gamification.POINTS_EARNED:
      return createPointsEarnedData(options.customData);
    case JourneyEvents.Gamification.ACHIEVEMENT_UNLOCKED:
      return createAchievementUnlockedData(options.customData);
    case JourneyEvents.Gamification.LEVEL_UP:
      return createLevelUpData(options.customData);
    case JourneyEvents.Gamification.QUEST_COMPLETED:
      return createQuestCompletionData(options.customData);
    default:
      return {};
  }
}

/**
 * Creates test data for a specific user event type
 * 
 * @param eventType The type of user event
 * @param options Options for data creation
 * @returns Test data for the specified event type
 */
export function createUserEventData(eventType: JourneyEvents.User | string, options: Partial<EventFactoryOptions> = {}): any {
  switch (eventType) {
    case JourneyEvents.User.PROFILE_COMPLETED:
      return createProfileCompletionData(options.customData);
    case JourneyEvents.User.LOGIN:
      return createLoginData(options.customData);
    case JourneyEvents.User.ONBOARDING_COMPLETED:
      return createOnboardingCompletionData(options.customData);
    case JourneyEvents.User.FEEDBACK_SUBMITTED:
      return createFeedbackSubmissionData(options.customData);
    default:
      return {};
  }
}

/**
 * Creates test data for any event type based on journey and event type
 * 
 * @param eventType The type of event
 * @param options Options for data creation
 * @returns Test data for the specified event type
 */
export function createEventData(eventType: EventType | string, options: Partial<EventFactoryOptions> = {}): any {
  const eventTypeStr = eventType.toString();
  
  if (eventTypeStr.startsWith('HEALTH_')) {
    return createHealthEventData(eventTypeStr, options);
  } else if (eventTypeStr.startsWith('CARE_')) {
    return createCareEventData(eventTypeStr, options);
  } else if (eventTypeStr.startsWith('PLAN_')) {
    return createPlanEventData(eventTypeStr, options);
  } else if (eventTypeStr.startsWith('GAMIFICATION_')) {
    return createGamificationEventData(eventTypeStr, options);
  } else if (eventTypeStr.startsWith('USER_')) {
    return createUserEventData(eventTypeStr, options);
  }
  
  return {};
}

/**
 * Creates a complete event object for any event type
 * 
 * @param eventType The type of event
 * @param options Options for event creation
 * @returns A complete event object
 */
export function createEvent(eventType: EventType | string, options: Partial<EventFactoryOptions> = {}): any {
  const data = createEventData(eventType, options);
  return createTestEvent(eventType, data, options);
}

/**
 * Creates a versioned event object for any event type
 * 
 * @param eventType The type of event
 * @param options Options for event creation
 * @returns A versioned event object
 */
export function createVersionedEvent(eventType: EventType | string, options: Partial<EventFactoryOptions> = {}): VersionedEventDto<any> {
  const data = createEventData(eventType, options);
  return createVersionedTestEvent(eventType, data, options);
}

/**
 * Creates an invalid event by omitting required fields
 * 
 * @param eventType The type of event
 * @param fieldsToOmit Fields to omit to make the event invalid
 * @param options Additional options for event creation
 * @returns An invalid event object
 */
export function createInvalidEvent(eventType: EventType | string, fieldsToOmit: string[], options: Partial<EventFactoryOptions> = {}): any {
  return createEvent(eventType, {
    ...options,
    makeInvalid: true,
    omitFields: fieldsToOmit
  });
}

/**
 * Creates a batch of events for testing
 * 
 * @param eventTypes Array of event types to create
 * @param options Options for event creation
 * @returns Array of event objects
 */
export function createEventBatch(eventTypes: Array<EventType | string>, options: Partial<EventFactoryOptions> = {}): any[] {
  return eventTypes.map(eventType => createEvent(eventType, options));
}

/**
 * Creates a set of events for a specific journey
 * 
 * @param journey The journey to create events for
 * @param options Options for event creation
 * @returns Array of event objects for the specified journey
 */
export function createJourneyEvents(journey: 'health' | 'care' | 'plan' | 'user' | 'gamification', options: Partial<EventFactoryOptions> = {}): any[] {
  let eventTypes: string[] = [];
  
  switch (journey) {
    case 'health':
      eventTypes = Object.values(JourneyEvents.Health);
      break;
    case 'care':
      eventTypes = Object.values(JourneyEvents.Care);
      break;
    case 'plan':
      eventTypes = Object.values(JourneyEvents.Plan);
      break;
    case 'user':
      eventTypes = Object.values(JourneyEvents.User);
      break;
    case 'gamification':
      eventTypes = Object.values(JourneyEvents.Gamification);
      break;
  }
  
  return createEventBatch(eventTypes, options);
}

/**
 * Creates a set of events with different versions for testing schema evolution
 * 
 * @param eventType The type of event
 * @param versions Array of versions to create
 * @param options Options for event creation
 * @returns Array of versioned event objects
 */
export function createVersionedEventSet(eventType: EventType | string, versions: string[], options: Partial<EventFactoryOptions> = {}): VersionedEventDto<any>[] {
  return versions.map(version => {
    return createVersionedEvent(eventType, {
      ...options,
      version
    });
  });
}

/**
 * Creates a set of related events with the same correlation ID
 * 
 * @param eventTypes Array of event types to create
 * @param correlationId Correlation ID to use for all events
 * @param options Options for event creation
 * @returns Array of related event objects
 */
export function createCorrelatedEvents(eventTypes: Array<EventType | string>, correlationId: string, options: Partial<EventFactoryOptions> = {}): any[] {
  return eventTypes.map(eventType => {
    return createEvent(eventType, {
      ...options,
      customMetadata: {
        ...options.customMetadata,
        correlationId
      }
    });
  });
}

/**
 * Creates a chain of events where each event is a child of the previous one
 * 
 * @param eventTypes Array of event types to create in sequence
 * @param options Options for event creation
 * @returns Array of chained event objects
 */
export function createEventChain(eventTypes: Array<EventType | string>, options: Partial<EventFactoryOptions> = {}): any[] {
  const correlationId = '550e8400-e29b-41d4-a716-446655440000';
  const events: any[] = [];
  
  for (let i = 0; i < eventTypes.length; i++) {
    const eventType = eventTypes[i];
    const parentEventId = i > 0 ? events[i - 1].metadata.eventId : undefined;
    
    events.push(createEvent(eventType, {
      ...options,
      customMetadata: {
        ...options.customMetadata,
        correlationId,
        parentEventId,
        eventId: `550e8400-e29b-41d4-a716-44665544000${i}`
      }
    }));
  }
  
  return events;
}