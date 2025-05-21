import { 
  IsString, 
  IsNotEmpty, 
  IsDate, 
  IsOptional, 
  IsUUID,
  IsEnum
} from 'class-validator'; // version 0.14.0
import { AppointmentType } from '@austa/interfaces/journey/care';

/**
 * Data Transfer Object for creating a new appointment.
 * This class defines the structure and validation rules for appointment creation
 * requests in the Care Now journey.
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
  @IsDate()
  dateTime: Date;

  /**
   * Type of appointment (in-person or telemedicine).
   * Uses the standardized AppointmentType enum from shared interfaces.
   */
  @IsNotEmpty()
  @IsEnum(AppointmentType, {
    message: 'Type must be a valid appointment type (in-person or telemedicine)'
  })
  type: AppointmentType;

  /**
   * Optional reason for the appointment.
   */
  @IsOptional()
  @IsString()
  reason?: string;
}