/**
 * Entity Mapper Utilities
 * 
 * Provides utilities for mapping between database entities and domain models across journey services.
 * Implements type-safe mapping functions for converting Prisma database records to business domain objects
 * and vice versa. Includes specialized mappers for different journeys (Health, Care, Plan) with support
 * for nested relations and computed properties.
 */

import { Prisma } from '@prisma/client';

// Import journey interfaces
import { 
  IHealthMetric, IHealthGoal, IMedicalEvent, IDeviceConnection,
  MetricType, MetricSource, GoalType, GoalStatus, GoalPeriod, ConnectionStatus, DeviceType
} from '@austa/interfaces/journey/health';

import {
  IAppointment, IProvider, IMedication, ITelemedicineSession, ITreatmentPlan,
  AppointmentType, AppointmentStatus
} from '@austa/interfaces/journey/care';

import {
  IPlan, IClaim, ICoverage, IBenefit, IDocument,
  ClaimStatus
} from '@austa/interfaces/journey/plan';

/**
 * Generic type for mapping options
 */
export interface EntityMapperOptions<T> {
  /** Include computed properties in the mapping */
  includeComputed?: boolean;
  /** Specific fields to include in the mapping (if empty, all fields are included) */
  include?: Array<keyof T>;
  /** Specific fields to exclude from the mapping */
  exclude?: Array<keyof T>;
  /** Custom mapping functions for specific fields */
  customMappers?: Record<string, (value: any) => any>;
  /** Whether to map nested relations */
  mapRelations?: boolean;
  /** Maximum depth for mapping nested relations (default: 3) */
  maxDepth?: number;
}

/**
 * Default mapping options
 */
const defaultMapperOptions: EntityMapperOptions<any> = {
  includeComputed: true,
  include: [],
  exclude: [],
  customMappers: {},
  mapRelations: true,
  maxDepth: 3
};

/**
 * Type for entity mapper function
 */
export type EntityMapper<TEntity, TDomain> = (
  entity: TEntity,
  options?: EntityMapperOptions<TDomain>
) => TDomain;

/**
 * Type for batch entity mapper function
 */
export type BatchEntityMapper<TEntity, TDomain> = (
  entities: TEntity[],
  options?: EntityMapperOptions<TDomain>
) => TDomain[];

/**
 * Type for domain to entity mapper function
 */
export type DomainToEntityMapper<TDomain, TEntity> = (
  domain: TDomain,
  options?: EntityMapperOptions<TDomain>
) => TEntity;

/**
 * Type for batch domain to entity mapper function
 */
export type BatchDomainToEntityMapper<TDomain, TEntity> = (
  domains: TDomain[],
  options?: EntityMapperOptions<TDomain>
) => TEntity[];

/**
 * Creates a generic entity mapper function
 * @param mapFn The mapping function to use
 * @returns A function that maps an entity to a domain model
 */
export function createEntityMapper<TEntity, TDomain>(
  mapFn: (entity: TEntity, options: EntityMapperOptions<TDomain>) => TDomain
): EntityMapper<TEntity, TDomain> {
  return (entity: TEntity, options: EntityMapperOptions<TDomain> = {}) => {
    const mergedOptions = { ...defaultMapperOptions, ...options };
    return mapFn(entity, mergedOptions);
  };
}

/**
 * Creates a batch entity mapper function
 * @param mapperFn The entity mapper function to use
 * @returns A function that maps an array of entities to domain models
 */
export function createBatchEntityMapper<TEntity, TDomain>(
  mapperFn: EntityMapper<TEntity, TDomain>
): BatchEntityMapper<TEntity, TDomain> {
  return (entities: TEntity[], options: EntityMapperOptions<TDomain> = {}) => {
    return entities.map(entity => mapperFn(entity, options));
  };
}

/**
 * Creates a domain to entity mapper function
 * @param mapFn The mapping function to use
 * @returns A function that maps a domain model to an entity
 */
export function createDomainToEntityMapper<TDomain, TEntity>(
  mapFn: (domain: TDomain, options: EntityMapperOptions<TDomain>) => TEntity
): DomainToEntityMapper<TDomain, TEntity> {
  return (domain: TDomain, options: EntityMapperOptions<TDomain> = {}) => {
    const mergedOptions = { ...defaultMapperOptions, ...options };
    return mapFn(domain, mergedOptions);
  };
}

/**
 * Creates a batch domain to entity mapper function
 * @param mapperFn The domain to entity mapper function to use
 * @returns A function that maps an array of domain models to entities
 */
export function createBatchDomainToEntityMapper<TDomain, TEntity>(
  mapperFn: DomainToEntityMapper<TDomain, TEntity>
): BatchDomainToEntityMapper<TDomain, TEntity> {
  return (domains: TDomain[], options: EntityMapperOptions<TDomain> = {}) => {
    return domains.map(domain => mapperFn(domain, options));
  };
}

