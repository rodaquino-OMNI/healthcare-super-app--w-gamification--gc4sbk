/**
 * @file Types for database seeding operations
 * 
 * This file contains TypeScript interfaces and type definitions for seed data structures,
 * options, and configurations. It ensures type safety across all seeding operations and
 * provides clear interfaces for seed function parameters and return values.
 *
 * @version TypeScript 5.3.3
 */

/**
 * Options for user seeding
 */
export interface UserSeedOptions {
  /**
   * Email for the admin user
   * @default 'admin@austa.com.br'
   */
  adminEmail?: string;
  
  /**
   * Password for the admin user
   * @default 'Password123!'
   */
  adminPassword?: string;
  
  /**
   * Email for the test user
   * @default 'user@austa.com.br'
   */
  testUserEmail?: string;
  
  /**
   * Password for the test user
   * @default 'Password123!'
   */
  testUserPassword?: string;
  
  /**
   * Whether to create an admin user
   * @default true
   */
  createAdminUser?: boolean;
  
  /**
   * Whether to create a test user
   * @default true
   */
  createTestUser?: boolean;
}

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { JourneyType as BaseJourneyType } from '@austa/interfaces/common';

/**
 * Base interface for all seed function parameters
 */
export interface SeedFunctionParams {
  prisma: PrismaClient;
  options?: SeedOptions;
  /** Context for the current journey */
  journeyContext?: {
    /** Current journey being seeded */
    journey: JourneyType;
    /** Additional journey-specific context */
    data?: Record<string, any>;
  };
}

/**
 * Zod schema for validating seed function parameters
 */
export const SeedFunctionParamsSchema = z.object({
  prisma: z.any(), // Can't validate PrismaClient directly with Zod
  options: SeedOptionsSchema.optional(),
  journeyContext: z.object({
    journey: z.string(),
    data: z.record(z.any()).optional()
  }).optional()
});

/**
 * Configuration options for the seeding process
 */
export interface SeedOptions {
  /** Whether to clean the database before seeding */
  cleanDatabase?: boolean;
  /** Whether to log seeding operations */
  logEnabled?: boolean;
  /** Specific journeys to seed (if not provided, all journeys will be seeded) */
  journeys?: JourneyType[];
  /** Whether to throw errors or just log them */
  throwOnError?: boolean;
  /** Custom seed data to use instead of defaults */
  customData?: Partial<SeedData>;
  /** Whether to use transactions for seeding */
  useTransactions?: boolean;
  /** Timeout for transactions in milliseconds */
  transactionTimeout?: number;
  /** Environment-specific configuration */
  environment?: 'development' | 'test' | 'staging' | 'production';
}

/**
 * Zod schema for validating seed options
 */
export const SeedOptionsSchema = z.object({
  cleanDatabase: z.boolean().optional().default(true),
  logEnabled: z.boolean().optional().default(true),
  journeys: z.array(z.string()).optional(),
  throwOnError: z.boolean().optional().default(true),
  customData: z.record(z.any()).optional(),
  useTransactions: z.boolean().optional().default(true),
  transactionTimeout: z.number().optional().default(30000),
  environment: z.enum(['development', 'test', 'staging', 'production']).optional().default('development')
});

/**
 * Result of the seeding process
 */
export interface SeedResult {
  /** Whether the seeding was successful */
  success: boolean;
  /** Error message if seeding failed */
  error?: string;
  /** Statistics about the seeding process */
  stats: {
    /** Number of entities created */
    created: number;
    /** Number of entities updated */
    updated: number;
    /** Number of entities skipped */
    skipped: number;
    /** Time taken for the seeding process in milliseconds */
    timeTaken: number;
    /** Number of validation errors */
    validationErrors: number;
  };
  /** Detailed results for each journey */
  journeyResults: Record<JourneyType, JourneySeedResult>;
  /** Transaction information if transactions were used */
  transaction?: {
    /** Whether the transaction was committed */
    committed: boolean;
    /** Number of operations in the transaction */
    operations: number;
  };
}

/**
 * Zod schema for validating seed result
 */
