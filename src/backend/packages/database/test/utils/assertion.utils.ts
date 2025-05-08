/**
 * Database Testing Assertion Utilities
 * 
 * This module provides a comprehensive set of assertion utilities specifically designed for database testing.
 * It includes functions for verifying database state, comparing entity properties, validating relationships
 * between entities, and checking transaction results across different journeys.
 */

import { z } from 'zod';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PrismaClient } from '@prisma/client';

// Import journey-specific interfaces
import {
  IHealthMetric,
  IHealthGoal,
  IDeviceConnection,
  MetricType,
  GoalType
} from '@austa/interfaces/journey/health';

import {
  IAppointment,
  IProvider,
  IMedication,
  ITelemedicineSession,
  ITreatmentPlan,
  AppointmentStatus
} from '@austa/interfaces/journey/care';

import {
  IPlan,
  IClaim,
  IBenefit,
  IDocument,
  ICoverage,
  ClaimStatus
} from '@austa/interfaces/journey/plan';

// Import database types
import { JourneyType } from '@austa/database/types';

/**
 * Options for entity comparison
 */
export interface CompareEntityOptions {
  /** Fields to exclude from comparison */
  excludeFields?: string[];
  /** Only compare these specific fields */
  onlyFields?: string[];
  /** Whether to ignore undefined values in expected object */
  ignoreUndefined?: boolean;
  /** Whether to ignore null values in expected object */
  ignoreNull?: boolean;
  /** Whether to ignore timestamps (createdAt, updatedAt) */
  ignoreTimestamps?: boolean;
  /** Custom comparison functions for specific fields */
  customComparisons?: Record<string, (actual: any, expected: any) => boolean>;
}

/**
 * Default comparison options
 */
const defaultCompareOptions: CompareEntityOptions = {
  excludeFields: [],
  ignoreUndefined: true,
  ignoreNull: false,
  ignoreTimestamps: true,
  customComparisons: {}
};

/**
 * Compares two entities and asserts that they match according to the provided options.
 * 
 * @param actual - The actual entity from the database
 * @param expected - The expected entity (usually from test data)
 * @param options - Comparison options
 * @returns boolean - True if entities match according to options
 * @throws Error if entities don't match
 */
export function assertEntityMatches<T extends Record<string, any>>(
  actual: T,
  expected: Partial<T>,
  options: CompareEntityOptions = {}
): boolean {
  const opts = { ...defaultCompareOptions, ...options };
  const {
    excludeFields,
    onlyFields,
    ignoreUndefined,
    ignoreNull,
    ignoreTimestamps,
    customComparisons
  } = opts;

  // Default timestamp fields to exclude if ignoreTimestamps is true
  const fieldsToExclude = [
    ...(excludeFields || []),
    ...(ignoreTimestamps ? ['createdAt', 'updatedAt'] : [])
  ];

  // Determine which fields to compare
  const fieldsToCompare = onlyFields || Object.keys(expected);

  // Filter out excluded fields
  const relevantFields = fieldsToCompare.filter(field => !fieldsToExclude.includes(field));

  // Check each relevant field
  for (const field of relevantFields) {
    const expectedValue = expected[field];
    const actualValue = actual[field];

    // Skip undefined values if ignoreUndefined is true
    if (ignoreUndefined && expectedValue === undefined) {
      continue;
    }

    // Skip null values if ignoreNull is true
    if (ignoreNull && expectedValue === null) {
      continue;
    }

    // Use custom comparison if provided for this field
    if (customComparisons && customComparisons[field]) {
      if (!customComparisons[field](actualValue, expectedValue)) {
        throw new Error(`Field ${field} does not match using custom comparison. Expected: ${JSON.stringify(expectedValue)}, Actual: ${JSON.stringify(actualValue)}`);
      }
      continue;
    }

    // Handle dates
    if (expectedValue instanceof Date && actualValue instanceof Date) {
      if (expectedValue.getTime() !== actualValue.getTime()) {
        throw new Error(`Field ${field} does not match. Expected: ${expectedValue.toISOString()}, Actual: ${actualValue.toISOString()}`);
      }
      continue;
    }

    // Handle arrays
    if (Array.isArray(expectedValue) && Array.isArray(actualValue)) {
      if (expectedValue.length !== actualValue.length) {
        throw new Error(`Array length for field ${field} does not match. Expected: ${expectedValue.length}, Actual: ${actualValue.length}`);
      }

      // For simple arrays, compare values
      if (expectedValue.every(item => typeof item !== 'object')) {
        const sortedExpected = [...expectedValue].sort();
        const sortedActual = [...actualValue].sort();
        for (let i = 0; i < sortedExpected.length; i++) {
          if (sortedExpected[i] !== sortedActual[i]) {
            throw new Error(`Array values for field ${field} do not match at index ${i}. Expected: ${sortedExpected[i]}, Actual: ${sortedActual[i]}`);
          }
        }
      }
      continue;
    }

    // Handle objects (non-array)
    if (typeof expectedValue === 'object' && expectedValue !== null &&
        typeof actualValue === 'object' && actualValue !== null &&
        !(expectedValue instanceof Date) && !(actualValue instanceof Date)) {
      try {
        assertEntityMatches(actualValue, expectedValue, opts);
      } catch (error) {
        throw new Error(`Nested object for field ${field} does not match: ${error.message}`);
      }
      continue;
    }

    // Simple value comparison
    if (expectedValue !== actualValue) {
      throw new Error(`Field ${field} does not match. Expected: ${expectedValue}, Actual: ${actualValue}`);
    }
  }

  return true;
}

