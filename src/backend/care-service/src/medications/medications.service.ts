import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateMedicationDto } from './dto/create-medication.dto';
import { Medication } from './entities/medication.entity';
import { Service } from '@app/shared/interfaces/service.interface';
import { FilterDto } from '@app/shared/dto/filter.dto';
import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { LoggerService } from '@app/shared/logging/logger.service';
import { Configuration } from '@app/config/configuration';

// Import from @austa packages for type-safe data contracts
import { IMedication } from '@austa/interfaces/journey/care';

// Import error handling from @austa/errors
import {
  MedicationNotFoundError,
  MedicationPersistenceError,
  MedicationExternalLookupError
} from '@austa/errors/journey/care';

// Import Kafka producer with retry and circuit breaker
import { KafkaProducer } from '@austa/events/kafka';

// Import circuit breaker for external service interactions
import { CircuitBreaker } from '@austa/errors/utils/circuit-breaker';

/**
 * Service class for managing medications.
 * Handles the business logic for medication tracking, including
 * creating, retrieving, updating, and deleting medication records.
 */
@Injectable()
export class MedicationsService implements Service {
  // Circuit breaker for Kafka event publishing
  private kafkaCircuitBreaker: CircuitBreaker;

  /**
   * Constructor for MedicationsService.
   * @param medicationsRepository The TypeORM repository for medications
   * @param logger The logging service
   * @param kafkaProducer The Kafka producer service with retry capabilities
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
    
    // Initialize circuit breaker for Kafka operations
    this.kafkaCircuitBreaker = new CircuitBreaker({
      name: 'kafka-medication-events',
      failureThreshold: 3,
      resetTimeout: 30000, // 30 seconds
      fallback: async () => {
        this.logger.warn(
          'Circuit open: Using fallback for medication events', 
          'MedicationsService'
        );
        return true; // Continue despite Kafka failures
      }
    });
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
      
      // Publish event for gamification if enabled with circuit breaker pattern
      if (this.configService.gamification?.enabled) {
        try {
          await this.kafkaCircuitBreaker.execute(() => 
            this.kafkaProducer.produce({
              topic: this.configService.gamification.defaultEvents.medicationAdherence,
              messages: [{
                value: JSON.stringify({
                  eventType: 'MEDICATION_CREATED',
                  userId,
                  medicationId: savedMedication.id,
                  timestamp: new Date().toISOString()
                })
              }],
              // Enable retry with exponential backoff
              retryOptions: {
                retries: 3,
                initialDelay: 100,
                maxDelay: 3000,
                factor: 2
              }
            })
          );
        } catch (error) {
          this.logger.error(
            'Failed to publish medication creation event', 
            error, 
            'MedicationsService'
          );
          // Continue despite Kafka error (non-critical operation)
        }
      }

      this.logger.log(
        `Medication created: ${savedMedication.id} for user ${userId}`, 
        'MedicationsService'
      );
      
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
      if (error instanceof MedicationNotFoundError) {
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
      
      // Publish medication update event if gamification is enabled
      if (this.configService.gamification?.enabled) {
        try {
          await this.kafkaCircuitBreaker.execute(() => 
            this.kafkaProducer.produce({
              topic: this.configService.gamification.defaultEvents.medicationAdherence,
              messages: [{
                value: JSON.stringify({
                  eventType: 'MEDICATION_UPDATED',
                  userId: medication.userId,
                  medicationId: id,
                  timestamp: new Date().toISOString()
                })
              }],
              // Enable retry with exponential backoff
              retryOptions: {
                retries: 3,
                initialDelay: 100,
                maxDelay: 3000,
                factor: 2
              }
            })
          );
        } catch (error) {
          this.logger.error(
            'Failed to publish medication update event', 
            error, 
            'MedicationsService'
          );
          // Continue despite Kafka error (non-critical operation)
        }
      }
      
      this.logger.log(`Medication updated: ${id}`, 'MedicationsService');
      
      // Returns the updated medication
      return updatedMedication;
    } catch (error) {
      if (error instanceof MedicationNotFoundError) {
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
      const medication = await this.findOne(id);
      
      // Deletes the medication from the database by ID
      await this.medicationsRepository.delete(id);
      
      // Publish medication deletion event if gamification is enabled
      if (this.configService.gamification?.enabled) {
        try {
          await this.kafkaCircuitBreaker.execute(() => 
            this.kafkaProducer.produce({
              topic: this.configService.gamification.defaultEvents.medicationAdherence,
              messages: [{
                value: JSON.stringify({
                  eventType: 'MEDICATION_DELETED',
                  userId: medication.userId,
                  medicationId: id,
                  timestamp: new Date().toISOString()
                })
              }],
              // Enable retry with exponential backoff
              retryOptions: {
                retries: 3,
                initialDelay: 100,
                maxDelay: 3000,
                factor: 2
              }
            })
          );
        } catch (error) {
          this.logger.error(
            'Failed to publish medication deletion event', 
            error, 
            'MedicationsService'
          );
          // Continue despite Kafka error (non-critical operation)
        }
      }
      
      this.logger.log(`Medication deleted: ${id}`, 'MedicationsService');
    } catch (error) {
      if (error instanceof MedicationNotFoundError) {
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

  /**
   * Tracks medication adherence and publishes events to the gamification engine.
   * @param medicationId The ID of the medication
   * @param userId The ID of the user
   * @param taken Whether the medication was taken
   * @returns Success status
   */
  async trackAdherence(medicationId: string, userId: string, taken: boolean): Promise<boolean> {
    try {
      // Verify the medication exists
      const medication = await this.findOne(medicationId);
      
      // Verify the medication belongs to the user
      if (medication.userId !== userId) {
        throw new MedicationNotFoundError(
          `Medication with ID ${medicationId} not found for user ${userId}`,
          { medicationId, userId }
        );
      }
      
      // Update the medication's last taken date if taken
      if (taken) {
        await this.update(medicationId, { lastTakenAt: new Date() });
      }
      
      // Publish medication adherence event with circuit breaker pattern
      if (this.configService.gamification?.enabled) {
        try {
          await this.kafkaCircuitBreaker.execute(() => 
            this.kafkaProducer.produce({
              topic: this.configService.gamification.defaultEvents.medicationAdherence,
              messages: [{
                value: JSON.stringify({
                  eventType: taken ? 'MEDICATION_TAKEN' : 'MEDICATION_SKIPPED',
                  userId,
                  medicationId,
                  medicationName: medication.name,
                  timestamp: new Date().toISOString()
                })
              }],
              // Enable retry with exponential backoff
              retryOptions: {
                retries: 3,
                initialDelay: 100,
                maxDelay: 3000,
                factor: 2
              }
            })
          );
        } catch (error) {
          this.logger.error(
            'Failed to publish medication adherence event', 
            error, 
            'MedicationsService'
          );
          // Continue despite Kafka error (non-critical operation)
        }
      }
      
      this.logger.log(
        `Medication ${taken ? 'taken' : 'skipped'}: ${medicationId} by user ${userId}`, 
        'MedicationsService'
      );
      
      return true;
    } catch (error) {
      if (error instanceof MedicationNotFoundError) {
        throw error;
      }
      
      this.logger.error(
        `Failed to track adherence for medication ${medicationId}`, 
        error, 
        'MedicationsService'
      );
      throw new MedicationPersistenceError(
        `Failed to track medication adherence`,
        { medicationId, userId, taken },
        error
      );
    }
  }

