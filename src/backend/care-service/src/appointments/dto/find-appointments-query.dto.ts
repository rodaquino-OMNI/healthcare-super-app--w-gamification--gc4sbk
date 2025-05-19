import { IsOptional, IsUUID, IsEnum, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentType, AppointmentStatus } from '@austa/interfaces/journey/care';

/**
 * Data Transfer Object for querying appointments.
 * This class defines the structure and validation rules for appointment query
 * parameters in the Care journey.
 */
export class FindAppointmentsQueryDto {
  /**
   * Optional filter by user ID
   */
  @IsOptional()
  @IsUUID()
  userId?: string;

  /**
   * Optional filter by provider ID
   */
  @IsOptional()
  @IsUUID()
  providerId?: string;

  /**
   * Optional filter by appointment status
   */
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  /**
   * Optional filter by appointment type
   */
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  /**
   * Optional filter for appointments after this date
   */
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  /**
   * Optional filter for appointments before this date
   */
  @IsOptional()
  @IsDateString()
  toDate?: string;

  /**
   * Optional pagination parameter - page number
   * @default 1
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Optional pagination parameter - items per page
   * @default 10
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}