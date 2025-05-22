/**
 * Factory utilities for generating test data for all database entities across all journeys.
 * 
 * This module provides factory functions for creating valid entity instances with customizable
 * properties, supporting both single entity creation and bulk generation for high-volume testing.
 */

import { PrismaClient } from '@prisma/client';
import * as faker from 'faker';
import { v4 as uuidv4 } from 'uuid';

// Initialize faker with Brazilian Portuguese locale for appropriate test data
faker.locale = 'pt_BR';

/**
 * Helper Types
 */

/**
 * Generic type for factory functions that create entity data
 */
type FactoryFunction<T> = (overrides?: Partial<T>) => T;

/**
 * Generic type for bulk generation of entities
 */
type BulkFactoryFunction<T> = (count: number, overrides?: Partial<T>) => T[];

/**
 * Helper Functions
 */

/**
 * Generates a random date within a specified range
 * 
 * @param start - Start date for the range
 * @param end - End date for the range
 * @returns A random date within the specified range
 */
export function randomDate(start: Date = new Date(2020, 0, 1), end: Date = new Date()): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Creates a bulk generation function from a factory function
 * 
 * @param factory - The factory function to use for generating entities
 * @returns A function that generates multiple entities
 */
export function createBulkFactory<T>(factory: FactoryFunction<T>): BulkFactoryFunction<T> {
  return (count: number, overrides?: Partial<T>) => {
    return Array.from({ length: count }, () => factory(overrides));
  };
}

/**
 * Auth Entities
 */

/**
 * Factory for User entities
 */
