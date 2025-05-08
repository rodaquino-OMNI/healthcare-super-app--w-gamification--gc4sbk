/**
 * Entity Mapper Utilities
 * 
 * Provides utilities for mapping between database entities and domain models across journey services.
 * Implements type-safe mapping functions for converting Prisma database records to business domain objects
 * and vice versa. Includes specialized mappers for different journeys (Health, Care, Plan) with support
 * for nested relations and computed properties.
 */

import { Logger } from '@nestjs/common';

// Import journey interfaces
import {
  IHealthMetric,
  IHealthGoal,
  IMedicalEvent,
  IDeviceConnection,
  MetricType,
  GoalType,
} from '@austa/interfaces/journey/health';

import {
  IAppointment,
  IProvider,
  IMedication,
  ITelemedicineSession,
  ITreatmentPlan,
  AppointmentStatus,
} from '@austa/interfaces/journey/care';

import {
  IPlan,
  IBenefit,
  ICoverage,
  IClaim,
  IDocument,
  ClaimStatus,
} from '@austa/interfaces/journey/plan';

// Create a private logger instance for the entity mappers
const logger = new Logger('EntityMappers');

/**
 * Type for mapping functions that convert database entities to domain models
 */
export type EntityMapper<TEntity, TModel> = (entity: TEntity) => TModel;

/**
 * Type for mapping functions that convert domain models to database entities
 */
export type ModelMapper<TModel, TEntity> = (model: TModel) => TEntity;

/**
 * Type for selective mapping options to include only specific fields
 */
export type SelectiveMapOptions<T> = {
  include?: Array<keyof T>;
  exclude?: Array<keyof T>;
};

/**
 * Type for computed property mapping function
 */
export type ComputedPropertyFn<TEntity, TValue> = (entity: TEntity) => TValue;

/**
 * Type for computed property mapping configuration
 */
export type ComputedProperty<TEntity, TValue> = {
  key: string;
  fn: ComputedPropertyFn<TEntity, TValue>;
};

/**
 * Options for entity mapping
 */
export interface EntityMapOptions<TEntity, TModel> {
  /**
   * Fields to include in the mapping (if not specified, all fields are included)
   */
  include?: Array<keyof TModel>;
  
  /**
   * Fields to exclude from the mapping
   */
  exclude?: Array<keyof TModel>;
  
  /**
   * Computed properties to add to the mapped model
   */
  computed?: Array<ComputedProperty<TEntity, any>>;
  
  /**
   * Nested mappers for related entities
   */
  relations?: {
    [key: string]: EntityMapper<any, any>;
  };
  
  /**
   * Whether to preserve null values (default: false)
   */
  preserveNull?: boolean;
  
  /**
   * Custom transformation function for the entire entity
   */
  transform?: (entity: TEntity) => Partial<TModel>;
}

/**
 * Options for batch mapping
 */
export interface BatchMapOptions<TEntity, TModel> extends EntityMapOptions<TEntity, TModel> {
  /**
   * Batch size for processing large datasets (default: 100)
   */
  batchSize?: number;
  
  /**
   * Whether to log progress during batch processing (default: false)
   */
  logProgress?: boolean;
  
  /**
   * Custom error handler for batch processing
   */
  onError?: (error: Error, entity: TEntity, index: number) => void;
}

/**
 * Creates a mapper function that converts a database entity to a domain model
 * 
 * @param options Mapping options
 * @returns A function that maps an entity to a model
 */
export function createEntityMapper<TEntity, TModel>(
  options: EntityMapOptions<TEntity, TModel> = {}
): EntityMapper<TEntity, TModel> {
  return (entity: TEntity): TModel => {
    if (!entity) {
      return null;
    }

    try {
      // Start with a custom transform if provided
      let model = options.transform ? options.transform(entity) : {} as Partial<TModel>;

      // Get all keys from the entity
      const entityKeys = Object.keys(entity);

      // Determine which keys to map based on include/exclude options
      const keysToMap = options.include
        ? entityKeys.filter(key => (options.include as string[]).includes(key))
        : options.exclude
        ? entityKeys.filter(key => !(options.exclude as string[]).includes(key))
        : entityKeys;

      // Map basic properties
      for (const key of keysToMap) {
        const value = entity[key];
        
        // Skip null values unless preserveNull is true
        if (value === null && !options.preserveNull) {
          continue;
        }
        
        model[key] = value;
      }

      // Map relations using provided mappers
      if (options.relations) {
        for (const [relationKey, relationMapper] of Object.entries(options.relations)) {
          const relationEntity = entity[relationKey];
          
          if (Array.isArray(relationEntity)) {
            // Handle one-to-many relations
            model[relationKey] = relationEntity.map(item => relationMapper(item));
          } else if (relationEntity || options.preserveNull) {
            // Handle one-to-one relations
            model[relationKey] = relationMapper(relationEntity);
          }
        }
      }

      // Add computed properties
      if (options.computed) {
        for (const { key, fn } of options.computed) {
          model[key] = fn(entity);
        }
      }

      return model as TModel;
    } catch (error) {
      logger.error(`Error mapping entity to model: ${error.message}`, error.stack);
      throw new Error(`Entity mapping failed: ${error.message}`);
    }
  };
}

