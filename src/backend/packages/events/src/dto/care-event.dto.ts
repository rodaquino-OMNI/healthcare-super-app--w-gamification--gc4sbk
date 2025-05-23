import { IsNotEmpty, IsString, IsObject, IsUUID, IsOptional, IsNumber, IsEnum, IsBoolean, IsISO8601, IsArray, ValidateNested, Min, Max, IsPositive, Length, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessEventDto } from './base-event.dto';
import { AppointmentEventDto } from './appointment-event.dto';
import { MedicationEventDto } from './medication-event.dto';

/**
 * Enum for telemedicine session states
 */
export enum TelemedicineSessionState {
  SCHEDULED = 'scheduled',
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  MISSED = 'missed',
  TECHNICAL_ISSUES = 'technical_issues'
}

/**
 * Enum for care plan types
 */
export enum CarePlanType {
  CHRONIC_DISEASE = 'chronic_disease',
  PREVENTIVE = 'preventive',
  REHABILITATION = 'rehabilitation',
  MENTAL_HEALTH = 'mental_health',
  MATERNITY = 'maternity',
  POST_SURGERY = 'post_surgery',
  WELLNESS = 'wellness',
  CUSTOM = 'custom'
}

/**
 * Enum for care plan progress status
 */
export enum CarePlanProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  ON_TRACK = 'on_track',
  BEHIND = 'behind',
  AHEAD = 'ahead',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}

/**
 * DTO for provider information in care events
 */
export class CareProviderInfoDto {
  /**
   * The unique identifier of the healthcare provider
   */
  @IsNotEmpty()
  @IsUUID()
  providerId: string;

  /**
   * The name of the healthcare provider
   */
  @IsNotEmpty()
  @IsString()
  providerName: string;

  /**
   * The specialization of the healthcare provider
   */
  @IsNotEmpty()
  @IsString()
  specialization: string;

  /**
   * Optional provider rating (1-5)
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}

/**
 * DTO for technical details in telemedicine sessions
 */
export class TechnicalDetailsDto {
  /**
   * The platform used for the telemedicine session
   * @example "AUSTA Telemedicine"
   */
  @IsNotEmpty()
  @IsString()
  platform: string;

  /**
   * The connection quality rating (1-5)
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  connectionQuality?: number;

  /**
   * Whether video was enabled during the session
   */
  @IsOptional()
  @IsBoolean()
  videoEnabled?: boolean;

  /**
   * Whether audio was enabled during the session
   */
  @IsOptional()
  @IsBoolean()
  audioEnabled?: boolean;

  /**
   * The device type used by the patient
   * @example "mobile", "desktop", "tablet"
   */
  @IsOptional()
  @IsString()
  deviceType?: string;

  /**
   * Any technical issues encountered
   */
  @IsOptional()
  @IsString()
  technicalIssues?: string;
}

/**
 * DTO for care plan activity
 */
export class CarePlanActivityDto {
  /**
   * The unique identifier of the activity
   */
  @IsNotEmpty()
  @IsUUID()
  activityId: string;

  /**
   * The name of the activity
   */
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * The type of activity
   * @example "exercise", "medication", "appointment", "measurement"
   */
  @IsNotEmpty()
  @IsString()
  type: string;

  /**
   * The status of the activity
   * @example "completed", "pending", "overdue"
   */
  @IsNotEmpty()
  @IsString()
  status: string;

  /**
   * The scheduled date for the activity
   */
  @IsNotEmpty()
  @IsISO8601()
  scheduledDate: string;

  /**
   * The completion date for the activity (if completed)
   */
  @IsOptional()
  @IsISO8601()
  completionDate?: string;

  /**
   * Optional notes about the activity
   */
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Base DTO for care journey events
 */
export class CareEventDto extends ProcessEventDto {
  /**
   * The journey identifier - always 'care' for care journey events
   */
  @IsNotEmpty()
  @IsString()
  journey: string = 'care';
}

/**
 * DTO for telemedicine session events
 */
export class TelemedicineSessionEventDto extends CareEventDto {
  /**
   * The data associated with the telemedicine session event
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => TelemedicineSessionDataDto)
  data: TelemedicineSessionDataDto;
}

/**
 * DTO for telemedicine session event data
 */
export class TelemedicineSessionDataDto {
  /**
   * The session ID
   */
  @IsNotEmpty()
  @IsUUID()
  sessionId: string;