export interface UserFactoryData {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  cpf: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createUser: FactoryFunction<UserFactoryData> = (overrides = {}) => {
  return {
    id: overrides.id || uuidv4(),
    name: overrides.name || faker.name.findName(),
    email: overrides.email || faker.internet.email(),
    password: overrides.password || 'Password123!', // Default test password
    phone: overrides.phone || faker.phone.phoneNumber('+55119########'),
    cpf: overrides.cpf || faker.random.number({ min: 10000000000, max: 99999999999 }).toString(),
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createUsers = createBulkFactory(createUser);

/**
 * Factory for Permission entities
 */
export interface PermissionFactoryData {
  id: string;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createPermission: FactoryFunction<PermissionFactoryData> = (overrides = {}) => {
  const journey = overrides.name?.split(':')[0] || faker.random.arrayElement(['health', 'care', 'plan', 'game']);
  const resource = overrides.name?.split(':')[1] || faker.random.arrayElement(['metrics', 'goals', 'devices', 'appointments', 'claims', 'achievements']);
  const action = overrides.name?.split(':')[2] || faker.random.arrayElement(['read', 'write', 'delete']);
  
  return {
    id: overrides.id || uuidv4(),
    name: overrides.name || `${journey}:${resource}:${action}`,
    description: overrides.description || `Permission to ${action} ${resource} in ${journey} journey`,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createPermissions = createBulkFactory(createPermission);

/**
 * Factory for Role entities
 */
export interface RoleFactoryData {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  journey: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createRole: FactoryFunction<RoleFactoryData> = (overrides = {}) => {
  return {
    id: overrides.id || uuidv4(),
    name: overrides.name || faker.name.jobTitle(),
    description: overrides.description || faker.lorem.sentence(),
    isDefault: typeof overrides.isDefault !== 'undefined' ? overrides.isDefault : false,
    journey: overrides.journey || null,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createRoles = createBulkFactory(createRole);

/**
 * Health Journey Entities
 */

/**
 * Factory for HealthMetricType entities
 */
export interface HealthMetricTypeFactoryData {
  id: string;
  name: string;
  unit: string;
  normalRangeMin: number | null;
  normalRangeMax: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createHealthMetricType: FactoryFunction<HealthMetricTypeFactoryData> = (overrides = {}) => {
  const metricTypes = [
    { name: 'HEART_RATE', unit: 'bpm', min: 60, max: 100 },
    { name: 'BLOOD_PRESSURE', unit: 'mmHg', min: null, max: null },
    { name: 'BLOOD_GLUCOSE', unit: 'mg/dL', min: 70, max: 100 },
    { name: 'STEPS', unit: 'steps', min: 5000, max: null },
    { name: 'WEIGHT', unit: 'kg', min: null, max: null },
    { name: 'SLEEP', unit: 'hours', min: 7, max: 9 },
  ];
  
  const defaultType = faker.random.arrayElement(metricTypes);
  
  return {
    id: overrides.id || uuidv4(),
    name: overrides.name || defaultType.name,
    unit: overrides.unit || defaultType.unit,
    normalRangeMin: typeof overrides.normalRangeMin !== 'undefined' ? overrides.normalRangeMin : defaultType.min,
    normalRangeMax: typeof overrides.normalRangeMax !== 'undefined' ? overrides.normalRangeMax : defaultType.max,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createHealthMetricTypes = createBulkFactory(createHealthMetricType);

/**
 * Factory for DeviceType entities
 */
export interface DeviceTypeFactoryData {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createDeviceType: FactoryFunction<DeviceTypeFactoryData> = (overrides = {}) => {
  const deviceTypes = [
    { name: 'Smartwatch', description: 'Wearable smartwatch device', manufacturer: 'Apple' },
    { name: 'Blood Pressure Monitor', description: 'Blood pressure monitoring device', manufacturer: 'Omron' },
    { name: 'Glucose Monitor', description: 'Blood glucose monitoring device', manufacturer: 'Dexcom' },
    { name: 'Smart Scale', description: 'Weight and body composition scale', manufacturer: 'Withings' },
  ];
  
  const defaultType = faker.random.arrayElement(deviceTypes);
  
  return {
    id: overrides.id || uuidv4(),
    name: overrides.name || defaultType.name,
    description: overrides.description || defaultType.description,
    manufacturer: overrides.manufacturer || defaultType.manufacturer,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createDeviceTypes = createBulkFactory(createDeviceType);

/**
 * Factory for HealthMetric entities
 */
export interface HealthMetricFactoryData {
  id: string;
  userId: string;
  typeId: string;
  value: number;
  valueText: string | null;
  recordedAt: Date;
  source: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createHealthMetric: FactoryFunction<HealthMetricFactoryData> = (overrides = {}) => {
  const metricSources = ['manual', 'device', 'integration'];
  
  return {
    id: overrides.id || uuidv4(),
    userId: overrides.userId || uuidv4(),
    typeId: overrides.typeId || uuidv4(),
    value: typeof overrides.value !== 'undefined' ? overrides.value : faker.random.number({ min: 50, max: 200 }),
    valueText: overrides.valueText || null,
    recordedAt: overrides.recordedAt || randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    source: overrides.source || faker.random.arrayElement(metricSources),
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createHealthMetrics = createBulkFactory(createHealthMetric);

/**
 * Factory for HealthGoal entities
 */
export interface HealthGoalFactoryData {
  id: string;
  userId: string;
  metricTypeId: string;
  targetValue: number;
  targetValueText: string | null;
  startDate: Date;
  endDate: Date | null;
  status: string;
  progress: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createHealthGoal: FactoryFunction<HealthGoalFactoryData> = (overrides = {}) => {
  const goalStatuses = ['active', 'completed', 'abandoned'];
  const startDate = overrides.startDate || randomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  const endDate = overrides.endDate || randomDate(startDate, new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000));
  
  return {
    id: overrides.id || uuidv4(),
    userId: overrides.userId || uuidv4(),
    metricTypeId: overrides.metricTypeId || uuidv4(),
    targetValue: typeof overrides.targetValue !== 'undefined' ? overrides.targetValue : faker.random.number({ min: 1000, max: 10000 }),
    targetValueText: overrides.targetValueText || null,
    startDate,
    endDate,
    status: overrides.status || faker.random.arrayElement(goalStatuses),
    progress: typeof overrides.progress !== 'undefined' ? overrides.progress : faker.random.number({ min: 0, max: 100 }),
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createHealthGoals = createBulkFactory(createHealthGoal);

/**
 * Factory for DeviceConnection entities
 */
export interface DeviceConnectionFactoryData {
  id: string;
  userId: string;
  deviceTypeId: string;
  deviceId: string;
  name: string;
  status: string;
  lastSyncAt: Date | null;
  metadata: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createDeviceConnection: FactoryFunction<DeviceConnectionFactoryData> = (overrides = {}) => {
  const connectionStatuses = ['active', 'disconnected', 'paused'];
  
  return {
    id: overrides.id || uuidv4(),
    userId: overrides.userId || uuidv4(),
    deviceTypeId: overrides.deviceTypeId || uuidv4(),
    deviceId: overrides.deviceId || faker.random.uuid(),
    name: overrides.name || `${faker.name.firstName()}'s Device`,
    status: overrides.status || faker.random.arrayElement(connectionStatuses),
    lastSyncAt: overrides.lastSyncAt || randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    metadata: overrides.metadata || {
      firmwareVersion: faker.system.semver(),
      batteryLevel: faker.random.number({ min: 0, max: 100 }),
    },
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createDeviceConnections = createBulkFactory(createDeviceConnection);

/**
 * Care Journey Entities
 */

/**
 * Factory for ProviderSpecialty entities
 */
export interface ProviderSpecialtyFactoryData {
  id: string;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createProviderSpecialty: FactoryFunction<ProviderSpecialtyFactoryData> = (overrides = {}) => {
  const specialties = [
    { name: 'Cardiologia', description: 'Especialista em coração e sistema cardiovascular' },
    { name: 'Dermatologia', description: 'Especialista em pele, cabelo e unhas' },
    { name: 'Ortopedia', description: 'Especialista em sistema músculo-esquelético' },
    { name: 'Pediatria', description: 'Especialista em saúde infantil' },
    { name: 'Psiquiatria', description: 'Especialista em saúde mental' },
  ];
  
  const defaultSpecialty = faker.random.arrayElement(specialties);
  
  return {
    id: overrides.id || uuidv4(),
    name: overrides.name || defaultSpecialty.name,
    description: overrides.description || defaultSpecialty.description,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createProviderSpecialties = createBulkFactory(createProviderSpecialty);

/**
 * Factory for Provider entities
 */
export interface ProviderFactoryData {
  id: string;
  name: string;
  crm: string;
  specialtyId: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
  isAvailable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createProvider: FactoryFunction<ProviderFactoryData> = (overrides = {}) => {
  return {
    id: overrides.id || uuidv4(),
    name: overrides.name || faker.name.findName(),
    crm: overrides.crm || faker.random.number({ min: 10000, max: 99999 }).toString(),
    specialtyId: overrides.specialtyId || uuidv4(),
    email: overrides.email || faker.internet.email(),
    phone: overrides.phone || faker.phone.phoneNumber('+55119########'),
    address: overrides.address || faker.address.streetAddress(true),
    bio: overrides.bio || faker.lorem.paragraph(),
    isAvailable: typeof overrides.isAvailable !== 'undefined' ? overrides.isAvailable : true,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createProviders = createBulkFactory(createProvider);

/**
 * Factory for Appointment entities
 */
export interface AppointmentFactoryData {
  id: string;
  userId: string;
  providerId: string;
  scheduledAt: Date;
  endAt: Date;
  status: string;
  type: string;
  notes: string | null;
  location: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createAppointment: FactoryFunction<AppointmentFactoryData> = (overrides = {}) => {
  const appointmentStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
  const appointmentTypes = ['in-person', 'telemedicine', 'home-visit'];
  const scheduledAt = overrides.scheduledAt || randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const endAt = overrides.endAt || new Date(scheduledAt.getTime() + 30 * 60 * 1000); // 30 minutes later
  
  return {
    id: overrides.id || uuidv4(),
    userId: overrides.userId || uuidv4(),
    providerId: overrides.providerId || uuidv4(),
    scheduledAt,
    endAt,
    status: overrides.status || faker.random.arrayElement(appointmentStatuses),
    type: overrides.type || faker.random.arrayElement(appointmentTypes),
    notes: overrides.notes || faker.lorem.paragraph(),
    location: overrides.location || (overrides.type === 'in-person' ? faker.address.streetAddress(true) : null),
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createAppointments = createBulkFactory(createAppointment);

/**
 * Factory for Medication entities
 */
export interface MedicationFactoryData {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate: Date | null;
  instructions: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createMedication: FactoryFunction<MedicationFactoryData> = (overrides = {}) => {
  const medicationStatuses = ['active', 'completed', 'cancelled'];
  const startDate = overrides.startDate || randomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  const endDate = overrides.endDate || randomDate(startDate, new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000));
  
  return {
    id: overrides.id || uuidv4(),
    userId: overrides.userId || uuidv4(),
    name: overrides.name || faker.commerce.productName(),
    dosage: overrides.dosage || `${faker.random.number({ min: 1, max: 1000 })} mg`,
    frequency: overrides.frequency || `${faker.random.number({ min: 1, max: 4 })}x ao dia`,
    startDate,
    endDate,
    instructions: overrides.instructions || faker.lorem.sentence(),
    status: overrides.status || faker.random.arrayElement(medicationStatuses),
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createMedications = createBulkFactory(createMedication);

/**
 * Factory for Treatment entities
 */
export interface TreatmentFactoryData {
  id: string;
  userId: string;
  providerId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  progress: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createTreatment: FactoryFunction<TreatmentFactoryData> = (overrides = {}) => {
  const treatmentStatuses = ['active', 'completed', 'cancelled'];
  const startDate = overrides.startDate || randomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  const endDate = overrides.endDate || randomDate(startDate, new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000));
  
  return {
    id: overrides.id || uuidv4(),
    userId: overrides.userId || uuidv4(),
    providerId: overrides.providerId || uuidv4(),
    name: overrides.name || faker.lorem.words(3),
    description: overrides.description || faker.lorem.paragraph(),
    startDate,
    endDate,
    status: overrides.status || faker.random.arrayElement(treatmentStatuses),
    progress: typeof overrides.progress !== 'undefined' ? overrides.progress : faker.random.number({ min: 0, max: 100 }),
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createTreatments = createBulkFactory(createTreatment);

/**
 * Plan Journey Entities
 */

/**
 * Factory for InsurancePlanType entities
 */
export interface InsurancePlanTypeFactoryData {
  id: string;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createInsurancePlanType: FactoryFunction<InsurancePlanTypeFactoryData> = (overrides = {}) => {
  const planTypes = [
    { name: 'Básico', description: 'Plano com cobertura básica' },
    { name: 'Standard', description: 'Plano com cobertura intermediária' },
    { name: 'Premium', description: 'Plano com cobertura ampla' },
  ];
  
  const defaultType = faker.random.arrayElement(planTypes);
  
  return {
    id: overrides.id || uuidv4(),
    name: overrides.name || defaultType.name,
    description: overrides.description || defaultType.description,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createInsurancePlanTypes = createBulkFactory(createInsurancePlanType);

/**
 * Factory for ClaimType entities
 */
export interface ClaimTypeFactoryData {
  id: string;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createClaimType: FactoryFunction<ClaimTypeFactoryData> = (overrides = {}) => {
  const claimTypes = [
    { name: 'Consulta Médica', description: 'Reembolso para consulta médica' },
    { name: 'Exame', description: 'Reembolso para exames médicos' },
    { name: 'Terapia', description: 'Reembolso para sessões terapêuticas' },
    { name: 'Internação', description: 'Reembolso para internação hospitalar' },
    { name: 'Medicamento', description: 'Reembolso para medicamentos prescritos' },
  ];
  
  const defaultType = faker.random.arrayElement(claimTypes);
  
  return {
    id: overrides.id || uuidv4(),
    name: overrides.name || defaultType.name,
    description: overrides.description || defaultType.description,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createClaimTypes = createBulkFactory(createClaimType);

/**
 * Factory for InsurancePlan entities
 */
export interface InsurancePlanFactoryData {
  id: string;
  userId: string;
  planTypeId: string;
  policyNumber: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  monthlyPremium: number;
  coverageLimit: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createInsurancePlan: FactoryFunction<InsurancePlanFactoryData> = (overrides = {}) => {
  const planStatuses = ['active', 'expired', 'cancelled'];
  const startDate = overrides.startDate || randomDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));
  const endDate = overrides.endDate || randomDate(startDate, new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000));
  
  return {
    id: overrides.id || uuidv4(),
    userId: overrides.userId || uuidv4(),
    planTypeId: overrides.planTypeId || uuidv4(),
    policyNumber: overrides.policyNumber || faker.random.alphaNumeric(10).toUpperCase(),
    startDate,
    endDate,
    status: overrides.status || faker.random.arrayElement(planStatuses),
    monthlyPremium: typeof overrides.monthlyPremium !== 'undefined' ? overrides.monthlyPremium : faker.random.number({ min: 100, max: 1000 }),
    coverageLimit: typeof overrides.coverageLimit !== 'undefined' ? overrides.coverageLimit : faker.random.number({ min: 10000, max: 1000000 }),
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createInsurancePlans = createBulkFactory(createInsurancePlan);

/**
 * Factory for Claim entities
 */
export interface ClaimFactoryData {
  id: string;
  userId: string;
  planId: string;
  claimTypeId: string;
  providerName: string;
  serviceDate: Date;
  amount: number;
  status: string;
  receiptUrl: string | null;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createClaim: FactoryFunction<ClaimFactoryData> = (overrides = {}) => {
  const claimStatuses = ['submitted', 'in-review', 'approved', 'rejected'];
  
  return {
    id: overrides.id || uuidv4(),
    userId: overrides.userId || uuidv4(),
    planId: overrides.planId || uuidv4(),
    claimTypeId: overrides.claimTypeId || uuidv4(),
    providerName: overrides.providerName || faker.company.companyName(),
    serviceDate: overrides.serviceDate || randomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)),
    amount: typeof overrides.amount !== 'undefined' ? overrides.amount : faker.random.number({ min: 50, max: 5000 }),
    status: overrides.status || faker.random.arrayElement(claimStatuses),
    receiptUrl: overrides.receiptUrl || `https://storage.austa.com.br/receipts/${uuidv4()}.pdf`,
    notes: overrides.notes || faker.lorem.sentence(),
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createClaims = createBulkFactory(createClaim);

/**
 * Factory for Benefit entities
 */
export interface BenefitFactoryData {
  id: string;
  planId: string;
  name: string;
  description: string;
  coveragePercentage: number;
  annualLimit: number | null;
  waitingPeriod: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createBenefit: FactoryFunction<BenefitFactoryData> = (overrides = {}) => {
  return {
    id: overrides.id || uuidv4(),
    planId: overrides.planId || uuidv4(),
    name: overrides.name || faker.commerce.productName(),
    description: overrides.description || faker.lorem.sentence(),
    coveragePercentage: typeof overrides.coveragePercentage !== 'undefined' ? overrides.coveragePercentage : faker.random.number({ min: 50, max: 100 }),
    annualLimit: typeof overrides.annualLimit !== 'undefined' ? overrides.annualLimit : faker.random.number({ min: 1000, max: 50000 }),
    waitingPeriod: typeof overrides.waitingPeriod !== 'undefined' ? overrides.waitingPeriod : faker.random.number({ min: 0, max: 180 }),
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createBenefits = createBulkFactory(createBenefit);

/**
 * Gamification Entities
 */

/**
 * Factory for AchievementType entities
 */
export interface AchievementTypeFactoryData {
  id: string;
  name: string;
  title: string;
  description: string;
  journey: string;
  icon: string;
  levels: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createAchievementType: FactoryFunction<AchievementTypeFactoryData> = (overrides = {}) => {
  const achievementTypes = [
    { 
      name: 'health-check-streak', 
      title: 'Monitor de Saúde', 
      description: 'Registre suas métricas de saúde por dias consecutivos',
      journey: 'health',
      icon: 'heart-pulse',
      levels: 3
    },
    { 
      name: 'steps-goal', 
      title: 'Caminhante Dedicado', 
      description: 'Atinja sua meta diária de passos',
      journey: 'health',
      icon: 'footprints',
      levels: 3
    },
    { 
      name: 'appointment-keeper', 
      title: 'Compromisso com a Saúde', 
      description: 'Compareça às consultas agendadas',
      journey: 'care',
      icon: 'calendar-check',
      levels: 3
    },
    { 
      name: 'medication-adherence', 
      title: 'Aderência ao Tratamento', 
      description: 'Tome seus medicamentos conforme prescrito',
      journey: 'care',
      icon: 'pill',
      levels: 3
    },
    { 
      name: 'claim-master', 
      title: 'Mestre em Reembolsos', 
      description: 'Submeta solicitações de reembolso completas',
      journey: 'plan',
      icon: 'receipt',
      levels: 3
    },
  ];
  
  const defaultType = faker.random.arrayElement(achievementTypes);
  
  return {
    id: overrides.id || uuidv4(),
    name: overrides.name || defaultType.name,
    title: overrides.title || defaultType.title,
    description: overrides.description || defaultType.description,
    journey: overrides.journey || defaultType.journey,
    icon: overrides.icon || defaultType.icon,
    levels: typeof overrides.levels !== 'undefined' ? overrides.levels : defaultType.levels,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createAchievementTypes = createBulkFactory(createAchievementType);

/**
 * Factory for Achievement entities
 */
export interface AchievementFactoryData {
  id: string;
  userId: string;
  typeId: string;
  level: number;
  progress: number;
  completedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createAchievement: FactoryFunction<AchievementFactoryData> = (overrides = {}) => {
  const level = typeof overrides.level !== 'undefined' ? overrides.level : faker.random.number({ min: 1, max: 3 });
  const progress = typeof overrides.progress !== 'undefined' ? overrides.progress : faker.random.number({ min: 0, max: 100 });
  const completedAt = overrides.completedAt || (progress === 100 ? randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) : null);
  
  return {
    id: overrides.id || uuidv4(),
    userId: overrides.userId || uuidv4(),
    typeId: overrides.typeId || uuidv4(),
    level,
    progress,
    completedAt,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createAchievements = createBulkFactory(createAchievement);

/**
 * Factory for Reward entities
 */
export interface RewardFactoryData {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  type: string;
  imageUrl: string | null;
  isActive: boolean;
  quantity: number | null;
  expiresAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createReward: FactoryFunction<RewardFactoryData> = (overrides = {}) => {
  const rewardTypes = ['discount', 'product', 'service', 'donation'];
  
  return {
    id: overrides.id || uuidv4(),
    name: overrides.name || faker.commerce.productName(),
    description: overrides.description || faker.lorem.sentence(),
    pointCost: typeof overrides.pointCost !== 'undefined' ? overrides.pointCost : faker.random.number({ min: 100, max: 5000 }),
    type: overrides.type || faker.random.arrayElement(rewardTypes),
    imageUrl: overrides.imageUrl || `https://storage.austa.com.br/rewards/${uuidv4()}.jpg`,
    isActive: typeof overrides.isActive !== 'undefined' ? overrides.isActive : true,
    quantity: typeof overrides.quantity !== 'undefined' ? overrides.quantity : faker.random.number({ min: 1, max: 1000 }),
    expiresAt: overrides.expiresAt || randomDate(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createRewards = createBulkFactory(createReward);

/**
 * Factory for GamificationProfile entities
 */
export interface GamificationProfileFactoryData {
  id: string;
  userId: string;
  points: number;
  level: number;
  streak: number;
  lastActivityAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createGamificationProfile: FactoryFunction<GamificationProfileFactoryData> = (overrides = {}) => {
  return {
    id: overrides.id || uuidv4(),
    userId: overrides.userId || uuidv4(),
    points: typeof overrides.points !== 'undefined' ? overrides.points : faker.random.number({ min: 0, max: 10000 }),
    level: typeof overrides.level !== 'undefined' ? overrides.level : faker.random.number({ min: 1, max: 50 }),
    streak: typeof overrides.streak !== 'undefined' ? overrides.streak : faker.random.number({ min: 0, max: 365 }),
    lastActivityAt: overrides.lastActivityAt || randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createGamificationProfiles = createBulkFactory(createGamificationProfile);

/**
 * Factory for RewardRedemption entities
 */
export interface RewardRedemptionFactoryData {
  id: string;
  userId: string;
  rewardId: string;
  pointsSpent: number;
  status: string;
  redeemedAt: Date;
  fulfilledAt: Date | null;
  code: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createRewardRedemption: FactoryFunction<RewardRedemptionFactoryData> = (overrides = {}) => {
  const redemptionStatuses = ['pending', 'fulfilled', 'cancelled', 'expired'];
  const status = overrides.status || faker.random.arrayElement(redemptionStatuses);
  const redeemedAt = overrides.redeemedAt || randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const fulfilledAt = overrides.fulfilledAt || (status === 'fulfilled' ? randomDate(redeemedAt) : null);
  
  return {
    id: overrides.id || uuidv4(),
    userId: overrides.userId || uuidv4(),
    rewardId: overrides.rewardId || uuidv4(),
    pointsSpent: typeof overrides.pointsSpent !== 'undefined' ? overrides.pointsSpent : faker.random.number({ min: 100, max: 5000 }),
    status,
    redeemedAt,
    fulfilledAt,
    code: overrides.code || (status === 'fulfilled' ? faker.random.alphaNumeric(8).toUpperCase() : null),
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createRewardRedemptions = createBulkFactory(createRewardRedemption);

/**
 * Factory for Event entities
 */
export interface EventFactoryData {
  id: string;
  userId: string;
  type: string;
  journey: string;
  payload: Record<string, any>;
  processedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createEvent: FactoryFunction<EventFactoryData> = (overrides = {}) => {
  const eventTypes = ['metric-recorded', 'appointment-completed', 'medication-taken', 'claim-submitted', 'goal-achieved'];
  const journeys = ['health', 'care', 'plan'];
  const type = overrides.type || faker.random.arrayElement(eventTypes);
  const journey = overrides.journey || faker.random.arrayElement(journeys);
  
  let payload: Record<string, any> = {};
  
  // Generate appropriate payload based on event type
  switch (type) {
    case 'metric-recorded':
      payload = {
        metricTypeId: uuidv4(),
        value: faker.random.number({ min: 50, max: 200 }),
        recordedAt: new Date().toISOString(),
      };
      break;
    case 'appointment-completed':
      payload = {
        appointmentId: uuidv4(),
        providerId: uuidv4(),
        duration: faker.random.number({ min: 15, max: 60 }),
      };
      break;
    case 'medication-taken':
      payload = {
        medicationId: uuidv4(),
        takenAt: new Date().toISOString(),
        dosage: `${faker.random.number({ min: 1, max: 1000 })} mg`,
      };
      break;
    case 'claim-submitted':
      payload = {
        claimId: uuidv4(),
        amount: faker.random.number({ min: 50, max: 5000 }),
        serviceDate: new Date().toISOString(),
      };
      break;
    case 'goal-achieved':
      payload = {
        goalId: uuidv4(),
        achievedAt: new Date().toISOString(),
        targetValue: faker.random.number({ min: 1000, max: 10000 }),
      };
      break;
  }
  
  return {
    id: overrides.id || uuidv4(),
    userId: overrides.userId || uuidv4(),
    type,
    journey,
    payload: overrides.payload || payload,
    processedAt: overrides.processedAt || randomDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
  };
};

export const createEvents = createBulkFactory(createEvent);