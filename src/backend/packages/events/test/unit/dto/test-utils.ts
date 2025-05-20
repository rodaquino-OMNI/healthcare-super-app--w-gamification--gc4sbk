/**
 * @file test-utils.ts
 * @description Provides utility functions and fixtures for testing event DTOs, including factory
 * functions for creating valid test events, validation helpers, and common test patterns.
 * 
 * This file centralizes testing utilities to reduce duplication, ensure consistent testing
 * approaches across all DTO tests, and simplify the creation of test data that complies with
 * validation rules and schema requirements.
 *
 * @module events/test/unit/dto
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

// Import DTOs
import { ProcessEventDto } from '@austa/interfaces';
import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';
import { EventMetadataDto, EventOriginDto, EventVersionDto, createEventMetadata } from '../../../src/dto/event-metadata.dto';
import { VersionedEventDto, createVersionedEvent } from '../../../src/dto/version.dto';
import {
  HealthMetricData,
  HealthGoalData,
  DeviceSyncData,
  HealthInsightData,
  HealthMetricType,
  HealthGoalType,
  DeviceType,
  HealthInsightType,
  HealthMetricRecordedEventDto,
  HealthGoalAchievedEventDto,
  DeviceSynchronizedEventDto,
  HealthInsightGeneratedEventDto
} from '../../../src/dto/health-event.dto';

// Import validation utilities
import { ValidationError, validateObject } from '../../../src/dto/validation';

/**
 * Interface for test factory options
 */
export interface TestFactoryOptions {
  /**
   * Whether to include metadata in the generated event
   */
  includeMetadata?: boolean;
  
  /**
   * Whether to include a user ID in the generated event
   */
  includeUserId?: boolean;
  
  /**
   * Whether to include a timestamp in the generated event
   */
  includeTimestamp?: boolean;
  
  /**
   * Whether to include a correlation ID in the generated event
   */
  includeCorrelationId?: boolean;
  
  /**
   * Whether to include a version in the generated event
   */
  includeVersion?: boolean;
  
  /**
   * Whether to include an origin in the generated event metadata
   */
  includeOrigin?: boolean;
}

/**
 * Default test factory options
 */
export const DEFAULT_TEST_FACTORY_OPTIONS: TestFactoryOptions = {
  includeMetadata: true,
  includeUserId: true,
  includeTimestamp: true,
  includeCorrelationId: true,
  includeVersion: true,
  includeOrigin: true
};

/**
 * Creates a valid event metadata object for testing
 * 
 * @param options Options for customizing the generated metadata
 * @returns A valid EventMetadataDto instance
 */
export function createTestEventMetadata(options: TestFactoryOptions = DEFAULT_TEST_FACTORY_OPTIONS): EventMetadataDto {
  const metadata = new EventMetadataDto();
  
  if (options.includeCorrelationId) {
    metadata.correlationId = uuidv4();
  }
  
  if (options.includeTimestamp) {
    metadata.timestamp = new Date();
  }
  
  if (options.includeVersion) {
    metadata.version = new EventVersionDto();
    metadata.version.major = '1';
    metadata.version.minor = '0';
    metadata.version.patch = '0';
  }
  
  if (options.includeOrigin) {
    metadata.origin = new EventOriginDto();
    metadata.origin.service = 'test-service';
    metadata.origin.component = 'test-component';
    metadata.origin.instance = 'test-instance-1';
  }
  
  return metadata;
}

/**
 * Creates a base event object with common properties
 * 
 * @param type The event type
 * @param journey The journey name
 * @param data The event data
 * @param options Options for customizing the generated event
 * @returns A valid base event object
 */
export function createBaseEvent<T>(type: string, journey: string, data: T, options: TestFactoryOptions = DEFAULT_TEST_FACTORY_OPTIONS): Partial<ProcessEventDto> {
  const event: Partial<ProcessEventDto> = {
    type,
    journey,
    data
  };
  
  if (options.includeUserId) {
    event.userId = uuidv4();
  }
  
  if (options.includeTimestamp) {
    event.timestamp = new Date().toISOString();
  }
  
  if (options.includeMetadata) {
    event.metadata = createTestEventMetadata(options);
  }
  
  return event;
}

// ===== HEALTH JOURNEY TEST FACTORIES =====

/**
 * Creates a valid health metric data object for testing
 * 
 * @param metricType The type of health metric (defaults to HEART_RATE)
 * @param customData Additional data to merge with the generated data
 * @returns A valid HealthMetricData instance
 */