/**
 * Creates a mapper function that converts a domain model to a database entity
 * 
 * @param options Mapping options
 * @returns A function that maps a model to an entity
 */
export function createModelMapper<TModel, TEntity>(
  options: EntityMapOptions<TModel, TEntity> = {}
): ModelMapper<TModel, TEntity> {
  return (model: TModel): TEntity => {
    if (!model) {
      return null;
    }

    try {
      // Start with a custom transform if provided
      let entity = options.transform ? options.transform(model) : {} as Partial<TEntity>;

      // Get all keys from the model
      const modelKeys = Object.keys(model);

      // Determine which keys to map based on include/exclude options
      const keysToMap = options.include
        ? modelKeys.filter(key => (options.include as string[]).includes(key))
        : options.exclude
        ? modelKeys.filter(key => !(options.exclude as string[]).includes(key))
        : modelKeys;

      // Map basic properties
      for (const key of keysToMap) {
        const value = model[key];
        
        // Skip null values unless preserveNull is true
        if (value === null && !options.preserveNull) {
          continue;
        }
        
        entity[key] = value;
      }

      // Map relations using provided mappers
      if (options.relations) {
        for (const [relationKey, relationMapper] of Object.entries(options.relations)) {
          const relationModel = model[relationKey];
          
          if (Array.isArray(relationModel)) {
            // Handle one-to-many relations
            entity[relationKey] = relationModel.map(item => relationMapper(item));
          } else if (relationModel || options.preserveNull) {
            // Handle one-to-one relations
            entity[relationKey] = relationMapper(relationModel);
          }
        }
      }

      // Add computed properties
      if (options.computed) {
        for (const { key, fn } of options.computed) {
          entity[key] = fn(model);
        }
      }

      return entity as TEntity;
    } catch (error) {
      logger.error(`Error mapping model to entity: ${error.message}`, error.stack);
      throw new Error(`Model mapping failed: ${error.message}`);
    }
  };
}

/**
 * Maps an array of entities to an array of models using the provided mapper
 * 
 * @param entities Array of entities to map
 * @param mapper Mapping function
 * @param options Batch mapping options
 * @returns Array of mapped models
 */
export function mapEntities<TEntity, TModel>(
  entities: TEntity[],
  mapper: EntityMapper<TEntity, TModel>,
  options: BatchMapOptions<TEntity, TModel> = {}
): TModel[] {
  if (!entities || entities.length === 0) {
    return [];
  }

  try {
    const batchSize = options.batchSize || 100;
    const logProgress = options.logProgress || false;
    const total = entities.length;
    const results: TModel[] = [];

    // Process in batches for better memory management with large datasets
    for (let i = 0; i < total; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      
      // Map each entity in the batch
      for (let j = 0; j < batch.length; j++) {
        const index = i + j;
        const entity = batch[j];
        
        try {
          const model = mapper(entity);
          results.push(model);
        } catch (error) {
          if (options.onError) {
            options.onError(error, entity, index);
          } else {
            logger.warn(`Error mapping entity at index ${index}: ${error.message}`);
          }
        }
      }
      
      // Log progress if enabled
      if (logProgress) {
        const progress = Math.min(i + batchSize, total);
        logger.log(`Mapped ${progress}/${total} entities (${Math.round((progress / total) * 100)}%)`);
      }
    }

    return results;
  } catch (error) {
    logger.error(`Error in batch mapping: ${error.message}`, error.stack);
    throw new Error(`Batch mapping failed: ${error.message}`);
  }
}

/**
 * Creates a mapper that selectively maps only specified fields from an entity
 * 
 * @param fields Array of field names to include in the mapping
 * @param mapper Base mapper function
 * @returns A mapper function that only includes the specified fields
 */
export function createSelectiveMapper<TEntity, TModel>(
  fields: Array<keyof TModel>,
  mapper: EntityMapper<TEntity, TModel>
): EntityMapper<TEntity, Partial<TModel>> {
  return (entity: TEntity): Partial<TModel> => {
    if (!entity) {
      return null;
    }

    const fullModel = mapper(entity);
    const partialModel: Partial<TModel> = {};

    for (const field of fields) {
      partialModel[field] = fullModel[field];
    }

    return partialModel;
  };
}