/**
 * Asserts that an entity exists in the database with the specified criteria.
 * 
 * @param prisma - PrismaClient instance
 * @param model - The Prisma model name
 * @param criteria - The search criteria
 * @returns Promise<boolean> - True if entity exists
 * @throws Error if entity doesn't exist
 */
export async function assertEntityExists(
  prisma: PrismaClient,
  model: string,
  criteria: Record<string, any>
): Promise<boolean> {
  // @ts-ignore - Dynamic model access
  const entity = await prisma[model].findFirst({
    where: criteria
  });

  if (!entity) {
    throw new Error(`Entity of type ${model} not found with criteria: ${JSON.stringify(criteria)}`);
  }

  return true;
}

/**
 * Asserts that an entity does not exist in the database with the specified criteria.
 * 
 * @param prisma - PrismaClient instance
 * @param model - The Prisma model name
 * @param criteria - The search criteria
 * @returns Promise<boolean> - True if entity doesn't exist
 * @throws Error if entity exists
 */
export async function assertEntityNotExists(
  prisma: PrismaClient,
  model: string,
  criteria: Record<string, any>
): Promise<boolean> {
  // @ts-ignore - Dynamic model access
  const entity = await prisma[model].findFirst({
    where: criteria
  });

  if (entity) {
    throw new Error(`Entity of type ${model} found with criteria: ${JSON.stringify(criteria)}, but expected not to exist`);
  }

  return true;
}

/**
 * Asserts that a relationship exists between two entities.
 * 
 * @param prisma - PrismaClient instance
 * @param sourceModel - The source entity model name
 * @param sourceCriteria - Criteria to find the source entity
 * @param relationField - The relation field name
 * @param targetCriteria - Criteria the related entity should match
 * @returns Promise<boolean> - True if relationship exists
 * @throws Error if relationship doesn't exist
 */
export async function assertRelationshipExists(
  prisma: PrismaClient,
  sourceModel: string,
  sourceCriteria: Record<string, any>,
  relationField: string,
  targetCriteria: Record<string, any>
): Promise<boolean> {
  // @ts-ignore - Dynamic model access
  const entity = await prisma[sourceModel].findFirst({
    where: sourceCriteria,
    include: {
      [relationField]: true
    }
  });

  if (!entity) {
    throw new Error(`Source entity of type ${sourceModel} not found with criteria: ${JSON.stringify(sourceCriteria)}`);
  }

  const relatedEntity = entity[relationField];

  // Handle array relationships
  if (Array.isArray(relatedEntity)) {
    const matchingEntity = relatedEntity.find(related => {
      return Object.entries(targetCriteria).every(([key, value]) => related[key] === value);
    });

    if (!matchingEntity) {
      throw new Error(`No related entity in ${relationField} matches criteria: ${JSON.stringify(targetCriteria)}`);
    }
  } 
  // Handle single entity relationships
  else if (relatedEntity) {
    try {
      assertEntityMatches(relatedEntity, targetCriteria);
    } catch (error) {
      throw new Error(`Related entity in ${relationField} does not match criteria: ${error.message}`);
    }
  } 
  // Handle null relationships
  else {
    throw new Error(`Relationship ${relationField} is null or undefined`);
  }

  return true;
}

/**
 * Validates an entity against a Zod schema and asserts that it's valid.
 * 
 * @param entity - The entity to validate
 * @param schema - The Zod schema to validate against
 * @returns boolean - True if entity is valid
 * @throws Error if entity is invalid
 */
export function assertZodValidation<T>(
  entity: T,
  schema: z.ZodType<T>
): boolean {
  const result = schema.safeParse(entity);
  
  if (!result.success) {
    const formattedErrors = result.error.format();
    throw new Error(`Entity validation failed: ${JSON.stringify(formattedErrors, null, 2)}`);
  }
  
  return true;
}

/**
 * Validates an entity against class-validator decorators and asserts that it's valid.
 * 
 * @param entity - The plain object to validate
 * @param entityClass - The class with validation decorators
 * @returns Promise<boolean> - True if entity is valid
 * @throws Error if entity is invalid
 */
export async function assertClassValidation<T extends object>(
  entity: Record<string, any>,
  entityClass: new () => T
): Promise<boolean> {
  const instanceObject = plainToInstance(entityClass, entity);
  const errors = await validate(instanceObject);
  
  if (errors.length > 0) {
    throw new Error(`Entity validation failed: ${JSON.stringify(errors, null, 2)}`);
  }
  
  return true;
}

/**
 * Asserts that database state matches expected state for a specific model.
 * 
 * @param prisma - PrismaClient instance
 * @param model - The Prisma model name
 * @param expectedState - Array of expected entities
 * @param filterCriteria - Optional filter criteria to limit the comparison scope
 * @param compareOptions - Options for entity comparison
 * @returns Promise<boolean> - True if database state matches
 * @throws Error if database state doesn't match
 */