export function createHealthMetricData(metricType: HealthMetricType = HealthMetricType.HEART_RATE, customData: Partial<HealthMetricData> = {}): HealthMetricData {
  const baseData: HealthMetricData = {
    metricType,
    value: 0,
    unit: '',
    validateMetricRange: function(): boolean { return true; }
  };
  
  // Set appropriate values based on metric type
  switch (metricType) {
    case HealthMetricType.HEART_RATE:
      baseData.value = 75;
      baseData.unit = 'bpm';
      break;
    case HealthMetricType.BLOOD_PRESSURE:
      baseData.value = 120; // Systolic value
      baseData.unit = 'mmHg';
      break;
    case HealthMetricType.BLOOD_GLUCOSE:
      baseData.value = 95;
      baseData.unit = 'mg/dL';
      break;
    case HealthMetricType.STEPS:
      baseData.value = 8500;
      baseData.unit = 'steps';
      break;
    case HealthMetricType.SLEEP:
      baseData.value = 7.5;
      baseData.unit = 'hours';
      break;
    case HealthMetricType.WEIGHT:
      baseData.value = 70;
      baseData.unit = 'kg';
      break;
    case HealthMetricType.TEMPERATURE:
      baseData.value = 36.8;
      baseData.unit = '°C';
      break;
    case HealthMetricType.OXYGEN_SATURATION:
      baseData.value = 98;
      baseData.unit = '%';
      break;
    case HealthMetricType.RESPIRATORY_RATE:
      baseData.value = 16;
      baseData.unit = 'breaths/min';
      break;
    case HealthMetricType.WATER_INTAKE:
      baseData.value = 2000;
      baseData.unit = 'ml';
      break;
    case HealthMetricType.CALORIES:
      baseData.value = 2500;
      baseData.unit = 'kcal';
      break;
  }
  
  // Add optional fields
  baseData.recordedAt = new Date().toISOString();
  baseData.notes = 'Test metric recording';
  
  // Merge with custom data
  return { ...baseData, ...customData };
}

/**
 * Creates a valid health goal data object for testing
 * 
 * @param goalType The type of health goal (defaults to STEPS_TARGET)
 * @param customData Additional data to merge with the generated data
 * @returns A valid HealthGoalData instance
 */
export function createHealthGoalData(goalType: HealthGoalType = HealthGoalType.STEPS_TARGET, customData: Partial<HealthGoalData> = {}): HealthGoalData {
  const baseData: HealthGoalData = {
    goalId: uuidv4(),
    goalType,
    description: '',
    isAchieved: function(): boolean { return this.progressPercentage === 100 || !!this.achievedAt; },
    markAsAchieved: function(): void { this.achievedAt = new Date().toISOString(); this.progressPercentage = 100; }
  };
  
  // Set appropriate values based on goal type
  switch (goalType) {
    case HealthGoalType.STEPS_TARGET:
      baseData.description = 'Walk 10,000 steps daily';
      baseData.targetValue = 10000;
      baseData.unit = 'steps';
      break;
    case HealthGoalType.WEIGHT_TARGET:
      baseData.description = 'Reach target weight of 65kg';
      baseData.targetValue = 65;
      baseData.unit = 'kg';
      break;
    case HealthGoalType.SLEEP_DURATION:
      baseData.description = 'Sleep 8 hours every night';
      baseData.targetValue = 8;
      baseData.unit = 'hours';
      break;
    case HealthGoalType.ACTIVITY_FREQUENCY:
      baseData.description = 'Exercise 5 times per week';
      baseData.targetValue = 5;
      baseData.unit = 'sessions';
      break;
    case HealthGoalType.WATER_INTAKE:
      baseData.description = 'Drink 2L of water daily';
      baseData.targetValue = 2000;
      baseData.unit = 'ml';
      break;
    case HealthGoalType.BLOOD_PRESSURE_MANAGEMENT:
      baseData.description = 'Maintain blood pressure below 130/85';
      baseData.targetValue = 130;
      baseData.unit = 'mmHg';
      break;
    case HealthGoalType.BLOOD_GLUCOSE_MANAGEMENT:
      baseData.description = 'Keep fasting blood glucose below 100 mg/dL';
      baseData.targetValue = 100;
      baseData.unit = 'mg/dL';
      break;
  }
  
  // Add progress percentage (not achieved by default)
  baseData.progressPercentage = 75;
  
  // Merge with custom data
  return { ...baseData, ...customData };
}

/**
 * Creates a valid device sync data object for testing
 * 
 * @param deviceType The type of device (defaults to SMARTWATCH)
 * @param customData Additional data to merge with the generated data
 * @returns A valid DeviceSyncData instance
 */