/**
 * Applies mapping options to filter fields
 * @param obj The object to filter
 * @param options The mapping options
 * @returns A filtered object based on the options
 */
export function applyMappingOptions<T extends Record<string, any>>(
  obj: T,
  options: EntityMapperOptions<T>
): Partial<T> {
  const { include, exclude, customMappers } = options;
  
  // Start with a copy of the original object
  let result = { ...obj };
  
  // Apply include filter if specified
  if (include && include.length > 0) {
    const includeSet = new Set(include);
    result = Object.keys(result).reduce((filtered, key) => {
      if (includeSet.has(key as keyof T)) {
        filtered[key] = result[key];
      }
      return filtered;
    }, {} as Record<string, any>);
  }
  
  // Apply exclude filter
  if (exclude && exclude.length > 0) {
    const excludeSet = new Set(exclude);
    result = Object.keys(result).reduce((filtered, key) => {
      if (!excludeSet.has(key as keyof T)) {
        filtered[key] = result[key];
      }
      return filtered;
    }, {} as Record<string, any>);
  }
  
  // Apply custom mappers
  if (customMappers && Object.keys(customMappers).length > 0) {
    Object.keys(customMappers).forEach(key => {
      if (key in result) {
        result[key] = customMappers[key](result[key]);
      }
    });
  }
  
  return result;
}

/**
 * Maps nested relations recursively
 * @param obj The object containing relations
 * @param relationMappers Map of relation mappers
 * @param options Mapping options
 * @param depth Current recursion depth
 * @returns Object with mapped relations
 */
export function mapNestedRelations<T extends Record<string, any>>(
  obj: T,
  relationMappers: Record<string, EntityMapper<any, any>>,
  options: EntityMapperOptions<T>,
  depth: number = 0
): T {
  if (!options.mapRelations || depth >= (options.maxDepth || 3)) {
    return obj;
  }
  
  const result = { ...obj };
  
  Object.keys(relationMappers).forEach(relationKey => {
    if (relationKey in result && result[relationKey]) {
      const mapper = relationMappers[relationKey];
      
      // Handle array relations
      if (Array.isArray(result[relationKey])) {
        result[relationKey] = result[relationKey].map((item: any) => 
          mapper(item, { ...options, maxDepth: options.maxDepth, depth: depth + 1 })
        );
      } 
      // Handle single object relations
      else {
        result[relationKey] = mapper(
          result[relationKey], 
          { ...options, maxDepth: options.maxDepth, depth: depth + 1 }
        );
      }
    }
  });
  
  return result;
}

// ===== HEALTH JOURNEY MAPPERS =====

/**
 * Maps a Prisma HealthMetric entity to an IHealthMetric domain model
 */
