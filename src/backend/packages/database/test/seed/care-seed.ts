/**
 * @file care-seed.ts
 * @description Contains seeding functions for Care journey test data, including appointments, providers,
 * telemedicine sessions, and medications. This file is essential for testing the Care journey components
 * by providing consistent, configurable test data that simulates realistic care coordination scenarios
 * while maintaining controlled test conditions.
 */

import { PrismaClient } from '@prisma/client';
import { CareContext, JourneyType } from '../../src/contexts/care.context';
import { ConnectionManager } from '../../src/connection/connection-manager';
import {
  SeedFunctionParams,
  SeedResult,
  ProviderSpecialtySeedData,
  ProviderSeedData,
  AppointmentSeedData,
  MedicationSeedData,
  CareJourneySeedData,
  SeedOptions,
} from './types';
import {
  seedLogger,
  withTransaction,
  withRetry,
  safeUpsert,
  safeCreate,
  safeConnect,
  executeSeedOperation,
  deterministicUuid,
  seededRandom,
  seededDate,
  seededBoolean,
  seededArrayItem,
  seededArraySubset,
  generateEmail,
  generatePhoneNumber,
} from './utils';
import { defaultConfig, getJourneyConfig } from './config';

/**
 * Appointment status enum
 */
enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

/**
 * Appointment type enum
 */
enum AppointmentType {
  IN_PERSON = 'IN_PERSON',
  TELEMEDICINE = 'TELEMEDICINE',
}

/**
 * Medication frequency options
 */
const MEDICATION_FREQUENCIES = [
  'daily',
  'twice daily',
  'three times daily',
  'four times daily',
  'every other day',
  'weekly',
  'as needed',
];

/**
 * Provider specialty seed data
 */
const DEFAULT_SPECIALTIES: ProviderSpecialtySeedData[] = [
  { name: 'Cardiologia', description: 'Especialista em coração e sistema cardiovascular' },
  { name: 'Dermatologia', description: 'Especialista em pele, cabelo e unhas' },
  { name: 'Ortopedia', description: 'Especialista em sistema músculo-esquelético' },
  { name: 'Pediatria', description: 'Especialista em saúde infantil' },
  { name: 'Psiquiatria', description: 'Especialista em saúde mental' },
  { name: 'Neurologia', description: 'Especialista em sistema nervoso' },
  { name: 'Oftalmologia', description: 'Especialista em olhos e visão' },
  { name: 'Ginecologia', description: 'Especialista em saúde feminina' },
  { name: 'Urologia', description: 'Especialista em sistema urinário e reprodutor masculino' },
  { name: 'Endocrinologia', description: 'Especialista em hormônios e metabolismo' },
];

/**
 * Seeds provider specialties for the Care journey
 * 
 * @param params Seed function parameters
 * @param specialties Provider specialties to seed
 * @returns Seed result
 */