  /**
   * The current state of the session
   */
  @IsNotEmpty()
  @IsEnum(TelemedicineSessionState)
  state: TelemedicineSessionState;

  /**
   * The previous state of the session (for state transitions)
   */
  @IsOptional()
  @IsEnum(TelemedicineSessionState)
  previousState?: TelemedicineSessionState;

  /**
   * The scheduled start time of the session
   */
  @IsNotEmpty()
  @IsISO8601()
  scheduledStartTime: string;

  /**
   * The actual start time of the session (if started)
   */
  @IsOptional()
  @IsISO8601()
  actualStartTime?: string;

  /**
   * The end time of the session (if completed)
   */
  @IsOptional()
  @IsISO8601()
  endTime?: string;

  /**
   * The duration of the session in minutes (if completed)
   */
  @IsOptional()
  @IsNumber()
  @IsPositive()
  durationMinutes?: number;

  /**
   * Information about the healthcare provider
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CareProviderInfoDto)
  provider: CareProviderInfoDto;

  /**
   * The reason for the session
   */
  @IsNotEmpty()
  @IsString()
  reason: string;

  /**
   * Technical details about the session
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => TechnicalDetailsDto)
  technicalDetails?: TechnicalDetailsDto;

  /**
   * Whether this is a follow-up session
   */
  @IsOptional()
  @IsBoolean()
  isFollowUp?: boolean;

  /**
   * The ID of the previous session (if this is a follow-up)
   */
  @IsOptional()
  @IsUUID()
  previousSessionId?: string;

  /**
   * Optional notes about the session
   */
  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * Whether a prescription was issued during the session
   */
  @IsOptional()
  @IsBoolean()
  prescriptionIssued?: boolean;

  /**
   * Whether a follow-up session was recommended
   */
  @IsOptional()
  @IsBoolean()
  followUpRecommended?: boolean;
}

/**
 * DTO for care plan events
 */
export class CarePlanEventDto extends CareEventDto {
  /**
   * The data associated with the care plan event
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => CarePlanDataDto)
  data: CarePlanDataDto;
}

/**
 * DTO for care plan event data
 */
export class CarePlanDataDto {
  /**
   * The care plan ID
   */
  @IsNotEmpty()
  @IsUUID()
  carePlanId: string;

  /**
   * The care plan name
   */
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * The care plan type
   */
  @IsNotEmpty()
  @IsEnum(CarePlanType)
  type: CarePlanType;

  /**
   * The care plan start date
   */
  @IsNotEmpty()
  @IsISO8601()
  startDate: string;

  /**
   * The care plan end date (if applicable)
   */
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  /**
   * The current progress status of the care plan
   */
  @IsNotEmpty()
  @IsEnum(CarePlanProgressStatus)
  progressStatus: CarePlanProgressStatus;

  /**
   * The previous progress status (for status transitions)
   */
  @IsOptional()
  @IsEnum(CarePlanProgressStatus)
  previousProgressStatus?: CarePlanProgressStatus;

  /**
   * The progress percentage (0-100)
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage?: number;

  /**
   * The healthcare provider who created or is managing the care plan
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CareProviderInfoDto)
  provider: CareProviderInfoDto;

  /**
   * The condition or reason for the care plan
   */
  @IsNotEmpty()
  @IsString()
  condition: string;

  /**
   * The list of activities in the care plan
   */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => CarePlanActivityDto)
  activities?: CarePlanActivityDto[];

  /**
   * The number of completed activities
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  completedActivities?: number;

  /**
   * The total number of activities
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalActivities?: number;

  /**
   * Optional notes about the care plan
   */
  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * Whether the care plan is active
   */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Type representing all possible care event DTOs
 */
export type CareJourneyEventDto =
  | TelemedicineSessionEventDto
  | CarePlanEventDto
  | { type: string; data: AppointmentEventDto }
  | { type: string; data: MedicationEventDto };