export async function assertDatabaseState<T extends Record<string, any>>(
  prisma: PrismaClient,
  model: string,
  expectedState: T[],
  filterCriteria: Record<string, any> = {},
  compareOptions: CompareEntityOptions = {}
): Promise<boolean> {
  // @ts-ignore - Dynamic model access
  const actualEntities = await prisma[model].findMany({
    where: filterCriteria
  });

  if (actualEntities.length !== expectedState.length) {
    throw new Error(`Expected ${expectedState.length} entities of type ${model}, but found ${actualEntities.length}`);
  }

  // For each expected entity, find a matching actual entity
  for (const expected of expectedState) {
    const idField = 'id' in expected ? 'id' : Object.keys(expected)[0];
    const matchingEntity = actualEntities.find(actual => actual[idField] === expected[idField]);
    
    if (!matchingEntity) {
      throw new Error(`No matching entity found for ${idField}: ${expected[idField]}`);
    }
    
    try {
      assertEntityMatches(matchingEntity, expected, compareOptions);
    } catch (error) {
      throw new Error(`Entity with ${idField}: ${expected[idField]} does not match: ${error.message}`);
    }
  }

  return true;
}

/**
 * Asserts that a transaction was committed successfully by verifying the database state.
 * 
 * @param prisma - PrismaClient instance
 * @param verifications - Array of verification functions to run
 * @returns Promise<boolean> - True if all verifications pass
 * @throws Error if any verification fails
 */
export async function assertTransactionResult(
  prisma: PrismaClient,
  verifications: Array<(client: PrismaClient) => Promise<boolean>>
): Promise<boolean> {
  for (const verify of verifications) {
    try {
      await verify(prisma);
    } catch (error) {
      throw new Error(`Transaction verification failed: ${error.message}`);
    }
  }
  
  return true;
}

// ===== HEALTH JOURNEY ASSERTIONS =====

/**
 * Creates a Zod schema for validating health metrics.
 * 
 * @returns Zod schema for health metrics
 */
export function createHealthMetricSchema() {
  return z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid(),
    type: z.nativeEnum(MetricType),
    value: z.number(),
    unit: z.string(),
    timestamp: z.date(),
    source: z.string().optional(),
    deviceId: z.string().uuid().optional(),
    notes: z.string().optional().nullable(),
  });
}

/**
 * Asserts that a health metric is valid.
 * 
 * @param metric - The health metric to validate
 * @returns boolean - True if metric is valid
 * @throws Error if metric is invalid
 */
export function assertHealthMetricValid(metric: Partial<IHealthMetric>): boolean {
  const schema = createHealthMetricSchema();
  return assertZodValidation(metric, schema);
}

/**
 * Creates a Zod schema for validating health goals.
 * 
 * @returns Zod schema for health goals
 */
export function createHealthGoalSchema() {
  return z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid(),
    type: z.nativeEnum(GoalType),
    target: z.number(),
    unit: z.string(),
    period: z.string(),
    startDate: z.date(),
    endDate: z.date().optional().nullable(),
    status: z.string(),
    progress: z.number().optional(),
    lastUpdated: z.date().optional(),
  });
}

/**
 * Asserts that a health goal is valid.
 * 
 * @param goal - The health goal to validate
 * @returns boolean - True if goal is valid
 * @throws Error if goal is invalid
 */
export function assertHealthGoalValid(goal: Partial<IHealthGoal>): boolean {
  const schema = createHealthGoalSchema();
  return assertZodValidation(goal, schema);
}

/**
 * Asserts that health metrics are within expected ranges.
 * 
 * @param metrics - Array of health metrics to validate
 * @param ranges - Map of metric types to their valid ranges
 * @returns boolean - True if all metrics are within ranges
 * @throws Error if any metric is outside its valid range
 */
export function assertHealthMetricsInRange(
  metrics: IHealthMetric[],
  ranges: Record<MetricType, { min: number; max: number }>
): boolean {
  for (const metric of metrics) {
    const range = ranges[metric.type];
    if (!range) continue;
    
    if (metric.value < range.min || metric.value > range.max) {
      throw new Error(`Health metric ${metric.type} value ${metric.value} is outside valid range [${range.min}, ${range.max}]`);
    }
  }
  
  return true;
}

/**
 * Creates a Zod schema for validating device connections.
 * 
 * @returns Zod schema for device connections
 */
export function createDeviceConnectionSchema() {
  return z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid(),
    deviceType: z.string(),
    deviceId: z.string(),
    status: z.string(),
    lastSyncedAt: z.date().optional().nullable(),
    connectionData: z.record(z.any()).optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
}

/**
 * Asserts that a device connection is valid.
 * 
 * @param connection - The device connection to validate
 * @returns boolean - True if connection is valid
 * @throws Error if connection is invalid
 */
export function assertDeviceConnectionValid(connection: Partial<IDeviceConnection>): boolean {
  const schema = createDeviceConnectionSchema();
  return assertZodValidation(connection, schema);
}

/**
 * Asserts that health metrics have consistent units for the same type.
 * 
 * @param metrics - Array of health metrics to validate
 * @returns boolean - True if all metrics have consistent units
 * @throws Error if any metrics have inconsistent units
 */
