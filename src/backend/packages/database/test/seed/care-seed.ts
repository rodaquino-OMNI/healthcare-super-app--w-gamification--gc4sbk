import { PrismaClient } from '@prisma/client';
import { CareContext } from '../../src/contexts/care.context';
import { TransactionService } from '../../src/transactions/transaction.service';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { AppointmentStatus, AppointmentType } from '@austa/interfaces/journey/care/appointment.interface';

/**
 * Configuration options for Care journey seed data
 */
export interface CareSeedOptions {
  /** Number of providers to create */
  providerCount?: number;
  /** Number of appointments per user */
  appointmentsPerUser?: number;
  /** Number of medications per user */
  medicationsPerUser?: number;
  /** Number of treatment plans per user */
  treatmentPlansPerUser?: number;
  /** Percentage of telemedicine appointments (0-100) */
  telemedicinePercentage?: number;
  /** Percentage of completed appointments (0-100) */
  completedAppointmentsPercentage?: number;
  /** Percentage of cancelled appointments (0-100) */
  cancelledAppointmentsPercentage?: number;
  /** Percentage of medications with adherence records (0-100) */
  medicationAdherencePercentage?: number;
  /** Whether to create future appointments */
  includeFutureAppointments?: boolean;
  /** Whether to create past appointments */
  includePastAppointments?: boolean;
  /** Whether to create emergency care scenarios */
  includeEmergencyCare?: boolean;
  /** Specific user IDs to create data for (if empty, creates for all users) */
  userIds?: string[];
}

/**
 * Default options for Care journey seed data
 */
const defaultCareSeedOptions: CareSeedOptions = {
  providerCount: 10,
  appointmentsPerUser: 5,
  medicationsPerUser: 3,
  treatmentPlansPerUser: 2,
  telemedicinePercentage: 40,
  completedAppointmentsPercentage: 30,
  cancelledAppointmentsPercentage: 10,
  medicationAdherencePercentage: 70,
  includeFutureAppointments: true,
  includePastAppointments: true,
  includeEmergencyCare: false,
  userIds: [],
};

/**
 * Seeds the Care journey data for testing purposes.
 * 
 * This function creates test data for the Care journey, including providers,
 * appointments, medications, treatment plans, and telemedicine sessions.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Configuration options for the seed data
 * @returns A promise that resolves when the seeding is complete
 */
export async function seedCareJourney(
  prisma: PrismaClient,
  options: CareSeedOptions = {}
): Promise<void> {
  console.log('Seeding Care journey data...');
  
  // Merge default options with provided options
  const seedOptions = { ...defaultCareSeedOptions, ...options };
  
  // Create a CareContext instance for database operations
  const transactionService = new TransactionService(prisma);
  const careContext = new CareContext(prisma, transactionService);
  
  try {
    // Seed provider specialties
    console.log('Creating provider specialties...');
    await seedProviderSpecialties(prisma);
    
    // Seed providers
    console.log(`Creating ${seedOptions.providerCount} providers...`);
    const providers = await seedProviders(prisma, seedOptions.providerCount);
    
    // Get users to create data for
    let users = [];
    if (seedOptions.userIds && seedOptions.userIds.length > 0) {
      users = await prisma.user.findMany({
        where: {
          id: {
            in: seedOptions.userIds,
          },
        },
      });
    } else {
      users = await prisma.user.findMany();
    }
    
    console.log(`Creating care data for ${users.length} users...`);
    
    // Create data for each user
    for (const user of users) {
      // Seed appointments
      if (seedOptions.appointmentsPerUser > 0) {
        console.log(`Creating appointments for user ${user.name}...`);
        await seedAppointments(
          careContext,
          user.id,
          providers,
          seedOptions
        );
      }
      
      // Seed medications
      if (seedOptions.medicationsPerUser > 0) {
        console.log(`Creating medications for user ${user.name}...`);
        await seedMedications(
          careContext,
          user.id,
          seedOptions
        );
      }
      
      // Seed treatment plans
      if (seedOptions.treatmentPlansPerUser > 0) {
        console.log(`Creating treatment plans for user ${user.name}...`);
        await seedTreatmentPlans(
          careContext,
          user.id,
          seedOptions
        );
      }
    }
    
    console.log('Care journey data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding Care journey data:', error);
    throw error;
  }
}