export const mapHealthMetricEntityToDomain = createEntityMapper<Prisma.HealthMetricGetPayload<{}>, IHealthMetric>(
  (entity, options) => {
    const domainModel: IHealthMetric = {
      id: entity.id,
      userId: entity.userId,
      type: entity.type as MetricType,
      value: entity.value,
      unit: entity.unit,
      timestamp: entity.timestamp,
      source: entity.source as MetricSource,
      deviceId: entity.deviceId,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
    
    // Add computed properties if requested
    if (options.includeComputed) {
      // Example of a computed property: normalized value based on standard ranges
      const normalizedValue = normalizeHealthMetricValue(entity.type as MetricType, entity.value);
      (domainModel as any).normalizedValue = normalizedValue;
    }
    
    return applyMappingOptions(domainModel, options) as IHealthMetric;
  }
);

/**
 * Maps an IHealthMetric domain model to a Prisma HealthMetric entity
 */
export const mapHealthMetricDomainToEntity = createDomainToEntityMapper<IHealthMetric, Prisma.HealthMetricCreateInput>(
  (domain, options) => {
    const entity: Prisma.HealthMetricCreateInput = {
      id: domain.id,
      userId: domain.userId,
      type: domain.type,
      value: domain.value,
      unit: domain.unit,
      timestamp: domain.timestamp,
      source: domain.source,
      deviceId: domain.deviceId,
      notes: domain.notes || null,
      createdAt: domain.createdAt || new Date(),
      updatedAt: domain.updatedAt || new Date()
    };
    
    return applyMappingOptions(entity, options) as Prisma.HealthMetricCreateInput;
  }
);

/**
 * Maps a Prisma HealthGoal entity to an IHealthGoal domain model
 */
export const mapHealthGoalEntityToDomain = createEntityMapper<Prisma.HealthGoalGetPayload<{}>, IHealthGoal>(
  (entity, options) => {
    const domainModel: IHealthGoal = {
      id: entity.id,
      userId: entity.userId,
      type: entity.type as GoalType,
      target: entity.target,
      unit: entity.unit,
      period: entity.period as GoalPeriod,
      startDate: entity.startDate,
      endDate: entity.endDate,
      status: entity.status as GoalStatus,
      progress: entity.progress,
      lastUpdated: entity.lastUpdated,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
    
    // Add computed properties if requested
    if (options.includeComputed) {
      // Example: Calculate remaining days until goal end
      const today = new Date();
      const endDate = entity.endDate || today;
      const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      (domainModel as any).remainingDays = remainingDays;
      
      // Example: Calculate completion percentage
      const completionPercentage = Math.min(100, Math.round((entity.progress / entity.target) * 100));
      (domainModel as any).completionPercentage = completionPercentage;
    }
    
    return applyMappingOptions(domainModel, options) as IHealthGoal;
  }
);

/**
 * Maps an IHealthGoal domain model to a Prisma HealthGoal entity
 */
export const mapHealthGoalDomainToEntity = createDomainToEntityMapper<IHealthGoal, Prisma.HealthGoalCreateInput>(
  (domain, options) => {
    const entity: Prisma.HealthGoalCreateInput = {
      id: domain.id,
      userId: domain.userId,
      type: domain.type,
      target: domain.target,
      unit: domain.unit,
      period: domain.period,
      startDate: domain.startDate,
      endDate: domain.endDate || null,
      status: domain.status,
      progress: domain.progress,
      lastUpdated: domain.lastUpdated || new Date(),
      createdAt: domain.createdAt || new Date(),
      updatedAt: domain.updatedAt || new Date()
    };
    
    return applyMappingOptions(entity, options) as Prisma.HealthGoalCreateInput;
  }
);

/**
 * Maps a Prisma DeviceConnection entity to an IDeviceConnection domain model
 */
export const mapDeviceConnectionEntityToDomain = createEntityMapper<Prisma.DeviceConnectionGetPayload<{}>, IDeviceConnection>(
  (entity, options) => {
    const domainModel: IDeviceConnection = {
      id: entity.id,
      userId: entity.userId,
      deviceType: entity.deviceType as DeviceType,
      deviceId: entity.deviceId,
      deviceName: entity.deviceName,
      manufacturer: entity.manufacturer,
      model: entity.model,
      status: entity.status as ConnectionStatus,
      lastSyncDate: entity.lastSyncDate,
      accessToken: entity.accessToken,
      refreshToken: entity.refreshToken,
      tokenExpiryDate: entity.tokenExpiryDate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
    
    // Add computed properties if requested
    if (options.includeComputed) {
      // Example: Calculate days since last sync
      const today = new Date();
      const lastSync = entity.lastSyncDate || today;
      const daysSinceLastSync = Math.floor((today.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24));
      (domainModel as any).daysSinceLastSync = daysSinceLastSync;
      
      // Example: Check if token is expired
      const isTokenExpired = entity.tokenExpiryDate ? entity.tokenExpiryDate < today : true;
      (domainModel as any).isTokenExpired = isTokenExpired;
    }
    
    return applyMappingOptions(domainModel, options) as IDeviceConnection;
  }
);

/**
 * Maps an IDeviceConnection domain model to a Prisma DeviceConnection entity
 */
export const mapDeviceConnectionDomainToEntity = createDomainToEntityMapper<IDeviceConnection, Prisma.DeviceConnectionCreateInput>(
  (domain, options) => {
    const entity: Prisma.DeviceConnectionCreateInput = {
      id: domain.id,
      userId: domain.userId,
      deviceType: domain.deviceType,
      deviceId: domain.deviceId,
      deviceName: domain.deviceName,
      manufacturer: domain.manufacturer || null,
      model: domain.model || null,
      status: domain.status,
      lastSyncDate: domain.lastSyncDate || null,
      accessToken: domain.accessToken || null,
      refreshToken: domain.refreshToken || null,
      tokenExpiryDate: domain.tokenExpiryDate || null,
      createdAt: domain.createdAt || new Date(),
      updatedAt: domain.updatedAt || new Date()
    };
    
    return applyMappingOptions(entity, options) as Prisma.DeviceConnectionCreateInput;
  }
);

/**
 * Maps a Prisma MedicalEvent entity to an IMedicalEvent domain model
 */
export const mapMedicalEventEntityToDomain = createEntityMapper<Prisma.MedicalEventGetPayload<{}>, IMedicalEvent>(
  (entity, options) => {
    const domainModel: IMedicalEvent = {
      id: entity.id,
      userId: entity.userId,
      type: entity.type,
      description: entity.description,
      date: entity.date,
      provider: entity.provider,
      location: entity.location,
      notes: entity.notes,
      documentIds: entity.documentIds as string[],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
    
    return applyMappingOptions(domainModel, options) as IMedicalEvent;
  }
);

/**
 * Maps an IMedicalEvent domain model to a Prisma MedicalEvent entity
 */
export const mapMedicalEventDomainToEntity = createDomainToEntityMapper<IMedicalEvent, Prisma.MedicalEventCreateInput>(
  (domain, options) => {
    const entity: Prisma.MedicalEventCreateInput = {
      id: domain.id,
      userId: domain.userId,
      type: domain.type,
      description: domain.description,
      date: domain.date,
      provider: domain.provider || null,
      location: domain.location || null,
      notes: domain.notes || null,
      documentIds: domain.documentIds || [],
      createdAt: domain.createdAt || new Date(),
      updatedAt: domain.updatedAt || new Date()
    };
    
    return applyMappingOptions(entity, options) as Prisma.MedicalEventCreateInput;
  }
);

// ===== CARE JOURNEY MAPPERS =====

/**
 * Maps a Prisma Appointment entity to an IAppointment domain model
 */
export const mapAppointmentEntityToDomain = createEntityMapper<Prisma.AppointmentGetPayload<{}>, IAppointment>(
  (entity, options) => {
    const domainModel: IAppointment = {
      id: entity.id,
      userId: entity.userId,
      providerId: entity.providerId,
      type: entity.type as AppointmentType,
      status: entity.status as AppointmentStatus,
      date: entity.date,
      time: entity.time,
      duration: entity.duration,
      location: entity.location,
      notes: entity.notes,
      reminderSent: entity.reminderSent,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
    
    // Add computed properties if requested
    if (options.includeComputed) {
      // Example: Calculate if appointment is upcoming (within next 24 hours)
      const appointmentDate = new Date(`${entity.date}T${entity.time}`);
      const now = new Date();
      const timeDiff = appointmentDate.getTime() - now.getTime();
      const isUpcoming = timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000;
      (domainModel as any).isUpcoming = isUpcoming;
      
      // Example: Calculate if appointment is past
      const isPast = appointmentDate < now;
      (domainModel as any).isPast = isPast;
    }
    
    // Map nested relations if requested and available
    if (options.mapRelations && entity.provider) {
      const relationMappers = {
        provider: mapProviderEntityToDomain
      };
      
      return mapNestedRelations(domainModel, relationMappers, options) as IAppointment;
    }
    
    return applyMappingOptions(domainModel, options) as IAppointment;
  }
);

/**
 * Maps an IAppointment domain model to a Prisma Appointment entity
 */
export const mapAppointmentDomainToEntity = createDomainToEntityMapper<IAppointment, Prisma.AppointmentCreateInput>(
  (domain, options) => {
    const entity: Prisma.AppointmentCreateInput = {
      id: domain.id,
      userId: domain.userId,
      providerId: domain.providerId,
      type: domain.type,
      status: domain.status,
      date: domain.date,
      time: domain.time,
      duration: domain.duration,
      location: domain.location || null,
      notes: domain.notes || null,
      reminderSent: domain.reminderSent || false,
      createdAt: domain.createdAt || new Date(),
      updatedAt: domain.updatedAt || new Date()
    };
    
    return applyMappingOptions(entity, options) as Prisma.AppointmentCreateInput;
  }
);

/**
 * Maps a Prisma Provider entity to an IProvider domain model
 */
export const mapProviderEntityToDomain = createEntityMapper<Prisma.ProviderGetPayload<{}>, IProvider>(
  (entity, options) => {
    const domainModel: IProvider = {
      id: entity.id,
      name: entity.name,
      specialty: entity.specialty,
      address: entity.address,
      city: entity.city,
      state: entity.state,
      zipCode: entity.zipCode,
      phone: entity.phone,
      email: entity.email,
      npi: entity.npi,
      acceptingNewPatients: entity.acceptingNewPatients,
      offersTelemedicine: entity.offersTelemedicine,
      languages: entity.languages as string[],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
    
    return applyMappingOptions(domainModel, options) as IProvider;
  }
);

/**
 * Maps an IProvider domain model to a Prisma Provider entity
 */
export const mapProviderDomainToEntity = createDomainToEntityMapper<IProvider, Prisma.ProviderCreateInput>(
  (domain, options) => {
    const entity: Prisma.ProviderCreateInput = {
      id: domain.id,
      name: domain.name,
      specialty: domain.specialty,
      address: domain.address,
      city: domain.city,
      state: domain.state,
      zipCode: domain.zipCode,
      phone: domain.phone,
      email: domain.email || null,
      npi: domain.npi || null,
      acceptingNewPatients: domain.acceptingNewPatients || false,
      offersTelemedicine: domain.offersTelemedicine || false,
      languages: domain.languages || [],
      createdAt: domain.createdAt || new Date(),
      updatedAt: domain.updatedAt || new Date()
    };
    
    return applyMappingOptions(entity, options) as Prisma.ProviderCreateInput;
  }
);

/**
 * Maps a Prisma Medication entity to an IMedication domain model
 */
export const mapMedicationEntityToDomain = createEntityMapper<Prisma.MedicationGetPayload<{}>, IMedication>(
  (entity, options) => {
    const domainModel: IMedication = {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      dosage: entity.dosage,
      frequency: entity.frequency,
      startDate: entity.startDate,
      endDate: entity.endDate,
      instructions: entity.instructions,
      prescribedBy: entity.prescribedBy,
      pharmacy: entity.pharmacy,
      remindersEnabled: entity.remindersEnabled,
      reminderTimes: entity.reminderTimes as string[],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
    
    // Add computed properties if requested
    if (options.includeComputed) {
      // Example: Calculate if medication is active
      const now = new Date();
      const isActive = (!entity.endDate || entity.endDate >= now) && entity.startDate <= now;
      (domainModel as any).isActive = isActive;
      
      // Example: Calculate days remaining for medication
      if (entity.endDate) {
        const daysRemaining = Math.max(0, Math.ceil((entity.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        (domainModel as any).daysRemaining = daysRemaining;
      }
    }
    
    return applyMappingOptions(domainModel, options) as IMedication;
  }
);

/**
 * Maps an IMedication domain model to a Prisma Medication entity
 */
export const mapMedicationDomainToEntity = createDomainToEntityMapper<IMedication, Prisma.MedicationCreateInput>(
  (domain, options) => {
    const entity: Prisma.MedicationCreateInput = {
      id: domain.id,
      userId: domain.userId,
      name: domain.name,
      dosage: domain.dosage,
      frequency: domain.frequency,
      startDate: domain.startDate,
      endDate: domain.endDate || null,
      instructions: domain.instructions || null,
      prescribedBy: domain.prescribedBy || null,
      pharmacy: domain.pharmacy || null,
      remindersEnabled: domain.remindersEnabled || false,
      reminderTimes: domain.reminderTimes || [],
      createdAt: domain.createdAt || new Date(),
      updatedAt: domain.updatedAt || new Date()
    };
    
    return applyMappingOptions(entity, options) as Prisma.MedicationCreateInput;
  }
);

/**
 * Maps a Prisma TelemedicineSession entity to an ITelemedicineSession domain model
 */
export const mapTelemedicineSessionEntityToDomain = createEntityMapper<Prisma.TelemedicineSessionGetPayload<{}>, ITelemedicineSession>(
  (entity, options) => {
    const domainModel: ITelemedicineSession = {
      id: entity.id,
      appointmentId: entity.appointmentId,
      userId: entity.userId,
      providerId: entity.providerId,
      sessionUrl: entity.sessionUrl,
      startTime: entity.startTime,
      endTime: entity.endTime,
      status: entity.status,
      notes: entity.notes,
      recordingUrl: entity.recordingUrl,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
    
    // Add computed properties if requested
    if (options.includeComputed) {
      // Example: Calculate session duration in minutes
      if (entity.startTime && entity.endTime) {
        const durationMinutes = Math.round((entity.endTime.getTime() - entity.startTime.getTime()) / (1000 * 60));
        (domainModel as any).durationMinutes = durationMinutes;
      }
      
      // Example: Calculate if session is active now
      const now = new Date();
      const isActive = entity.startTime <= now && (!entity.endTime || entity.endTime >= now);
      (domainModel as any).isActive = isActive;
    }
    
    // Map nested relations if requested and available
    if (options.mapRelations) {
      const relationMappers = {
        appointment: mapAppointmentEntityToDomain,
        provider: mapProviderEntityToDomain
      };
      
      return mapNestedRelations(domainModel, relationMappers, options) as ITelemedicineSession;
    }
    
    return applyMappingOptions(domainModel, options) as ITelemedicineSession;
  }
);

/**
 * Maps an ITelemedicineSession domain model to a Prisma TelemedicineSession entity
 */
export const mapTelemedicineSessionDomainToEntity = createDomainToEntityMapper<ITelemedicineSession, Prisma.TelemedicineSessionCreateInput>(
  (domain, options) => {
    const entity: Prisma.TelemedicineSessionCreateInput = {
      id: domain.id,
      appointmentId: domain.appointmentId,
      userId: domain.userId,
      providerId: domain.providerId,
      sessionUrl: domain.sessionUrl,
      startTime: domain.startTime,
      endTime: domain.endTime || null,
      status: domain.status,
      notes: domain.notes || null,
      recordingUrl: domain.recordingUrl || null,
      createdAt: domain.createdAt || new Date(),
      updatedAt: domain.updatedAt || new Date()
    };
    
    return applyMappingOptions(entity, options) as Prisma.TelemedicineSessionCreateInput;
  }
);

// ===== PLAN JOURNEY MAPPERS =====

/**
 * Maps a Prisma Plan entity to an IPlan domain model
 */
export const mapPlanEntityToDomain = createEntityMapper<Prisma.PlanGetPayload<{}>, IPlan>(
  (entity, options) => {
    const domainModel: IPlan = {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      description: entity.description,
      provider: entity.provider,
      type: entity.type,
      premium: entity.premium,
      deductible: entity.deductible,
      outOfPocketMax: entity.outOfPocketMax,
      startDate: entity.startDate,
      endDate: entity.endDate,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
    
    // Add computed properties if requested
    if (options.includeComputed) {
      // Example: Calculate if plan is active
      const now = new Date();
      const isActive = entity.startDate <= now && (!entity.endDate || entity.endDate >= now);
      (domainModel as any).isActive = isActive;
      
      // Example: Calculate days remaining in plan
      if (entity.endDate) {
        const daysRemaining = Math.max(0, Math.ceil((entity.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        (domainModel as any).daysRemaining = daysRemaining;
      }
    }
    
    // Map nested relations if requested and available
    if (options.mapRelations) {
      const relationMappers = {
        benefits: createBatchEntityMapper(mapBenefitEntityToDomain),
        coverages: createBatchEntityMapper(mapCoverageEntityToDomain),
        claims: createBatchEntityMapper(mapClaimEntityToDomain)
      };
      
      return mapNestedRelations(domainModel, relationMappers, options) as IPlan;
    }
    
    return applyMappingOptions(domainModel, options) as IPlan;
  }
);

/**
 * Maps an IPlan domain model to a Prisma Plan entity
 */
export const mapPlanDomainToEntity = createDomainToEntityMapper<IPlan, Prisma.PlanCreateInput>(
  (domain, options) => {
    const entity: Prisma.PlanCreateInput = {
      id: domain.id,
      userId: domain.userId,
      name: domain.name,
      description: domain.description || null,
      provider: domain.provider,
      type: domain.type,
      premium: domain.premium,
      deductible: domain.deductible,
      outOfPocketMax: domain.outOfPocketMax,
      startDate: domain.startDate,
      endDate: domain.endDate || null,
      status: domain.status,
      createdAt: domain.createdAt || new Date(),
      updatedAt: domain.updatedAt || new Date()
    };
    
    return applyMappingOptions(entity, options) as Prisma.PlanCreateInput;
  }
);

/**
 * Maps a Prisma Claim entity to an IClaim domain model
 */
export const mapClaimEntityToDomain = createEntityMapper<Prisma.ClaimGetPayload<{}>, IClaim>(
  (entity, options) => {
    const domainModel: IClaim = {
      id: entity.id,
      userId: entity.userId,
      planId: entity.planId,
      claimNumber: entity.claimNumber,
      serviceDate: entity.serviceDate,
      providerName: entity.providerName,
      description: entity.description,
      amount: entity.amount,
      status: entity.status as ClaimStatus,
      submissionDate: entity.submissionDate,
      processedDate: entity.processedDate,
      notes: entity.notes,
      documentIds: entity.documentIds as string[],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
    
    // Add computed properties if requested
    if (options.includeComputed) {
      // Example: Calculate days since submission
      const now = new Date();
      const daysSinceSubmission = Math.floor((now.getTime() - entity.submissionDate.getTime()) / (1000 * 60 * 60 * 24));
      (domainModel as any).daysSinceSubmission = daysSinceSubmission;
      
      // Example: Calculate processing time in days
      if (entity.processedDate) {
        const processingDays = Math.floor((entity.processedDate.getTime() - entity.submissionDate.getTime()) / (1000 * 60 * 60 * 24));
        (domainModel as any).processingDays = processingDays;
      }
    }
    
    // Map nested relations if requested and available
    if (options.mapRelations) {
      const relationMappers = {
        plan: mapPlanEntityToDomain,
        documents: createBatchEntityMapper(mapDocumentEntityToDomain)
      };
      
      return mapNestedRelations(domainModel, relationMappers, options) as IClaim;
    }
    
    return applyMappingOptions(domainModel, options) as IClaim;
  }
);

/**
 * Maps an IClaim domain model to a Prisma Claim entity
 */
export const mapClaimDomainToEntity = createDomainToEntityMapper<IClaim, Prisma.ClaimCreateInput>(
  (domain, options) => {
    const entity: Prisma.ClaimCreateInput = {
      id: domain.id,
      userId: domain.userId,
      planId: domain.planId,
      claimNumber: domain.claimNumber,
      serviceDate: domain.serviceDate,
      providerName: domain.providerName,
      description: domain.description || null,
      amount: domain.amount,
      status: domain.status,
      submissionDate: domain.submissionDate,
      processedDate: domain.processedDate || null,
      notes: domain.notes || null,
      documentIds: domain.documentIds || [],
      createdAt: domain.createdAt || new Date(),
      updatedAt: domain.updatedAt || new Date()
    };
    
    return applyMappingOptions(entity, options) as Prisma.ClaimCreateInput;
  }
);

/**
 * Maps a Prisma Benefit entity to an IBenefit domain model
 */
export const mapBenefitEntityToDomain = createEntityMapper<Prisma.BenefitGetPayload<{}>, IBenefit>(
  (entity, options) => {
    const domainModel: IBenefit = {
      id: entity.id,
      planId: entity.planId,
      name: entity.name,
      description: entity.description,
      type: entity.type,
      coverage: entity.coverage,
      limit: entity.limit,
      copay: entity.copay,
      coinsurance: entity.coinsurance,
      details: entity.details,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
    
    return applyMappingOptions(domainModel, options) as IBenefit;
  }
);

/**
 * Maps an IBenefit domain model to a Prisma Benefit entity
 */
export const mapBenefitDomainToEntity = createDomainToEntityMapper<IBenefit, Prisma.BenefitCreateInput>(
  (domain, options) => {
    const entity: Prisma.BenefitCreateInput = {
      id: domain.id,
      planId: domain.planId,
      name: domain.name,
      description: domain.description || null,
      type: domain.type,
      coverage: domain.coverage,
      limit: domain.limit || null,
      copay: domain.copay || null,
      coinsurance: domain.coinsurance || null,
      details: domain.details || null,
      createdAt: domain.createdAt || new Date(),
      updatedAt: domain.updatedAt || new Date()
    };
    
    return applyMappingOptions(entity, options) as Prisma.BenefitCreateInput;
  }
);

/**
 * Maps a Prisma Coverage entity to an ICoverage domain model
 */
export const mapCoverageEntityToDomain = createEntityMapper<Prisma.CoverageGetPayload<{}>, ICoverage>(
  (entity, options) => {
    const domainModel: ICoverage = {
      id: entity.id,
      planId: entity.planId,
      type: entity.type,
      description: entity.description,
      inNetwork: entity.inNetwork,
      outOfNetwork: entity.outOfNetwork,
      limitations: entity.limitations,
      copayAmount: entity.copayAmount,
      coinsuranceRate: entity.coinsuranceRate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
    
    return applyMappingOptions(domainModel, options) as ICoverage;
  }
);

/**
 * Maps an ICoverage domain model to a Prisma Coverage entity
 */
export const mapCoverageDomainToEntity = createDomainToEntityMapper<ICoverage, Prisma.CoverageCreateInput>(
  (domain, options) => {
    const entity: Prisma.CoverageCreateInput = {
      id: domain.id,
      planId: domain.planId,
      type: domain.type,
      description: domain.description || null,
      inNetwork: domain.inNetwork,
      outOfNetwork: domain.outOfNetwork || null,
      limitations: domain.limitations || null,
      copayAmount: domain.copayAmount || null,
      coinsuranceRate: domain.coinsuranceRate || null,
      createdAt: domain.createdAt || new Date(),
      updatedAt: domain.updatedAt || new Date()
    };
    
    return applyMappingOptions(entity, options) as Prisma.CoverageCreateInput;
  }
);

/**
 * Maps a Prisma Document entity to an IDocument domain model
 */
export const mapDocumentEntityToDomain = createEntityMapper<Prisma.DocumentGetPayload<{}>, IDocument>(
  (entity, options) => {
    const domainModel: IDocument = {
      id: entity.id,
      userId: entity.userId,
      claimId: entity.claimId,
      filename: entity.filename,
      fileType: entity.fileType,
      fileSize: entity.fileSize,
      path: entity.path,
      uploadDate: entity.uploadDate,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
    
    return applyMappingOptions(domainModel, options) as IDocument;
  }
);

/**
 * Maps an IDocument domain model to a Prisma Document entity
 */
export const mapDocumentDomainToEntity = createDomainToEntityMapper<IDocument, Prisma.DocumentCreateInput>(
  (domain, options) => {
    const entity: Prisma.DocumentCreateInput = {
      id: domain.id,
      userId: domain.userId,
      claimId: domain.claimId,
      filename: domain.filename,
      fileType: domain.fileType,
      fileSize: domain.fileSize,
      path: domain.path,
      uploadDate: domain.uploadDate,
      status: domain.status,
      createdAt: domain.createdAt || new Date(),
      updatedAt: domain.updatedAt || new Date()
    };
    
    return applyMappingOptions(entity, options) as Prisma.DocumentCreateInput;
  }
);

// ===== BATCH MAPPERS =====

// Health Journey batch mappers
export const mapHealthMetricEntitiesToDomain = createBatchEntityMapper(mapHealthMetricEntityToDomain);
export const mapHealthMetricDomainsToEntity = createBatchDomainToEntityMapper(mapHealthMetricDomainToEntity);
export const mapHealthGoalEntitiesToDomain = createBatchEntityMapper(mapHealthGoalEntityToDomain);
export const mapHealthGoalDomainsToEntity = createBatchDomainToEntityMapper(mapHealthGoalDomainToEntity);
export const mapDeviceConnectionEntitiesToDomain = createBatchEntityMapper(mapDeviceConnectionEntityToDomain);
export const mapDeviceConnectionDomainsToEntity = createBatchDomainToEntityMapper(mapDeviceConnectionDomainToEntity);
export const mapMedicalEventEntitiesToDomain = createBatchEntityMapper(mapMedicalEventEntityToDomain);
export const mapMedicalEventDomainsToEntity = createBatchDomainToEntityMapper(mapMedicalEventDomainToEntity);

// Care Journey batch mappers
export const mapAppointmentEntitiesToDomain = createBatchEntityMapper(mapAppointmentEntityToDomain);
export const mapAppointmentDomainsToEntity = createBatchDomainToEntityMapper(mapAppointmentDomainToEntity);
export const mapProviderEntitiesToDomain = createBatchEntityMapper(mapProviderEntityToDomain);
export const mapProviderDomainsToEntity = createBatchDomainToEntityMapper(mapProviderDomainToEntity);
export const mapMedicationEntitiesToDomain = createBatchEntityMapper(mapMedicationEntityToDomain);
export const mapMedicationDomainsToEntity = createBatchDomainToEntityMapper(mapMedicationDomainToEntity);
export const mapTelemedicineSessionEntitiesToDomain = createBatchEntityMapper(mapTelemedicineSessionEntityToDomain);
export const mapTelemedicineSessionDomainsToEntity = createBatchDomainToEntityMapper(mapTelemedicineSessionDomainToEntity);

// Plan Journey batch mappers
export const mapPlanEntitiesToDomain = createBatchEntityMapper(mapPlanEntityToDomain);
export const mapPlanDomainsToEntity = createBatchDomainToEntityMapper(mapPlanDomainToEntity);
export const mapClaimEntitiesToDomain = createBatchEntityMapper(mapClaimEntityToDomain);
export const mapClaimDomainsToEntity = createBatchDomainToEntityMapper(mapClaimDomainToEntity);
export const mapBenefitEntitiesToDomain = createBatchEntityMapper(mapBenefitEntityToDomain);
export const mapBenefitDomainsToEntity = createBatchDomainToEntityMapper(mapBenefitDomainToEntity);
export const mapCoverageEntitiesToDomain = createBatchEntityMapper(mapCoverageEntityToDomain);
export const mapCoverageDomainsToEntity = createBatchDomainToEntityMapper(mapCoverageDomainToEntity);
export const mapDocumentEntitiesToDomain = createBatchEntityMapper(mapDocumentEntityToDomain);
export const mapDocumentDomainsToEntity = createBatchDomainToEntityMapper(mapDocumentDomainToEntity);

// ===== HELPER FUNCTIONS =====

/**
 * Normalizes a health metric value based on standard ranges
 * @param type The type of health metric
 * @param value The raw value of the metric
 * @returns A normalized value between 0 and 1
 */
function normalizeHealthMetricValue(type: MetricType, value: number): number {
  switch (type) {
    case MetricType.HEART_RATE:
      // Normal resting heart rate: 60-100 bpm
      return Math.min(1, Math.max(0, (value - 40) / 80));
      
    case MetricType.BLOOD_PRESSURE_SYSTOLIC:
      // Normal systolic: 90-120 mmHg
      return Math.min(1, Math.max(0, 1 - (value - 90) / 80));
      
    case MetricType.BLOOD_PRESSURE_DIASTOLIC:
      // Normal diastolic: 60-80 mmHg
      return Math.min(1, Math.max(0, 1 - (value - 60) / 40));
      
    case MetricType.BLOOD_GLUCOSE:
      // Normal fasting blood glucose: 70-100 mg/dL
      return Math.min(1, Math.max(0, 1 - (value - 70) / 130));
      
    case MetricType.WEIGHT:
      // Cannot normalize without height/gender/age
      return 0.5;
      
    case MetricType.STEPS:
      // Target: 10,000 steps
      return Math.min(1, Math.max(0, value / 10000));
      
    case MetricType.SLEEP_DURATION:
      // Ideal: 7-9 hours (420-540 minutes)
      return Math.min(1, Math.max(0, value > 540 ? 1 - (value - 540) / 180 : value / 480));
      
    case MetricType.OXYGEN_SATURATION:
      // Normal: 95-100%
      return Math.min(1, Math.max(0, (value - 90) / 10));
      
    default:
      return 0.5;
  }
}