export const SeedResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  stats: z.object({
    created: z.number(),
    updated: z.number(),
    skipped: z.number(),
    timeTaken: z.number(),
    validationErrors: z.number()
  }),
  journeyResults: z.record(z.string(), z.object({
    success: z.boolean(),
    error: z.string().optional(),
    stats: z.object({
      created: z.number(),
      updated: z.number(),
      skipped: z.number()
    })
  })),
  transaction: z.object({
    committed: z.boolean(),
    operations: z.number()
  }).optional()
});

/**
 * Result of seeding a specific journey
 */
export interface JourneySeedResult {
  /** Whether the journey seeding was successful */
  success: boolean;
  /** Error message if journey seeding failed */
  error?: string;
  /** Statistics about the journey seeding process */
  stats: {
    /** Number of entities created */
    created: number;
    /** Number of entities updated */
    updated: number;
    /** Number of entities skipped */
    skipped: number;
  };
}

/**
 * Available journey types in the application
 * Extends the base journey type from @austa/interfaces
 */
export type JourneyType = BaseJourneyType;

/**
 * Complete seed data structure containing all journey-specific data
 */
export interface SeedData {
  /** Authentication and authorization data */
  auth: AuthSeedData;
  /** Health journey data */
  health: HealthSeedData;
  /** Care journey data */
  care: CareSeedData;
  /** Plan journey data */
  plan: PlanSeedData;
  /** Gamification data */
  gamification: GamificationSeedData;
  /** Common data shared across journeys */
  common?: CommonSeedData;
}

/**
 * Common data shared across journeys
 */
export interface CommonSeedData {
  /** Configuration values */
  config?: Record<string, any>;
  /** Feature flags */
  featureFlags?: Record<string, boolean>;
  /** Shared reference data */
  referenceData?: Record<string, any[]>;
}

/**
 * Zod schema for common seed data
 */
export const CommonSeedDataSchema = z.object({
  config: z.record(z.any()).optional(),
  featureFlags: z.record(z.boolean()).optional(),
  referenceData: z.record(z.array(z.any())).optional()
});

/**
 * Authentication and authorization seed data
 */
export interface AuthSeedData {
  /** Permission definitions */
  permissions: PermissionData[];
  /** Role definitions with assigned permissions */
  roles: RoleData[];
  /** User definitions with assigned roles */
  users: UserData[];
}

/**
 * Permission data structure
 */
export interface PermissionData {
  /** Unique name of the permission */
  name: string;
  /** Human-readable description of the permission */
  description: string;
  /** Journey this permission belongs to (optional) */
  journey?: JourneyType;
}

/**
 * Role data structure
 */
export interface RoleData {
  /** Unique name of the role */
  name: string;
  /** Human-readable description of the role */
  description: string;
  /** Whether this role is assigned to new users by default */
  isDefault: boolean;
  /** Journey this role belongs to (optional) */
  journey?: JourneyType | null;
  /** Permissions assigned to this role */
  permissions: string[];
}

/**
 * User data structure
 */
export interface UserData {
  /** User's full name */
  name: string;
  /** User's email address */
  email: string;
  /** User's password (will be hashed) */
  password: string;
  /** User's phone number */
  phone: string;
  /** User's CPF (Brazilian tax ID) */
  cpf: string;
  /** Roles assigned to this user */
  roles?: string[];
}

/**
 * Health journey seed data
 */
export interface HealthSeedData {
  /** Health metric type definitions */
  metricTypes: HealthMetricTypeData[];
  /** Device type definitions */
  deviceTypes: DeviceTypeData[];
  /** Health goals for users */
  goals?: HealthGoalData[];
  /** Health metrics for users */
  metrics?: HealthMetricData[];
  /** Device connections for users */
  deviceConnections?: DeviceConnectionData[];
}

/**
 * Health metric type data structure
 */
