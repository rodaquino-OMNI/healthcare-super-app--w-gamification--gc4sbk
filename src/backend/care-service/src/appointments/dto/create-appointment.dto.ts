import { 
  IsString, 
  IsNotEmpty, 
  IsDate, 
  IsOptional, 
  IsUUID,
  IsIn
} from 'class-validator';
import { AppointmentType } from '@austa/interfaces/journey/care';

/**
 * Data Transfer Object for creating a new appointment.
 * This class defines the structure and validation rules for appointment creation
 * requests in the Care Now journey. It ensures that all required fields are present
 * and properly formatted before processing the appointment creation request.
 */
export class CreateAppointmentDto {
  /**
   * ID of the user scheduling the appointment.
   * Must be a valid UUID format.
   */
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  /**
   * ID of the healthcare provider for the appointment.
   * Must be a valid UUID format.
   */
  @IsNotEmpty()
  @IsUUID()
  providerId: string;

  /**
   * Date and time of the appointment.
   * Must be a valid Date object.
   */
  @IsNotEmpty()
  @IsDate()
  dateTime: Date;

  /**
   * Type of appointment (in-person or telemedicine).
   * Must be one of the values defined in the AppointmentType enum.
   */
  @IsNotEmpty()
  @IsString()
  @IsIn([AppointmentType.IN_PERSON, AppointmentType.TELEMEDICINE])
  type: AppointmentType;

  /**
   * Optional reason for the appointment.
   * Provides additional context for the healthcare provider.
   */
  @IsOptional()
  @IsString()
  reason?: string;
}