/**
 * @file Types for database seeding operations
 * @description Contains TypeScript interfaces and type definitions for seed data structures, options, and configurations.
 * This file ensures type safety across all seeding operations and provides clear interfaces for seed function parameters and return values.
 */

import { PrismaClient } from '@prisma/client';

/**
 * Supported journey types in the application
 */
export type JourneyType = 'health' | 'care' | 'plan' | null;

/**
 * Base interface for all seed function parameters
 */
export interface SeedFunctionParams {
  prisma: PrismaClient;
  options?: SeedOptions;
}

/**
 * Configuration options for seeding operations
 */
export interface SeedOptions {
  /** Whether to clean the database before seeding */
  cleanDatabase?: boolean;
  /** Whether to log seeding operations */
  logging?: boolean;
  /** Specific journeys to seed (if not provided, all journeys will be seeded) */
  journeys?: JourneyType[];
  /** Whether to seed test data */
  includeTestData?: boolean;
  /** Number of test entities to generate per type */
  testDataCount?: number;
  /** Random seed for deterministic test data generation */
  randomSeed?: number;
}

/**
 * Result of a seeding operation
 */
export interface SeedResult {
  /** Whether the seeding operation was successful */
  success: boolean;
  /** Error message if the seeding operation failed */
  error?: string;
  /** Statistics about the seeded data */
  stats: SeedStats;
}

/**
 * Statistics about seeded data
 */
export interface SeedStats {
  /** Number of entities created per type */
  created: Record<string, number>;
  /** Number of entities updated per type */
  updated: Record<string, number>;
  /** Number of entities skipped per type */
  skipped: Record<string, number>;
  /** Time taken for the seeding operation in milliseconds */
  timeTakenMs: number;
}

/**
 * Permission data for seeding
 */
export interface PermissionSeedData {
  /** Unique name of the permission */
  name: string;
  /** Human-readable description of the permission */
  description: string;
  /** Journey this permission belongs to */
  journey?: JourneyType;
}

/**
 * Role data for seeding
 */
export interface RoleSeedData {
  /** Unique name of the role */
  name: string;
  /** Human-readable description of the role */
  description: string;
  /** Whether this role is assigned by default to new users */
  isDefault: boolean;
  /** Journey this role belongs to */
  journey: JourneyType;
  /** Names of permissions assigned to this role */
  permissions: string[];
}

/**
 * User data for seeding
 */
export interface UserSeedData {
  /** Full name of the user */
  name: string;
  /** Email address of the user (must be unique) */
  email: string;
  /** Plain text password (will be hashed before storage) */
  password: string;
  /** Phone number with country code */
  phone: string;
  /** Brazilian CPF number (must be unique) */
  cpf: string;
  /** Names of roles assigned to this user */
  roles?: string[];
}

/**
 * Health metric type data for seeding
 */
export interface HealthMetricTypeSeedData {
  /** Unique name of the metric type */
  name: string;
  /** Unit of measurement */
  unit: string;
  /** Minimum value in the normal range (optional) */
  normalRangeMin: number | null;
  /** Maximum value in the normal range (optional) */
  normalRangeMax: number | null;
}

/**
 * Device type data for seeding
 */
export interface DeviceTypeSeedData {
  /** Unique name of the device type */
  name: string;
  /** Human-readable description of the device type */
  description: string;
  /** Manufacturer of the device */
  manufacturer: string;
}

/**
 * Provider specialty data for seeding
 */
export interface ProviderSpecialtySeedData {
  /** Unique name of the specialty */
  name: string;
  /** Human-readable description of the specialty */
  description: string;
}

/**
 * Insurance plan type data for seeding
 */
export interface InsurancePlanTypeSeedData {
  /** Unique name of the plan type */
  name: string;
  /** Human-readable description of the plan type */
  description: string;
}

/**
 * Claim type data for seeding
 */
export interface ClaimTypeSeedData {
  /** Unique name of the claim type */
  name: string;
  /** Human-readable description of the claim type */
  description: string;
}

/**
 * Achievement type data for seeding
 */