export function createDeviceSyncData(deviceType: DeviceType = DeviceType.SMARTWATCH, customData: Partial<DeviceSyncData> = {}): DeviceSyncData {
  const baseData: DeviceSyncData = {
    deviceId: uuidv4(),
    deviceType,
    deviceName: '',
    syncedAt: new Date().toISOString(),
    syncSuccessful: true,
    markAsFailed: function(errorMessage: string): void { this.syncSuccessful = false; this.errorMessage = errorMessage; },
    markAsSuccessful: function(dataPointsCount: number, metricTypes: HealthMetricType[]): void {
      this.syncSuccessful = true;
      this.dataPointsCount = dataPointsCount;
      this.metricTypes = metricTypes;
      this.errorMessage = undefined;
    }
  };
  
  // Set appropriate values based on device type
  switch (deviceType) {
    case DeviceType.SMARTWATCH:
      baseData.deviceName = 'Apple Watch Series 7';
      baseData.dataPointsCount = 24;
      baseData.metricTypes = [HealthMetricType.HEART_RATE, HealthMetricType.STEPS, HealthMetricType.SLEEP];
      break;
    case DeviceType.FITNESS_TRACKER:
      baseData.deviceName = 'Fitbit Charge 5';
      baseData.dataPointsCount = 18;
      baseData.metricTypes = [HealthMetricType.STEPS, HealthMetricType.HEART_RATE, HealthMetricType.SLEEP];
      break;
    case DeviceType.BLOOD_PRESSURE_MONITOR:
      baseData.deviceName = 'Omron X5';
      baseData.dataPointsCount = 3;
      baseData.metricTypes = [HealthMetricType.BLOOD_PRESSURE];
      break;
    case DeviceType.GLUCOSE_MONITOR:
      baseData.deviceName = 'Dexcom G6';
      baseData.dataPointsCount = 12;
      baseData.metricTypes = [HealthMetricType.BLOOD_GLUCOSE];
      break;
    case DeviceType.SCALE:
      baseData.deviceName = 'Withings Body+';
      baseData.dataPointsCount = 1;
      baseData.metricTypes = [HealthMetricType.WEIGHT];
      break;
    case DeviceType.SLEEP_TRACKER:
      baseData.deviceName = 'Oura Ring';
      baseData.dataPointsCount = 8;
      baseData.metricTypes = [HealthMetricType.SLEEP];
      break;
    case DeviceType.THERMOMETER:
      baseData.deviceName = 'Withings Thermo';
      baseData.dataPointsCount = 1;
      baseData.metricTypes = [HealthMetricType.TEMPERATURE];
      break;
    case DeviceType.PULSE_OXIMETER:
      baseData.deviceName = 'Nonin Onyx';
      baseData.dataPointsCount = 2;
      baseData.metricTypes = [HealthMetricType.OXYGEN_SATURATION];
      break;
  }
  
  // Merge with custom data
  return { ...baseData, ...customData };
}

/**
 * Creates a valid health insight data object for testing
 * 
 * @param insightType The type of health insight (defaults to TREND_ANALYSIS)
 * @param customData Additional data to merge with the generated data
 * @returns A valid HealthInsightData instance
 */
export function createHealthInsightData(insightType: HealthInsightType = HealthInsightType.TREND_ANALYSIS, customData: Partial<HealthInsightData> = {}): HealthInsightData {
  const baseData: HealthInsightData = {
    insightId: uuidv4(),
    insightType,
    title: '',
    description: '',
    acknowledgeByUser: function(): void { this.userAcknowledged = true; },
    isHighPriority: function(): boolean {
      return (this.insightType === HealthInsightType.ANOMALY_DETECTION || 
              this.insightType === HealthInsightType.HEALTH_RISK_ASSESSMENT) && 
             this.confidenceScore !== undefined && 
             this.confidenceScore > 75;
    }
  };
  
  // Set appropriate values based on insight type
  switch (insightType) {
    case HealthInsightType.TREND_ANALYSIS:
      baseData.title = 'Improving Sleep Pattern';
      baseData.description = 'Your sleep duration has been consistently improving over the past 2 weeks.';
      baseData.relatedMetricTypes = [HealthMetricType.SLEEP];
      baseData.confidenceScore = 85;
      break;
    case HealthInsightType.ANOMALY_DETECTION:
      baseData.title = 'Unusual Heart Rate Detected';
      baseData.description = 'We noticed an unusually high resting heart rate yesterday evening.';
      baseData.relatedMetricTypes = [HealthMetricType.HEART_RATE];
      baseData.confidenceScore = 70;
      break;
    case HealthInsightType.PREVENTIVE_RECOMMENDATION:
      baseData.title = 'Hydration Reminder';
      baseData.description = 'Your water intake has been below target for 3 consecutive days.';
      baseData.relatedMetricTypes = [HealthMetricType.WATER_INTAKE];
      baseData.confidenceScore = 90;
      break;
    case HealthInsightType.GOAL_SUGGESTION:
      baseData.title = 'New Step Goal Recommendation';
      baseData.description = 'Based on your activity level, we recommend increasing your daily step goal to 12,000.';
      baseData.relatedMetricTypes = [HealthMetricType.STEPS];
      baseData.confidenceScore = 80;
      break;
    case HealthInsightType.HEALTH_RISK_ASSESSMENT:
      baseData.title = 'Blood Pressure Trend Alert';
      baseData.description = 'Your blood pressure readings have been consistently elevated over the past week.';
      baseData.relatedMetricTypes = [HealthMetricType.BLOOD_PRESSURE];
      baseData.confidenceScore = 85;
      break;
  }
  
  // Add generated timestamp
  baseData.generatedAt = new Date().toISOString();
  baseData.userAcknowledged = false;
  
  // Merge with custom data
  return { ...baseData, ...customData };
}

