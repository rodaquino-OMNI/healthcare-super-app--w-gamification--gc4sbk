/**
 * @file Test Events Producer
 * 
 * Utility for generating test events for all supported event types across journey services.
 * This file provides factory methods for creating standardized, valid test events with
 * customizable payloads for each journey (Health, Care, Plan).
 */

import { v4 as uuidv4 } from 'uuid';
import {
  EventType,
  EventJourney,
  GamificationEvent,
  EventVersion,
  EventPayload,
  ProcessGamificationEventDto,
  // Health Journey Event Payloads
  HealthMetricRecordedPayload,
  HealthGoalPayload,
  HealthGoalAchievedPayload,
  HealthGoalStreakPayload,
  DeviceEventPayload,
  // Care Journey Event Payloads
  AppointmentEventPayload,
  MedicationEventPayload,
  TelemedicineEventPayload,
  TreatmentPlanEventPayload,
  // Plan Journey Event Payloads
  ClaimEventPayload,
  BenefitUtilizedPayload,
  PlanEventPayload,
  // Cross-Journey Event Payloads
  AchievementUnlockedPayload,
  QuestCompletedPayload,
  XpEarnedPayload,
  LevelUpPayload
} from '@austa/interfaces/gamification';

// Import journey-specific interfaces for type checking
import {
  MetricType,
  GoalType,
  GoalPeriod,
  DeviceType
} from '@austa/interfaces/journey/health';

import {
  AppointmentType
} from '@austa/interfaces/journey/care';

import {
  ClaimStatus
} from '@austa/interfaces/journey/plan';

/**
 * Default event version for test events
 */
const DEFAULT_EVENT_VERSION: EventVersion = {
  major: 1,
  minor: 0,
  patch: 0
};

/**
 * Options for customizing generated test events
 */
export interface TestEventOptions {
  /** Custom user ID (defaults to a random UUID) */
  userId?: string;
  /** Custom event ID (defaults to a random UUID) */
  eventId?: string;
  /** Custom timestamp (defaults to current time) */
  timestamp?: string;
  /** Custom event version (defaults to 1.0.0) */
  version?: EventVersion;
  /** Custom source system (defaults to 'test') */
  source?: string;
  /** Custom correlation ID (defaults to a random UUID) */
  correlationId?: string;
  /** Custom payload data to merge with defaults */
  payload?: Partial<EventPayload>;
}

/**
 * Utility class for generating test events for all supported event types
 * across journey services. Provides factory methods for creating standardized,
 * valid test events with customizable payloads.
 */
export class TestEventsProducer {
  /**
   * Creates a base gamification event with default values
   * 
   * @param type - The event type
   * @param journey - The journey associated with the event
   * @param options - Optional customization options
   * @returns A base gamification event
   */
  private static createBaseEvent(
    type: EventType,
    journey: EventJourney,
    options: TestEventOptions = {}
  ): Omit<GamificationEvent, 'payload'> {
    const now = new Date();
    
    return {
      eventId: options.eventId || uuidv4(),
      type,
      userId: options.userId || uuidv4(),
      journey,
      version: options.version || DEFAULT_EVENT_VERSION,
      createdAt: options.timestamp || now.toISOString(),
      source: options.source || 'test',
      correlationId: options.correlationId || uuidv4()
    };
  }

  /**
   * Creates a complete gamification event with the specified payload
   * 
   * @param type - The event type
   * @param journey - The journey associated with the event
   * @param payload - The event payload
   * @param options - Optional customization options
   * @returns A complete gamification event
   */
  public static createEvent<T extends EventPayload>(
    type: EventType,
    journey: EventJourney,
    payload: T,
    options: TestEventOptions = {}
  ): GamificationEvent {
    const baseEvent = this.createBaseEvent(type, journey, options);
    const mergedPayload = { ...payload, ...options.payload };
    
    // Add timestamp to payload if not present
    if (!('timestamp' in mergedPayload)) {
      (mergedPayload as any).timestamp = baseEvent.createdAt;
    }
    
    return {
      ...baseEvent,
      payload: mergedPayload as EventPayload
    };
  }

  /**
   * Creates a ProcessGamificationEventDto from a GamificationEvent
   * for testing event processing
   * 
   * @param event - The gamification event
   * @returns A ProcessGamificationEventDto
   */
  public static createProcessEventDto(event: GamificationEvent): ProcessGamificationEventDto {
    return {
      type: event.type,
      userId: event.userId,
      data: event.payload,
      journey: event.journey,
      version: event.version,
      source: event.source,
      correlationId: event.correlationId
    };
  }