// ===== HEALTH JOURNEY MAPPERS =====

/**
 * Maps a Prisma HealthMetric entity to an IHealthMetric domain model
 */
export const mapHealthMetricEntity: EntityMapper<any, IHealthMetric> = createEntityMapper<any, IHealthMetric>({
  computed: [
    {
      key: 'formattedValue',
      fn: (entity) => {
        // Format the value based on metric type
        switch (entity.type) {
          case MetricType.HEART_RATE:
            return `${entity.value} bpm`;
          case MetricType.BLOOD_PRESSURE:
            return entity.value; // Already formatted as "120/80"
          case MetricType.BLOOD_GLUCOSE:
            return `${entity.value} mg/dL`;
          case MetricType.WEIGHT:
            return `${entity.value} kg`;
          case MetricType.STEPS:
            return entity.value.toLocaleString();
          case MetricType.SLEEP:
            return `${Math.floor(entity.value / 60)}h ${entity.value % 60}m`;
          default:
            return `${entity.value}`;
        }
      },
    },
    {
      key: 'isAbnormal',
      fn: (entity) => {
        // Determine if the value is outside normal range based on metric type
        switch (entity.type) {
          case MetricType.HEART_RATE:
            return entity.value < 60 || entity.value > 100;
          case MetricType.BLOOD_GLUCOSE:
            return entity.value < 70 || entity.value > 180;
          case MetricType.WEIGHT:
            // Would need user's target weight range for proper calculation
            return false;
          default:
            return false;
        }
      },
    },
  ],
});

/**
 * Maps a Prisma HealthGoal entity to an IHealthGoal domain model
 */
export const mapHealthGoalEntity: EntityMapper<any, IHealthGoal> = createEntityMapper<any, IHealthGoal>({
  computed: [
    {
      key: 'progressPercentage',
      fn: (entity) => {
        if (!entity.currentValue || !entity.targetValue) {
          return 0;
        }
        
        // Calculate progress percentage based on goal type
        switch (entity.type) {
          case GoalType.STEPS:
          case GoalType.EXERCISE_MINUTES:
          case GoalType.SLEEP_HOURS:
            // For accumulation goals, calculate percentage of target
            const percentage = (entity.currentValue / entity.targetValue) * 100;
            return Math.min(Math.round(percentage), 100);
          case GoalType.WEIGHT_LOSS:
            // For reduction goals, calculate percentage of progress from start to target
            if (entity.startValue === entity.targetValue) return 100;
            const weightProgress = (entity.startValue - entity.currentValue) / (entity.startValue - entity.targetValue) * 100;
            return Math.min(Math.max(Math.round(weightProgress), 0), 100);
          default:
            return 0;
        }
      },
    },
    {
      key: 'daysRemaining',
      fn: (entity) => {
        if (!entity.endDate) {
          return null;
        }
        
        const endDate = new Date(entity.endDate);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return Math.max(diffDays, 0);
      },
    },
  ],
});

/**
 * Maps a Prisma MedicalEvent entity to an IMedicalEvent domain model
 */
export const mapMedicalEventEntity: EntityMapper<any, IMedicalEvent> = createEntityMapper<any, IMedicalEvent>();

/**
 * Maps a Prisma DeviceConnection entity to an IDeviceConnection domain model
 */
export const mapDeviceConnectionEntity: EntityMapper<any, IDeviceConnection> = createEntityMapper<any, IDeviceConnection>();

// ===== CARE JOURNEY MAPPERS =====

/**
 * Maps a Prisma Appointment entity to an IAppointment domain model
 */
