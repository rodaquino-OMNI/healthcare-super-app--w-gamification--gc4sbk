import { IsNotEmpty, IsString, IsObject, IsUUID, IsOptional, IsEnum, IsISO8601, ValidateNested, IsBoolean, IsArray, ArrayMinSize, ArrayMaxSize, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessEventDto } from '../../../gamification-engine/src/events/dto/process-event.dto';

/**
 * Enum defining the types of care providers available in the system.
 */
export enum CareProviderType {
  GENERAL_PRACTITIONER = 'general_practitioner',
  SPECIALIST = 'specialist',
  NURSE = 'nurse',
  THERAPIST = 'therapist',
  NUTRITIONIST = 'nutritionist',
  PSYCHOLOGIST = 'psychologist',
  OTHER = 'other'
}

/**
 * Enum defining the possible appointment status values.
 */
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CHECKED_IN = 'checked_in',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled'
}

/**
 * Enum defining the possible telemedicine session types.
 */
export enum TelemedicineSessionType {
  VIDEO = 'video',
  AUDIO = 'audio',
  CHAT = 'chat'
}

/**
 * Enum defining the possible medication adherence status values.
 */
export enum MedicationAdherenceStatus {
  TAKEN = 'taken',
  SKIPPED = 'skipped',
  MISSED = 'missed',
  DELAYED = 'delayed'
}

/**
 * Enum defining the possible care plan progress status values.
 */
export enum CarePlanProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

/**
 * DTO for provider information in care events.
 */
export class ProviderInfoDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(CareProviderType)
  type: CareProviderType;

  @IsOptional()
  @IsString()
  specialization?: string;
}

/**
 * DTO for location information in care events.
 */
export class LocationInfoDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;
}

/**
 * Base DTO for all care journey events.
 * Extends the ProcessEventDto with care-specific properties.
 */
export class CareEventDto extends ProcessEventDto {
  /**
   * The journey identifier, always set to 'care' for care journey events.
   */
  @IsNotEmpty()
  @IsString()
  journey: string = 'care';
}

/**
 * DTO for appointment booking events.
 * Used when a user books a new appointment with a healthcare provider.
 */
export class AppointmentBookedEventDto extends CareEventDto {
  /**
   * The data associated with the appointment booking event.
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AppointmentBookedDataDto)
  data: AppointmentBookedDataDto;
}

/**
 * DTO for the data contained in an appointment booking event.
 */
export class AppointmentBookedDataDto {
  @IsNotEmpty()
  @IsUUID()
  appointmentId: string;

  @IsNotEmpty()
  @IsISO8601()
  appointmentDate: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ProviderInfoDto)
  provider: ProviderInfoDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationInfoDto)
  location: LocationInfoDto;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsNotEmpty()
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus = AppointmentStatus.SCHEDULED;
}

/**
 * DTO for appointment status update events.
 * Used when an appointment's status changes (check-in, completion, cancellation, etc.).
 */
export class AppointmentStatusUpdatedEventDto extends CareEventDto {
  /**
   * The data associated with the appointment status update event.
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AppointmentStatusUpdatedDataDto)
  data: AppointmentStatusUpdatedDataDto;
}

/**
 * DTO for the data contained in an appointment status update event.
 */
export class AppointmentStatusUpdatedDataDto {
  @IsNotEmpty()
  @IsUUID()
  appointmentId: string;

  @IsNotEmpty()
  @IsEnum(AppointmentStatus)
  previousStatus: AppointmentStatus;

  @IsNotEmpty()
  @IsEnum(AppointmentStatus)
  newStatus: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsISO8601()
  updatedAt: string;
}

/**
 * DTO for medication tracking events.
 * Used when a user logs taking, skipping, or missing medication.
 */
export class MedicationTrackedEventDto extends CareEventDto {
  /**
   * The data associated with the medication tracking event.
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MedicationTrackedDataDto)
  data: MedicationTrackedDataDto;
}

/**
 * DTO for the data contained in a medication tracking event.
 */
export class MedicationTrackedDataDto {
  @IsNotEmpty()
  @IsUUID()
  medicationId: string;

  @IsNotEmpty()
  @IsString()
  medicationName: string;

  @IsNotEmpty()
  @IsEnum(MedicationAdherenceStatus)
  status: MedicationAdherenceStatus;

  @IsNotEmpty()
  @IsISO8601()
  scheduledTime: string;

  @IsNotEmpty()
  @IsISO8601()
  trackedAt: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for telemedicine session events.
 * Used when a user starts, participates in, or completes a telemedicine session.
 */
export class TelemedicineSessionEventDto extends CareEventDto {
  /**
   * The data associated with the telemedicine session event.
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TelemedicineSessionDataDto)
  data: TelemedicineSessionDataDto;
}

/**
 * DTO for the data contained in a telemedicine session event.
 */
export class TelemedicineSessionDataDto {
  @IsNotEmpty()
  @IsUUID()
  sessionId: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ProviderInfoDto)
  provider: ProviderInfoDto;

  @IsNotEmpty()
  @IsEnum(TelemedicineSessionType)
  sessionType: TelemedicineSessionType;

  @IsNotEmpty()
  @IsISO8601()
  startTime: string;

  @IsOptional()
  @IsISO8601()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for care plan progress events.
 * Used when a user makes progress on their care plan or completes care plan items.
 */
export class CarePlanProgressEventDto extends CareEventDto {
  /**
   * The data associated with the care plan progress event.
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CarePlanProgressDataDto)
  data: CarePlanProgressDataDto;
}

/**
 * DTO for the data contained in a care plan progress event.
 */
export class CarePlanProgressDataDto {
  @IsNotEmpty()
  @IsUUID()
  carePlanId: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CarePlanItemDto)
  items: CarePlanItemDto[];

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(100)
  overallProgress: number;

  @IsNotEmpty()
  @IsISO8601()
  updatedAt: string;
}

/**
 * DTO for individual care plan items in a care plan progress event.
 */
export class CarePlanItemDto {
  @IsNotEmpty()
  @IsUUID()
  itemId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsEnum(CarePlanProgressStatus)
  status: CarePlanProgressStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}