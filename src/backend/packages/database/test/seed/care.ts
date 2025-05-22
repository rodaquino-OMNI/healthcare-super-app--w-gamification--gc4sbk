/**
 * @file Care Journey Seed Functions
 * 
 * Contains seed functions for the Care journey ("Cuidar-me Agora") test data,
 * including providers, appointments, medications, and treatments.
 */

import { PrismaClient } from '@prisma/client';
import { CareContext } from '../../src/contexts/care.context';
import { TestSeedOptions, prefixTestData, getCountByVolume, handleSeedError } from './types';

/**
 * Seeds Care Journey test data.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 * @param careContext - Optional CareContext instance for optimized operations
 */
export async function seedCareJourneyData(
  prisma: PrismaClient, 
  options: TestSeedOptions,
  careContext?: CareContext
): Promise<void> {
  try {
    // Sample provider specialties
    const specialties = [
      { name: prefixTestData('Cardiologia', options), description: 'Especialista em corau00e7u00e3o e sistema cardiovascular' },
      { name: prefixTestData('Dermatologia', options), description: 'Especialista em pele, cabelo e unhas' },
      { name: prefixTestData('Ortopedia', options), description: 'Especialista em sistema mu00fasculo-esquelu00e9tico' },
      { name: prefixTestData('Pediatria', options), description: 'Especialista em sau00fade infantil' },
      { name: prefixTestData('Psiquiatria', options), description: 'Especialista em sau00fade mental' },
    ];
    
    for (const specialty of specialties) {
      // Use care context if available for optimized operations
      if (careContext) {
        await careContext.upsertProviderSpecialty(specialty);
      } else {
        await prisma.providerSpecialty.upsert({
          where: { name: specialty.name },
          update: {},
          create: specialty,
        });
      }
    }
    
    // Create providers based on volume
    if (options.dataVolume !== 'small') {
      await seedProvidersData(prisma, options, careContext);
    }
    
    // Create appointments based on volume
    if (options.dataVolume !== 'small') {
      await seedAppointmentsData(prisma, options, careContext);
    }
    
    // Create medications based on volume
    if (options.dataVolume !== 'small') {
      await seedMedicationsData(prisma, options, careContext);
    }
    
    // Create treatments based on volume
    if (options.dataVolume !== 'small') {
      await seedTreatmentsData(prisma, options, careContext);
    }
    
    if (options.logging) {
      console.log(`Created care journey test data: ${specialties.length} provider specialties`);
    }
  } catch (error) {
    if (options.errorHandling === 'throw') {
      throw error;
    } else if (options.errorHandling === 'log') {
      console.error(`Error seeding care journey test data:`, error);
    }
  }
}

/**
 * Seeds providers data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 * @param careContext - Optional CareContext instance for optimized operations
 */
export async function seedProvidersData(
  prisma: PrismaClient, 
  options: TestSeedOptions,
  careContext?: CareContext
): Promise<void> {
  // Implementation depends on data volume
  const providerCount = getProviderCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${providerCount} healthcare providers...`);
  }
  
  // Get specialties
  const specialties = await prisma.providerSpecialty.findMany();
  
  if (specialties.length === 0) {
    return;
  }
  
  // Create providers
  for (let i = 0; i < providerCount; i++) {
    // Select a random specialty
    const specialty = specialties[Math.floor(Math.random() * specialties.length)];
    
    // Create the provider data
    const providerData = {
      name: prefixTestData(`Dr. Test Provider ${i + 1}`, options),
      email: prefixTestData(`provider${i + 1}@test.com`, options),
      phone: `+551177777777${(i + 1).toString().padStart(2, '0')}`,
      crm: `${100000 + i}`,
      specialtyId: specialty.id,
      active: true,
    };
    
    // Use care context if available for optimized operations
    if (careContext) {
      await careContext.createProvider(providerData);
    } else {
      await prisma.provider.create({ data: providerData });
    }
  }
}

/**
 * Seeds appointments data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 * @param careContext - Optional CareContext instance for optimized operations
 */
export async function seedAppointmentsData(
  prisma: PrismaClient, 
  options: TestSeedOptions,
  careContext?: CareContext
): Promise<void> {
  // Implementation depends on data volume
  const appointmentCount = getAppointmentCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${appointmentCount} appointments...`);
  }
  
  // Get users and providers
  const users = await prisma.user.findMany({
    take: 5, // Limit to 5 users for appointments
  });
  
  const providers = await prisma.provider.findMany();
  
  if (users.length === 0 || providers.length === 0) {
    return;
  }
  
  // Create appointments
  for (let i = 0; i < appointmentCount; i++) {
    // Select a random user and provider
    const user = users[Math.floor(Math.random() * users.length)];
    const provider = providers[Math.floor(Math.random() * providers.length)];
    
    // Create appointment with dates spanning the next 30 days
    const date = new Date();
    date.setDate(date.getDate() + (i % 30));
    date.setHours(9 + (i % 8), 0, 0, 0); // 9 AM to 5 PM
    
    // Create the appointment data
    const appointmentData = {
      userId: user.id,
      providerId: provider.id,
      scheduledAt: date,
      duration: 30, // 30 minutes
      status: i % 5 === 0 ? 'CANCELLED' : (i % 3 === 0 ? 'COMPLETED' : 'SCHEDULED'),
      notes: `Test appointment ${i + 1}`,
    };
    
    // Use care context if available for optimized operations
    if (careContext) {
      await careContext.createAppointment(appointmentData);
    } else {
      await prisma.appointment.create({ data: appointmentData });
    }
  }
}

/**
 * Seeds medications data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 * @param careContext - Optional CareContext instance for optimized operations
 */
