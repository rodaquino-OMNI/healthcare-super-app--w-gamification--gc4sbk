import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete, 
  UseGuards, 
  UseFilters,
  HttpCode,
  HttpStatus,
  Inject,
  Request
} from '@nestjs/common'; // v10.3.0

import { MedicationsService } from './medications.service';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { AllExceptionsFilter } from '@app/shared/exceptions/exceptions.filter';
import { AUTH_INSUFFICIENT_PERMISSIONS } from '@app/shared/constants/error-codes.constants';
import { LoggerService } from '@app/shared/logging/logger.service';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { AppException, ErrorType, ErrorCategory } from '@app/shared/exceptions/exceptions.types';

// Import interfaces from the centralized interfaces package
import { IMedication, CreateMedicationDto } from '@austa/interfaces/journey/care';

/**
 * Controller class for managing medications.
 * Provides CRUD operations for medication management as part of the Care journey.
 */
@Controller('medications')
@UseGuards(JwtAuthGuard)
@UseFilters(AllExceptionsFilter)
export class MedicationsController {
  /**
   * Constructor for MedicationsController.
   * @param medicationsService The service for handling medication business logic
   * @param logger The logger service for logging operations
   */
  constructor(
    private readonly medicationsService: MedicationsService,
    private readonly logger: LoggerService
  ) {
    this.logger.setContext('MedicationsController');
    this.logger.log('MedicationsController initialized');
  }

  /**
   * Creates a new medication.
   * @param createMedicationDto The data for creating the medication
   * @param userId The ID of the authenticated user
   * @returns The created medication
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createMedicationDto: CreateMedicationDto,
    @CurrentUser('id') userId: string,
    @Request() req: any
  ): Promise<IMedication> {
    const correlationId = req.headers['x-correlation-id'] || 'unknown';
    this.logger.log({
      message: 'Creating medication',
      userId,
      correlationId,
      journey: 'care'
    });
    
    try {
      return await this.medicationsService.create(createMedicationDto, userId);
    } catch (error) {
      this.logger.error({
        message: 'Failed to create medication',
        error: error.message,
        userId,
        correlationId,
        journey: 'care'
      });
      throw error;
    }
  }

  /**
   * Retrieves all medications for the authenticated user.
   * @param userId The ID of the authenticated user
   * @param req The request object containing correlation ID
   * @returns A list of medications
   */
  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Request() req: any
  ): Promise<IMedication[]> {
    const correlationId = req.headers['x-correlation-id'] || 'unknown';
    this.logger.log({
      message: 'Retrieving all medications',
      userId,
      correlationId,
      journey: 'care'
    });
    
    try {
      return await this.medicationsService.findAll({ where: { userId } }, { limit: 100 });
    } catch (error) {
      this.logger.error({
        message: 'Failed to retrieve medications',
        error: error.message,
        userId,
        correlationId,
        journey: 'care'
      });
      throw error;
    }
  }

  /**
   * Retrieves a medication by ID.
   * @param id The ID of the medication to retrieve
   * @param userId The ID of the authenticated user
   * @param req The request object containing correlation ID
   * @returns The medication, if found
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Request() req: any
  ): Promise<IMedication> {
    const correlationId = req.headers['x-correlation-id'] || 'unknown';
    this.logger.log({
      message: 'Retrieving medication by ID',
      medicationId: id,
      userId,
      correlationId,
      journey: 'care'
    });
    
    try {
      const medication = await this.medicationsService.findOne(id);
      
      // Ensure user only accesses their own medications
      if (medication.userId !== userId) {
        this.logger.warn({
          message: 'Unauthorized medication access attempt',
          medicationId: id,
          requestingUserId: userId,
          ownerUserId: medication.userId,
          correlationId,
          journey: 'care'
        });
        
        throw new AppException(
          'You do not have permission to access this medication',
          ErrorType.BUSINESS,
          AUTH_INSUFFICIENT_PERMISSIONS,
          ErrorCategory.CLIENT
        );
      }
      
      return medication;
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      
      this.logger.error({
        message: 'Failed to retrieve medication',
        error: error.message,
        medicationId: id,
        userId,
        correlationId,
        journey: 'care'
      });
      
      throw error;
    }
  }

  /**
   * Updates an existing medication.
   * @param id The ID of the medication to update
   * @param updateMedicationData The data to update the medication with
   * @param userId The ID of the authenticated user
   * @param req The request object containing correlation ID
   * @returns The updated medication
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMedicationData: Partial<IMedication>,
    @CurrentUser('id') userId: string,
    @Request() req: any
  ): Promise<IMedication> {
    const correlationId = req.headers['x-correlation-id'] || 'unknown';
    this.logger.log({
      message: 'Updating medication',
      medicationId: id,
      userId,
      correlationId,
      journey: 'care'
    });
    
    try {
      const medication = await this.medicationsService.findOne(id);
      
      // Ensure user only updates their own medications
      if (medication.userId !== userId) {
        this.logger.warn({
          message: 'Unauthorized medication update attempt',
          medicationId: id,
          requestingUserId: userId,
          ownerUserId: medication.userId,
          correlationId,
          journey: 'care'
        });
        
        throw new AppException(
          'You do not have permission to update this medication',
          ErrorType.BUSINESS,
          AUTH_INSUFFICIENT_PERMISSIONS,
          ErrorCategory.CLIENT
        );
      }
      
      return await this.medicationsService.update(id, updateMedicationData);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      
      this.logger.error({
        message: 'Failed to update medication',
        error: error.message,
        medicationId: id,
        userId,
        correlationId,
        journey: 'care'
      });
      
      throw error;
    }
  }

  /**
   * Removes a medication by ID.
   * @param id The ID of the medication to remove
   * @param userId The ID of the authenticated user
   * @param req The request object containing correlation ID
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Request() req: any
  ): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] || 'unknown';
    this.logger.log({
      message: 'Deleting medication',
      medicationId: id,
      userId,
      correlationId,
      journey: 'care'
    });
    
    try {
      const medication = await this.medicationsService.findOne(id);
      
      // Ensure user only deletes their own medications
      if (medication.userId !== userId) {
        this.logger.warn({
          message: 'Unauthorized medication deletion attempt',
          medicationId: id,
          requestingUserId: userId,
          ownerUserId: medication.userId,
          correlationId,
          journey: 'care'
        });
        
        throw new AppException(
          'You do not have permission to delete this medication',
          ErrorType.BUSINESS,
          AUTH_INSUFFICIENT_PERMISSIONS,
          ErrorCategory.CLIENT
        );
      }
      
      await this.medicationsService.remove(id);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      
      this.logger.error({
        message: 'Failed to delete medication',
        error: error.message,
        medicationId: id,
        userId,
        correlationId,
        journey: 'care'
      });
      
      throw error;
    }
  }
}