export function assertHealthMetricUnitsConsistent(metrics: IHealthMetric[]): boolean {
  const unitsByType: Record<string, Set<string>> = {};
  
  for (const metric of metrics) {
    if (!unitsByType[metric.type]) {
      unitsByType[metric.type] = new Set();
    }
    unitsByType[metric.type].add(metric.unit);
  }
  
  for (const [type, units] of Object.entries(unitsByType)) {
    if (units.size > 1) {
      throw new Error(`Inconsistent units found for metric type ${type}: ${Array.from(units).join(', ')}`);
    }
  }
  
  return true;
}

/**
 * Asserts that health goals have appropriate targets based on metric type.
 * 
 * @param goals - Array of health goals to validate
 * @param metricRanges - Map of metric types to their valid ranges
 * @returns boolean - True if all goals have appropriate targets
 * @throws Error if any goal has an inappropriate target
 */
export function assertHealthGoalTargetsAppropriate(
  goals: IHealthGoal[],
  metricRanges: Record<GoalType, { min: number; max: number }>
): boolean {
  for (const goal of goals) {
    const range = metricRanges[goal.type];
    if (!range) continue;
    
    if (goal.target < range.min || goal.target > range.max) {
      throw new Error(`Health goal ${goal.type} target ${goal.target} is outside appropriate range [${range.min}, ${range.max}]`);
    }
  }
  
  return true;
}

// ===== CARE JOURNEY ASSERTIONS =====

/**
 * Creates a Zod schema for validating appointments.
 * 
 * @returns Zod schema for appointments
 */
export function createAppointmentSchema() {
  return z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid(),
    providerId: z.string().uuid(),
    type: z.string(),
    status: z.nativeEnum(AppointmentStatus),
    scheduledAt: z.date(),
    duration: z.number().int().positive(),
    location: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
}

/**
 * Asserts that an appointment is valid.
 * 
 * @param appointment - The appointment to validate
 * @returns boolean - True if appointment is valid
 * @throws Error if appointment is invalid
 */
export function assertAppointmentValid(appointment: Partial<IAppointment>): boolean {
  const schema = createAppointmentSchema();
  return assertZodValidation(appointment, schema);
}

/**
 * Asserts that appointments don't overlap for a provider.
 * 
 * @param appointments - Array of appointments to check
 * @returns boolean - True if no appointments overlap
 * @throws Error if any appointments overlap
 */
export function assertNoAppointmentOverlaps(appointments: IAppointment[]): boolean {
  // Group appointments by providerId
  const appointmentsByProvider: Record<string, IAppointment[]> = {};
  
  for (const appointment of appointments) {
    if (!appointmentsByProvider[appointment.providerId]) {
      appointmentsByProvider[appointment.providerId] = [];
    }
    appointmentsByProvider[appointment.providerId].push(appointment);
  }
  
  // Check for overlaps within each provider's appointments
  for (const [providerId, providerAppointments] of Object.entries(appointmentsByProvider)) {
    // Sort appointments by scheduledAt
    const sorted = [...providerAppointments].sort(
      (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
    );
    
    // Check for overlaps
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      
      const currentEnd = new Date(current.scheduledAt.getTime() + current.duration * 60000);
      
      if (currentEnd > next.scheduledAt) {
        throw new Error(`Appointment overlap detected for provider ${providerId} between appointments ${current.id} and ${next.id}`);
      }
    }
  }
  
  return true;
}

/**
 * Creates a Zod schema for validating medications.
 * 
 * @returns Zod schema for medications
 */
export function createMedicationSchema() {
  return z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid(),
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    startDate: z.date(),
    endDate: z.date().optional().nullable(),
    instructions: z.string().optional().nullable(),
    prescribedBy: z.string().optional().nullable(),
    active: z.boolean().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
}

/**
 * Asserts that a medication is valid.
 * 
 * @param medication - The medication to validate
 * @returns boolean - True if medication is valid
 * @throws Error if medication is invalid
 */
export function assertMedicationValid(medication: Partial<IMedication>): boolean {
  const schema = createMedicationSchema();
  return assertZodValidation(medication, schema);
}

/**
 * Creates a Zod schema for validating providers.
 * 
 * @returns Zod schema for providers
 */