  /**
   * Verifies medication information with external drug information service.
   * Implements circuit breaker pattern for external service interactions.
   * @param medicationName The name of the medication to verify
   * @returns Verification result
   */
  async verifyMedicationInfo(medicationName: string): Promise<any> {
    // Create a circuit breaker for the external drug information service
    const drugInfoCircuitBreaker = new CircuitBreaker({
      name: 'external-drug-info-service',
      failureThreshold: 3,
      resetTimeout: 60000, // 60 seconds
      fallback: async () => {
        this.logger.warn(
          'Circuit open: Using fallback for drug information service', 
          'MedicationsService'
        );
        // Return basic information when external service is unavailable
        return { 
          verified: false,
          message: 'Drug information service temporarily unavailable',
          fallback: true
        };
      }
    });
    
    try {
      // Execute the external service call with circuit breaker protection
      return await drugInfoCircuitBreaker.execute(async () => {
        // Simulated external service call
        // In a real implementation, this would call an actual external API
        this.logger.log(
          `Verifying medication information for: ${medicationName}`, 
          'MedicationsService'
        );
        
        // Simulate successful verification
        return {
          verified: true,
          name: medicationName,
          genericName: `Generic ${medicationName}`,
          category: 'Simulated Category',
          interactions: [],
          sideEffects: ['Simulated side effect 1', 'Simulated side effect 2']
        };
      });
    } catch (error) {
      this.logger.error(
        `Failed to verify medication information for ${medicationName}`, 
        error, 
        'MedicationsService'
      );
      throw new MedicationExternalLookupError(
        `Failed to verify medication information`,
        { medicationName },
        error
      );
    }
  }
}