/**
 * Factory utilities for generating test data for all database entities across all journeys.
 * 
 * This module provides factory functions for creating test data with customizable properties,
 * supporting both single entity creation and bulk generation for high-volume testing scenarios.
 */

import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import { 
  User, Role, Permission, 
  HealthMetric, DeviceConnection, HealthGoal, HealthMetricType, DeviceType,
  Appointment, Provider, Medication, ProviderSpecialty,
  InsurancePlan, Claim, Benefit, InsurancePlanType, ClaimType,
  Achievement, Reward, AchievementType
} from '@prisma/client';

/**
 * Base factory options interface
 */
interface BaseFactoryOptions {
  /**
   * Unique identifier for the test suite to ensure isolation
   */
  testSuiteId?: string;
}

/**
 * Bulk generation options interface
 */
interface BulkGenerationOptions extends BaseFactoryOptions {
  /**
   * Number of entities to generate
   * @default 10
   */
  count?: number;
}

// ==========================================
// Core Entity Factories (Auth)
// ==========================================

/**
 * Creates a factory function for generating Permission entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates Permission data
 */
export function createPermissionFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<Permission> = {}): Omit<Permission, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
      name: `permission-${faker.string.uuid()}-${testSuiteId}`,
      description: faker.lorem.sentence(),
      ...overrides
    };
  };
}

/**
 * Creates a factory function for generating Role entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates Role data
 */
export function createRoleFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<Role & { permissions: string[] }> = {}): Omit<Role, 'id' | 'createdAt' | 'updatedAt'> & { permissions?: string[] } => {
    const { permissions, ...roleOverrides } = overrides;
    
    return {
      name: `role-${faker.string.uuid()}-${testSuiteId}`,
      description: faker.lorem.sentence(),
      isDefault: false,
      journey: null,
      permissions: permissions || [],
      ...roleOverrides
    };
  };
}

/**
 * Creates a factory function for generating User entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates User data
 */
export function createUserFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<User> = {}): Omit<User, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
      name: faker.person.fullName(),
      email: `user-${faker.string.uuid()}-${testSuiteId}@test.austa.com.br`,
      password: faker.internet.password(),
      phone: faker.phone.number('+55119########'),
      cpf: faker.string.numeric(11),
      ...overrides
    };
  };
}

/**
 * Generates multiple User entities
 * 
 * @param options - Bulk generation options
 * @returns An array of User data
 */
export function generateUsers(options: BulkGenerationOptions = {}): Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] {
  const { count = 10, testSuiteId = uuidv4() } = options;
  const createUser = createUserFactory(testSuiteId);
  
  return Array.from({ length: count }, (_, index) => {
    return createUser({
      name: `Test User ${index + 1}`,
      email: `user-${index + 1}-${testSuiteId}@test.austa.com.br`,
    });
  });
}

// ==========================================
// Health Journey Entity Factories
// ==========================================

/**
 * Creates a factory function for generating HealthMetric entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates HealthMetric data
 */
export function createHealthMetricFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<HealthMetric> = {}): Omit<HealthMetric, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
      userId: uuidv4(),
      healthMetricTypeId: uuidv4(),
      value: faker.number.float({ min: 50, max: 200, precision: 0.1 }).toString(),
      recordedAt: faker.date.recent(),
      source: 'MANUAL',
      notes: faker.lorem.sentence(),
      ...overrides
    };
  };
}

/**
 * Creates a factory function for generating DeviceConnection entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates DeviceConnection data
 */
export function createDeviceConnectionFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<DeviceConnection> = {}): Omit<DeviceConnection, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
      userId: uuidv4(),
      deviceTypeId: uuidv4(),
      deviceIdentifier: `device-${faker.string.uuid()}-${testSuiteId}`,
      lastSyncedAt: faker.date.recent(),
      isActive: true,
      accessToken: faker.string.alphanumeric(32),
      refreshToken: faker.string.alphanumeric(32),
      tokenExpiresAt: faker.date.future(),
      ...overrides
    };
  };
}

/**
 * Creates a factory function for generating HealthGoal entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates HealthGoal data
 */