export function createProviderSchema() {
  return z.object({
    id: z.string().uuid().optional(),
    name: z.string(),
    specialty: z.string(),
    npi: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    acceptsNewPatients: z.boolean().optional(),
    supportsTelemedicine: z.boolean().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
}

/**
 * Asserts that a provider is valid.
 * 
 * @param provider - The provider to validate
 * @returns boolean - True if provider is valid
 * @throws Error if provider is invalid
 */
export function assertProviderValid(provider: Partial<IProvider>): boolean {
  const schema = createProviderSchema();
  return assertZodValidation(provider, schema);
}

/**
 * Creates a Zod schema for validating telemedicine sessions.
 * 
 * @returns Zod schema for telemedicine sessions
 */
export function createTelemedicineSessionSchema() {
  return z.object({
    id: z.string().uuid().optional(),
    appointmentId: z.string().uuid(),
    userId: z.string().uuid(),
    providerId: z.string().uuid(),
    status: z.string(),
    startTime: z.date().optional().nullable(),
    endTime: z.date().optional().nullable(),
    sessionUrl: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
}

/**
 * Asserts that a telemedicine session is valid.
 * 
 * @param session - The telemedicine session to validate
 * @returns boolean - True if session is valid
 * @throws Error if session is invalid
 */
export function assertTelemedicineSessionValid(session: Partial<ITelemedicineSession>): boolean {
  const schema = createTelemedicineSessionSchema();
  return assertZodValidation(session, schema);
}

/**
 * Asserts that a telemedicine session has a valid duration.
 * 
 * @param session - The telemedicine session to validate
 * @param minDuration - Minimum valid duration in minutes
 * @param maxDuration - Maximum valid duration in minutes
 * @returns boolean - True if session has a valid duration
 * @throws Error if session has an invalid duration
 */
export function assertTelemedicineSessionDurationValid(
  session: ITelemedicineSession,
  minDuration: number = 5,
  maxDuration: number = 60
): boolean {
  if (!session.startTime || !session.endTime) {
    return true; // Skip validation for sessions without start/end times
  }
  
  const durationMinutes = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60);
  
  if (durationMinutes < minDuration) {
    throw new Error(`Telemedicine session ${session.id} duration (${durationMinutes.toFixed(1)} minutes) is less than minimum (${minDuration} minutes)`);
  }
  
  if (durationMinutes > maxDuration) {
    throw new Error(`Telemedicine session ${session.id} duration (${durationMinutes.toFixed(1)} minutes) exceeds maximum (${maxDuration} minutes)`);
  }
  
  return true;
}

/**
 * Creates a Zod schema for validating treatment plans.
 * 
 * @returns Zod schema for treatment plans
 */
export function createTreatmentPlanSchema() {
  return z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid(),
    providerId: z.string().uuid().optional(),
    title: z.string(),
    description: z.string(),
    startDate: z.date(),
    endDate: z.date().optional().nullable(),
    status: z.string(),
    progress: z.number().min(0).max(100).optional(),
    notes: z.string().optional().nullable(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
}

/**
 * Asserts that a treatment plan is valid.
 * 
 * @param plan - The treatment plan to validate
 * @returns boolean - True if plan is valid
 * @throws Error if plan is invalid
 */
export function assertTreatmentPlanValid(plan: Partial<ITreatmentPlan>): boolean {
  const schema = createTreatmentPlanSchema();
  return assertZodValidation(plan, schema);
}

// ===== PLAN JOURNEY ASSERTIONS =====

/**
 * Creates a Zod schema for validating claims.
 * 
 * @returns Zod schema for claims
 */
export function createClaimSchema() {
  return z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid(),
    planId: z.string().uuid(),
    type: z.string(),
    status: z.nativeEnum(ClaimStatus),
    amount: z.number().positive(),
    serviceDate: z.date(),
    submissionDate: z.date(),
    description: z.string(),
    providerName: z.string().optional().nullable(),
    providerNPI: z.string().optional().nullable(),
    documents: z.array(z.any()).optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
}

/**
 * Asserts that a claim is valid.
 * 
 * @param claim - The claim to validate
 * @returns boolean - True if claim is valid
 * @throws Error if claim is invalid
 */
export function assertClaimValid(claim: Partial<IClaim>): boolean {
  const schema = createClaimSchema();
  return assertZodValidation(claim, schema);
}

/**
 * Asserts that a claim has all required documents.
 * 
 * @param claim - The claim to check
 * @param requiredDocumentTypes - Array of required document types
 * @returns boolean - True if claim has all required documents
 * @throws Error if claim is missing any required documents
 */
export function assertClaimHasRequiredDocuments(
  claim: IClaim,
  requiredDocumentTypes: string[]
): boolean {
  if (!claim.documents || claim.documents.length === 0) {
    throw new Error(`Claim ${claim.id} has no documents, but requires: ${requiredDocumentTypes.join(', ')}`);
  }
  
  const documentTypes = claim.documents.map((doc: IDocument) => doc.type);
  
  for (const requiredType of requiredDocumentTypes) {
    if (!documentTypes.includes(requiredType)) {
      throw new Error(`Claim ${claim.id} is missing required document type: ${requiredType}`);
    }
  }
  
  return true;
}

/**
 * Creates a Zod schema for validating plans.
 * 
 * @returns Zod schema for plans
 */
export function createPlanSchema() {
  return z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid(),
    name: z.string(),
    provider: z.string(),
    type: z.string(),
    startDate: z.date(),
    endDate: z.date().optional().nullable(),
    status: z.string(),
    policyNumber: z.string().optional().nullable(),
    groupNumber: z.string().optional().nullable(),
    coverages: z.array(z.any()).optional(),
    benefits: z.array(z.any()).optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
}

/**
 * Asserts that a plan is valid.
 * 
 * @param plan - The plan to validate
 * @returns boolean - True if plan is valid
 * @throws Error if plan is invalid
 */
export function assertPlanValid(plan: Partial<IPlan>): boolean {
  const schema = createPlanSchema();
  return assertZodValidation(plan, schema);
}

/**
 * Creates a Zod schema for validating benefits.
 * 
 * @returns Zod schema for benefits
 */
export function createBenefitSchema() {
  return z.object({
    id: z.string().uuid().optional(),
    planId: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    type: z.string(),
    coveragePercentage: z.number().min(0).max(100).optional(),
    coverageAmount: z.number().min(0).optional(),
    limitType: z.string().optional(),
    limitValue: z.number().optional(),
    limitPeriod: z.string().optional(),
    requiresPreAuthorization: z.boolean().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
}

/**
 * Asserts that a benefit is valid.
 * 
 * @param benefit - The benefit to validate
 * @returns boolean - True if benefit is valid
 * @throws Error if benefit is invalid
 */
export function assertBenefitValid(benefit: Partial<IBenefit>): boolean {
  const schema = createBenefitSchema();
  return assertZodValidation(benefit, schema);
}

/**
 * Creates a Zod schema for validating coverage.
 * 
 * @returns Zod schema for coverage
 */
export function createCoverageSchema() {
  return z.object({
    id: z.string().uuid().optional(),
    planId: z.string().uuid(),
    type: z.string(),
    description: z.string(),
    inNetworkCoverage: z.number().min(0).max(100),
    outNetworkCoverage: z.number().min(0).max(100).optional(),
    deductible: z.number().min(0).optional(),
    outOfPocketMax: z.number().min(0).optional(),
    copay: z.number().min(0).optional(),
    coinsurance: z.number().min(0).max(100).optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
}

/**
 * Asserts that a coverage is valid.
 * 
 * @param coverage - The coverage to validate
 * @returns boolean - True if coverage is valid
 * @throws Error if coverage is invalid
 */
export function assertCoverageValid(coverage: Partial<ICoverage>): boolean {
  const schema = createCoverageSchema();
  return assertZodValidation(coverage, schema);
}

/**
 * Creates a Zod schema for validating documents.
 * 
 * @returns Zod schema for documents
 */
export function createDocumentSchema() {
  return z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid(),
    claimId: z.string().uuid().optional(),
    type: z.string(),
    filename: z.string(),
    filesize: z.number().positive(),
    mimeType: z.string(),
    storageKey: z.string(),
    uploadStatus: z.string(),
    uploadedAt: z.date().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
}

/**
 * Asserts that a document is valid.
 * 
 * @param document - The document to validate
 * @returns boolean - True if document is valid
 * @throws Error if document is invalid
 */
export function assertDocumentValid(document: Partial<IDocument>): boolean {
  const schema = createDocumentSchema();
  return assertZodValidation(document, schema);
}

/**
 * Asserts that a plan has all required coverages.
 * 
 * @param plan - The plan to check
 * @param requiredCoverageTypes - Array of required coverage types
 * @returns boolean - True if plan has all required coverages
 * @throws Error if plan is missing any required coverages
 */
export function assertPlanHasRequiredCoverages(
  plan: IPlan,
  requiredCoverageTypes: string[]
): boolean {
  if (!plan.coverages || plan.coverages.length === 0) {
    throw new Error(`Plan ${plan.id} has no coverages, but requires: ${requiredCoverageTypes.join(', ')}`);
  }
  
  const coverageTypes = plan.coverages.map((coverage: ICoverage) => coverage.type);
  
  for (const requiredType of requiredCoverageTypes) {
    if (!coverageTypes.includes(requiredType)) {
      throw new Error(`Plan ${plan.id} is missing required coverage type: ${requiredType}`);
    }
  }
  
  return true;
}

/**
 * Asserts that a plan has all required benefits.
 * 
 * @param plan - The plan to check
 * @param requiredBenefitTypes - Array of required benefit types
 * @returns boolean - True if plan has all required benefits
 * @throws Error if plan is missing any required benefits
 */
export function assertPlanHasRequiredBenefits(
  plan: IPlan,
  requiredBenefitTypes: string[]
): boolean {
  if (!plan.benefits || plan.benefits.length === 0) {
    throw new Error(`Plan ${plan.id} has no benefits, but requires: ${requiredBenefitTypes.join(', ')}`);
  }
  
  const benefitTypes = plan.benefits.map((benefit: IBenefit) => benefit.type);
  
  for (const requiredType of requiredBenefitTypes) {
    if (!benefitTypes.includes(requiredType)) {
      throw new Error(`Plan ${plan.id} is missing required benefit type: ${requiredType}`);
    }
  }
  
  return true;
}

// ===== CROSS-JOURNEY ASSERTIONS =====

/**
 * Asserts that data is consistent across journeys.
 * 
 * @param prisma - PrismaClient instance
 * @param userId - User ID to check consistency for
 * @returns Promise<boolean> - True if data is consistent
 * @throws Error if data is inconsistent
 */
export async function assertCrossJourneyConsistency(
  prisma: PrismaClient,
  userId: string
): Promise<boolean> {
  // Check that user exists
  await assertEntityExists(prisma, 'user', { id: userId });
  
  // Verify health journey data consistency
  const healthMetrics = await prisma.healthMetric.findMany({ where: { userId } });
  const healthGoals = await prisma.healthGoal.findMany({ where: { userId } });
  
  // Verify care journey data consistency
  const appointments = await prisma.appointment.findMany({ where: { userId } });
  const medications = await prisma.medication.findMany({ where: { userId } });
  
  // Verify plan journey data consistency
  const plans = await prisma.insurancePlan.findMany({ where: { userId } });
  const claims = await prisma.claim.findMany({ where: { userId } });
  
  // Check for inconsistencies between journeys
  
  // Example: Verify that appointments have corresponding health metrics if they're check-ups
  for (const appointment of appointments) {
    if (appointment.type === 'CHECK_UP' && appointment.status === AppointmentStatus.COMPLETED) {
      // There should be health metrics recorded on the appointment date
      const appointmentDate = appointment.scheduledAt;
      const startOfDay = new Date(appointmentDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(appointmentDate.setHours(23, 59, 59, 999));
      
      const metricsOnAppointmentDay = healthMetrics.filter(metric => 
        metric.timestamp >= startOfDay && metric.timestamp <= endOfDay
      );
      
      if (metricsOnAppointmentDay.length === 0) {
        throw new Error(`No health metrics found for completed check-up appointment ${appointment.id} on ${appointmentDate.toISOString().split('T')[0]}`);
      }
    }
  }
  
  // Example: Verify that claims match appointments
  for (const claim of claims) {
    if (claim.type === 'APPOINTMENT') {
      // There should be a corresponding appointment
      const matchingAppointment = appointments.find(apt => 
        apt.scheduledAt.toISOString().split('T')[0] === claim.serviceDate.toISOString().split('T')[0]
      );
      
      if (!matchingAppointment) {
        throw new Error(`No matching appointment found for claim ${claim.id} with service date ${claim.serviceDate.toISOString().split('T')[0]}`);
      }
    }
  }
  
  return true;
}

/**
 * Asserts that gamification events are properly generated for journey actions.
 * 
 * @param prisma - PrismaClient instance
 * @param journeyType - Type of journey
 * @param actionType - Type of action
 * @param entityId - ID of the entity that triggered the action
 * @param userId - User ID
 * @returns Promise<boolean> - True if events are properly generated
 * @throws Error if events are not properly generated
 */
export async function assertGamificationEventsGenerated(
  prisma: PrismaClient,
  journeyType: JourneyType,
  actionType: string,
  entityId: string,
  userId: string
): Promise<boolean> {
  // Check for gamification events in the database
  const events = await prisma.gamificationEvent.findMany({
    where: {
      userId,
      journey: journeyType,
      action: actionType,
      entityId
    }
  });
  
  if (events.length === 0) {
    throw new Error(`No gamification events found for ${journeyType} journey, action ${actionType}, entity ${entityId}`);
  }
  
  return true;
}

/**
 * Asserts that data transformation results are valid.
 * 
 * @param originalData - The original data before transformation
 * @param transformedData - The data after transformation
 * @param transformationRules - Rules that define how the data should be transformed
 * @returns boolean - True if transformation is valid
 * @throws Error if transformation is invalid
 */
export function assertDataTransformationValid<T, U>(
  originalData: T,
  transformedData: U,
  transformationRules: Record<string, (original: any) => any>
): boolean {
  for (const [targetField, transformFn] of Object.entries(transformationRules)) {
    const expectedValue = transformFn(originalData);
    const actualValue = getNestedProperty(transformedData, targetField);
    
    if (expectedValue !== actualValue) {
      throw new Error(`Transformation for field ${targetField} is invalid. Expected: ${expectedValue}, Actual: ${actualValue}`);
    }
  }
  
  return true;
}

/**
 * Asserts that data integrity is maintained across related entities.
 * 
 * @param prisma - PrismaClient instance
 * @param entityType - Type of entity to check
 * @param entityId - ID of the entity
 * @param relatedEntities - Map of related entity types to their expected counts
 * @returns Promise<boolean> - True if data integrity is maintained
 * @throws Error if data integrity is violated
 */
export async function assertDataIntegrityAcrossEntities(
  prisma: PrismaClient,
  entityType: string,
  entityId: string,
  relatedEntities: Record<string, number>
): Promise<boolean> {
  // Check that the main entity exists
  await assertEntityExists(prisma, entityType, { id: entityId });
  
  // Check related entity counts
  for (const [relatedType, expectedCount] of Object.entries(relatedEntities)) {
    // @ts-ignore - Dynamic model access
    const actualCount = await prisma[relatedType].count({
      where: {
        [`${entityType}Id`]: entityId
      }
    });
    
    if (actualCount !== expectedCount) {
      throw new Error(`Data integrity violation: Expected ${expectedCount} ${relatedType} entities related to ${entityType} ${entityId}, but found ${actualCount}`);
    }
  }
  
  return true;
}

/**
 * Asserts that database constraints are properly enforced.
 * 
 * @param prisma - PrismaClient instance
 * @param model - The Prisma model name
 * @param invalidData - Invalid data that should violate constraints
 * @param expectedErrorCode - Expected Prisma error code
 * @returns Promise<boolean> - True if constraints are properly enforced
 * @throws Error if constraints are not properly enforced
 */
export async function assertDatabaseConstraintsEnforced(
  prisma: PrismaClient,
  model: string,
  invalidData: Record<string, any>,
  expectedErrorCode: string
): Promise<boolean> {
  try {
    // @ts-ignore - Dynamic model access
    await prisma[model].create({
      data: invalidData
    });
    
    // If we get here, the operation succeeded when it should have failed
    throw new Error(`Database constraint violation not detected: ${model} created with invalid data`);
  } catch (error) {
    // Check if the error is the expected constraint violation
    if (error.code !== expectedErrorCode) {
      throw new Error(`Expected database constraint violation with code ${expectedErrorCode}, but got: ${error.code || 'unknown error'}`);
    }
    
    // Constraint properly enforced
    return true;
  }
}

/**
 * Gets a nested property from an object using dot notation.
 * 
 * @param obj - The object to get the property from
 * @param path - The path to the property using dot notation
 * @returns The value of the property
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((prev, curr) => prev && prev[curr], obj);
}

/**
 * Asserts that migration results are valid.
 * 
 * @param prisma - PrismaClient instance
 * @param migrationName - Name of the migration
 * @param verifications - Array of verification functions to run
 * @returns Promise<boolean> - True if migration results are valid
 * @throws Error if migration results are invalid
 */
export async function assertMigrationResultsValid(
  prisma: PrismaClient,
  migrationName: string,
  verifications: Array<(client: PrismaClient) => Promise<boolean>>
): Promise<boolean> {
  // Check that the migration exists and was applied
  const migration = await prisma.$queryRaw`SELECT * FROM _prisma_migrations WHERE migration_name = ${migrationName} AND applied_steps_count > 0`;
  
  if (!migration || (Array.isArray(migration) && migration.length === 0)) {
    throw new Error(`Migration ${migrationName} not found or not applied`);
  }
  
  // Run all verifications
  for (const verify of verifications) {
    try {
      await verify(prisma);
    } catch (error) {
      throw new Error(`Migration verification failed: ${error.message}`);
    }
  }
  
  return true;
}

// ===== TRANSACTION ASSERTIONS =====

/**
 * Asserts that a transaction was properly rolled back on error.
 * 
 * @param prisma - PrismaClient instance
 * @param transactionFn - Function that executes a transaction that should fail
 * @param verifications - Array of verification functions to run after transaction failure
 * @returns Promise<boolean> - True if transaction was properly rolled back
 * @throws Error if transaction was not properly rolled back
 */
export async function assertTransactionRollback(
  prisma: PrismaClient,
  transactionFn: (tx: PrismaClient) => Promise<any>,
  verifications: Array<(client: PrismaClient) => Promise<boolean>>
): Promise<boolean> {
  try {
    // Execute the transaction that should fail
    await prisma.$transaction(async (tx) => {
      await transactionFn(tx);
    });
    
    // If we get here, the transaction succeeded when it should have failed
    throw new Error('Transaction succeeded when it should have failed');
  } catch (error) {
    // Transaction failed as expected, now verify rollback
    for (const verify of verifications) {
      try {
        await verify(prisma);
      } catch (verifyError) {
        throw new Error(`Transaction rollback verification failed: ${verifyError.message}`);
      }
    }
    
    return true;
  }
}

/**
 * Asserts that a nested transaction was properly handled.
 * 
 * @param prisma - PrismaClient instance
 * @param outerTransactionFn - Function that executes the outer transaction
 * @param innerTransactionFn - Function that executes the inner transaction
 * @param verifications - Array of verification functions to run after transactions complete
 * @returns Promise<boolean> - True if nested transactions were properly handled
 * @throws Error if nested transactions were not properly handled
 */
export async function assertNestedTransactions(
  prisma: PrismaClient,
  outerTransactionFn: (tx: PrismaClient) => Promise<any>,
  innerTransactionFn: (tx: PrismaClient) => Promise<any>,
  verifications: Array<(client: PrismaClient) => Promise<boolean>>
): Promise<boolean> {
  // Execute nested transactions
  await prisma.$transaction(async (outerTx) => {
    await outerTransactionFn(outerTx);
    
    await outerTx.$transaction(async (innerTx) => {
      await innerTransactionFn(innerTx);
    });
  });
  
  // Verify results
  for (const verify of verifications) {
    try {
      await verify(prisma);
    } catch (error) {
      throw new Error(`Nested transaction verification failed: ${error.message}`);
    }
  }
  
  return true;
}

/**
 * Asserts that a transaction maintains isolation at the specified level.
 * 
 * @param prisma - PrismaClient instance
 * @param isolationLevel - The isolation level to test
 * @param concurrentTransactions - Array of functions that execute concurrent transactions
 * @param verifications - Array of verification functions to run after transactions complete
 * @returns Promise<boolean> - True if transaction isolation is maintained
 * @throws Error if transaction isolation is violated
 */
export async function assertTransactionIsolation(
  prisma: PrismaClient,
  isolationLevel: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable',
  concurrentTransactions: Array<(tx: PrismaClient) => Promise<any>>,
  verifications: Array<(client: PrismaClient) => Promise<boolean>>
): Promise<boolean> {
  // Execute concurrent transactions with specified isolation level
  await Promise.all(concurrentTransactions.map(txFn => {
    return prisma.$transaction(async (tx) => {
      await txFn(tx);
    }, {
      isolationLevel: isolationLevel as any
    });
  }));
  
  // Verify results
  for (const verify of verifications) {
    try {
      await verify(prisma);
    } catch (error) {
      throw new Error(`Transaction isolation verification failed: ${error.message}`);
    }
  }
  
  return true;
}