export interface AchievementTypeSeedData {
  /** Unique identifier for the achievement type */
  name: string;
  /** Display title of the achievement */
  title: string;
  /** Human-readable description of the achievement */
  description: string;
  /** Journey this achievement belongs to */
  journey: JourneyType;
  /** Icon identifier for the achievement */
  icon: string;
  /** Number of levels for this achievement */
  levels: number;
}

/**
 * Health journey seed data
 */
export interface HealthJourneySeedData {
  /** Health metric types to seed */
  metricTypes: HealthMetricTypeSeedData[];
  /** Device types to seed */
  deviceTypes: DeviceTypeSeedData[];
  /** Health goals to seed (if test data is enabled) */
  goals?: HealthGoalSeedData[];
  /** Health metrics to seed (if test data is enabled) */
  metrics?: HealthMetricSeedData[];
}

/**
 * Health goal seed data for test data generation
 */
export interface HealthGoalSeedData {
  /** Type of health metric this goal applies to */
  metricType: string;
  /** Target value for the goal */
  targetValue: number;
  /** Start date of the goal */
  startDate: Date;
  /** End date of the goal (optional) */
  endDate?: Date;
  /** User ID this goal belongs to */
  userId: string;
}

/**
 * Health metric seed data for test data generation
 */
export interface HealthMetricSeedData {
  /** Type of health metric */
  metricType: string;
  /** Recorded value */
  value: number;
  /** Additional data as JSON (optional) */
  metadata?: Record<string, any>;
  /** Timestamp when the metric was recorded */
  recordedAt: Date;
  /** User ID this metric belongs to */
  userId: string;
  /** Device ID that recorded this metric (optional) */
  deviceId?: string;
}

/**
 * Care journey seed data
 */
export interface CareJourneySeedData {
  /** Provider specialties to seed */
  specialties: ProviderSpecialtySeedData[];
  /** Providers to seed (if test data is enabled) */
  providers?: ProviderSeedData[];
  /** Appointments to seed (if test data is enabled) */
  appointments?: AppointmentSeedData[];
  /** Medications to seed (if test data is enabled) */
  medications?: MedicationSeedData[];
}

/**
 * Provider seed data for test data generation
 */
export interface ProviderSeedData {
  /** Full name of the provider */
  name: string;
  /** Provider's professional registration number */
  registrationNumber: string;
  /** Specialties of the provider */
  specialties: string[];
  /** Contact email */
  email: string;
  /** Contact phone */
  phone: string;
}

/**
 * Appointment seed data for test data generation
 */
export interface AppointmentSeedData {
  /** User ID this appointment belongs to */
  userId: string;
  /** Provider ID for this appointment */
  providerId: string;
  /** Scheduled date and time */
  scheduledAt: Date;
  /** Duration in minutes */
  durationMinutes: number;
  /** Status of the appointment */
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  /** Notes about the appointment (optional) */
  notes?: string;
}

/**
 * Medication seed data for test data generation
 */
export interface MedicationSeedData {
  /** Name of the medication */
  name: string;
  /** Dosage information */
  dosage: string;
  /** Frequency of administration */
  frequency: string;
  /** Start date */
  startDate: Date;
  /** End date (optional) */
  endDate?: Date;
  /** User ID this medication belongs to */
  userId: string;
  /** Provider ID who prescribed this medication */
  prescribedBy: string;
}

/**
 * Plan journey seed data
 */
export interface PlanJourneySeedData {
  /** Insurance plan types to seed */
  planTypes: InsurancePlanTypeSeedData[];
  /** Claim types to seed */
  claimTypes: ClaimTypeSeedData[];
  /** Insurance plans to seed (if test data is enabled) */
  plans?: InsurancePlanSeedData[];
  /** Claims to seed (if test data is enabled) */
  claims?: ClaimSeedData[];
}

/**
 * Insurance plan seed data for test data generation
 */
export interface InsurancePlanSeedData {
  /** Plan type name */
  planType: string;
  /** Plan number/identifier */
  planNumber: string;
  /** Coverage start date */
  startDate: Date;
  /** Coverage end date (optional) */
  endDate?: Date;
  /** Monthly premium amount */
  monthlyPremium: number;
  /** Annual deductible amount */
  annualDeductible: number;
  /** User ID this plan belongs to */
  userId: string;
}