export function createHealthGoalFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<HealthGoal> = {}): Omit<HealthGoal, 'id' | 'createdAt' | 'updatedAt'> => {
    const startDate = faker.date.recent();
    const targetDate = faker.date.future({ refDate: startDate });
    
    return {
      userId: uuidv4(),
      healthMetricTypeId: uuidv4(),
      targetValue: faker.number.float({ min: 50, max: 200, precision: 0.1 }).toString(),
      startValue: faker.number.float({ min: 50, max: 200, precision: 0.1 }).toString(),
      startDate,
      targetDate,
      status: 'IN_PROGRESS',
      notes: faker.lorem.sentence(),
      ...overrides
    };
  };
}

/**
 * Creates a factory function for generating HealthMetricType entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates HealthMetricType data
 */
export function createHealthMetricTypeFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<HealthMetricType> = {}): Omit<HealthMetricType, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
      name: `METRIC_${faker.string.uuid()}_${testSuiteId}`,
      unit: faker.science.unit().name,
      normalRangeMin: faker.number.float({ min: 0, max: 50, precision: 0.1 }),
      normalRangeMax: faker.number.float({ min: 51, max: 200, precision: 0.1 }),
      ...overrides
    };
  };
}

/**
 * Creates a factory function for generating DeviceType entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates DeviceType data
 */
export function createDeviceTypeFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<DeviceType> = {}): Omit<DeviceType, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
      name: `Device ${faker.string.uuid()} ${testSuiteId}`,
      description: faker.lorem.sentence(),
      manufacturer: faker.company.name(),
      ...overrides
    };
  };
}

/**
 * Generates multiple HealthMetric entities
 * 
 * @param options - Bulk generation options
 * @returns An array of HealthMetric data
 */
export function generateHealthMetrics(options: BulkGenerationOptions & { userId?: string, metricTypeId?: string } = {}): Omit<HealthMetric, 'id' | 'createdAt' | 'updatedAt'>[] {
  const { count = 10, testSuiteId = uuidv4(), userId = uuidv4(), metricTypeId = uuidv4() } = options;
  const createHealthMetric = createHealthMetricFactory(testSuiteId);
  
  return Array.from({ length: count }, () => {
    return createHealthMetric({
      userId,
      healthMetricTypeId: metricTypeId,
      recordedAt: faker.date.recent(),
    });
  });
}

// ==========================================
// Care Journey Entity Factories
// ==========================================

/**
 * Creates a factory function for generating Appointment entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates Appointment data
 */
export function createAppointmentFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<Appointment> = {}): Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
      userId: uuidv4(),
      providerId: uuidv4(),
      scheduledAt: faker.date.future(),
      duration: 30, // 30 minutes
      status: 'SCHEDULED',
      notes: faker.lorem.paragraph(),
      type: 'IN_PERSON',
      location: faker.location.streetAddress(),
      ...overrides
    };
  };
}

/**
 * Creates a factory function for generating Provider entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates Provider data
 */
export function createProviderFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<Provider> = {}): Omit<Provider, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
      name: `Dr. ${faker.person.fullName()}`,
      email: `provider-${faker.string.uuid()}-${testSuiteId}@test.austa.com.br`,
      phone: faker.phone.number('+55119########'),
      crm: faker.string.numeric(6),
      specialtyId: uuidv4(),
      isActive: true,
      bio: faker.lorem.paragraph(),
      ...overrides
    };
  };
}

/**
 * Creates a factory function for generating Medication entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates Medication data
 */
export function createMedicationFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<Medication> = {}): Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> => {
    const startDate = faker.date.recent();
    const endDate = faker.date.future({ refDate: startDate });
    
    return {
      userId: uuidv4(),
      name: faker.commerce.productName(),
      dosage: `${faker.number.int({ min: 10, max: 500 })}mg`,
      frequency: `${faker.number.int({ min: 1, max: 4 })}x daily`,
      startDate,
      endDate,
      instructions: faker.lorem.sentence(),
      prescribedById: uuidv4(),
      isActive: true,
      ...overrides
    };
  };
}

/**
 * Creates a factory function for generating ProviderSpecialty entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates ProviderSpecialty data
 */
export function createProviderSpecialtyFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<ProviderSpecialty> = {}): Omit<ProviderSpecialty, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
      name: `Specialty ${faker.string.uuid()} ${testSuiteId}`,
      description: faker.lorem.sentence(),
      ...overrides
    };
  };
}

