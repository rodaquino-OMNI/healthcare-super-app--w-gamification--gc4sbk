import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TelemedicineService } from './telemedicine.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TelemedicineConnectionError } from '@austa/errors/journey/care';
import { ITelemedicineSession, IUserContext } from '@austa/interfaces/journey/care';

/**
 * Controller for handling telemedicine session requests in the Care journey.
 * Provides endpoints for initiating and managing telemedicine sessions between
 * patients and healthcare providers.
 */
@Controller('telemedicine')
export class TelemedicineController {
  /**
   * Initializes the TelemedicineController with required dependencies.
   * 
   * @param telemedicineService - Service for handling telemedicine operations
   * @param logger - Service for structured logging with context information
   */
  constructor(
    private readonly telemedicineService: TelemedicineService,
    private readonly logger: LoggerService
  ) {}

  /**
   * Starts a new telemedicine session between a patient and healthcare provider.
   * Requires authentication via JWT and validates the user's permissions before
   * initiating the session.
   * 
   * @param createSessionDto - Data required to create a telemedicine session
   * @param user - The authenticated user context from the JWT token
   * @returns The created telemedicine session with connection details
   * @throws TelemedicineConnectionError if session creation fails
   */
  @Post('session')
  @UseGuards(JwtAuthGuard)
  async startTelemedicineSession(
    @Body() createSessionDto: CreateSessionDto,
    @CurrentUser() user: IUserContext
  ): Promise<ITelemedicineSession> {
    try {
      // Create structured context for consistent logging
      const logContext = {
        userId: user.id,
        journey: 'care',
        action: 'startTelemedicineSession',
        correlationId: user.correlationId || `telemedicine-${Date.now()}`,
        requestData: { ...createSessionDto }
      };
      
      // Log the session creation attempt with structured context
      this.logger.log(
        'Telemedicine session creation initiated',
        logContext,
        'TelemedicineController'
      );
      
      // Ensure the user ID in the DTO matches the authenticated user
      const sessionRequest = {
        ...createSessionDto,
        userId: user.id // Override with authenticated user ID for security
      };
      
      // Call the telemedicine service to start a new session
      const session = await this.telemedicineService.startTelemedicineSession(sessionRequest);
      
      // Log successful session creation with context
      this.logger.log(
        `Telemedicine session started successfully`,
        {
          ...logContext,
          sessionId: session.id,
          status: 'success',
          duration: Date.now() - new Date(logContext.correlationId.split('-')[1]).getTime()
        },
        'TelemedicineController'
      );
      
      // Return the session with connection details
      return session;
    } catch (error) {
      // Create error context with detailed information for troubleshooting
      const errorContext = {
        userId: user.id,
        journey: 'care',
        action: 'startTelemedicineSession',
        correlationId: user.correlationId || `telemedicine-${Date.now()}`,
        status: 'error',
        errorType: error.name,
        errorCode: error.code || 'UNKNOWN',
        errorMessage: error.message,
        requestData: { ...createSessionDto }
      };
      
      // Log the error with structured context
      this.logger.error(
        `Failed to start telemedicine session: ${error.message}`,
        errorContext,
        error.stack,
        'TelemedicineController'
      );
      
      // Rethrow AppExceptions (including TelemedicineConnectionError)
      if (error.name === 'AppException' || error.name === 'TelemedicineConnectionError') {
        throw error;
      }
      
      // Wrap other errors in a TelemedicineConnectionError
      throw new TelemedicineConnectionError(
        'Failed to start telemedicine session',
        { dto: createSessionDto, userId: user.id, correlationId: errorContext.correlationId },
        error
      );
    }
  }
}