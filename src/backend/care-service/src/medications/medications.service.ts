import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Import from @austa/interfaces for type-safe medication data models
import { IMedication } from '@austa/interfaces/journey/care';

// Use standardized path aliases
import { CreateMedicationDto } from './dto/create-medication.dto';
import { Medication } from './entities/medication.entity';
import { Service } from '@app/shared/interfaces/service.interface';
import { FilterDto } from '@app/shared/dto/filter.dto';
import { PaginationDto } from '@app/shared/dto/pagination.dto';

// Import from @austa/errors for standardized error handling
import { 
  BaseError, 
  ErrorType,
  MedicationNotFoundError,
  MedicationPersistenceError
} from '@austa/errors/journey/care';

// Import from @app/shared for logging and configuration
import { LoggerService } from '@app/shared/logging/logger.service';
import { Configuration } from '@app/care/config/configuration';

// Import from @austa/events for reliable Kafka event publishing
import { KafkaProducer } from '@austa/events/kafka';

/**
 * Service class for managing medications.
 * Handles the business logic for medication tracking, including
 * creating, retrieving, updating, and deleting medication records.
 */
@Injectable()
export class MedicationsService {
  /**
   * Constructor for MedicationsService.
   * @param medicationsRepository The TypeORM repository for medications
   * @param logger The logging service
   * @param kafkaProducer The Kafka producer for event publishing
   * @param configService The configuration service
   */
  constructor(
    @InjectRepository(Medication)
    private readonly medicationsRepository: Repository<Medication>,
    private readonly logger: LoggerService,
    private readonly kafkaProducer: KafkaProducer,
    private readonly configService: Configuration
  ) {
    // Initializes the logger
    this.logger.log('MedicationsService initialized', 'MedicationsService');
  }

  /**
   * Creates a new medication.
   * @param createMedicationDto The data for creating the medication
   * @param userId The ID of the user who owns the medication
   * @returns The created medication
   */
  async create(createMedicationDto: CreateMedicationDto, userId: string): Promise<IMedication> {
    try {
      // Creates a new medication entity
      const medication = this.medicationsRepository.create({
        ...createMedicationDto,
        userId,
        startDate: new Date(createMedicationDto.startDate),
        endDate: createMedicationDto.endDate ? new Date(createMedicationDto.endDate) : null
      });

      // Saves the medication to the database with connection pooling
      const savedMedication = await this.medicationsRepository.save(medication);
      
      // Publish event for gamification if enabled with retry mechanism
      if (this.configService.gamification?.enabled) {
        try {
          await this.kafkaProducer.produce({
            topic: this.configService.gamification.defaultEvents.medicationAdherence,
            messages: [{
              value: JSON.stringify({
                eventType: 'MEDICATION_CREATED',
                userId,
                medicationId: savedMedication.id,
                timestamp: new Date().toISOString()
              })
            }],
            // Retry configuration with exponential backoff
            retryConfig: {
              retries: 3,
              initialDelay: 100,
              maxDelay: 1000,
              factor: 2
            }
          });
        } catch (error) {
          this.logger.error('Failed to publish medication creation event', error, 'MedicationsService');
          // Continue despite Kafka error - non-critical operation
        }
      }

      this.logger.log(`Medication created: ${savedMedication.id} for user ${userId}`, 'MedicationsService');
      
      // Returns the created medication
      return savedMedication;
    } catch (error) {
      this.logger.error('Failed to create medication', error, 'MedicationsService');
      throw new MedicationPersistenceError(
        'Failed to create medication record',
        { userId, medication: createMedicationDto },
        error
      );
    }
  }