/**
 * Creates a valid health metric recorded event for testing
 * 
 * @param metricType The type of health metric (defaults to HEART_RATE)
 * @param customData Additional data to merge with the generated metric data
 * @param options Options for customizing the generated event
 * @returns A valid HealthMetricRecordedEventDto instance
 */
export function createHealthMetricRecordedEvent(
  metricType: HealthMetricType = HealthMetricType.HEART_RATE,
  customData: Partial<HealthMetricData> = {},
  options: TestFactoryOptions = DEFAULT_TEST_FACTORY_OPTIONS
): HealthMetricRecordedEventDto {
  const metricData = createHealthMetricData(metricType, customData);
  const eventData = createBaseEvent(EventType.HEALTH_METRIC_RECORDED, 'health', metricData, options);
  
  return plainToInstance(HealthMetricRecordedEventDto, eventData);
}

/**
 * Creates a valid health goal achieved event for testing
 * 
 * @param goalType The type of health goal (defaults to STEPS_TARGET)
 * @param customData Additional data to merge with the generated goal data
 * @param options Options for customizing the generated event
 * @returns A valid HealthGoalAchievedEventDto instance
 */
export function createHealthGoalAchievedEvent(
  goalType: HealthGoalType = HealthGoalType.STEPS_TARGET,
  customData: Partial<HealthGoalData> = {},
  options: TestFactoryOptions = DEFAULT_TEST_FACTORY_OPTIONS
): HealthGoalAchievedEventDto {
  // Create goal data and mark it as achieved
  const goalData = createHealthGoalData(goalType, customData);
  goalData.markAsAchieved();
  
  const eventData = createBaseEvent(EventType.HEALTH_GOAL_ACHIEVED, 'health', goalData, options);
  
  return plainToInstance(HealthGoalAchievedEventDto, eventData);
}

/**
 * Creates a valid device synchronized event for testing
 * 
 * @param deviceType The type of device (defaults to SMARTWATCH)
 * @param customData Additional data to merge with the generated device data
 * @param options Options for customizing the generated event
 * @returns A valid DeviceSynchronizedEventDto instance
 */
export function createDeviceSynchronizedEvent(
  deviceType: DeviceType = DeviceType.SMARTWATCH,
  customData: Partial<DeviceSyncData> = {},
  options: TestFactoryOptions = DEFAULT_TEST_FACTORY_OPTIONS
): DeviceSynchronizedEventDto {
  const deviceData = createDeviceSyncData(deviceType, customData);
  const eventData = createBaseEvent('DEVICE_SYNCHRONIZED', 'health', deviceData, options);
  
  return plainToInstance(DeviceSynchronizedEventDto, eventData);
}

/**
 * Creates a valid health insight generated event for testing
 * 
 * @param insightType The type of health insight (defaults to TREND_ANALYSIS)
 * @param customData Additional data to merge with the generated insight data
 * @param options Options for customizing the generated event
 * @returns A valid HealthInsightGeneratedEventDto instance
 */
export function createHealthInsightGeneratedEvent(
  insightType: HealthInsightType = HealthInsightType.TREND_ANALYSIS,
  customData: Partial<HealthInsightData> = {},
  options: TestFactoryOptions = DEFAULT_TEST_FACTORY_OPTIONS
): HealthInsightGeneratedEventDto {
  const insightData = createHealthInsightData(insightType, customData);
  const eventData = createBaseEvent(EventType.HEALTH_INSIGHT_GENERATED, 'health', insightData, options);
  
  return plainToInstance(HealthInsightGeneratedEventDto, eventData);
}

// ===== CARE JOURNEY TEST FACTORIES =====

/**
 * Enum for appointment types in the care journey
 */
export enum AppointmentType {
  IN_PERSON = 'IN_PERSON',
  TELEMEDICINE = 'TELEMEDICINE',
  HOME_VISIT = 'HOME_VISIT'
}

/**
 * Enum for appointment statuses in the care journey
 */
export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED'
}

/**
 * Interface for appointment data in the care journey
 */
export interface AppointmentData {
  appointmentId: string;
  providerId: string;
  specialtyType: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  scheduledAt: string;
  bookedAt: string;
  duration: number; // in minutes
  location?: string;
  notes?: string;
  completedAt?: string;
}

/**
 * Creates a valid appointment data object for testing
 * 
 * @param appointmentType The type of appointment (defaults to IN_PERSON)
 * @param status The status of the appointment (defaults to SCHEDULED)
 * @param customData Additional data to merge with the generated data
 * @returns A valid AppointmentData object
 */
