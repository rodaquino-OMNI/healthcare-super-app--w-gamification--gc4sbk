import { IsNotEmpty, IsUUID } from '@app/shared/validation';
import { ITelemedicineSessionRequest } from '@austa/interfaces/journey/care';

/**
 * Data Transfer Object for creating a telemedicine session.
 * This DTO defines the structure of data required from the client
 * to initiate a telemedicine session in the Care Journey.
 *
 * @implements {ITelemedicineSessionRequest} - Implements the standard interface for telemedicine session requests
 * @description Used for validating incoming requests to create new telemedicine sessions
 * in the Care Journey. Ensures that the user ID is provided and is a valid UUID.
 */
export class CreateSessionDto implements ITelemedicineSessionRequest {
  /**
   * The ID of the user initiating the telemedicine session.
   * Must be a valid UUID.
   * 
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @IsNotEmpty({ message: 'User ID is required for telemedicine session' })
  @IsUUID(undefined, { message: 'User ID must be a valid UUID' })
  userId: string;
}