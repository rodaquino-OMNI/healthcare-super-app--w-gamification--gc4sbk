import { IsNotEmpty, IsUUID } from 'class-validator';
import { ITelemedicineSessionRequest } from '@austa/interfaces/care/telemedicine-session';

/**
 * Data Transfer Object for creating a telemedicine session.
 * This DTO defines the structure of data required from the client
 * to initiate a telemedicine session in the Care Journey.
 * 
 * Implements the ITelemedicineSessionRequest interface from @austa/interfaces
 * to ensure type consistency between frontend and backend.
 */
export class CreateSessionDto implements ITelemedicineSessionRequest {
  /**
   * The ID of the user initiating the telemedicine session.
   * Must be a valid UUID.
   * 
   * This ID is used to associate the telemedicine session with the correct user
   * profile and medical records within the Care Journey.
   */
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}