export interface HealthMetricTypeData {
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
 * Device type data structure
 */
export interface DeviceTypeData {
  /** Unique name of the device type */
  name: string;
  /** Human-readable description of the device type */
  description: string;
  /** Device manufacturer */
  manufacturer: string;
}

/**
 * Health goal data structure
 */
export interface HealthGoalData {
  /** User ID this goal belongs to */
  userId: string;
  /** Type of health metric this goal is for */
  metricType: string;
  /** Target value for the goal */
  targetValue: number;
  /** Start date of the goal */
  startDate: Date;
  /** End date of the goal (optional) */
  endDate?: Date | null;
  /** Whether the goal is currently active */
  isActive: boolean;
}

/**
 * Health metric data structure
 */
export interface HealthMetricData {
  /** User ID this metric belongs to */
  userId: string;
  /** Type of health metric */
  metricType: string;
  /** Value of the metric */
  value: number;
  /** Timestamp when the metric was recorded */
  timestamp: Date;
  /** Source of the metric (e.g., manual entry, device) */
  source?: string;
  /** Additional metadata for the metric */
  metadata?: Record<string, any>;
}

/**
 * Device connection data structure
 */
export interface DeviceConnectionData {
  /** User ID this device connection belongs to */
  userId: string;
  /** Type of device */
  deviceType: string;
  /** Unique device identifier */
  deviceId: string;
  /** Access token for the device API */
  accessToken: string;
  /** Refresh token for the device API */
  refreshToken?: string;
  /** When the connection was established */
  connectedAt: Date;
  /** When the connection expires (optional) */
  expiresAt?: Date | null;
  /** Whether the connection is currently active */
  isActive: boolean;
}

/**
 * Care journey seed data
 */
export interface CareSeedData {
  /** Provider specialty definitions */
  specialties: ProviderSpecialtyData[];
  /** Healthcare provider definitions */
  providers?: ProviderData[];
  /** Appointment definitions */
  appointments?: AppointmentData[];
  /** Medication definitions */
  medications?: MedicationData[];
  /** Treatment plan definitions */
  treatments?: TreatmentData[];
}

/**
 * Provider specialty data structure
 */
export interface ProviderSpecialtyData {
  /** Unique name of the specialty */
  name: string;
  /** Human-readable description of the specialty */
  description: string;
}

/**
 * Healthcare provider data structure
 */
export interface ProviderData {
  /** Provider's full name */
  name: string;
  /** Provider's specialties */
  specialties: string[];
  /** Provider's license number */
  licenseNumber: string;
  /** Provider's contact information */
  contact: {
    /** Provider's email address */
    email: string;
    /** Provider's phone number */
    phone: string;
    /** Provider's address */
    address?: string;
  };
  /** Whether the provider is currently active */
  isActive: boolean;
}

/**
 * Appointment data structure
 */
export interface AppointmentData {
  /** User ID this appointment belongs to */
  userId: string;
  /** Provider ID for this appointment */
  providerId: string;
  /** Appointment date and time */
  dateTime: Date;
  /** Duration of the appointment in minutes */
  durationMinutes: number;
  /** Type of appointment (e.g., in-person, telemedicine) */
  type: string;
  /** Status of the appointment */
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  /** Notes about the appointment */
  notes?: string;
}

/**
 * Medication data structure
 */
export interface MedicationData {
  /** User ID this medication belongs to */
  userId: string;
  /** Name of the medication */
  name: string;
  /** Dosage information */
  dosage: string;
  /** Frequency of administration */
  frequency: string;
  /** Start date of the medication */
  startDate: Date;
  /** End date of the medication (optional) */
  endDate?: Date | null;
  /** Instructions for taking the medication */
  instructions?: string;
  /** Whether the medication is currently active */
  isActive: boolean;
}

/**
 * Treatment plan data structure
 */
export interface TreatmentData {
  /** User ID this treatment plan belongs to */
  userId: string;
  /** Provider ID who created this treatment plan */
  providerId: string;
  /** Name of the treatment plan */
  name: string;
  /** Description of the treatment plan */
  description: string;
  /** Start date of the treatment plan */
  startDate: Date;
  /** End date of the treatment plan (optional) */
  endDate?: Date | null;
  /** Goals of the treatment plan */
  goals?: string[];
  /** Whether the treatment plan is currently active */
  isActive: boolean;
}

/**
 * Plan journey seed data
 */
export interface PlanSeedData {
  /** Insurance plan type definitions */
  planTypes: InsurancePlanTypeData[];
  /** Claim type definitions */
  claimTypes: ClaimTypeData[];
  /** Insurance plan definitions */
  plans?: InsurancePlanData[];
  /** Benefit definitions */
  benefits?: BenefitData[];
  /** Claim definitions */
  claims?: ClaimData[];
  /** Document definitions */
  documents?: DocumentData[];
}

/**
 * Insurance plan type data structure
 */
export interface InsurancePlanTypeData {
  /** Unique name of the plan type */
  name: string;
  /** Human-readable description of the plan type */
  description: string;
}

/**
 * Claim type data structure
 */
export interface ClaimTypeData {
  /** Unique name of the claim type */
  name: string;
  /** Human-readable description of the claim type */
  description: string;
}

/**
 * Insurance plan data structure
 */
export interface InsurancePlanData {
  /** User ID this plan belongs to */
  userId: string;
  /** Type of insurance plan */
  planType: string;
  /** Plan number or identifier */
  planNumber: string;
  /** Insurance provider name */
  providerName: string;
  /** Start date of the plan */
  startDate: Date;
  /** End date of the plan (optional) */
  endDate?: Date | null;
  /** Whether the plan is currently active */
  isActive: boolean;
}

/**
 * Benefit data structure
 */
export interface BenefitData {
  /** Insurance plan ID this benefit belongs to */
  planId: string;
  /** Name of the benefit */
  name: string;
  /** Description of the benefit */
  description: string;
  /** Coverage percentage (0-100) */
  coveragePercentage: number;
  /** Annual limit amount (optional) */
  annualLimit?: number | null;
  /** Lifetime limit amount (optional) */
  lifetimeLimit?: number | null;
  /** Whether the benefit is currently active */
  isActive: boolean;
}

/**
 * Claim data structure
 */
export interface ClaimData {
  /** User ID this claim belongs to */
  userId: string;
  /** Insurance plan ID this claim is filed against */
  planId: string;
  /** Type of claim */
  claimType: string;
  /** Date of service */
  serviceDate: Date;
  /** Amount being claimed */
  amount: number;
  /** Status of the claim */
  status: 'submitted' | 'in-review' | 'approved' | 'denied' | 'paid';
  /** Date the claim was submitted */
  submissionDate: Date;
  /** Date the claim was processed (optional) */
  processedDate?: Date | null;
  /** Amount reimbursed (optional) */
  reimbursedAmount?: number | null;
  /** Notes about the claim */
  notes?: string;
}

/**
 * Document data structure
 */
export interface DocumentData {
  /** User ID this document belongs to */
  userId: string;
  /** Type of document */
  type: string;
  /** Name of the document */
  name: string;
  /** File path or URL of the document */
  filePath: string;
  /** MIME type of the document */
  mimeType: string;
  /** Size of the document in bytes */
  sizeBytes: number;
  /** Date the document was uploaded */
  uploadDate: Date;
  /** Whether the document is currently active */
  isActive: boolean;
}

/**
 * Gamification seed data
 */
export interface GamificationSeedData {
  /** Achievement type definitions */
  achievementTypes: AchievementTypeData[];
  /** Reward definitions */
  rewards?: RewardData[];
  /** Quest definitions */
  quests?: QuestData[];
  /** Rule definitions */
  rules?: RuleData[];
  /** User profile definitions */
  profiles?: ProfileData[];
  /** Achievement instances for users */
  achievements?: AchievementData[];
}

/**
 * Achievement type data structure
 */
export interface AchievementTypeData {
  /** Unique name/identifier of the achievement type */
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
 * Reward data structure
 */
export interface RewardData {
  /** Name of the reward */
  name: string;
  /** Description of the reward */
  description: string;
  /** Cost of the reward in points */
  pointCost: number;
  /** Type of reward */
  type: string;
  /** Whether the reward is currently active */
  isActive: boolean;
  /** Maximum number of times a user can redeem this reward (optional) */
  maxRedemptions?: number | null;
  /** Start date when the reward becomes available */
  startDate: Date;
  /** End date when the reward expires (optional) */
  endDate?: Date | null;
}

/**
 * Quest data structure
 */
export interface QuestData {
  /** Name of the quest */
  name: string;
  /** Description of the quest */
  description: string;
  /** Points awarded for completing the quest */
  pointsAwarded: number;
  /** Journey this quest belongs to */
  journey: JourneyType;
  /** Requirements to complete the quest */
  requirements: string[];
  /** Whether the quest is currently active */
  isActive: boolean;
  /** Start date when the quest becomes available */
  startDate: Date;
  /** End date when the quest expires (optional) */
  endDate?: Date | null;
}

/**
 * Rule data structure
 */
export interface RuleData {
  /** Name of the rule */
  name: string;
  /** Description of the rule */
  description: string;
  /** Event type this rule applies to */
  eventType: string;
  /** Conditions for the rule to trigger */
  conditions: Record<string, any>;
  /** Actions to take when the rule triggers */
  actions: Record<string, any>[];
  /** Priority of the rule (lower numbers = higher priority) */
  priority: number;
  /** Whether the rule is currently active */
  isActive: boolean;
}

/**
 * User profile data structure for gamification
 */
export interface ProfileData {
  /** User ID this profile belongs to */
  userId: string;
  /** Current level of the user */
  level: number;
  /** Current experience points */
  xp: number;
  /** Total points earned */
  totalPoints: number;
  /** Available points to spend */
  availablePoints: number;
  /** Date the profile was created */
  createdAt: Date;
  /** Date the profile was last updated */
  updatedAt: Date;
}

/**
 * Achievement instance data structure
 */
export interface AchievementData {
  /** User ID this achievement belongs to */
  userId: string;
  /** Achievement type identifier */
  achievementType: string;
  /** Current level of the achievement (1-based) */
  level: number;
  /** Progress towards the next level (0-100) */
  progress: number;
  /** Date the achievement was first earned */
  earnedAt: Date;
  /** Date the achievement was last updated */
  updatedAt: Date;
  /** Whether the achievement has been viewed by the user */
  isViewed: boolean;
}

/**
 * Utility type for creating partial seed data with required fields
 */
export type PartialSeedData<T> = Partial<T> & Pick<T, keyof T>;

/**
 * Utility type for creating seed data with optional ID fields
 */
export type SeedDataWithOptionalId<T extends { id?: string }> = Omit<T, 'id'> & { id?: string };

/**
 * Utility type for creating seed data with required journey field
 */
export type JourneySeedData<T> = T & { journey: JourneyType };

/**
 * Utility type for creating seed data with timestamps
 */
export type TimestampedSeedData<T> = T & {
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Utility type for creating seed data with soft delete
 */
export type SoftDeleteSeedData<T> = T & {
  deletedAt?: Date | null;
  isDeleted?: boolean;
};

/**
 * Utility type for creating seed data with user ownership
 */
export type UserOwnedSeedData<T> = T & {
  userId: string;
};

/**
 * Utility type for creating seed data with active status
 */
export type ActiveStatusSeedData<T> = T & {
  isActive: boolean;
};

/**
 * Utility type for creating seed data with versioning
 */
export type VersionedSeedData<T> = T & {
  version: number;
};

/**
 * Utility type for creating seed data with metadata
 */
export type MetadataSeedData<T> = T & {
  metadata?: Record<string, any>;
};

/**
 * Utility type for creating seed data with journey context
 */
export type JourneyContextSeedData<T> = T & {
  journeyContext: {
    journey: JourneyType;
    data?: Record<string, any>;
  };
};

/**
 * Utility type for creating seed data with validation
 */
export type ValidatedSeedData<T> = T & {
  validated: boolean;
  validationErrors?: string[];
};

/**
 * Utility type for creating seed data with relationships
 */
export type RelationalSeedData<T, R> = T & {
  relationships: R;
};

/**
 * Utility type for creating seed data with prisma create input
 */
export type PrismaCreateInput<T> = {
  [K in keyof T]: T[K];
} & {
  connect?: Record<string, { id: string } | { id: string }[]>;
  create?: Record<string, any>;
  connectOrCreate?: Record<string, { where: any; create: any }>;
};

/**
 * Function type for seeding a specific entity type
 */
export type SeedFunction<T> = (params: SeedFunctionParams) => Promise<T[]>;

/**
 * Function type for cleaning up seeded data
 */
export type CleanupFunction = (params: SeedFunctionParams) => Promise<void>;

/**
 * Function type for generating test data
 */
export type TestDataGenerator<T> = (count: number, options?: Partial<SeedOptions>) => T[];

/**
 * Function type for validating seed data
 */
export type SeedDataValidator<T> = (data: T) => boolean | Promise<boolean>;

/**
 * Interface for a complete seed module
 */
export interface SeedModule<T> {
  /** Function to seed data */
  seed: SeedFunction<T>;
  /** Function to clean up seeded data */
  cleanup: CleanupFunction;
  /** Function to generate test data */
  generate: TestDataGenerator<T>;
  /** Function to validate seed data */
  validate: SeedDataValidator<T>;
  /** Zod schema for validating data */
  schema: z.ZodType<T>;
}