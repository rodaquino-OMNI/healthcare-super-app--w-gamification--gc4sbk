import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TelemedicineService } from './telemedicine.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { LoggerService } from '@app/logging';
import { IUser } from '@austa/interfaces/auth';
import { ITelemedicineSession } from '@austa/interfaces/journey/care';
import { AppException, ErrorType } from '@app/errors';
import { TelemedicineConnectionError } from '@app/errors/journey/care';

/**
 * Controller for handling telemedicine session requests in the Care journey.
 * Provides endpoints for initiating and managing virtual consultations.
 */
@Controller('telemedicine')
export class TelemedicineController {
  /**
   * Initializes the TelemedicineController with required dependencies.
   * 
   * @param telemedicineService - Service for handling telemedicine operations
   * @param logger - Service for structured logging with context
   */
  constructor(
    private readonly telemedicineService: TelemedicineService,
    private readonly logger: LoggerService
  ) {}

  /**
   * Starts a new telemedicine session.
   * 
   * This endpoint initiates a new virtual consultation session between a patient
   * and healthcare provider. It validates the request, creates the session record,
   * and returns connection details for the video consultation.
   * 
   * @param createSessionDto - Data required to create a telemedicine session
   * @param user - The authenticated user requesting the session
   * @returns The created telemedicine session with connection details
   */
  @Post('session')
  @UseGuards(JwtAuthGuard)
  async startTelemedicineSession(
    @Body() createSessionDto: CreateSessionDto,
    @CurrentUser() user: IUser
  ): Promise<ITelemedicineSession> {
    try {
      this.logger.log(
        'Initiating telemedicine session',
        {
          userId: user.id,
          journey: 'care',
          action: 'telemedicine.start'
        },
        'TelemedicineController'
      );
      
      // Call the telemedicine service to start a new session
      const session = await this.telemedicineService.startTelemedicineSession(createSessionDto);
      
      this.logger.log(
        `Telemedicine session started successfully`,
        {
          userId: user.id,
          sessionId: session.id,
          journey: 'care',
          action: 'telemedicine.started'
        },
        'TelemedicineController'
      );
      
      // Return the result of the session creation
      return session;
    } catch (error) {
      // If it's already an AppException, just rethrow
      if (error instanceof AppException) {
        throw error;
      }
      
      this.logger.error(
        `Failed to start telemedicine session: ${error.message}`,
        {
          userId: user.id,
          journey: 'care',
          action: 'telemedicine.error',
          error: error.message,
          stack: error.stack
        },
        'TelemedicineController'
      );
      
      // Wrap other errors with journey-specific error class
      throw new TelemedicineConnectionError(
        'Failed to establish telemedicine connection',
        { userId: user.id, dto: createSessionDto },
        error
      );
    }
  }
}