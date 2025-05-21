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
  Inject
} from '@nestjs/common';

import { MedicationsService } from './medications.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { AllExceptionsFilter } from '@app/shared/exceptions/exceptions.filter';
import { AUTH_INSUFFICIENT_PERMISSIONS } from '@app/shared/constants/error-codes.constants';
import { LoggerService } from '@app/shared/logging/logger.service';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { IMedication } from '@austa/interfaces/journey/care';
import { 
  MedicationNotFoundError,
  MedicationPersistenceError,
  MedicationAccessDeniedError
} from '@austa/errors/journey/care';

/**
 * Controller class for managing medications.
 * Provides HTTP endpoints for medication CRUD operations.
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
    this.logger.log({
      message: 'MedicationsController initialized',
      context: 'MedicationsController',
      correlationId: 'system-init'
    });
  }

  /**
   * Creates a new medication.
   * @param createMedicationDto The data for creating the medication
   * @param userId The ID of the user creating the medication
   * @returns The created medication
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createMedicationDto: CreateMedicationDto,
    @CurrentUser('id') userId: string
  ): Promise<IMedication> {
    const correlationId = `med-create-${Date.now()}`;
    
    this.logger.log({
      message: `Creating medication for user ${userId}`,
      context: 'MedicationsController.create',
      correlationId,
      userId,
      medicationName: createMedicationDto.name
    });
    
    try {
      return await this.medicationsService.create(createMedicationDto, userId);
    } catch (error) {
      this.logger.error({
        message: `Failed to create medication for user ${userId}`,
        context: 'MedicationsController.create',
        correlationId,
        userId,
        error
      });
      
      throw new MedicationPersistenceError(
        'Failed to create medication record',
        { userId, medicationName: createMedicationDto.name },
        error
      );
    }
  }

  /**
   * Retrieves all medications for the authenticated user.
   * @param userId The ID of the authenticated user
   * @returns A list of medications
   */
  @Get()
  async findAll(@CurrentUser('id') userId: string): Promise<IMedication[]> {
    const correlationId = `med-list-${userId}-${Date.now()}`;
    
    this.logger.log({
      message: `Retrieving all medications for user ${userId}`,
      context: 'MedicationsController.findAll',
      correlationId,
      userId
    });
    
    try {
      return await this.medicationsService.findAll({ where: { userId } }, { limit: 100 });
    } catch (error) {
      this.logger.error({
        message: `Failed to retrieve medications for user ${userId}`,
        context: 'MedicationsController.findAll',
        correlationId,
        userId,
        error
      });
      
      throw new MedicationPersistenceError(
        'Failed to retrieve medication list',
        { userId },
        error
      );
    }
  }

  /**
   * Retrieves a medication by ID.
   * @param id The ID of the medication to retrieve
   * @param userId The ID of the authenticated user
   * @returns The medication, if found
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ): Promise<IMedication> {
    const correlationId = `med-get-${id}-${Date.now()}`;
    
    this.logger.log({
      message: `Retrieving medication ${id} for user ${userId}`,
      context: 'MedicationsController.findOne',
      correlationId,
      userId,
      medicationId: id
    });
    
    try {
      const medication = await this.medicationsService.findOne(id);
      
      // Ensure user only accesses their own medications
      if (medication.userId !== userId) {
        this.logger.warn({
          message: `User ${userId} attempted to access medication ${id} belonging to user ${medication.userId}`,
          context: 'MedicationsController.findOne',
          correlationId,
          userId,
          medicationId: id,
          ownerUserId: medication.userId,
          securityEvent: true
        });
        
        throw new MedicationAccessDeniedError(
          'You do not have permission to access this medication',
          { medicationId: id, userId, ownerUserId: medication.userId }
        );
      }
      
      return medication;
    } catch (error) {
      // If it's already a known error type, just rethrow it
      if (error instanceof MedicationAccessDeniedError) {
        throw error;
      }
      
      // Handle not found errors
      if (error?.name === 'EntityNotFoundError' || error?.message?.includes('not found')) {
        this.logger.warn({
          message: `Medication ${id} not found`,
          context: 'MedicationsController.findOne',
          correlationId,
          userId,
          medicationId: id
        });
        
        throw new MedicationNotFoundError(
          `Medication with ID ${id} not found`,
          { medicationId: id }
        );
      }
      
      // Handle other errors
      this.logger.error({
        message: `Failed to retrieve medication ${id}`,
        context: 'MedicationsController.findOne',
        correlationId,
        userId,
        medicationId: id,
        error
      });
      
      throw new MedicationPersistenceError(
        'Failed to retrieve medication details',
        { medicationId: id },
        error
      );
    }
  }

  /**
   * Updates an existing medication.
   * @param id The ID of the medication to update
   * @param updateMedicationData The data to update the medication with
   * @param userId The ID of the authenticated user
   * @returns The updated medication
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMedicationData: Record<string, any>,
    @CurrentUser('id') userId: string
  ): Promise<IMedication> {
    const correlationId = `med-update-${id}-${Date.now()}`;
    
    this.logger.log({
      message: `Updating medication ${id} for user ${userId}`,
      context: 'MedicationsController.update',
      correlationId,
      userId,
      medicationId: id,
      updateFields: Object.keys(updateMedicationData)
    });
    
    try {
      const medication = await this.medicationsService.findOne(id);
      
      // Ensure user only updates their own medications
      if (medication.userId !== userId) {
        this.logger.warn({
          message: `User ${userId} attempted to update medication ${id} belonging to user ${medication.userId}`,
          context: 'MedicationsController.update',
          correlationId,
          userId,
          medicationId: id,
          ownerUserId: medication.userId,
          securityEvent: true
        });
        
        throw new MedicationAccessDeniedError(
          'You do not have permission to update this medication',
          { medicationId: id, userId, ownerUserId: medication.userId }
        );
      }
      
      return await this.medicationsService.update(id, updateMedicationData);
    } catch (error) {
      // If it's already a known error type, just rethrow it
      if (error instanceof MedicationAccessDeniedError) {
        throw error;
      }
      
      // Handle not found errors
      if (error?.name === 'EntityNotFoundError' || error?.message?.includes('not found')) {
        this.logger.warn({
          message: `Medication ${id} not found for update`,
          context: 'MedicationsController.update',
          correlationId,
          userId,
          medicationId: id
        });
        
        throw new MedicationNotFoundError(
          `Medication with ID ${id} not found`,
          { medicationId: id }
        );
      }
      
      // Handle other errors
      this.logger.error({
        message: `Failed to update medication ${id}`,
        context: 'MedicationsController.update',
        correlationId,
        userId,
        medicationId: id,
        error
      });
      
      throw new MedicationPersistenceError(
        'Failed to update medication details',
        { medicationId: id },
        error
      );
    }
  }

  /**
   * Removes a medication by ID.
   * @param id The ID of the medication to remove
   * @param userId The ID of the authenticated user
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ): Promise<void> {
    const correlationId = `med-delete-${id}-${Date.now()}`;
    
    this.logger.log({
      message: `Deleting medication ${id} for user ${userId}`,
      context: 'MedicationsController.remove',
      correlationId,
      userId,
      medicationId: id
    });
    
    try {
      const medication = await this.medicationsService.findOne(id);
      
      // Ensure user only deletes their own medications
      if (medication.userId !== userId) {
        this.logger.warn({
          message: `User ${userId} attempted to delete medication ${id} belonging to user ${medication.userId}`,
          context: 'MedicationsController.remove',
          correlationId,
          userId,
          medicationId: id,
          ownerUserId: medication.userId,
          securityEvent: true
        });
        
        throw new MedicationAccessDeniedError(
          'You do not have permission to delete this medication',
          { medicationId: id, userId, ownerUserId: medication.userId }
        );
      }
      
      await this.medicationsService.remove(id);
    } catch (error) {
      // If it's already a known error type, just rethrow it
      if (error instanceof MedicationAccessDeniedError) {
        throw error;
      }
      
      // Handle not found errors
      if (error?.name === 'EntityNotFoundError' || error?.message?.includes('not found')) {
        this.logger.warn({
          message: `Medication ${id} not found for deletion`,
          context: 'MedicationsController.remove',
          correlationId,
          userId,
          medicationId: id
        });
        
        throw new MedicationNotFoundError(
          `Medication with ID ${id} not found`,
          { medicationId: id }
        );
      }
      
      // Handle other errors
      this.logger.error({
        message: `Failed to delete medication ${id}`,
        context: 'MedicationsController.remove',
        correlationId,
        userId,
        medicationId: id,
        error
      });
      
      throw new MedicationPersistenceError(
        'Failed to delete medication',
        { medicationId: id },
        error
      );
    }
  }
}