export async function seedMedicationsData(
  prisma: PrismaClient, 
  options: TestSeedOptions,
  careContext?: CareContext
): Promise<void> {
  // Implementation depends on data volume
  const medicationCount = getMedicationCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${medicationCount} medications per user...`);
  }
  
  // Get users
  const users = await prisma.user.findMany({
    take: 5, // Limit to 5 users for medications
  });
  
  if (users.length === 0) {
    return;
  }
  
  // Sample medication names and dosages
  const medications = [
    { name: 'Losartana', dosage: '50mg', frequency: 'Uma vez ao dia' },
    { name: 'Metformina', dosage: '500mg', frequency: 'Duas vezes ao dia' },
    { name: 'Atorvastatina', dosage: '20mg', frequency: 'Uma vez ao dia' },
    { name: 'Omeprazol', dosage: '20mg', frequency: 'Uma vez ao dia' },
    { name: 'Levotiroxina', dosage: '75mcg', frequency: 'Uma vez ao dia' },
    { name: 'Dipirona', dosage: '500mg', frequency: 'A cada 6 horas se necessário' },
    { name: 'Amoxicilina', dosage: '500mg', frequency: 'A cada 8 horas' },
    { name: 'Fluoxetina', dosage: '20mg', frequency: 'Uma vez ao dia' },
  ];
  
  // Create medications for each user
  for (const user of users) {
    // Select a subset of medications for each user
    const userMedicationCount = Math.min(medicationCount, medications.length);
    const selectedMedications = [...medications]
      .sort(() => Math.random() - 0.5)
      .slice(0, userMedicationCount);
    
    for (let i = 0; i < selectedMedications.length; i++) {
      const medication = selectedMedications[i];
      
      // Create start and end dates
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30)); // Started within last 30 days
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30 + Math.floor(Math.random() * 60)); // 30-90 days duration
      
      // Create the medication data
      const medicationData = {
        userId: user.id,
        name: prefixTestData(medication.name, options),
        dosage: medication.dosage,
        frequency: medication.frequency,
        startDate,
        endDate,
        instructions: `Tomar ${medication.frequency.toLowerCase()} com água`,
        status: Math.random() > 0.2 ? 'ACTIVE' : 'COMPLETED', // 80% active, 20% completed
        adherence: Math.floor(Math.random() * 100), // Random adherence percentage
      };
      
      // Use care context if available for optimized operations
      if (careContext) {
        await careContext.createMedication(medicationData);
      } else {
        await prisma.medication.create({ data: medicationData });
      }
    }
  }
}

/**
 * Seeds treatments data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 * @param careContext - Optional CareContext instance for optimized operations
 */
export async function seedTreatmentsData(
  prisma: PrismaClient, 
  options: TestSeedOptions,
  careContext?: CareContext
): Promise<void> {
  // Implementation depends on data volume
  const treatmentCount = getTreatmentCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${treatmentCount} treatments per user...`);
  }
  
  // Get users and providers
  const users = await prisma.user.findMany({
    take: 5, // Limit to 5 users for treatments
  });
  
  const providers = await prisma.provider.findMany();
  
  if (users.length === 0 || providers.length === 0) {
    return;
  }
  
  // Sample treatment types
  const treatmentTypes = [
    'Fisioterapia',
    'Psicoterapia',
    'Nutrição',
    'Fonoaudiologia',
    'Terapia Ocupacional',
    'Acupuntura',
    'Quimioterapia',
    'Radioterapia',
  ];
  
  // Create treatments for each user
  for (const user of users) {
    // Select a subset of treatment types for each user
    const userTreatmentCount = Math.min(treatmentCount, treatmentTypes.length);
    const selectedTreatmentTypes = [...treatmentTypes]
      .sort(() => Math.random() - 0.5)
      .slice(0, userTreatmentCount);
    
    for (let i = 0; i < selectedTreatmentTypes.length; i++) {
      const treatmentType = selectedTreatmentTypes[i];
      const provider = providers[Math.floor(Math.random() * providers.length)];
      
      // Create start and end dates
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60)); // Started within last 60 days
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 90 + Math.floor(Math.random() * 90)); // 90-180 days duration
      
      // Create the treatment data
      const treatmentData = {
        userId: user.id,
        providerId: provider.id,
        type: prefixTestData(treatmentType, options),
        description: `Tratamento de ${treatmentType.toLowerCase()} para o paciente`,
        startDate,
        endDate,
        frequency: i % 3 === 0 ? 'Semanal' : (i % 2 === 0 ? 'Quinzenal' : 'Mensal'),
        status: Math.random() > 0.3 ? 'ACTIVE' : 'COMPLETED', // 70% active, 30% completed
        progress: Math.floor(Math.random() * 100), // Random progress percentage
        notes: `Notas sobre o tratamento de ${treatmentType.toLowerCase()}`,
      };
      
      // Use care context if available for optimized operations
      if (careContext) {
        await careContext.createTreatment(treatmentData);
      } else {
        await prisma.treatment.create({ data: treatmentData });
      }
    }
  }
}

/**
 * Gets the number of providers to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of providers to create
 */
function getProviderCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  return getCountByVolume(dataVolume, 0, 5, 20);
}

/**
 * Gets the number of appointments to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of appointments to create
 */
function getAppointmentCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  return getCountByVolume(dataVolume, 0, 10, 50);
}

/**
 * Gets the number of medications to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of medications to create
 */
function getMedicationCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  return getCountByVolume(dataVolume, 0, 3, 8);
}

/**
 * Gets the number of treatments to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of treatments to create
 */
function getTreatmentCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  return getCountByVolume(dataVolume, 0, 2, 5);
}