/**
 * Seeds provider specialties for the Care journey.
 * 
 * @param prisma - The Prisma client instance
 */
async function seedProviderSpecialties(prisma: PrismaClient): Promise<void> {
  // Sample provider specialties
  const specialties = [
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
  
  for (const specialty of specialties) {
    await prisma.providerSpecialty.upsert({
      where: { name: specialty.name },
      update: {},
      create: specialty,
    });
  }
  
  console.log(`Created ${specialties.length} provider specialties`);
}

/**
 * Seeds providers for the Care journey.
 * 
 * @param prisma - The Prisma client instance
 * @param count - Number of providers to create
 * @returns Array of created providers
 */
async function seedProviders(prisma: PrismaClient, count: number): Promise<any[]> {
  const providers = [];
  const specialties = await prisma.providerSpecialty.findMany();
  
  for (let i = 0; i < count; i++) {
    // Select a random specialty
    const specialty = specialties[Math.floor(Math.random() * specialties.length)];
    
    // Generate provider data
    const provider = await prisma.provider.create({
      data: {
        name: faker.person.fullName(),
        specialty: specialty.name,
        practiceLocation: faker.location.streetAddress() + ', ' + faker.location.city(),
        bio: faker.lorem.paragraph(),
        education: faker.helpers.arrayElements([
          'Universidade de São Paulo (USP)',
          'Universidade Federal do Rio de Janeiro (UFRJ)',
          'Universidade Estadual de Campinas (UNICAMP)',
          'Universidade Federal de Minas Gerais (UFMG)',
          'Pontifícia Universidade Católica (PUC)',
        ], { min: 1, max: 2 }).join(', '),
        yearsOfExperience: faker.number.int({ min: 1, max: 30 }),
        languages: faker.helpers.arrayElements([
          'Português', 'Inglês', 'Espanhol', 'Francês', 'Italiano'
        ], { min: 1, max: 3 }).join(', '),
        telemedicineAvailable: faker.datatype.boolean(0.7), // 70% of providers support telemedicine
        rating: faker.number.float({ min: 3.5, max: 5.0, precision: 0.1 }),
        reviewCount: faker.number.int({ min: 0, max: 500 }),
        acceptingNewPatients: faker.datatype.boolean(0.8), // 80% accepting new patients
      },
    });
    
    providers.push(provider);
  }
  
  return providers;
}

/**
 * Seeds appointments for a user in the Care journey.
 * 
 * @param careContext - The Care journey database context
 * @param userId - The user ID to create appointments for
 * @param providers - Array of providers to assign appointments to
 * @param options - Configuration options for the seed data
 */
async function seedAppointments(
  careContext: CareContext,
  userId: string,
  providers: any[],
  options: CareSeedOptions
): Promise<void> {
  const appointmentCount = options.appointmentsPerUser || 0;
  const now = new Date();
  
  for (let i = 0; i < appointmentCount; i++) {
    // Determine if this should be a past or future appointment
    const isPastAppointment = i < appointmentCount * 0.6; // 60% past, 40% future
    
    // Skip if we're not supposed to create this type of appointment
    if ((isPastAppointment && !options.includePastAppointments) ||
        (!isPastAppointment && !options.includeFutureAppointments)) {
      continue;
    }
    
    // Select a random provider
    const provider = providers[Math.floor(Math.random() * providers.length)];
    
    // Determine appointment type (in-person or telemedicine)
    const isTelemedicine = faker.datatype.boolean(options.telemedicinePercentage / 100);
    const appointmentType = isTelemedicine ? AppointmentType.TELEMEDICINE : AppointmentType.IN_PERSON;
    
    // Skip telemedicine appointments for providers that don't support it
    if (isTelemedicine && !provider.telemedicineAvailable) {
      continue;
    }
    
    // Generate appointment date
    let scheduledAt: Date;
    if (isPastAppointment) {
      // Past appointment (1-90 days ago)
      scheduledAt = new Date(now.getTime() - faker.number.int({ min: 1, max: 90 }) * 24 * 60 * 60 * 1000);
    } else {
      // Future appointment (1-30 days in the future)
      scheduledAt = new Date(now.getTime() + faker.number.int({ min: 1, max: 30 }) * 24 * 60 * 60 * 1000);
    }
    
    // Set appointment time between 8 AM and 5 PM
    scheduledAt.setHours(faker.number.int({ min: 8, max: 17 }));
    scheduledAt.setMinutes(faker.helpers.arrayElement([0, 30])); // Only 00 or 30 minutes
    scheduledAt.setSeconds(0);
    scheduledAt.setMilliseconds(0);
    
    // Determine appointment status
    let status = AppointmentStatus.SCHEDULED;
    
    if (isPastAppointment) {
      // For past appointments, determine if completed, cancelled, or no-show
      const random = Math.random() * 100;
      if (random < options.completedAppointmentsPercentage) {
        status = AppointmentStatus.COMPLETED;
      } else if (random < options.completedAppointmentsPercentage + options.cancelledAppointmentsPercentage) {
        status = AppointmentStatus.CANCELLED;
      } else {
        status = AppointmentStatus.NO_SHOW;
      }
    } else {
      // For future appointments, most are scheduled, some are confirmed
      status = faker.helpers.arrayElement([
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.CONFIRMED,
      ]);
    }
    
    // Create the appointment
    try {
      await careContext.createAppointment({
        userId,
        provider: {
          connect: { id: provider.id },
        },
        scheduledAt,
        type: appointmentType,
        status,
        reason: faker.helpers.arrayElement([
          'Consulta de rotina',
          'Acompanhamento',
          'Exame físico',
          'Sintomas respiratórios',
          'Dor nas costas',
          'Dor de cabeça frequente',
          'Problemas de pele',
          'Ansiedade',
          'Depressão',
          'Problemas digestivos',
        ]),
        notes: status === AppointmentStatus.CANCELLED ? 
          faker.helpers.arrayElement([
            'Conflito de agenda',
            'Paciente solicitou cancelamento',
            'Médico indisponível',
            'Reagendado para data futura',
          ]) : 
          undefined,
      });
    } catch (error) {
      // If there's a conflict (e.g., provider not available), just skip this appointment
      console.warn(`Skipping appointment creation due to conflict: ${error.message}`);
    }
  }
}

/**
 * Seeds medications for a user in the Care journey.
 * 
 * @param careContext - The Care journey database context
 * @param userId - The user ID to create medications for
 * @param options - Configuration options for the seed data
 */
async function seedMedications(
  careContext: CareContext,
  userId: string,
  options: CareSeedOptions
): Promise<void> {
  const medicationCount = options.medicationsPerUser || 0;
  const now = new Date();
  
  // Common medication names and their purposes
  const medicationData = [
    { name: 'Losartana', dosage: '50mg', purpose: 'Controle de pressão arterial' },
    { name: 'Metformina', dosage: '500mg', purpose: 'Controle de diabetes' },
    { name: 'Levotiroxina', dosage: '75mcg', purpose: 'Tratamento de hipotireoidismo' },
    { name: 'Omeprazol', dosage: '20mg', purpose: 'Redução de acidez gástrica' },
    { name: 'Sinvastatina', dosage: '20mg', purpose: 'Controle de colesterol' },
    { name: 'Atenolol', dosage: '25mg', purpose: 'Controle de pressão arterial' },
    { name: 'Amitriptilina', dosage: '25mg', purpose: 'Tratamento de depressão' },
    { name: 'Fluoxetina', dosage: '20mg', purpose: 'Tratamento de depressão e ansiedade' },
    { name: 'Dipirona', dosage: '500mg', purpose: 'Alívio de dor e febre' },
    { name: 'Ibuprofeno', dosage: '600mg', purpose: 'Anti-inflamatório' },
  ];
  
  // Frequency patterns
  const frequencyPatterns = [
    'Uma vez ao dia, pela manhã',
    'Uma vez ao dia, à noite',
    'Duas vezes ao dia, de 12 em 12 horas',
    'Três vezes ao dia, após as refeições',
    'A cada 8 horas',
    'Conforme necessário para dor (máximo 4 vezes ao dia)',
    'Uma vez por semana',
    'Duas vezes por semana',
    'A cada 4 horas se necessário',
    'Antes de dormir',
  ];
  
  // Create medications
  for (let i = 0; i < medicationCount; i++) {
    // Select a random medication
    const medication = faker.helpers.arrayElement(medicationData);
    
    // Generate start date (between 1-180 days ago)
    const startDate = new Date(now.getTime() - faker.number.int({ min: 1, max: 180 }) * 24 * 60 * 60 * 1000);
    
    // Determine if medication has an end date (30% do)
    const hasEndDate = faker.datatype.boolean(0.3);
    let endDate = null;
    
    if (hasEndDate) {
      // End date is either in the past or future
      const isPastEnd = faker.datatype.boolean(0.5);
      
      if (isPastEnd) {
        // End date in the past (after start date but before now)
        const daysAfterStart = faker.number.int({ min: 7, max: 90 });
        const maxDays = Math.floor((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        endDate = new Date(startDate.getTime() + Math.min(daysAfterStart, maxDays) * 24 * 60 * 60 * 1000);
      } else {
        // End date in the future (7-90 days from now)
        endDate = new Date(now.getTime() + faker.number.int({ min: 7, max: 90 }) * 24 * 60 * 60 * 1000);
      }
    }
    
    // Create the medication
    const createdMedication = await careContext.createMedication({
      userId,
      name: medication.name,
      dosage: medication.dosage,
      frequency: faker.helpers.arrayElement(frequencyPatterns),
      purpose: medication.purpose,
      startDate,
      endDate,
      instructions: faker.helpers.arrayElement([
        'Tomar com água',
        'Tomar após as refeições',
        'Tomar com estômago vazio',
        'Não tomar com leite ou antiácidos',
        'Pode causar sonolência',
        'Evitar bebidas alcoólicas',
        null,
      ]),
      active: !hasEndDate || endDate > now,
      prescribedBy: faker.person.fullName() + ' - ' + faker.helpers.arrayElement([
        'Clínico Geral',
        'Cardiologista',
        'Endocrinologista',
        'Psiquiatra',
        'Neurologista',
      ]),
    });
    
    // Create adherence records for this medication
    if (faker.datatype.boolean(options.medicationAdherencePercentage / 100)) {
      await seedMedicationAdherence(careContext, createdMedication.id, startDate, endDate || now);
    }
  }
}

/**
 * Seeds medication adherence records for a medication.
 * 
 * @param careContext - The Care journey database context
 * @param medicationId - The medication ID to create adherence records for
 * @param startDate - The start date of the medication
 * @param endDate - The end date of the medication (or current date if ongoing)
 */
async function seedMedicationAdherence(
  careContext: CareContext,
  medicationId: string,
  startDate: Date,
  endDate: Date
): Promise<void> {
  // Calculate number of days between start and end
  const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  
  // Create adherence records for each day (with some randomness)
  for (let i = 0; i < daysDiff; i++) {
    // Skip some days randomly (20% chance)
    if (faker.datatype.boolean(0.2)) {
      continue;
    }
    
    const takenAt = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    
    // 80% chance of taking medication, 20% chance of missing
    const taken = faker.datatype.boolean(0.8);
    
    // Add notes for missed doses
    const notes = !taken ? faker.helpers.arrayElement([
      'Esqueci de tomar',
      'Estava fora de casa',
      'Medicamento acabou',
      'Senti efeitos colaterais',
      null,
    ]) : null;
    
    // Create adherence record
    await careContext.updateMedicationAdherence(medicationId, {
      takenAt,
      taken,
      notes,
    });
  }
}

/**
 * Seeds treatment plans for a user in the Care journey.
 * 
 * @param careContext - The Care journey database context
 * @param userId - The user ID to create treatment plans for
 * @param options - Configuration options for the seed data
 */
async function seedTreatmentPlans(
  careContext: CareContext,
  userId: string,
  options: CareSeedOptions
): Promise<void> {
  const treatmentPlanCount = options.treatmentPlansPerUser || 0;
  const now = new Date();
  
  // Treatment plan types and their activities
  const treatmentPlanTypes = [
    {
      name: 'Reabilitação Cardíaca',
      description: 'Programa de recuperação após evento cardíaco',
      activities: [
        'Caminhada leve diária (15-30 minutos)',
        'Monitoramento de pressão arterial',
        'Dieta com baixo teor de sódio',
        'Exercícios respiratórios',
        'Consulta de acompanhamento com cardiologista',
      ],
    },
    {
      name: 'Controle de Diabetes',
      description: 'Programa para gerenciamento de diabetes',
      activities: [
        'Monitoramento de glicemia',
        'Dieta com baixo índice glicêmico',
        'Atividade física regular',
        'Exame de hemoglobina glicada trimestral',
        'Consulta com endocrinologista',
      ],
    },
    {
      name: 'Recuperação Pós-Cirúrgica',
      description: 'Programa de recuperação após procedimento cirúrgico',
      activities: [
        'Cuidados com a ferida operatória',
        'Exercícios de mobilidade progressiva',
        'Gerenciamento da dor',
        'Retorno para retirada de pontos',
        'Fisioterapia',
      ],
    },
    {
      name: 'Saúde Mental',
      description: 'Programa para tratamento de ansiedade e depressão',
      activities: [
        'Terapia cognitivo-comportamental',
        'Técnicas de relaxamento e mindfulness',
        'Atividade física regular',
        'Consulta com psiquiatra',
        'Grupo de apoio',
      ],
    },
    {
      name: 'Reabilitação Ortopédica',
      description: 'Programa para recuperação de lesões musculoesqueléticas',
      activities: [
        'Fisioterapia 3x por semana',
        'Exercícios de fortalecimento muscular',
        'Aplicação de gelo/calor',
        'Uso de órtese conforme orientação',
        'Consulta de acompanhamento com ortopedista',
      ],
    },
  ];
  
  // Create treatment plans
  for (let i = 0; i < treatmentPlanCount; i++) {
    // Select a random treatment plan type
    const planType = faker.helpers.arrayElement(treatmentPlanTypes);
    
    // Determine if this is an active or completed plan
    const isActive = faker.datatype.boolean(0.7); // 70% active, 30% completed
    
    // Generate start date (between 1-180 days ago)
    const startDate = new Date(now.getTime() - faker.number.int({ min: 1, max: 180 }) * 24 * 60 * 60 * 1000);
    
    // Generate end date for completed plans
    let endDate = null;
    if (!isActive) {
      // End date is in the past (after start date but before now)
      const daysAfterStart = faker.number.int({ min: 30, max: 90 });
      const maxDays = Math.floor((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      endDate = new Date(startDate.getTime() + Math.min(daysAfterStart, maxDays) * 24 * 60 * 60 * 1000);
    } else {
      // For active plans, end date is in the future (30-180 days from now)
      endDate = new Date(now.getTime() + faker.number.int({ min: 30, max: 180 }) * 24 * 60 * 60 * 1000);
    }
    
    // Calculate progress based on time elapsed
    let progress = 0;
    if (!isActive) {
      // Completed plans have 100% progress
      progress = 100;
    } else {
      // Active plans have progress based on time elapsed
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      progress = Math.min(Math.floor((elapsed / totalDuration) * 100), 99); // Max 99% for active plans
    }
    
    // Create the treatment plan
    const treatmentPlan = await prisma.treatmentPlan.create({
      data: {
        userId,
        name: planType.name,
        description: planType.description,
        start: startDate,
        end: endDate,
        progress,
        active: isActive,
        createdBy: faker.helpers.arrayElement([
          'Dr. ' + faker.person.lastName() + ' - Clínico Geral',
          'Dr. ' + faker.person.lastName() + ' - Cardiologista',
          'Dr. ' + faker.person.lastName() + ' - Ortopedista',
          'Dr. ' + faker.person.lastName() + ' - Psiquiatra',
          'Dr. ' + faker.person.lastName() + ' - Endocrinologista',
        ]),
      },
    });
    
    // Add care activities to the treatment plan
    for (const activityDescription of planType.activities) {
      // Skip some activities randomly (20% chance)
      if (faker.datatype.boolean(0.2)) {
        continue;
      }
      
      // Determine if activity is completed
      const isCompleted = !isActive || faker.datatype.boolean(progress / 100);
      
      await careContext.addCareActivityToTreatmentPlan(
        treatmentPlan.id,
        {
          description: activityDescription,
          frequency: faker.helpers.arrayElement([
            'Diário',
            'Semanal',
            'Duas vezes por semana',
            'Três vezes por semana',
            'Quinzenal',
            'Mensal',
            'Conforme necessário',
          ]),
          completed: isCompleted,
          completedAt: isCompleted ? new Date(startDate.getTime() + 
            faker.number.int({ min: 1, max: Math.floor((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) }) * 
            24 * 60 * 60 * 1000) : null,
          notes: isCompleted ? faker.helpers.arrayElement([
            'Concluído conforme planejado',
            'Paciente relatou melhora',
            'Atividade bem tolerada',
            null,
          ]) : null,
        }
      );
    }
  }
}