  /**
   * Finds all medications based on the filter and pagination parameters.
   * @param filterDto Filter criteria for the query
   * @param paginationDto Pagination parameters
   * @returns A list of medications
   */
  async findAll(filterDto: FilterDto, paginationDto: PaginationDto): Promise<IMedication[]> {
    try {
      // Retrieves all medications from the database based on the filter and pagination parameters
      const queryBuilder = this.medicationsRepository.createQueryBuilder('medication');
      
      // Apply filters
      if (filterDto?.where) {
        Object.entries(filterDto.where).forEach(([key, value]) => {
          queryBuilder.andWhere(`medication.${key} = :${key}`, { [key]: value });
        });
      }
      
      // Apply sorting
      if (filterDto?.orderBy) {
        Object.entries(filterDto.orderBy).forEach(([key, value]) => {
          queryBuilder.orderBy(`medication.${key}`, value.toUpperCase());
        });
      } else {
        queryBuilder.orderBy('medication.createdAt', 'DESC');
      }
      
      // Apply pagination
      if (paginationDto) {
        const skip = paginationDto.skip || 
          (paginationDto.page && paginationDto.limit ? (paginationDto.page - 1) * paginationDto.limit : 0);
        const take = paginationDto.limit || 10;
        
        queryBuilder.skip(skip).take(take);
      }
      
      // Returns the list of medications
      return await queryBuilder.getMany();
    } catch (error) {
      this.logger.error('Failed to fetch medications', error, 'MedicationsService');
      throw new MedicationPersistenceError(
        'Failed to retrieve medications',
        { filter: filterDto, pagination: paginationDto },
        error
      );
    }
  }

  /**
   * Finds a medication by ID.
   * @param id The ID of the medication to find
   * @returns The medication, if found
   */
  async findOne(id: string): Promise<IMedication> {
    try {
      // Retrieves the medication from the database by ID
      const medication = await this.medicationsRepository.findOne({ where: { id } });
      
      if (!medication) {
        throw new MedicationNotFoundError(
          `Medication with ID ${id} not found`,
          { id }
        );
      }
      
      // Returns the medication, if found
      return medication;
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      
      this.logger.error(`Failed to fetch medication with ID ${id}`, error, 'MedicationsService');
      throw new MedicationPersistenceError(
        `Failed to retrieve medication`,
        { id },
        error
      );
    }
  }

  /**
   * Updates an existing medication.
   * @param id The ID of the medication to update
   * @param updateMedicationData The data to update the medication with
   * @returns The updated medication
   */
  async update(id: string, updateMedicationData: Record<string, any>): Promise<IMedication> {
    try {
      // Retrieves the medication from the database by ID
      const medication = await this.findOne(id);
      
      // Handle date conversions
      if (updateMedicationData.startDate) {
        updateMedicationData.startDate = new Date(updateMedicationData.startDate);
      }
      
      if (updateMedicationData.endDate) {
        updateMedicationData.endDate = updateMedicationData.endDate ? 
          new Date(updateMedicationData.endDate) : null;
      }
      
      // Updates the medication with the new data
      Object.assign(medication, updateMedicationData);
      
      // Saves the updated medication to the database
      const updatedMedication = await this.medicationsRepository.save(medication);
      
      this.logger.log(`Medication updated: ${id}`, 'MedicationsService');
      
      // Returns the updated medication
      return updatedMedication;
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      
      this.logger.error(`Failed to update medication with ID ${id}`, error, 'MedicationsService');
      throw new MedicationPersistenceError(
        `Failed to update medication`,
        { id, updateData: updateMedicationData },
        error
      );
    }
  }

  /**
   * Removes a medication by ID.
   * @param id The ID of the medication to remove
   */
  async remove(id: string): Promise<void> {
    try {
      // Verify the medication exists before deletion
      await this.findOne(id);
      
      // Deletes the medication from the database by ID
      await this.medicationsRepository.delete(id);
      
      this.logger.log(`Medication deleted: ${id}`, 'MedicationsService');
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      
      this.logger.error(`Failed to delete medication with ID ${id}`, error, 'MedicationsService');
      throw new MedicationPersistenceError(
        `Failed to delete medication`,
        { id },
        error
      );
    }
  }
}