export async function seedProviderSpecialties(
  params: SeedFunctionParams,
  specialties: ProviderSpecialtySeedData[] = DEFAULT_SPECIALTIES
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const logger = seedLogger;
  logger.setEnabled(options.logging ?? true);
  
  logger.info(`Seeding ${specialties.length} provider specialties`);
  
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
  };
  
  const startTime = Date.now();
  
  try {
    await withTransaction(prisma, async (tx) => {
      for (const specialty of specialties) {
        try {
          const result = await safeUpsert(
            tx,
            'providerSpecialty',
            { name: specialty.name },
            specialty,
            {}, // No updates needed if it exists
            { logging: options.logging }
          );
          
          if (result) {
            if (result.createdAt === result.updatedAt) {
              stats.created++;
            } else {
              stats.updated++;
            }
          } else {
            stats.skipped++;
          }
        } catch (error) {
          logger.error(`Failed to seed specialty: ${specialty.name}`, error);
          stats.skipped++;
        }
      }
    }, { logging: options.logging });
    
    logger.info(`Provider specialties seeding completed: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped`);
    
    return {
      success: true,
      stats: {
        created: { providerSpecialties: stats.created },
        updated: { providerSpecialties: stats.updated },
        skipped: { providerSpecialties: stats.skipped },
        timeTakenMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    logger.error('Provider specialties seeding failed', error);
    
    return {
      success: false,
      error: error.message,
      stats: {
        created: { providerSpecialties: stats.created },
        updated: { providerSpecialties: stats.updated },
        skipped: { providerSpecialties: stats.skipped },
        timeTakenMs: Date.now() - startTime,
      },
    };
  }
}

/**
 * Generates test provider data with availability schedules
 * 
 * @param count Number of providers to generate
 * @param specialties Available specialties
 * @param options Seed options
 * @returns Array of provider seed data
 */
export function generateProviderTestData(
  count: number,
  specialties: string[],
  options: SeedOptions = {}
): ProviderSeedData[] {
  const providers: ProviderSeedData[] = [];
  const randomSeed = options.randomSeed ?? defaultConfig.randomSeed;
  
  for (let i = 0; i < count; i++) {
    const seed = `provider-${randomSeed}-${i}`;
    const firstName = seededArrayItem(seed, [
      'Ana', 'Carlos', 'Mariana', 'João', 'Fernanda', 'Ricardo', 'Camila', 'Pedro', 'Luciana', 'Gabriel',
    ]);
    const lastName = seededArrayItem(seed, [
      'Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima',
    ]);
    
    // Generate a registration number in the format CRM/UF 123456
    const uf = seededArrayItem(`${seed}-uf`, [
      'SP', 'RJ', 'MG', 'RS', 'PR', 'BA', 'SC', 'PE', 'CE', 'DF',
    ]);
    const registrationNumber = `CRM/${uf} ${seededRandom(`${seed}-reg`, 100000, 999999)}`;
    
    // Assign 1-3 specialties to each provider
    const specialtyCount = seededRandom(`${seed}-spec-count`, 1, Math.min(3, specialties.length));
    const providerSpecialties = seededArraySubset(`${seed}-specs`, specialties, specialtyCount);
    
    // Generate provider data
    providers.push({
      name: `Dr. ${firstName} ${lastName}`,
      registrationNumber,
      specialties: providerSpecialties,
      email: generateEmail(`${seed}-${firstName.toLowerCase()}.${lastName.toLowerCase()}`),
      phone: generatePhoneNumber(seed),
    });
  }
  
  return providers;
}

/**
 * Seeds providers with availability schedules for the Care journey
 * 
 * @param params Seed function parameters
 * @param providers Providers to seed
 * @returns Seed result
 */
export async function seedProviders(
  params: SeedFunctionParams,
  providers: ProviderSeedData[]
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const logger = seedLogger;
  logger.setEnabled(options.logging ?? true);
  
  logger.info(`Seeding ${providers.length} providers`);
  
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    schedules: 0,
  };
  
  const startTime = Date.now();
  const randomSeed = options.randomSeed ?? defaultConfig.randomSeed;
  
  try {
    await withTransaction(prisma, async (tx) => {
      // Get all specialties
      const specialties = await tx.providerSpecialty.findMany();
      const specialtyMap = new Map(specialties.map(s => [s.name, s.id]));
      
      for (const providerData of providers) {
        try {
          // Create the provider
          const provider = await safeUpsert(
            tx,
            'provider',
            { registrationNumber: providerData.registrationNumber },
            {
              name: providerData.name,
              registrationNumber: providerData.registrationNumber,
              email: providerData.email,
              phone: providerData.phone,
              telemedicineAvailable: seededBoolean(`provider-telemedicine-${providerData.registrationNumber}`, 0.7),
              isTestData: true,
            },
            {
              name: providerData.name,
              email: providerData.email,
              phone: providerData.phone,
            },
            { logging: options.logging }
          );
          
          if (!provider) {
            stats.skipped++;
            continue;
          }
          
          // Connect specialties
          const specialtyIds = providerData.specialties
            .map(name => specialtyMap.get(name))
            .filter(Boolean);
          
          if (specialtyIds.length > 0) {
            await safeConnect(
              tx,
              'provider',
              provider.id,
              'specialties',
              specialtyIds,
              { logging: options.logging }
            );
          }
          
          // Generate availability schedule
          // Each provider works on 3-6 days per week with different hours
          const workDays = seededArraySubset(
            `provider-workdays-${provider.id}`,
            [0, 1, 2, 3, 4, 5, 6], // 0 = Sunday, 6 = Saturday
            seededRandom(`provider-workday-count-${provider.id}`, 3, 6)
          );
          
          for (const dayOfWeek of workDays) {
            // Generate work hours (8am-12pm and/or 1pm-6pm)
            const worksMorning = seededBoolean(`provider-morning-${provider.id}-${dayOfWeek}`, 0.9);
            const worksAfternoon = seededBoolean(`provider-afternoon-${provider.id}-${dayOfWeek}`, 0.8);
            
            if (worksMorning) {
              // Morning shift (8am-12pm with some variation)
              const startHour = seededRandom(`provider-morning-start-${provider.id}-${dayOfWeek}`, 7, 9);
              const endHour = seededRandom(`provider-morning-end-${provider.id}-${dayOfWeek}`, 11, 13);
              
              await tx.providerSchedule.create({
                data: {
                  providerId: provider.id,
                  dayOfWeek,
                  startHour,
                  startMinute: 0,
                  endHour,
                  endMinute: 0,
                  isTestData: true,
                },
              });
              
              stats.schedules++;
            }
            
            if (worksAfternoon) {
              // Afternoon shift (1pm-6pm with some variation)
              const startHour = seededRandom(`provider-afternoon-start-${provider.id}-${dayOfWeek}`, 13, 15);
              const endHour = seededRandom(`provider-afternoon-end-${provider.id}-${dayOfWeek}`, 16, 19);
              
              await tx.providerSchedule.create({
                data: {
                  providerId: provider.id,
                  dayOfWeek,
                  startHour,
                  startMinute: 0,
                  endHour,
                  endMinute: 0,
                  isTestData: true,
                },
              });
              
              stats.schedules++;
            }
          }
          
          stats.created++;
        } catch (error) {
          logger.error(`Failed to seed provider: ${providerData.name}`, error);
          stats.skipped++;
        }
      }
    }, { logging: options.logging });
    
    logger.info(`Providers seeding completed: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped, ${stats.schedules} schedules created`);
    
    return {
      success: true,
      stats: {
        created: { providers: stats.created, providerSchedules: stats.schedules },
        updated: { providers: stats.updated },
        skipped: { providers: stats.skipped },
        timeTakenMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    logger.error('Providers seeding failed', error);
    
    return {
      success: false,
      error: error.message,
      stats: {
        created: { providers: stats.created, providerSchedules: stats.schedules },
        updated: { providers: stats.updated },
        skipped: { providers: stats.skipped },
        timeTakenMs: Date.now() - startTime,
      },
    };
  }
}

/**
 * Generates test appointment data with various scenarios
 * 
 * @param count Number of appointments to generate
 * @param userIds User IDs to assign appointments to
 * @param providerIds Provider IDs to assign appointments to
 * @param options Seed options
 * @returns Array of appointment seed data
 */
export function generateAppointmentTestData(
  count: number,
  userIds: string[],
  providerIds: string[],
  options: SeedOptions = {}
): AppointmentSeedData[] {
  if (userIds.length === 0 || providerIds.length === 0) {
    return [];
  }
  
  const appointments: AppointmentSeedData[] = [];
  const randomSeed = options.randomSeed ?? defaultConfig.randomSeed;
  
  // Define date range for appointments (past 30 days to next 60 days)
  const now = new Date();
  const pastDate = new Date(now);
  pastDate.setDate(pastDate.getDate() - 30);
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + 60);
  
  for (let i = 0; i < count; i++) {
    const seed = `appointment-${randomSeed}-${i}`;
    const userId = seededArrayItem(`${seed}-user`, userIds);
    const providerId = seededArrayItem(`${seed}-provider`, providerIds);
    
    // Generate appointment date (past or future)
    const isPastAppointment = seededBoolean(`${seed}-past`, 0.4);
    let scheduledAt: Date;
    let status: AppointmentStatus;
    
    if (isPastAppointment) {
      // Past appointment (between 30 days ago and yesterday)
      scheduledAt = seededDate(`${seed}-date`, pastDate, new Date(now.getTime() - 86400000));
      
      // Determine status for past appointments
      const statusRandom = seededRandom(`${seed}-status`, 1, 100);
      if (statusRandom <= 70) {
        status = AppointmentStatus.COMPLETED; // 70% completed
      } else if (statusRandom <= 85) {
        status = AppointmentStatus.CANCELLED; // 15% cancelled
      } else {
        status = AppointmentStatus.NO_SHOW; // 15% no-show
      }
    } else {
      // Future appointment (between today and 60 days from now)
      scheduledAt = seededDate(`${seed}-date`, now, futureDate);
      status = AppointmentStatus.SCHEDULED;
    }
    
    // Ensure appointment is during business hours (9am-5pm)
    scheduledAt.setHours(seededRandom(`${seed}-hour`, 9, 17));
    scheduledAt.setMinutes(seededRandom(`${seed}-minute`, 0, 3) * 15); // 0, 15, 30, or 45 minutes
    scheduledAt.setSeconds(0);
    scheduledAt.setMilliseconds(0);
    
    // Determine appointment type
    const isTelemedicine = seededBoolean(`${seed}-telemedicine`, 0.3);
    const appointmentType = isTelemedicine ? AppointmentType.TELEMEDICINE : AppointmentType.IN_PERSON;
    
    // Generate notes for some appointments
    let notes: string | undefined;
    if (seededBoolean(`${seed}-has-notes`, 0.4)) {
      const noteOptions = [
        'Paciente relatou dores persistentes',
        'Retorno para avaliação de exames',
        'Primeira consulta - avaliação inicial',
        'Acompanhamento de tratamento em andamento',
        'Paciente solicitou atestado médico',
      ];
      notes = seededArrayItem(`${seed}-notes`, noteOptions);
    }
    
    appointments.push({
      userId,
      providerId,
      scheduledAt,
      durationMinutes: 30, // Standard 30-minute appointments
      status,
      notes,
    });
  }
  
  return appointments;
}

/**
 * Seeds appointments for the Care journey
 * 
 * @param params Seed function parameters
 * @param appointments Appointments to seed
 * @returns Seed result
 */
export async function seedAppointments(
  params: SeedFunctionParams,
  appointments: AppointmentSeedData[]
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const logger = seedLogger;
  logger.setEnabled(options.logging ?? true);
  
  logger.info(`Seeding ${appointments.length} appointments`);
  
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    telemedicineSessions: 0,
  };
  
  const startTime = Date.now();
  
  try {
    await withTransaction(prisma, async (tx) => {
      for (const appointmentData of appointments) {
        try {
          // Create a unique identifier for the appointment
          const appointmentKey = `${appointmentData.userId}-${appointmentData.providerId}-${appointmentData.scheduledAt.toISOString()}`;
          const appointmentId = deterministicUuid(appointmentKey, 'appointment');
          
          // Create the appointment
          const appointment = await safeCreate(
            tx,
            'appointment',
            { id: appointmentId },
            {
              id: appointmentId,
              userId: appointmentData.userId,
              providerId: appointmentData.providerId,
              dateTime: appointmentData.scheduledAt,
              type: appointmentData.status === AppointmentStatus.TELEMEDICINE ? 'TELEMEDICINE' : 'IN_PERSON',
              status: appointmentData.status,
              notes: appointmentData.notes || '',
              isTestData: true,
            },
            { logging: options.logging }
          );
          
          if (!appointment) {
            stats.skipped++;
            continue;
          }
          
          // For telemedicine appointments, create a telemedicine session
          if (appointment.type === 'TELEMEDICINE') {
            const sessionStatus = appointment.status === 'SCHEDULED' ? 'scheduled' :
                                appointment.status === 'COMPLETED' ? 'completed' :
                                appointment.status === 'CANCELLED' ? 'cancelled' : 'no-show';
            
            const endTime = appointment.status === 'COMPLETED' ?
              new Date(appointment.dateTime.getTime() + appointmentData.durationMinutes * 60000) : null;
            
            await tx.telemedicineSession.create({
              data: {
                appointmentId: appointment.id,
                patientId: appointment.userId,
                providerId: appointment.providerId,
                startTime: appointment.dateTime,
                endTime,
                status: sessionStatus,
                sessionType: 'standard',
                metadata: {
                  sessionUrl: `https://telemedicine.austa.app/session/${appointment.id}`,
                  platform: 'web',
                },
                isTestData: true,
              },
            });
            
            stats.telemedicineSessions++;
          }
          
          stats.created++;
        } catch (error) {
          logger.error(`Failed to seed appointment for user ${appointmentData.userId}`, error);
          stats.skipped++;
        }
      }
    }, { logging: options.logging });
    
    logger.info(`Appointments seeding completed: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped, ${stats.telemedicineSessions} telemedicine sessions created`);
    
    return {
      success: true,
      stats: {
        created: { appointments: stats.created, telemedicineSessions: stats.telemedicineSessions },
        updated: { appointments: stats.updated },
        skipped: { appointments: stats.skipped },
        timeTakenMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    logger.error('Appointments seeding failed', error);
    
    return {
      success: false,
      error: error.message,
      stats: {
        created: { appointments: stats.created, telemedicineSessions: stats.telemedicineSessions },
        updated: { appointments: stats.updated },
        skipped: { appointments: stats.skipped },
        timeTakenMs: Date.now() - startTime,
      },
    };
  }
}

/**
 * Generates test medication data with adherence patterns
 * 
 * @param count Number of medications to generate
 * @param userIds User IDs to assign medications to
 * @param providerIds Provider IDs to assign as prescribers
 * @param options Seed options
 * @returns Array of medication seed data
 */
export function generateMedicationTestData(
  count: number,
  userIds: string[],
  providerIds: string[],
  options: SeedOptions = {}
): MedicationSeedData[] {
  if (userIds.length === 0 || providerIds.length === 0) {
    return [];
  }
  
  const medications: MedicationSeedData[] = [];
  const randomSeed = options.randomSeed ?? defaultConfig.randomSeed;
  
  // Common medication names and dosages
  const medicationOptions = [
    { name: 'Losartana', dosage: '50mg' },
    { name: 'Atorvastatina', dosage: '20mg' },
    { name: 'Metformina', dosage: '500mg' },
    { name: 'Omeprazol', dosage: '20mg' },
    { name: 'Levotiroxina', dosage: '50mcg' },
    { name: 'Amoxicilina', dosage: '500mg' },
    { name: 'Dipirona', dosage: '500mg' },
    { name: 'Paracetamol', dosage: '750mg' },
    { name: 'Ibuprofeno', dosage: '600mg' },
    { name: 'Fluoxetina', dosage: '20mg' },
    { name: 'Clonazepam', dosage: '2mg' },
    { name: 'Sertralina', dosage: '50mg' },
  ];
  
  // Define date range for medications (past 90 days to next 180 days for end date)
  const now = new Date();
  const pastDate = new Date(now);
  pastDate.setDate(pastDate.getDate() - 90);
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + 180);
  
  for (let i = 0; i < count; i++) {
    const seed = `medication-${randomSeed}-${i}`;
    const userId = seededArrayItem(`${seed}-user`, userIds);
    const providerId = seededArrayItem(`${seed}-provider`, providerIds);
    
    // Select a medication and dosage
    const medication = seededArrayItem(`${seed}-med`, medicationOptions);
    
    // Generate start date (between 90 days ago and today)
    const startDate = seededDate(`${seed}-start`, pastDate, now);
    
    // Determine if medication has an end date
    let endDate: Date | undefined;
    if (seededBoolean(`${seed}-has-end`, 0.6)) {
      // 60% of medications have an end date
      endDate = seededDate(`${seed}-end`, now, futureDate);
    }
    
    // Select a frequency
    const frequency = seededArrayItem(`${seed}-freq`, MEDICATION_FREQUENCIES);
    
    medications.push({
      name: medication.name,
      dosage: medication.dosage,
      frequency,
      startDate,
      endDate,
      userId,
      prescribedBy: providerId,
    });
  }
  
  return medications;
}

/**
 * Seeds medications for the Care journey
 * 
 * @param params Seed function parameters
 * @param medications Medications to seed
 * @returns Seed result
 */
export async function seedMedications(
  params: SeedFunctionParams,
  medications: MedicationSeedData[]
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const logger = seedLogger;
  logger.setEnabled(options.logging ?? true);
  
  logger.info(`Seeding ${medications.length} medications`);
  
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    intakes: 0,
  };
  
  const startTime = Date.now();
  const randomSeed = options.randomSeed ?? defaultConfig.randomSeed;
  
  try {
    await withTransaction(prisma, async (tx) => {
      for (const medicationData of medications) {
        try {
          // Create a unique identifier for the medication
          const medicationKey = `${medicationData.userId}-${medicationData.name}-${medicationData.startDate.toISOString()}`;
          const medicationId = deterministicUuid(medicationKey, 'medication');
          
          // Determine if medication is active
          const now = new Date();
          const isActive = !medicationData.endDate || medicationData.endDate > now;
          
          // Create the medication
          const medication = await safeCreate(
            tx,
            'medication',
            { id: medicationId },
            {
              id: medicationId,
              userId: medicationData.userId,
              name: medicationData.name,
              dosage: medicationData.dosage,
              frequency: medicationData.frequency,
              startDate: medicationData.startDate,
              endDate: medicationData.endDate,
              active: isActive,
              prescribedBy: medicationData.prescribedBy,
              instructions: '',
              isTestData: true,
            },
            { logging: options.logging }
          );
          
          if (!medication) {
            stats.skipped++;
            continue;
          }
          
          // Generate medication intakes for past dates
          if (medicationData.startDate < now) {
            // Determine how many days to generate intakes for
            const startDaysAgo = Math.floor((now.getTime() - medicationData.startDate.getTime()) / (1000 * 60 * 60 * 24));
            const daysToGenerate = Math.min(startDaysAgo, 30); // Generate up to 30 days of history
            
            // Determine adherence pattern (how often medication is taken as prescribed)
            const adherenceRate = seededRandom(`${medicationId}-adherence`, 50, 100) / 100; // 50-100% adherence
            
            // Calculate expected intakes per day based on frequency
            let intakesPerDay = 1;
            switch (medicationData.frequency) {
              case 'twice daily':
                intakesPerDay = 2;
                break;
              case 'three times daily':
                intakesPerDay = 3;
                break;
              case 'four times daily':
                intakesPerDay = 4;
                break;
              case 'every other day':
                intakesPerDay = 0.5;
                break;
              case 'weekly':
                intakesPerDay = 1/7;
                break;
              case 'as needed':
                intakesPerDay = seededRandom(`${medicationId}-prn`, 0, 3) / 10; // 0-0.3 per day
                break;
            }
            
            // Generate intakes
            for (let day = 0; day < daysToGenerate; day++) {
              const intakeDate = new Date(now);
              intakeDate.setDate(intakeDate.getDate() - day);
              
              // Determine expected intakes for this day
              let expectedIntakes = intakesPerDay;
              if (medicationData.frequency === 'every other day') {
                expectedIntakes = day % 2 === 0 ? 1 : 0;
              } else if (medicationData.frequency === 'weekly') {
                expectedIntakes = day % 7 === 0 ? 1 : 0;
              }
              
              // Round to nearest integer (for whole intakes)
              const intakesToGenerate = Math.round(expectedIntakes);
              
              for (let i = 0; i < intakesToGenerate; i++) {
                // Check if this intake is taken (based on adherence rate)
                if (seededRandom(`${medicationId}-day-${day}-intake-${i}`, 0, 100) / 100 <= adherenceRate) {
                  // Generate intake time
                  const intakeHour = i === 0 ? 8 : // First dose in morning
                                    i === 1 ? 13 : // Second dose at lunch
                                    i === 2 ? 18 : // Third dose at dinner
                                    22; // Fourth dose at bedtime
                  
                  // Add some variation to the time
                  const hourVariation = seededRandom(`${medicationId}-day-${day}-intake-${i}-hour-var`, -1, 1);
                  const minuteVariation = seededRandom(`${medicationId}-day-${day}-intake-${i}-min-var`, 0, 59);
                  
                  const intakeTime = new Date(intakeDate);
                  intakeTime.setHours(intakeHour + hourVariation, minuteVariation, 0, 0);
                  
                  // Create the intake record
                  await tx.medicationIntake.create({
                    data: {
                      medicationId,
                      userId: medicationData.userId,
                      intakeTime,
                      dosage: parseFloat(medicationData.dosage.match(/\d+(\.\d+)?/)[0]),
                      notes: '',
                      isTestData: true,
                    },
                  });
                  
                  stats.intakes++;
                }
              }
            }
          }
          
          stats.created++;
        } catch (error) {
          logger.error(`Failed to seed medication ${medicationData.name} for user ${medicationData.userId}`, error);
          stats.skipped++;
        }
      }
    }, { logging: options.logging });
    
    logger.info(`Medications seeding completed: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped, ${stats.intakes} intakes created`);
    
    return {
      success: true,
      stats: {
        created: { medications: stats.created, medicationIntakes: stats.intakes },
        updated: { medications: stats.updated },
        skipped: { medications: stats.skipped },
        timeTakenMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    logger.error('Medications seeding failed', error);
    
    return {
      success: false,
      error: error.message,
      stats: {
        created: { medications: stats.created, medicationIntakes: stats.intakes },
        updated: { medications: stats.updated },
        skipped: { medications: stats.skipped },
        timeTakenMs: Date.now() - startTime,
      },
    };
  }
}

/**
 * Seeds all Care journey data
 * 
 * @param params Seed function parameters
 * @param data Care journey seed data
 * @returns Seed result
 */
export async function seedCareJourney(
  params: SeedFunctionParams,
  data: CareJourneySeedData
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const logger = seedLogger;
  logger.setEnabled(options.logging ?? true);
  
  logger.info('Starting Care journey seeding');
  
  const startTime = Date.now();
  const stats = {
    created: {},
    updated: {},
    skipped: {},
  };
  
  try {
    // Seed provider specialties
    const specialtiesResult = await seedProviderSpecialties(
      { prisma, options },
      data.specialties
    );
    
    if (!specialtiesResult.success) {
      throw new Error(`Failed to seed provider specialties: ${specialtiesResult.error}`);
    }
    
    Object.assign(stats.created, specialtiesResult.stats.created);
    Object.assign(stats.updated, specialtiesResult.stats.updated);
    Object.assign(stats.skipped, specialtiesResult.stats.skipped);
    
    // Seed test data if enabled
    if (options.includeTestData && data.providers && data.providers.length > 0) {
      // Get users for test data
      const users = await prisma.user.findMany({
        take: 10, // Limit to 10 users for test data
      });
      
      if (users.length === 0) {
        logger.warn('No users found for test data, skipping Care journey test data seeding');
      } else {
        const userIds = users.map(user => user.id);
        
        // Seed providers
        const providersResult = await seedProviders(
          { prisma, options },
          data.providers
        );
        
        if (!providersResult.success) {
          throw new Error(`Failed to seed providers: ${providersResult.error}`);
        }
        
        Object.assign(stats.created, providersResult.stats.created);
        Object.assign(stats.updated, providersResult.stats.updated);
        Object.assign(stats.skipped, providersResult.stats.skipped);
        
        // Get provider IDs for appointments and medications
        const providers = await prisma.provider.findMany({
          where: { isTestData: true },
        });
        
        const providerIds = providers.map(provider => provider.id);
        
        if (providerIds.length > 0) {
          // Seed appointments if configured
          if (data.appointments && data.appointments.length > 0) {
            const appointmentsResult = await seedAppointments(
              { prisma, options },
              data.appointments
            );
            
            if (!appointmentsResult.success) {
              throw new Error(`Failed to seed appointments: ${appointmentsResult.error}`);
            }
            
            Object.assign(stats.created, appointmentsResult.stats.created);
            Object.assign(stats.updated, appointmentsResult.stats.updated);
            Object.assign(stats.skipped, appointmentsResult.stats.skipped);
          } else if (options.testDataCount > 0) {
            // Generate and seed appointments
            const appointmentCount = options.testDataCount * 2; // 2 appointments per user on average
            const appointmentData = generateAppointmentTestData(
              appointmentCount,
              userIds,
              providerIds,
              options
            );
            
            const appointmentsResult = await seedAppointments(
              { prisma, options },
              appointmentData
            );
            
            if (!appointmentsResult.success) {
              throw new Error(`Failed to seed generated appointments: ${appointmentsResult.error}`);
            }
            
            Object.assign(stats.created, appointmentsResult.stats.created);
            Object.assign(stats.updated, appointmentsResult.stats.updated);
            Object.assign(stats.skipped, appointmentsResult.stats.skipped);
          }
          
          // Seed medications if configured
          if (data.medications && data.medications.length > 0) {
            const medicationsResult = await seedMedications(
              { prisma, options },
              data.medications
            );
            
            if (!medicationsResult.success) {
              throw new Error(`Failed to seed medications: ${medicationsResult.error}`);
            }
            
            Object.assign(stats.created, medicationsResult.stats.created);
            Object.assign(stats.updated, medicationsResult.stats.updated);
            Object.assign(stats.skipped, medicationsResult.stats.skipped);
          } else if (options.testDataCount > 0) {
            // Generate and seed medications
            const medicationCount = options.testDataCount * 3; // 3 medications per user on average
            const medicationData = generateMedicationTestData(
              medicationCount,
              userIds,
              providerIds,
              options
            );
            
            const medicationsResult = await seedMedications(
              { prisma, options },
              medicationData
            );
            
            if (!medicationsResult.success) {
              throw new Error(`Failed to seed generated medications: ${medicationsResult.error}`);
            }
            
            Object.assign(stats.created, medicationsResult.stats.created);
            Object.assign(stats.updated, medicationsResult.stats.updated);
            Object.assign(stats.skipped, medicationsResult.stats.skipped);
          }
        }
      }
    }
    
    logger.info('Care journey seeding completed successfully');
    
    return {
      success: true,
      stats: {
        created: stats.created,
        updated: stats.updated,
        skipped: stats.skipped,
        timeTakenMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    logger.error('Care journey seeding failed', error);
    
    return {
      success: false,
      error: error.message,
      stats: {
        created: stats.created,
        updated: stats.updated,
        skipped: stats.skipped,
        timeTakenMs: Date.now() - startTime,
      },
    };
  }
}

/**
 * Seeds Care journey data using the CareContext
 * 
 * @param careContext Care journey database context
 * @param options Seed options
 * @returns Seed result
 */
export async function seedCareJourneyWithContext(
  careContext: CareContext,
  options: SeedOptions = {}
): Promise<SeedResult> {
  const logger = seedLogger;
  logger.setEnabled(options.logging ?? true);
  
  logger.info('Starting Care journey seeding with CareContext');
  
  try {
    // Get the Prisma client from the context
    const prisma = careContext.getPrismaClient();
    
    // Get journey configuration
    const config = getJourneyConfig(defaultConfig, JourneyType.CARE);
    
    if (!config) {
      throw new Error('Care journey configuration not found');
    }
    
    // Create seed data
    const seedData: CareJourneySeedData = {
      specialties: DEFAULT_SPECIALTIES,
      providers: options.includeTestData ? generateProviderTestData(
        config.providersCount,
        DEFAULT_SPECIALTIES.map(s => s.name),
        options
      ) : [],
    };
    
    // Seed the data
    return await seedCareJourney({ prisma, options }, seedData);
  } catch (error) {
    logger.error('Care journey seeding with context failed', error);
    
    return {
      success: false,
      error: error.message,
      stats: {
        created: {},
        updated: {},
        skipped: {},
        timeTakenMs: 0,
      },
    };
  }
}

/**
 * Creates a CareContext instance for testing
 * 
 * @param connectionManager Connection manager instance
 * @returns CareContext instance
 */
export function createTestCareContext(connectionManager?: ConnectionManager): CareContext {
  // Create a connection manager if not provided
  const manager = connectionManager || new ConnectionManager({
    databaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/austa_test',
  });
  
  // Create and return the care context
  return new CareContext(manager, {
    logging: true,
    journey: {
      journeyType: JourneyType.CARE,
      options: {
        useJourneyCaching: false,
      },
    },
  });
}

/**
 * Main function to seed Care journey data
 * 
 * @param options Seed options
 * @returns Seed result
 */
export async function seedCare(options: SeedOptions = {}): Promise<SeedResult> {
  const logger = seedLogger;
  logger.setEnabled(options.logging ?? true);
  
  logger.info('Starting Care journey seeding');
  
  try {
    // Create a care context for seeding
    const careContext = createTestCareContext();
    
    // Seed with the context
    const result = await seedCareJourneyWithContext(careContext, options);
    
    // Close the context when done
    await careContext.onModuleDestroy();
    
    return result;
  } catch (error) {
    logger.error('Care journey seeding failed', error);
    
    return {
      success: false,
      error: error.message,
      stats: {
        created: {},
        updated: {},
        skipped: {},
        timeTakenMs: 0,
      },
    };
  }
}

// Export default function for direct usage
export default seedCare;