export function createAppointmentData(
  appointmentType: AppointmentType = AppointmentType.IN_PERSON,
  status: AppointmentStatus = AppointmentStatus.SCHEDULED,
  customData: Partial<AppointmentData> = {}
): AppointmentData {
  const now = new Date();
  const scheduledDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  
  const baseData: AppointmentData = {
    appointmentId: uuidv4(),
    providerId: uuidv4(),
    specialtyType: 'Cardiologia',
    appointmentType,
    status,
    scheduledAt: scheduledDate.toISOString(),
    bookedAt: now.toISOString(),
    duration: 30, // 30 minutes
    notes: 'Regular check-up appointment'
  };
  
  // Set location based on appointment type
  if (appointmentType === AppointmentType.IN_PERSON) {
    baseData.location = 'AUSTA Medical Center - Floor 3, Room 302';
  } else if (appointmentType === AppointmentType.HOME_VISIT) {
    baseData.location = 'Patient\'s home address';
  }
  
  // Set completedAt if status is COMPLETED
  if (status === AppointmentStatus.COMPLETED) {
    const completedDate = new Date(scheduledDate.getTime() + baseData.duration * 60 * 1000);
    baseData.completedAt = completedDate.toISOString();
  }
  
  // Merge with custom data
  return { ...baseData, ...customData };
}

/**
 * Creates a valid appointment booked event for testing
 * 
 * @param appointmentType The type of appointment (defaults to IN_PERSON)
 * @param customData Additional data to merge with the generated appointment data
 * @param options Options for customizing the generated event
 * @returns A valid appointment booked event object
 */
export function createAppointmentBookedEvent(
  appointmentType: AppointmentType = AppointmentType.IN_PERSON,
  customData: Partial<AppointmentData> = {},
  options: TestFactoryOptions = DEFAULT_TEST_FACTORY_OPTIONS
): any {
  const appointmentData = createAppointmentData(appointmentType, AppointmentStatus.SCHEDULED, customData);
  const eventData = createBaseEvent(EventType.CARE_APPOINTMENT_BOOKED, 'care', appointmentData, options);
  
  return eventData;
}

/**
 * Creates a valid appointment completed event for testing
 * 
 * @param appointmentType The type of appointment (defaults to IN_PERSON)
 * @param customData Additional data to merge with the generated appointment data
 * @param options Options for customizing the generated event
 * @returns A valid appointment completed event object
 */
export function createAppointmentCompletedEvent(
  appointmentType: AppointmentType = AppointmentType.IN_PERSON,
  customData: Partial<AppointmentData> = {},
  options: TestFactoryOptions = DEFAULT_TEST_FACTORY_OPTIONS
): any {
  const appointmentData = createAppointmentData(appointmentType, AppointmentStatus.COMPLETED, customData);
  const eventData = createBaseEvent(EventType.CARE_APPOINTMENT_COMPLETED, 'care', appointmentData, options);
  
  return eventData;
}

/**
 * Enum for medication adherence statuses
 */
export enum MedicationAdherenceStatus {
  ON_TIME = 'ON_TIME',
  LATE = 'LATE',
  MISSED = 'MISSED',
  SKIPPED = 'SKIPPED'
}

/**
 * Interface for medication data
 */
export interface MedicationData {
  medicationId: string;
  medicationName: string;
  dosage: string;
  takenAt: string;
  scheduledAt: string;
  adherenceStatus: MedicationAdherenceStatus;
  notes?: string;
}

/**
 * Creates a valid medication data object for testing
 * 
 * @param adherenceStatus The adherence status (defaults to ON_TIME)
 * @param customData Additional data to merge with the generated data
 * @returns A valid MedicationData object
 */