/**
 * Generates multiple Appointment entities
 * 
 * @param options - Bulk generation options
 * @returns An array of Appointment data
 */
export function generateAppointments(options: BulkGenerationOptions & { userId?: string, providerId?: string } = {}): Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>[] {
  const { count = 10, testSuiteId = uuidv4(), userId = uuidv4(), providerId = uuidv4() } = options;
  const createAppointment = createAppointmentFactory(testSuiteId);
  
  return Array.from({ length: count }, (_, index) => {
    // Create appointments with different dates and statuses
    const appointmentDate = new Date();
    let status = 'SCHEDULED';
    
    if (index % 3 === 0) {
      // Past appointment
      appointmentDate.setDate(appointmentDate.getDate() - (index + 1));
      status = 'COMPLETED';
    } else if (index % 3 === 1) {
      // Future appointment
      appointmentDate.setDate(appointmentDate.getDate() + (index + 1));
      status = 'SCHEDULED';
    } else {
      // Today's appointment
      appointmentDate.setHours(9 + index % 8); // Between 9 AM and 5 PM
      status = 'SCHEDULED';
    }
    
    return createAppointment({
      userId,
      providerId,
      scheduledAt: appointmentDate,
      status: status as 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'MISSED',
    });
  });
}

// ==========================================
// Plan Journey Entity Factories
// ==========================================

/**
 * Creates a factory function for generating InsurancePlan entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates InsurancePlan data
 */
export function createInsurancePlanFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<InsurancePlan> = {}): Omit<InsurancePlan, 'id' | 'createdAt' | 'updatedAt'> => {
    const startDate = faker.date.past();
    const endDate = faker.date.future({ refDate: startDate, years: 2 });
    
    return {
      userId: uuidv4(),
      planTypeId: uuidv4(),
      policyNumber: `POL-${faker.string.alphanumeric(8)}-${testSuiteId}`,
      startDate,
      endDate,
      isActive: true,
      monthlyPremium: faker.number.float({ min: 100, max: 1000, precision: 0.01 }).toString(),
      ...overrides
    };
  };
}

/**
 * Creates a factory function for generating Claim entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates Claim data
 */
export function createClaimFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<Claim> = {}): Omit<Claim, 'id' | 'createdAt' | 'updatedAt'> => {
    const claimDate = faker.date.recent();
    const submissionDate = new Date(claimDate);
    submissionDate.setDate(submissionDate.getDate() + faker.number.int({ min: 1, max: 7 }));
    
    return {
      insurancePlanId: uuidv4(),
      claimTypeId: uuidv4(),
      claimDate,
      submissionDate,
      amount: faker.number.float({ min: 100, max: 5000, precision: 0.01 }).toString(),
      status: 'SUBMITTED',
      receiptNumber: `REC-${faker.string.alphanumeric(8)}-${testSuiteId}`,
      providerName: `Dr. ${faker.person.lastName()}`,
      notes: faker.lorem.sentence(),
      ...overrides
    };
  };
}

/**
 * Creates a factory function for generating Benefit entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates Benefit data
 */