  /**
   * Creates a batch of random events for testing
   * 
   * @param count - Number of events to generate
   * @param options - Optional customization options
   * @returns An array of gamification events
   */
  public static createRandomEvents(count: number, options: TestEventOptions = {}): GamificationEvent[] {
    const events: GamificationEvent[] = [];
    const eventTypes = Object.values(EventType);
    const journeys = Object.values(EventJourney);
    
    for (let i = 0; i < count; i++) {
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)] as EventType;
      const journey = this.getJourneyForEventType(type);
      const payload = this.createPayloadForEventType(type, options);
      
      events.push(this.createEvent(type, journey, payload, options));
    }
    
    return events;
  }

  /**
   * Determines the appropriate journey for an event type
   * 
   * @param type - The event type
   * @returns The appropriate journey for the event type
   */
  private static getJourneyForEventType(type: EventType): EventJourney {
    if (type.startsWith('HEALTH_') || type === 'DEVICE_CONNECTED' || type === 'DEVICE_SYNCED' || type === 'MEDICAL_EVENT_RECORDED') {
      return EventJourney.HEALTH;
    } else if (type.startsWith('APPOINTMENT_') || type.startsWith('MEDICATION_') || 
               type.startsWith('TELEMEDICINE_') || type.startsWith('TREATMENT_') || 
               type === 'SYMPTOM_CHECKER_USED' || type === 'PROVIDER_RATED') {
      return EventJourney.CARE;
    } else if (type.startsWith('CLAIM_') || type.startsWith('BENEFIT_') || 
               type.startsWith('PLAN_') || type === 'COVERAGE_REVIEWED' || 
               type === 'REWARD_REDEEMED') {
      return EventJourney.PLAN;
    } else {
      return EventJourney.CROSS_JOURNEY;
    }
  }

  /**
   * Creates an appropriate payload for the given event type
   * 
   * @param type - The event type
   * @param options - Optional customization options
   * @returns An appropriate payload for the event type
   */
  private static createPayloadForEventType(type: EventType, options: TestEventOptions = {}): EventPayload {
    const timestamp = options.timestamp || new Date().toISOString();
    
    switch (type) {
      // Health Journey Events
      case EventType.HEALTH_METRIC_RECORDED:
        return this.createHealthMetricRecordedPayload(options);
      case EventType.HEALTH_GOAL_CREATED:
      case EventType.HEALTH_GOAL_UPDATED:
        return this.createHealthGoalPayload(options);
      case EventType.HEALTH_GOAL_ACHIEVED:
        return this.createHealthGoalAchievedPayload(options);
      case EventType.HEALTH_GOAL_STREAK_MAINTAINED:
        return this.createHealthGoalStreakPayload(options);
      case EventType.DEVICE_CONNECTED:
      case EventType.DEVICE_SYNCED:
        return this.createDeviceEventPayload(type, options);
      
      // Care Journey Events
      case EventType.APPOINTMENT_BOOKED:
      case EventType.APPOINTMENT_ATTENDED:
      case EventType.APPOINTMENT_CANCELLED:
        return this.createAppointmentEventPayload(type, options);
      case EventType.MEDICATION_ADDED:
      case EventType.MEDICATION_TAKEN:
      case EventType.MEDICATION_ADHERENCE_STREAK:
        return this.createMedicationEventPayload(type, options);
      case EventType.TELEMEDICINE_SESSION_STARTED:
      case EventType.TELEMEDICINE_SESSION_COMPLETED:
        return this.createTelemedicineEventPayload(type, options);
      case EventType.TREATMENT_PLAN_CREATED:
      case EventType.TREATMENT_PLAN_PROGRESS:
      case EventType.TREATMENT_PLAN_COMPLETED:
        return this.createTreatmentPlanEventPayload(type, options);
      
      // Plan Journey Events
      case EventType.CLAIM_SUBMITTED:
      case EventType.CLAIM_APPROVED:
      case EventType.CLAIM_DOCUMENT_UPLOADED:
        return this.createClaimEventPayload(type, options);
      case EventType.BENEFIT_UTILIZED:
        return this.createBenefitUtilizedPayload(options);
      case EventType.PLAN_SELECTED:
      case EventType.PLAN_COMPARED:
      case EventType.PLAN_RENEWED:
        return this.createPlanEventPayload(type, options);
      
      // Cross-Journey Events
      case EventType.ACHIEVEMENT_UNLOCKED:
        return this.createAchievementUnlockedPayload(options);
      case EventType.QUEST_COMPLETED:
        return this.createQuestCompletedPayload(options);
      case EventType.XP_EARNED:
        return this.createXpEarnedPayload(options);
      case EventType.LEVEL_UP:
        return this.createLevelUpPayload(options);
      
      // Default case for other event types
      default:
        return {
          timestamp,
          metadata: {
            eventType: type,
            testEvent: true
          }
        };
    }
  }

  // Health Journey Event Payload Generators

  /**
   * Creates a payload for HEALTH_METRIC_RECORDED events
   * 
   * @param options - Optional customization options
   * @returns A HealthMetricRecordedPayload
   */
  public static createHealthMetricRecordedPayload(options: TestEventOptions = {}): HealthMetricRecordedPayload {
    const metricTypes = ['HEART_RATE', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'STEPS', 'WEIGHT', 'SLEEP'];
    const metricType = options.payload?.metricType as string || metricTypes[Math.floor(Math.random() * metricTypes.length)];
    
    let value: number;
    let unit: string;
    let isWithinHealthyRange: boolean;
    
    // Set appropriate values based on metric type
    switch (metricType) {
      case 'HEART_RATE':
        value = options.payload?.value as number || Math.floor(Math.random() * 50) + 60; // 60-110 bpm
        unit = 'bpm';
        isWithinHealthyRange = value >= 60 && value <= 100;
        break;
      case 'BLOOD_PRESSURE':
        value = options.payload?.value as number || Math.floor(Math.random() * 40) + 110; // Systolic 110-150
        unit = 'mmHg';
        isWithinHealthyRange = value >= 90 && value <= 120;
        break;
      case 'BLOOD_GLUCOSE':
        value = options.payload?.value as number || Math.floor(Math.random() * 50) + 70; // 70-120 mg/dL
        unit = 'mg/dL';
        isWithinHealthyRange = value >= 70 && value <= 100;
        break;
      case 'STEPS':
        value = options.payload?.value as number || Math.floor(Math.random() * 10000) + 2000; // 2000-12000 steps
        unit = 'steps';
        isWithinHealthyRange = value >= 5000;
        break;
      case 'WEIGHT':
        value = options.payload?.value as number || Math.floor(Math.random() * 50) + 50; // 50-100 kg
        unit = 'kg';
        isWithinHealthyRange = true; // No specific range for weight
        break;
      case 'SLEEP':
        value = options.payload?.value as number || Math.floor(Math.random() * 4) + 5; // 5-9 hours
        unit = 'hours';
        isWithinHealthyRange = value >= 7 && value <= 9;
        break;
      default:
        value = options.payload?.value as number || Math.floor(Math.random() * 100);
        unit = options.payload?.unit as string || 'units';
        isWithinHealthyRange = true;
    }
    
    return {
      timestamp: options.timestamp || new Date().toISOString(),
      metricType,
      value,
      unit,
      source: options.payload?.source as string || 'manual',
      isWithinHealthyRange,
      metadata: options.payload?.metadata as Record<string, any> || {}
    };
  }

  /**
   * Creates a payload for HEALTH_GOAL_CREATED and HEALTH_GOAL_UPDATED events
   * 
   * @param options - Optional customization options
   * @returns A HealthGoalPayload
   */
  public static createHealthGoalPayload(options: TestEventOptions = {}): HealthGoalPayload {
    const goalTypes = ['STEPS', 'WEIGHT', 'SLEEP', 'HEART_RATE', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE'];
    const periods = ['DAILY', 'WEEKLY', 'MONTHLY'];
    
    const goalType = options.payload?.goalType as string || goalTypes[Math.floor(Math.random() * goalTypes.length)];
    let targetValue: number;
    let unit: string;
    
    // Set appropriate values based on goal type
    switch (goalType) {
      case 'STEPS':
        targetValue = options.payload?.targetValue as number || 10000;
        unit = 'steps';
        break;
      case 'WEIGHT':
        targetValue = options.payload?.targetValue as number || 70;
        unit = 'kg';
        break;
      case 'SLEEP':
        targetValue = options.payload?.targetValue as number || 8;
        unit = 'hours';
        break;
      case 'HEART_RATE':
        targetValue = options.payload?.targetValue as number || 70;
        unit = 'bpm';
        break;
      case 'BLOOD_PRESSURE':
        targetValue = options.payload?.targetValue as number || 120;
        unit = 'mmHg';
        break;
      case 'BLOOD_GLUCOSE':
        targetValue = options.payload?.targetValue as number || 90;
        unit = 'mg/dL';
        break;
      default:
        targetValue = options.payload?.targetValue as number || 100;
        unit = options.payload?.unit as string || 'units';
    }
    
    return {
      timestamp: options.timestamp || new Date().toISOString(),
      goalId: options.payload?.goalId as string || uuidv4(),
      goalType,
      targetValue,
      unit,
      period: options.payload?.period as string || periods[Math.floor(Math.random() * periods.length)],
      metadata: options.payload?.metadata as Record<string, any> || {}
    };
  }

  /**
   * Creates a payload for HEALTH_GOAL_ACHIEVED events
   * 
   * @param options - Optional customization options
   * @returns A HealthGoalAchievedPayload
   */
  public static createHealthGoalAchievedPayload(options: TestEventOptions = {}): HealthGoalAchievedPayload {
    const baseGoal = this.createHealthGoalPayload(options);
    
    return {
      ...baseGoal,
      completionPercentage: options.payload?.completionPercentage as number || 100,
      isFirstTimeAchievement: options.payload?.isFirstTimeAchievement as boolean || Math.random() > 0.7 // 30% chance of first time
    };
  }

  /**
   * Creates a payload for HEALTH_GOAL_STREAK_MAINTAINED events
   * 
   * @param options - Optional customization options
   * @returns A HealthGoalStreakPayload
   */
  public static createHealthGoalStreakPayload(options: TestEventOptions = {}): HealthGoalStreakPayload {
    const goalTypes = ['STEPS', 'SLEEP', 'HEART_RATE', 'BLOOD_PRESSURE', 'BLOOD_GLUCOSE'];
    
    return {
      timestamp: options.timestamp || new Date().toISOString(),
      goalId: options.payload?.goalId as string || uuidv4(),
      streakCount: options.payload?.streakCount as number || Math.floor(Math.random() * 30) + 1, // 1-30 day streak
      goalType: options.payload?.goalType as string || goalTypes[Math.floor(Math.random() * goalTypes.length)],
      metadata: options.payload?.metadata as Record<string, any> || {}
    };
  }

  /**
   * Creates a payload for DEVICE_CONNECTED and DEVICE_SYNCED events
   * 
   * @param type - The event type
   * @param options - Optional customization options
   * @returns A DeviceEventPayload
   */
  public static createDeviceEventPayload(type: EventType, options: TestEventOptions = {}): DeviceEventPayload {
    const deviceTypes = ['Smartwatch', 'Blood Pressure Monitor', 'Glucose Monitor', 'Smart Scale'];
    const manufacturers = ['Apple', 'Samsung', 'Fitbit', 'Garmin', 'Omron', 'Withings'];
    
    const payload: DeviceEventPayload = {
      timestamp: options.timestamp || new Date().toISOString(),
      deviceId: options.payload?.deviceId as string || uuidv4(),
      deviceType: options.payload?.deviceType as string || deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
      manufacturer: options.payload?.manufacturer as string || manufacturers[Math.floor(Math.random() * manufacturers.length)],
      metadata: options.payload?.metadata as Record<string, any> || {}
    };
    
    // Add metricCount for DEVICE_SYNCED events
    if (type === EventType.DEVICE_SYNCED) {
      payload.metricCount = options.payload?.metricCount as number || Math.floor(Math.random() * 20) + 1; // 1-20 metrics
    }
    
    return payload;
  }

  // Care Journey Event Payload Generators

  /**
   * Creates a payload for APPOINTMENT_BOOKED, APPOINTMENT_ATTENDED, and APPOINTMENT_CANCELLED events
   * 
   * @param type - The event type
   * @param options - Optional customization options
   * @returns An AppointmentEventPayload
   */
  public static createAppointmentEventPayload(type: EventType, options: TestEventOptions = {}): AppointmentEventPayload {
    const appointmentTypes = ['CONSULTATION', 'FOLLOW_UP', 'EXAMINATION', 'PROCEDURE', 'THERAPY'];
    
    const payload: AppointmentEventPayload = {
      timestamp: options.timestamp || new Date().toISOString(),
      appointmentId: options.payload?.appointmentId as string || uuidv4(),
      appointmentType: options.payload?.appointmentType as string || appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)],
      providerId: options.payload?.providerId as string || uuidv4(),
      metadata: options.payload?.metadata as Record<string, any> || {}
    };
    
    // Add isFirstAppointment for APPOINTMENT_BOOKED and APPOINTMENT_ATTENDED events
    if (type === EventType.APPOINTMENT_BOOKED || type === EventType.APPOINTMENT_ATTENDED) {
      payload.isFirstAppointment = options.payload?.isFirstAppointment as boolean || Math.random() > 0.7; // 30% chance of first appointment
    }
    
    // Add cancellationReason for APPOINTMENT_CANCELLED events
    if (type === EventType.APPOINTMENT_CANCELLED) {
      const cancellationReasons = ['RESCHEDULED', 'PATIENT_REQUEST', 'PROVIDER_UNAVAILABLE', 'EMERGENCY', 'OTHER'];
      payload.cancellationReason = options.payload?.cancellationReason as string || 
                                  cancellationReasons[Math.floor(Math.random() * cancellationReasons.length)];
    }
    
    return payload;
  }

  /**
   * Creates a payload for MEDICATION_ADDED, MEDICATION_TAKEN, and MEDICATION_ADHERENCE_STREAK events
   * 
   * @param type - The event type
   * @param options - Optional customization options
   * @returns A MedicationEventPayload
   */
  public static createMedicationEventPayload(type: EventType, options: TestEventOptions = {}): MedicationEventPayload {
    const medicationNames = ['Atorvastatin', 'Lisinopril', 'Levothyroxine', 'Metformin', 'Amlodipine', 'Metoprolol', 'Omeprazole'];
    
    const payload: MedicationEventPayload = {
      timestamp: options.timestamp || new Date().toISOString(),
      medicationId: options.payload?.medicationId as string || uuidv4(),
      medicationName: options.payload?.medicationName as string || medicationNames[Math.floor(Math.random() * medicationNames.length)],
      metadata: options.payload?.metadata as Record<string, any> || {}
    };
    
    // Add streakCount for MEDICATION_ADHERENCE_STREAK events
    if (type === EventType.MEDICATION_ADHERENCE_STREAK) {
      payload.streakCount = options.payload?.streakCount as number || Math.floor(Math.random() * 30) + 1; // 1-30 day streak
    }
    
    // Add takenOnTime for MEDICATION_TAKEN events
    if (type === EventType.MEDICATION_TAKEN) {
      payload.takenOnTime = options.payload?.takenOnTime as boolean || Math.random() > 0.2; // 80% chance of taking on time
    }
    
    return payload;
  }

  /**
   * Creates a payload for TELEMEDICINE_SESSION_STARTED and TELEMEDICINE_SESSION_COMPLETED events
   * 
   * @param type - The event type
   * @param options - Optional customization options
   * @returns A TelemedicineEventPayload
   */
  public static createTelemedicineEventPayload(type: EventType, options: TestEventOptions = {}): TelemedicineEventPayload {
    const payload: TelemedicineEventPayload = {
      timestamp: options.timestamp || new Date().toISOString(),
      sessionId: options.payload?.sessionId as string || uuidv4(),
      providerId: options.payload?.providerId as string || uuidv4(),
      metadata: options.payload?.metadata as Record<string, any> || {}
    };
    
    // Add isFirstSession for both event types
    payload.isFirstSession = options.payload?.isFirstSession as boolean || Math.random() > 0.7; // 30% chance of first session
    
    // Add durationMinutes for TELEMEDICINE_SESSION_COMPLETED events
    if (type === EventType.TELEMEDICINE_SESSION_COMPLETED) {
      payload.durationMinutes = options.payload?.durationMinutes as number || Math.floor(Math.random() * 30) + 10; // 10-40 minutes
    }
    
    return payload;
  }

  /**
   * Creates a payload for TREATMENT_PLAN_CREATED, TREATMENT_PLAN_PROGRESS, and TREATMENT_PLAN_COMPLETED events
   * 
   * @param type - The event type
   * @param options - Optional customization options
   * @returns A TreatmentPlanEventPayload
   */
  public static createTreatmentPlanEventPayload(type: EventType, options: TestEventOptions = {}): TreatmentPlanEventPayload {
    const planTypes = ['MEDICATION', 'PHYSICAL_THERAPY', 'DIET', 'EXERCISE', 'MENTAL_HEALTH'];
    
    const payload: TreatmentPlanEventPayload = {
      timestamp: options.timestamp || new Date().toISOString(),
      planId: options.payload?.planId as string || uuidv4(),
      planType: options.payload?.planType as string || planTypes[Math.floor(Math.random() * planTypes.length)],
      metadata: options.payload?.metadata as Record<string, any> || {}
    };
    
    // Add progressPercentage for TREATMENT_PLAN_PROGRESS events
    if (type === EventType.TREATMENT_PLAN_PROGRESS) {
      payload.progressPercentage = options.payload?.progressPercentage as number || Math.floor(Math.random() * 100) + 1; // 1-100%
    }
    
    // Add completedOnSchedule for TREATMENT_PLAN_COMPLETED events
    if (type === EventType.TREATMENT_PLAN_COMPLETED) {
      payload.completedOnSchedule = options.payload?.completedOnSchedule as boolean || Math.random() > 0.3; // 70% chance of completing on schedule
    }
    
    return payload;
  }

  // Plan Journey Event Payload Generators

  /**
   * Creates a payload for CLAIM_SUBMITTED, CLAIM_APPROVED, and CLAIM_DOCUMENT_UPLOADED events
   * 
   * @param type - The event type
   * @param options - Optional customization options
   * @returns A ClaimEventPayload
   */
  public static createClaimEventPayload(type: EventType, options: TestEventOptions = {}): ClaimEventPayload {
    const claimTypes = ['CONSULTATION', 'EXAMINATION', 'PROCEDURE', 'MEDICATION', 'THERAPY', 'HOSPITALIZATION'];
    
    const payload: ClaimEventPayload = {
      timestamp: options.timestamp || new Date().toISOString(),
      claimId: options.payload?.claimId as string || uuidv4(),
      claimType: options.payload?.claimType as string || claimTypes[Math.floor(Math.random() * claimTypes.length)],
      metadata: options.payload?.metadata as Record<string, any> || {}
    };
    
    // Add amount for CLAIM_SUBMITTED and CLAIM_APPROVED events
    if (type === EventType.CLAIM_SUBMITTED || type === EventType.CLAIM_APPROVED) {
      payload.amount = options.payload?.amount as number || Math.floor(Math.random() * 1000) + 100; // R$100-1100
    }
    
    // Add documentCount for CLAIM_DOCUMENT_UPLOADED events
    if (type === EventType.CLAIM_DOCUMENT_UPLOADED) {
      payload.documentCount = options.payload?.documentCount as number || Math.floor(Math.random() * 5) + 1; // 1-5 documents
    }
    
    return payload;
  }

  /**
   * Creates a payload for BENEFIT_UTILIZED events
   * 
   * @param options - Optional customization options
   * @returns A BenefitUtilizedPayload
   */
  public static createBenefitUtilizedPayload(options: TestEventOptions = {}): BenefitUtilizedPayload {
    const benefitTypes = ['CONSULTATION', 'EXAMINATION', 'PROCEDURE', 'MEDICATION', 'THERAPY', 'WELLNESS', 'PREVENTION'];
    
    return {
      timestamp: options.timestamp || new Date().toISOString(),
      benefitId: options.payload?.benefitId as string || uuidv4(),
      benefitType: options.payload?.benefitType as string || benefitTypes[Math.floor(Math.random() * benefitTypes.length)],
      value: options.payload?.value as number || Math.floor(Math.random() * 500) + 50, // R$50-550
      metadata: options.payload?.metadata as Record<string, any> || {}
    };
  }

  /**
   * Creates a payload for PLAN_SELECTED, PLAN_COMPARED, and PLAN_RENEWED events
   * 
   * @param type - The event type
   * @param options - Optional customization options
   * @returns A PlanEventPayload
   */
  public static createPlanEventPayload(type: EventType, options: TestEventOptions = {}): PlanEventPayload {
    const planTypes = ['BASIC', 'STANDARD', 'PREMIUM', 'FAMILY', 'SENIOR'];
    
    const payload: PlanEventPayload = {
      timestamp: options.timestamp || new Date().toISOString(),
      planId: options.payload?.planId as string || uuidv4(),
      planType: options.payload?.planType as string || planTypes[Math.floor(Math.random() * planTypes.length)],
      metadata: options.payload?.metadata as Record<string, any> || {}
    };
    
    // Add isUpgrade for PLAN_SELECTED and PLAN_RENEWED events
    if (type === EventType.PLAN_SELECTED || type === EventType.PLAN_RENEWED) {
      payload.isUpgrade = options.payload?.isUpgrade as boolean || Math.random() > 0.5; // 50% chance of upgrade
    }
    
    // Add comparedPlanIds for PLAN_COMPARED events
    if (type === EventType.PLAN_COMPARED) {
      payload.comparedPlanIds = options.payload?.comparedPlanIds as string[] || [
        uuidv4(),
        uuidv4(),
        uuidv4().slice(0, 8) // Shorter ID for variety
      ];
    }
    
    return payload;
  }

  // Cross-Journey Event Payload Generators

  /**
   * Creates a payload for ACHIEVEMENT_UNLOCKED events
   * 
   * @param options - Optional customization options
   * @returns An AchievementUnlockedPayload
   */
  public static createAchievementUnlockedPayload(options: TestEventOptions = {}): AchievementUnlockedPayload {
    const achievements = [
      { title: 'Monitor de Saúde', description: 'Registre suas métricas de saúde por 7 dias consecutivos', journey: EventJourney.HEALTH },
      { title: 'Caminhante Dedicado', description: 'Atinja sua meta diária de passos por 5 dias', journey: EventJourney.HEALTH },
      { title: 'Compromisso com a Saúde', description: 'Compareça a 3 consultas agendadas', journey: EventJourney.CARE },
      { title: 'Aderência ao Tratamento', description: 'Tome seus medicamentos conforme prescrito por 14 dias', journey: EventJourney.CARE },
      { title: 'Mestre em Reembolsos', description: 'Submeta 5 solicitações de reembolso completas', journey: EventJourney.PLAN },
      { title: 'Explorador de Benefícios', description: 'Utilize 3 benefícios diferentes do seu plano', journey: EventJourney.PLAN },
      { title: 'Usuário Engajado', description: 'Use o aplicativo por 30 dias consecutivos', journey: EventJourney.CROSS_JOURNEY }
    ];
    
    const achievement = options.payload?.achievementTitle ? 
      { 
        title: options.payload.achievementTitle as string,
        description: options.payload.achievementDescription as string || 'Achievement description',
        journey: options.payload.relatedJourney as EventJourney || EventJourney.CROSS_JOURNEY
      } : 
      achievements[Math.floor(Math.random() * achievements.length)];
    
    return {
      timestamp: options.timestamp || new Date().toISOString(),
      achievementId: options.payload?.achievementId as string || uuidv4(),
      achievementTitle: achievement.title,
      achievementDescription: achievement.description,
      xpEarned: options.payload?.xpEarned as number || Math.floor(Math.random() * 100) + 50, // 50-150 XP
      relatedJourney: achievement.journey,
      metadata: options.payload?.metadata as Record<string, any> || {}
    };
  }

  /**
   * Creates a payload for QUEST_COMPLETED events
   * 
   * @param options - Optional customization options
   * @returns A QuestCompletedPayload
   */
  public static createQuestCompletedPayload(options: TestEventOptions = {}): QuestCompletedPayload {
    const quests = [
      'Semana da Hidratação',
      'Desafio do Sono',
      'Maratona de Passos',
      'Controle de Medicamentos',
      'Desafio de Consultas Preventivas',
      'Explorador de Benefícios',
      'Desafio Multijornada'
    ];
    
    const questTitle = options.payload?.questTitle as string || quests[Math.floor(Math.random() * quests.length)];
    const xpEarned = options.payload?.xpEarned as number || Math.floor(Math.random() * 200) + 100; // 100-300 XP
    
    const defaultRewards = [
      {
        rewardId: uuidv4(),
        rewardType: 'XP_BOOST',
        rewardValue: 10 // 10% XP boost
      },
      {
        rewardId: uuidv4(),
        rewardType: 'DISCOUNT',
        rewardValue: 15 // 15% discount
      }
    ];
    
    return {
      timestamp: options.timestamp || new Date().toISOString(),
      questId: options.payload?.questId as string || uuidv4(),
      questTitle,
      xpEarned,
      rewards: options.payload?.rewards as Array<{ rewardId: string; rewardType: string; rewardValue: number }> || defaultRewards,
      metadata: options.payload?.metadata as Record<string, any> || {}
    };
  }

  /**
   * Creates a payload for XP_EARNED events
   * 
   * @param options - Optional customization options
   * @returns An XpEarnedPayload
   */
  public static createXpEarnedPayload(options: TestEventOptions = {}): XpEarnedPayload {
    const sources = ['DAILY_LOGIN', 'ACHIEVEMENT', 'QUEST', 'ACTIVITY', 'REFERRAL'];
    const journeys = [EventJourney.HEALTH, EventJourney.CARE, EventJourney.PLAN, EventJourney.CROSS_JOURNEY];
    
    const source = options.payload?.source as string || sources[Math.floor(Math.random() * sources.length)];
    let description: string;
    
    switch (source) {
      case 'DAILY_LOGIN':
        description = 'Login diário no aplicativo';
        break;
      case 'ACHIEVEMENT':
        description = 'Conquista desbloqueada';
        break;
      case 'QUEST':
        description = 'Desafio completado';
        break;
      case 'ACTIVITY':
        description = 'Atividade concluída';
        break;
      case 'REFERRAL':
        description = 'Indicação de amigo';
        break;
      default:
        description = 'XP ganho por atividade';
    }
    
    return {
      timestamp: options.timestamp || new Date().toISOString(),
      amount: options.payload?.amount as number || Math.floor(Math.random() * 50) + 10, // 10-60 XP
      source,
      description: options.payload?.description as string || description,
      relatedJourney: options.payload?.relatedJourney as EventJourney || journeys[Math.floor(Math.random() * journeys.length)],
      metadata: options.payload?.metadata as Record<string, any> || {}
    };
  }

  /**
   * Creates a payload for LEVEL_UP events
   * 
   * @param options - Optional customization options
   * @returns A LevelUpPayload
   */
  public static createLevelUpPayload(options: TestEventOptions = {}): LevelUpPayload {
    const newLevel = options.payload?.newLevel as number || Math.floor(Math.random() * 10) + 2; // Level 2-11
    const previousLevel = options.payload?.previousLevel as number || newLevel - 1;
    
    const defaultUnlockedRewards = [
      {
        rewardId: uuidv4(),
        rewardType: 'BADGE',
        rewardDescription: `Distintivo de Nível ${newLevel}`
      },
      {
        rewardId: uuidv4(),
        rewardType: 'DISCOUNT',
        rewardDescription: `Desconto de ${newLevel * 2}% em consultas`
      }
    ];
    
    return {
      timestamp: options.timestamp || new Date().toISOString(),
      newLevel,
      previousLevel,
      totalXp: options.payload?.totalXp as number || newLevel * 100 + Math.floor(Math.random() * 50),
      unlockedRewards: options.payload?.unlockedRewards as Array<{ rewardId: string; rewardType: string; rewardDescription: string }> || defaultUnlockedRewards,
      metadata: options.payload?.metadata as Record<string, any> || {}
    };
  }

  // Journey-specific event generators

  /**
   * Creates a health journey event
   * 
   * @param type - The health journey event type
   * @param options - Optional customization options
   * @returns A gamification event for the health journey
   */
  public static createHealthEvent(type: EventType, options: TestEventOptions = {}): GamificationEvent {
    const payload = this.createPayloadForEventType(type, options);
    return this.createEvent(type, EventJourney.HEALTH, payload, options);
  }

  /**
   * Creates a care journey event
   * 
   * @param type - The care journey event type
   * @param options - Optional customization options
   * @returns A gamification event for the care journey
   */
  public static createCareEvent(type: EventType, options: TestEventOptions = {}): GamificationEvent {
    const payload = this.createPayloadForEventType(type, options);
    return this.createEvent(type, EventJourney.CARE, payload, options);
  }

  /**
   * Creates a plan journey event
   * 
   * @param type - The plan journey event type
   * @param options - Optional customization options
   * @returns A gamification event for the plan journey
   */
  public static createPlanEvent(type: EventType, options: TestEventOptions = {}): GamificationEvent {
    const payload = this.createPayloadForEventType(type, options);
    return this.createEvent(type, EventJourney.PLAN, payload, options);
  }

  /**
   * Creates a cross-journey event
   * 
   * @param type - The cross-journey event type
   * @param options - Optional customization options
   * @returns A gamification event for cross-journey functionality
   */
  public static createCrossJourneyEvent(type: EventType, options: TestEventOptions = {}): GamificationEvent {
    const payload = this.createPayloadForEventType(type, options);
    return this.createEvent(type, EventJourney.CROSS_JOURNEY, payload, options);
  }

  /**
   * Validates that a generated event matches the expected schema
   * 
   * @param event - The event to validate
   * @returns True if the event is valid, false otherwise
   */
  public static validateEvent(event: GamificationEvent): boolean {
    // Basic validation
    if (!event.eventId || !event.type || !event.userId || !event.journey || !event.payload) {
      return false;
    }
    
    // Validate version
    if (!event.version || typeof event.version.major !== 'number' || 
        typeof event.version.minor !== 'number' || typeof event.version.patch !== 'number') {
      return false;
    }
    
    // Validate timestamp
    if (!event.createdAt || isNaN(Date.parse(event.createdAt))) {
      return false;
    }
    
    // Validate payload has timestamp
    if (!event.payload.timestamp || isNaN(Date.parse(event.payload.timestamp))) {
      return false;
    }
    
    // Event type-specific validation
    switch (event.type) {
      case EventType.HEALTH_METRIC_RECORDED:
        const metricPayload = event.payload as HealthMetricRecordedPayload;
        return !!metricPayload.metricType && typeof metricPayload.value === 'number' && !!metricPayload.unit;
      
      case EventType.HEALTH_GOAL_CREATED:
      case EventType.HEALTH_GOAL_UPDATED:
        const goalPayload = event.payload as HealthGoalPayload;
        return !!goalPayload.goalId && !!goalPayload.goalType && typeof goalPayload.targetValue === 'number';
      
      case EventType.HEALTH_GOAL_ACHIEVED:
        const achievedPayload = event.payload as HealthGoalAchievedPayload;
        return !!achievedPayload.goalId && typeof achievedPayload.completionPercentage === 'number';
      
      // Add more validations for other event types as needed
      
      default:
        // Basic validation passed for other event types
        return true;
    }
  }
}

export default TestEventsProducer;