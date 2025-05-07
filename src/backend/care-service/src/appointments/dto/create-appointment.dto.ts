import { 
  IsString, 
  IsNotEmpty, 
  IsDate, 
  IsOptional, 
  IsUUID,
  IsEnum,
  IsDateString
} from 'class-validator'; // version 0.14.0
import { AppointmentType } from '@austa/interfaces/journey/care';
import { Transform } from 'class-transformer';

/**
 * Data Transfer Object for creating a new appointment.
 * This class defines the structure and validation rules for appointment creation
 * requests in the Care journey.
 */
export class CreateAppointmentDto {
  /**
   * ID of the user scheduling the appointment.
   */
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  /**
   * ID of the healthcare provider for the appointment.
   */
  @IsNotEmpty()
  @IsUUID()
  providerId: string;

  /**
   * Date and time of the appointment.
   */
  @IsNotEmpty()
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  dateTime: Date;

  /**
   * Type of appointment (e.g., in-person, telemedicine).
   */
  @IsNotEmpty()
  @IsEnum(AppointmentType)
  type: AppointmentType;

  /**
   * Optional reason for the appointment.
   */
  @IsOptional()
  @IsString()
  reason?: string;
}