/**
 * Claim seed data for test data generation
 */
export interface ClaimSeedData {
  /** Claim type name */
  claimType: string;
  /** Service date */
  serviceDate: Date;
  /** Claim amount */
  amount: number;
  /** Status of the claim */
  status: 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID';
  /** User ID this claim belongs to */
  userId: string;
  /** Insurance plan ID this claim is filed against */
  planId: string;
}

/**
 * Gamification journey seed data
 */
export interface GamificationJourneySeedData {
  /** Achievement types to seed */
  achievementTypes: AchievementTypeSeedData[];
  /** User profiles to seed (if test data is enabled) */
  profiles?: GamificationProfileSeedData[];
  /** Achievements to seed (if test data is enabled) */
  achievements?: AchievementSeedData[];
  /** Rewards to seed (if test data is enabled) */
  rewards?: RewardSeedData[];
}

/**
 * Gamification profile seed data for test data generation
 */
export interface GamificationProfileSeedData {
  /** User ID this profile belongs to */
  userId: string;
  /** Current experience points */
  xp: number;
  /** Current level */
  level: number;
  /** Total points earned */
  totalPoints: number;
}

/**
 * Achievement seed data for test data generation
 */
export interface AchievementSeedData {
  /** Achievement type name */
  achievementType: string;
  /** Current level of the achievement */
  level: number;
  /** Progress towards the next level (0-100) */
  progress: number;
  /** Date when the achievement was unlocked */
  unlockedAt?: Date;
  /** User ID this achievement belongs to */
  userId: string;
}

/**
 * Reward seed data for test data generation
 */
export interface RewardSeedData {
  /** Name of the reward */
  name: string;
  /** Description of the reward */
  description: string;
  /** Point cost to redeem */
  pointCost: number;
  /** Whether the reward is currently available */
  isAvailable: boolean;
  /** Expiration date (optional) */
  expiresAt?: Date;
}

/**
 * Complete seed data for all journeys
 */
export interface CompleteSeedData {
  /** Permissions to seed */
  permissions: PermissionSeedData[];
  /** Roles to seed */
  roles: RoleSeedData[];
  /** Users to seed */
  users: UserSeedData[];
  /** Health journey data */
  health: HealthJourneySeedData;
  /** Care journey data */
  care: CareJourneySeedData;
  /** Plan journey data */
  plan: PlanJourneySeedData;
  /** Gamification journey data */
  gamification: GamificationJourneySeedData;
}

/**
 * Type for seed function that seeds a specific entity type
 */
export type EntitySeedFunction<T> = (params: SeedFunctionParams, data: T[]) => Promise<SeedResult>;

/**
 * Type for seed function that seeds a complete journey
 */
export type JourneySeedFunction<T> = (params: SeedFunctionParams, data: T) => Promise<SeedResult>;

/**
 * Type for the main seed function
 */
export type MainSeedFunction = (options?: SeedOptions) => Promise<SeedResult>;

/**
 * Utility type for creating partial seed data with all fields optional
 */
export type PartialSeedData<T> = {
  [P in keyof T]?: T[P] extends object ? PartialSeedData<T[P]> : T[P];
};

/**
 * Utility type for validation errors in seed data
 */
export interface SeedDataValidationError {
  /** Path to the field with the error */
  path: string;
  /** Error message */
  message: string;
  /** Value that caused the error */
  value: any;
}

/**
 * Result of seed data validation
 */
export interface SeedDataValidationResult {
  /** Whether the validation was successful */
  valid: boolean;
  /** Validation errors if any */
  errors: SeedDataValidationError[];
}

/**
 * Type for seed data validator function
 */
export type SeedDataValidator<T> = (data: T) => SeedDataValidationResult;

/**
 * Configuration for test data generation
 */
export interface TestDataGenerationConfig {
  /** Number of entities to generate per type */
  count: number;
  /** Random seed for deterministic generation */
  seed?: number;
  /** Whether to include relationships between entities */
  includeRelationships: boolean;
  /** Date range for generated timestamps */
  dateRange: {
    start: Date;
    end: Date;
  };
}

/**
 * Type for test data generator function
 */
export type TestDataGenerator<T> = (config: TestDataGenerationConfig) => T[];