export const mapAppointmentEntity: EntityMapper<any, IAppointment> = createEntityMapper<any, IAppointment>({
  relations: {
    provider: mapProviderEntity,
  },
  computed: [
    {
      key: 'isUpcoming',
      fn: (entity) => {
        if (!entity.scheduledAt) {
          return false;
        }
        
        const appointmentDate = new Date(entity.scheduledAt);
        const now = new Date();
        
        return appointmentDate > now && entity.status === AppointmentStatus.CONFIRMED;
      },
    },
    {
      key: 'formattedDate',
      fn: (entity) => {
        if (!entity.scheduledAt) {
          return '';
        }
        
        const date = new Date(entity.scheduledAt);
        return date.toLocaleDateString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      },
    },
    {
      key: 'formattedTime',
      fn: (entity) => {
        if (!entity.scheduledAt) {
          return '';
        }
        
        const date = new Date(entity.scheduledAt);
        return date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
  ],
});

/**
 * Maps a Prisma Provider entity to an IProvider domain model
 */
export const mapProviderEntity: EntityMapper<any, IProvider> = createEntityMapper<any, IProvider>();

/**
 * Maps a Prisma Medication entity to an IMedication domain model
 */
export const mapMedicationEntity: EntityMapper<any, IMedication> = createEntityMapper<any, IMedication>({
  computed: [
    {
      key: 'adherenceRate',
      fn: (entity) => {
        if (!entity.takenDoses || !entity.scheduledDoses || entity.scheduledDoses === 0) {
          return 0;
        }
        
        return Math.round((entity.takenDoses / entity.scheduledDoses) * 100);
      },
    },
    {
      key: 'nextDoseFormatted',
      fn: (entity) => {
        if (!entity.nextDoseAt) {
          return '';
        }
        
        const date = new Date(entity.nextDoseAt);
        return date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
  ],
});

/**
 * Maps a Prisma TelemedicineSession entity to an ITelemedicineSession domain model
 */
export const mapTelemedicineSessionEntity: EntityMapper<any, ITelemedicineSession> = createEntityMapper<any, ITelemedicineSession>({
  relations: {
    appointment: mapAppointmentEntity,
  },
});

/**
 * Maps a Prisma TreatmentPlan entity to an ITreatmentPlan domain model
 */
export const mapTreatmentPlanEntity: EntityMapper<any, ITreatmentPlan> = createEntityMapper<any, ITreatmentPlan>();

// ===== PLAN JOURNEY MAPPERS =====

/**
 * Maps a Prisma Plan entity to an IPlan domain model
 */
export const mapPlanEntity: EntityMapper<any, IPlan> = createEntityMapper<any, IPlan>({
  relations: {
    benefits: mapBenefitEntity,
    coverages: mapCoverageEntity,
  },
});

/**
 * Maps a Prisma Benefit entity to an IBenefit domain model
 */
export const mapBenefitEntity: EntityMapper<any, IBenefit> = createEntityMapper<any, IBenefit>();

/**
 * Maps a Prisma Coverage entity to an ICoverage domain model
 */
export const mapCoverageEntity: EntityMapper<any, ICoverage> = createEntityMapper<any, ICoverage>();

/**
 * Maps a Prisma Claim entity to an IClaim domain model
 */
export const mapClaimEntity: EntityMapper<any, IClaim> = createEntityMapper<any, IClaim>({
  relations: {
    documents: mapDocumentEntity,
    plan: mapPlanEntity,
  },
  computed: [
    {
      key: 'isReimbursable',
      fn: (entity) => {
        return entity.status === ClaimStatus.APPROVED && !entity.reimbursementProcessedAt;
      },
    },
    {
      key: 'daysInProcess',
      fn: (entity) => {
        if (!entity.submittedAt) {
          return 0;
        }
        
        const submittedDate = new Date(entity.submittedAt);
        const today = new Date();
        const diffTime = today.getTime() - submittedDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
      },
    },
  ],
});

/**
 * Maps a Prisma Document entity to an IDocument domain model
 */
export const mapDocumentEntity: EntityMapper<any, IDocument> = createEntityMapper<any, IDocument>();

/**
 * Creates a domain model mapper for a specific entity type
 * 
 * @param entityType The type of entity to create a mapper for
 * @returns An appropriate mapper function for the entity type
 */
export function getMapperForEntityType(entityType: string): EntityMapper<any, any> {
  // Health journey mappers
  if (entityType === 'HealthMetric') return mapHealthMetricEntity;
  if (entityType === 'HealthGoal') return mapHealthGoalEntity;
  if (entityType === 'MedicalEvent') return mapMedicalEventEntity;
  if (entityType === 'DeviceConnection') return mapDeviceConnectionEntity;
  
  // Care journey mappers
  if (entityType === 'Appointment') return mapAppointmentEntity;
  if (entityType === 'Provider') return mapProviderEntity;
  if (entityType === 'Medication') return mapMedicationEntity;
  if (entityType === 'TelemedicineSession') return mapTelemedicineSessionEntity;
  if (entityType === 'TreatmentPlan') return mapTreatmentPlanEntity;
  
  // Plan journey mappers
  if (entityType === 'Plan') return mapPlanEntity;
  if (entityType === 'Benefit') return mapBenefitEntity;
  if (entityType === 'Coverage') return mapCoverageEntity;
  if (entityType === 'Claim') return mapClaimEntity;
  if (entityType === 'Document') return mapDocumentEntity;
  
  // Default to a basic mapper if no specific mapper is found
  logger.warn(`No specific mapper found for entity type: ${entityType}`);
  return createEntityMapper();
}