export function createMedicationData(
  adherenceStatus: MedicationAdherenceStatus = MedicationAdherenceStatus.ON_TIME,
  customData: Partial<MedicationData> = {}
): MedicationData {
  const now = new Date();
  const scheduledTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
  
  const baseData: MedicationData = {
    medicationId: uuidv4(),
    medicationName: 'Atorvastatina 20mg',
    dosage: '1 comprimido',
    scheduledAt: scheduledTime.toISOString(),
    takenAt: now.toISOString(),
    adherenceStatus,
    notes: 'Taken after dinner'
  };
  
  // Adjust takenAt based on adherence status
  if (adherenceStatus === MedicationAdherenceStatus.LATE) {
    baseData.takenAt = new Date(scheduledTime.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours after scheduled
  } else if (adherenceStatus === MedicationAdherenceStatus.MISSED) {
    baseData.takenAt = undefined;
  }
  
  // Merge with custom data
  return { ...baseData, ...customData };
}

/**
 * Creates a valid medication taken event for testing
 * 
 * @param adherenceStatus The adherence status (defaults to ON_TIME)
 * @param customData Additional data to merge with the generated medication data
 * @param options Options for customizing the generated event
 * @returns A valid medication taken event object
 */
export function createMedicationTakenEvent(
  adherenceStatus: MedicationAdherenceStatus = MedicationAdherenceStatus.ON_TIME,
  customData: Partial<MedicationData> = {},
  options: TestFactoryOptions = DEFAULT_TEST_FACTORY_OPTIONS
): any {
  const medicationData = createMedicationData(adherenceStatus, customData);
  const eventData = createBaseEvent(EventType.CARE_MEDICATION_TAKEN, 'care', medicationData, options);
  
  return eventData;
}

// ===== PLAN JOURNEY TEST FACTORIES =====

/**
 * Enum for claim types in the plan journey
 */
export enum ClaimType {
  MEDICAL = 'MEDICAL',
  DENTAL = 'DENTAL',
  VISION = 'VISION',
  PHARMACY = 'PHARMACY',
  LABORATORY = 'LABORATORY',
  IMAGING = 'IMAGING',
  THERAPY = 'THERAPY'
}

/**
 * Enum for claim statuses in the plan journey
 */
export enum ClaimStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ADDITIONAL_INFO_REQUIRED = 'ADDITIONAL_INFO_REQUIRED',
  APPROVED = 'APPROVED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  REJECTED = 'REJECTED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  APPEALED = 'APPEALED'
}

/**
 * Interface for claim data in the plan journey
 */
export interface ClaimData {
  claimId: string;
  claimType: ClaimType;
  providerId: string;
  providerName: string;
  serviceDate: string;
  submittedAt: string;
  amount: number;
  status: ClaimStatus;
  coveredAmount?: number;
  notes?: string;
  processedAt?: string;
  documentIds?: string[];
}

/**
 * Creates a valid claim data object for testing
 * 
 * @param claimType The type of claim (defaults to MEDICAL)
 * @param status The status of the claim (defaults to SUBMITTED)
 * @param customData Additional data to merge with the generated data
 * @returns A valid ClaimData object
 */
export function createClaimData(
  claimType: ClaimType = ClaimType.MEDICAL,
  status: ClaimStatus = ClaimStatus.SUBMITTED,
  customData: Partial<ClaimData> = {}
): ClaimData {
  const now = new Date();
  const serviceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  
  const baseData: ClaimData = {
    claimId: uuidv4(),
    claimType,
    providerId: uuidv4(),
    providerName: 'Dr. Carlos Silva',
    serviceDate: serviceDate.toISOString(),
    submittedAt: now.toISOString(),
    amount: 350.00,
    status,
    notes: 'Regular consultation claim',
    documentIds: [uuidv4(), uuidv4()]
  };
  
  // Set covered amount and processed date for processed claims
  if (status === ClaimStatus.APPROVED) {
    baseData.coveredAmount = baseData.amount;
    baseData.processedAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days after submission
  } else if (status === ClaimStatus.PARTIALLY_APPROVED) {
    baseData.coveredAmount = baseData.amount * 0.7; // 70% coverage
    baseData.processedAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  } else if (status === ClaimStatus.REJECTED) {
    baseData.coveredAmount = 0;
    baseData.processedAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  }
  
  // Adjust amount based on claim type
  if (claimType === ClaimType.DENTAL) {
    baseData.amount = 250.00;
    baseData.providerName = 'Dra. Ana Oliveira';
    baseData.notes = 'Dental cleaning and check-up';
  } else if (claimType === ClaimType.VISION) {
    baseData.amount = 500.00;
    baseData.providerName = 'Dr. Marcos Santos';
    baseData.notes = 'Annual eye exam and prescription glasses';
  } else if (claimType === ClaimType.PHARMACY) {
    baseData.amount = 120.00;
    baseData.providerName = 'Farmácia São Paulo';
    baseData.notes = 'Monthly prescription medications';
  }
  
  // Merge with custom data
  return { ...baseData, ...customData };
}

/**
 * Creates a valid claim submitted event for testing
 * 
 * @param claimType The type of claim (defaults to MEDICAL)
 * @param customData Additional data to merge with the generated claim data
 * @param options Options for customizing the generated event
 * @returns A valid claim submitted event object
 */
export function createClaimSubmittedEvent(
  claimType: ClaimType = ClaimType.MEDICAL,
  customData: Partial<ClaimData> = {},
  options: TestFactoryOptions = DEFAULT_TEST_FACTORY_OPTIONS
): any {
  const claimData = createClaimData(claimType, ClaimStatus.SUBMITTED, customData);
  const eventData = createBaseEvent(EventType.PLAN_CLAIM_SUBMITTED, 'plan', claimData, options);
  
  return eventData;
}