export function createBenefitFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<Benefit> = {}): Omit<Benefit, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
      insurancePlanId: uuidv4(),
      name: `Benefit ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      coveragePercentage: faker.number.int({ min: 50, max: 100 }),
      annualLimit: faker.number.float({ min: 1000, max: 50000, precision: 0.01 }).toString(),
      waitingPeriod: faker.number.int({ min: 0, max: 12 }),
      ...overrides
    };
  };
}

/**
 * Creates a factory function for generating InsurancePlanType entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates InsurancePlanType data
 */
export function createInsurancePlanTypeFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<InsurancePlanType> = {}): Omit<InsurancePlanType, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
      name: `Plan ${faker.string.uuid()} ${testSuiteId}`,
      description: faker.lorem.sentence(),
      ...overrides
    };
  };
}

/**
 * Creates a factory function for generating ClaimType entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates ClaimType data
 */
export function createClaimTypeFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<ClaimType> = {}): Omit<ClaimType, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
      name: `Claim ${faker.string.uuid()} ${testSuiteId}`,
      description: faker.lorem.sentence(),
      ...overrides
    };
  };
}

/**
 * Generates multiple Claim entities
 * 
 * @param options - Bulk generation options
 * @returns An array of Claim data
 */
export function generateClaims(options: BulkGenerationOptions & { insurancePlanId?: string, claimTypeId?: string } = {}): Omit<Claim, 'id' | 'createdAt' | 'updatedAt'>[] {
  const { count = 10, testSuiteId = uuidv4(), insurancePlanId = uuidv4(), claimTypeId = uuidv4() } = options;
  const createClaim = createClaimFactory(testSuiteId);
  
  return Array.from({ length: count }, (_, index) => {
    // Create claims with different statuses
    const statuses: Array<'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID'> = [
      'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID'
    ];
    const status = statuses[index % statuses.length];
    
    return createClaim({
      insurancePlanId,
      claimTypeId,
      status,
    });
  });
}

// ==========================================
// Gamification Entity Factories
// ==========================================

/**
 * Creates a factory function for generating Achievement entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates Achievement data
 */
export function createAchievementFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<Achievement> = {}): Omit<Achievement, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
      userId: uuidv4(),
      achievementTypeId: uuidv4(),
      level: faker.number.int({ min: 1, max: 3 }),
      achievedAt: faker.date.recent(),
      pointsAwarded: faker.number.int({ min: 50, max: 500 }),
      ...overrides
    };
  };
}

/**
 * Creates a factory function for generating Reward entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates Reward data
 */
export function createRewardFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<Reward> = {}): Omit<Reward, 'id' | 'createdAt' | 'updatedAt'> => {
    const isRedeemed = faker.datatype.boolean();
    let redeemedAt = null;
    
    if (isRedeemed) {
      redeemedAt = faker.date.recent();
    }
    
    return {
      userId: uuidv4(),
      name: `Reward ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      pointsCost: faker.number.int({ min: 100, max: 1000 }),
      isRedeemed,
      redeemedAt,
      expiresAt: faker.date.future(),
      type: faker.helpers.arrayElement(['DISCOUNT', 'BENEFIT']),
      ...overrides
    };
  };
}

/**
 * Creates a factory function for generating AchievementType entities
 * 
 * @param testSuiteId - Unique identifier for test isolation
 * @returns A function that creates AchievementType data
 */
export function createAchievementTypeFactory(testSuiteId: string = uuidv4()) {
  return (overrides: Partial<AchievementType> = {}): Omit<AchievementType, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
      name: `achievement-${faker.string.uuid()}-${testSuiteId}`,
      title: `Achievement ${faker.commerce.productName()}`,
      description: faker.lorem.sentence(),
      journey: faker.helpers.arrayElement(['health', 'care', 'plan']),
      icon: faker.helpers.arrayElement(['trophy', 'medal', 'star', 'badge']),
      levels: faker.number.int({ min: 1, max: 5 }),
      ...overrides
    };
  };
}

/**
 * Generates multiple Achievement entities
 * 
 * @param options - Bulk generation options
 * @returns An array of Achievement data
 */
export function generateAchievements(options: BulkGenerationOptions & { userId?: string, achievementTypeId?: string } = {}): Omit<Achievement, 'id' | 'createdAt' | 'updatedAt'>[] {
  const { count = 10, testSuiteId = uuidv4(), userId = uuidv4(), achievementTypeId = uuidv4() } = options;
  const createAchievement = createAchievementFactory(testSuiteId);
  
  return Array.from({ length: count }, (_, index) => {
    return createAchievement({
      userId,
      achievementTypeId,
      level: Math.min(index % 3 + 1, 3), // Levels 1-3
    });
  });
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Generates a random date within a specified range
 * 
 * @param start - Start date
 * @param end - End date
 * @returns A random date between start and end
 */
export function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generates a random boolean with a specified probability of being true
 * 
 * @param probability - Probability of returning true (0-1)
 * @returns A random boolean
 */
export function randomBoolean(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

/**
 * Generates a random item from an array
 * 
 * @param array - Array to select from
 * @returns A random item from the array
 */
export function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates a random subset of items from an array
 * 
 * @param array - Array to select from
 * @param count - Number of items to select
 * @returns A random subset of the array
 */
export function randomSubset<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}