/**
 * Creates a valid claim processed event for testing
 * 
 * @param claimType The type of claim (defaults to MEDICAL)
 * @param status The status of the processed claim (defaults to APPROVED)
 * @param customData Additional data to merge with the generated claim data
 * @param options Options for customizing the generated event
 * @returns A valid claim processed event object
 */
export function createClaimProcessedEvent(
  claimType: ClaimType = ClaimType.MEDICAL,
  status: ClaimStatus = ClaimStatus.APPROVED,
  customData: Partial<ClaimData> = {},
  options: TestFactoryOptions = DEFAULT_TEST_FACTORY_OPTIONS
): any {
  // Only use processed statuses
  const validStatuses = [ClaimStatus.APPROVED, ClaimStatus.PARTIALLY_APPROVED, ClaimStatus.REJECTED];
  const processStatus = validStatuses.includes(status) ? status : ClaimStatus.APPROVED;
  
  const claimData = createClaimData(claimType, processStatus, customData);
  const eventData = createBaseEvent(EventType.PLAN_CLAIM_PROCESSED, 'plan', claimData, options);
  
  return eventData;
}

/**
 * Interface for benefit data in the plan journey
 */
export interface BenefitData {
  benefitId: string;
  benefitType: string;
  benefitName: string;
  providerId?: string;
  providerName?: string;
  utilizationDate: string;
  savingsAmount?: number;
  notes?: string;
}

/**
 * Creates a valid benefit data object for testing
 * 
 * @param benefitType The type of benefit (defaults to 'wellness')
 * @param customData Additional data to merge with the generated data
 * @returns A valid BenefitData object
 */
export function createBenefitData(
  benefitType: string = 'wellness',
  customData: Partial<BenefitData> = {}
): BenefitData {
  const now = new Date();
  
  const baseData: BenefitData = {
    benefitId: uuidv4(),
    benefitType,
    benefitName: '',
    utilizationDate: now.toISOString(),
    notes: ''
  };
  
  // Set appropriate values based on benefit type
  switch (benefitType) {
    case 'wellness':
      baseData.benefitName = 'Academia Desconto';
      baseData.providerId = uuidv4();
      baseData.providerName = 'Academia Fitness Total';
      baseData.savingsAmount = 100.00;
      baseData.notes = 'Monthly gym membership discount';
      break;
    case 'preventive':
      baseData.benefitName = 'Check-up Anual';
      baseData.providerId = uuidv4();
      baseData.providerName = 'Clínica AUSTA';
      baseData.savingsAmount = 350.00;
      baseData.notes = 'Annual preventive health check-up';
      break;
    case 'specialist':
      baseData.benefitName = 'Consulta Especialista';
      baseData.providerId = uuidv4();
      baseData.providerName = 'Dr. Roberto Almeida';
      baseData.savingsAmount = 200.00;
      baseData.notes = 'Specialist consultation with reduced co-pay';
      break;
    case 'telemedicine':
      baseData.benefitName = 'Telemedicina Gratuita';
      baseData.providerId = uuidv4();
      baseData.providerName = 'AUSTA Telemedicina';
      baseData.savingsAmount = 150.00;
      baseData.notes = 'Free telemedicine consultation';
      break;
    case 'pharmacy':
      baseData.benefitName = 'Desconto Medicamentos';
      baseData.providerId = uuidv4();
      baseData.providerName = 'Rede de Farmácias São Paulo';
      baseData.savingsAmount = 75.00;
      baseData.notes = 'Prescription medication discount';
      break;
  }
  
  // Merge with custom data
  return { ...baseData, ...customData };
}

/**
 * Creates a valid benefit utilized event for testing
 * 
 * @param benefitType The type of benefit (defaults to 'wellness')
 * @param customData Additional data to merge with the generated benefit data
 * @param options Options for customizing the generated event
 * @returns A valid benefit utilized event object
 */
export function createBenefitUtilizedEvent(
  benefitType: string = 'wellness',
  customData: Partial<BenefitData> = {},
  options: TestFactoryOptions = DEFAULT_TEST_FACTORY_OPTIONS
): any {
  const benefitData = createBenefitData(benefitType, customData);
  const eventData = createBaseEvent(EventType.PLAN_BENEFIT_UTILIZED, 'plan', benefitData, options);
  
  return eventData;
}

// ===== VALIDATION TESTING UTILITIES =====

/**
 * Validates an event DTO and returns validation errors if any
 * 
 * @param dto The DTO to validate
 * @returns A promise resolving to validation errors or null if valid
 */
export async function validateEventDto(dto: any): Promise<ValidationError[] | null> {
  return validateObject(dto);
}

/**
 * Checks if a DTO is valid
 * 
 * @param dto The DTO to validate
 * @returns A promise resolving to a boolean indicating if the DTO is valid
 */
export async function isValidEventDto(dto: any): Promise<boolean> {
  const errors = await validate(dto);
  return errors.length === 0;
}

/**
 * Creates an invalid event by removing required properties
 * 
 * @param validEvent A valid event DTO
 * @param propertiesToRemove Properties to remove to make the event invalid
 * @returns An invalid event object
 */
export function createInvalidEvent(validEvent: any, propertiesToRemove: string[]): any {
  const invalidEvent = { ...validEvent };
  
  for (const prop of propertiesToRemove) {
    const props = prop.split('.');
    let current = invalidEvent;
    
    for (let i = 0; i < props.length - 1; i++) {
      if (current[props[i]]) {
        current = current[props[i]];
      }
    }
    
    const lastProp = props[props.length - 1];
    if (current[lastProp] !== undefined) {
      delete current[lastProp];
    }
  }
  
  return invalidEvent;
}

/**
 * Creates an invalid event by setting invalid values for properties
 * 
 * @param validEvent A valid event DTO
 * @param invalidValues Map of property paths to invalid values
 * @returns An invalid event object
 */
export function createEventWithInvalidValues(validEvent: any, invalidValues: Record<string, any>): any {
  const invalidEvent = JSON.parse(JSON.stringify(validEvent));
  
  for (const [prop, value] of Object.entries(invalidValues)) {
    const props = prop.split('.');
    let current = invalidEvent;
    
    for (let i = 0; i < props.length - 1; i++) {
      if (current[props[i]]) {
        current = current[props[i]];
      }
    }
    
    const lastProp = props[props.length - 1];
    current[lastProp] = value;
  }
  
  return invalidEvent;
}

/**
 * Creates a versioned event for testing
 * 
 * @param eventType The type of event
 * @param payload The event payload
 * @param version The event version (defaults to 1.0.0)
 * @returns A VersionedEventDto instance
 */
export function createTestVersionedEvent<T>(eventType: string, payload: T, version: string = '1.0.0'): VersionedEventDto<T> {
  const versionParts = version.split('.');
  const versionDto = new EventVersionDto();
  versionDto.major = versionParts[0];
  versionDto.minor = versionParts[1];
  versionDto.patch = versionParts[2];
  
  return new VersionedEventDto(eventType, payload, versionDto);
}

/**
 * Creates a test event with the specified journey and type
 * 
 * @param journey The journey name
 * @param type The event type
 * @param data The event data
 * @param options Options for customizing the generated event
 * @returns A generic event object
 */
export function createTestEvent<T>(journey: string, type: string, data: T, options: TestFactoryOptions = DEFAULT_TEST_FACTORY_OPTIONS): any {
  return createBaseEvent(type, journey, data, options);
}

/**
 * Creates a test event with random data for the specified journey and type
 * 
 * @param journey The journey name
 * @param type The event type
 * @param options Options for customizing the generated event
 * @returns A generic event object with random data
 */
export function createRandomTestEvent(journey: string, type: string, options: TestFactoryOptions = DEFAULT_TEST_FACTORY_OPTIONS): any {
  let data: any = {};
  
  // Generate appropriate data based on journey and type
  if (journey === 'health') {
    switch (type) {
      case EventType.HEALTH_METRIC_RECORDED:
        data = createHealthMetricData();
        break;
      case EventType.HEALTH_GOAL_ACHIEVED:
        data = createHealthGoalData();
        data.markAsAchieved();
        break;
      case EventType.HEALTH_GOAL_CREATED:
        data = createHealthGoalData();
        break;
      case EventType.HEALTH_DEVICE_CONNECTED:
        data = createDeviceSyncData();
        break;
      case EventType.HEALTH_INSIGHT_GENERATED:
        data = createHealthInsightData();
        break;
      default:
        data = { id: uuidv4(), timestamp: new Date().toISOString() };
    }
  } else if (journey === 'care') {
    switch (type) {
      case EventType.CARE_APPOINTMENT_BOOKED:
        data = createAppointmentData();
        break;
      case EventType.CARE_APPOINTMENT_COMPLETED:
        data = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.COMPLETED);
        break;
      case EventType.CARE_MEDICATION_TAKEN:
        data = createMedicationData();
        break;
      default:
        data = { id: uuidv4(), timestamp: new Date().toISOString() };
    }
  } else if (journey === 'plan') {
    switch (type) {
      case EventType.PLAN_CLAIM_SUBMITTED:
        data = createClaimData();
        break;
      case EventType.PLAN_CLAIM_PROCESSED:
        data = createClaimData(ClaimType.MEDICAL, ClaimStatus.APPROVED);
        break;
      case EventType.PLAN_BENEFIT_UTILIZED:
        data = createBenefitData();
        break;
      default:
        data = { id: uuidv4(), timestamp: new Date().toISOString() };
    }
  } else {
    // Generic data for other journeys
    data = { id: uuidv4(), timestamp: new Date().toISOString() };
  }
  
  return createBaseEvent(type, journey, data, options);
}