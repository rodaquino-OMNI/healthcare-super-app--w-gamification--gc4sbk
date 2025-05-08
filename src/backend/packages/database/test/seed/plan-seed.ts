import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Configuration options for Plan journey test data seeding
 */
export interface PlanSeedOptions {
  /**
   * Number of insurance plans to create per type
   * @default 1
   */
  plansPerType?: number;

  /**
   * Number of benefits to create per plan
   * @default 3
   */
  benefitsPerPlan?: number;

  /**
   * Number of coverage items to create per plan
   * @default 4
   */
  coveragePerPlan?: number;

  /**
   * Number of claims to create per plan
   * @default 2
   */
  claimsPerPlan?: number;

  /**
   * Number of documents to attach to each claim
   * @default 1
   */
  documentsPerClaim?: number;

  /**
   * User IDs to associate with the created plans
   * If not provided, plans will be created with random UUIDs
   */
  userIds?: string[];

  /**
   * Specific claim statuses to include in the test data
   * If not provided, a mix of statuses will be used
   */
  claimStatuses?: string[];

  /**
   * Whether to clean existing plan data before seeding
   * @default false
   */
  cleanBeforeSeeding?: boolean;

  /**
   * Whether to include expired plans in the test data
   * @default false
   */
  includeExpiredPlans?: boolean;

  /**
   * Whether to include future plans in the test data
   * @default false
   */
  includeFuturePlans?: boolean;

  /**
   * Whether to include plans with high utilization of benefits
   * @default false
   */
  includeHighUtilization?: boolean;
}

/**
 * Default claim statuses for test data
 */
const DEFAULT_CLAIM_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'VALIDATING',
  'PROCESSING',
  'UNDER_REVIEW',
  'ADDITIONAL_INFO_REQUIRED',
  'APPROVED',
  'PAYMENT_PENDING',
  'COMPLETED',
  'REJECTED',
  'DENIED'
];

/**
 * Default plan types for test data
 */
const DEFAULT_PLAN_TYPES = ['Básico', 'Standard', 'Premium'];

/**
 * Default benefit types for test data
 */
const DEFAULT_BENEFIT_TYPES = [
  'WELLNESS_PROGRAM',
  'TELEMEDICINE',
  'MENTAL_HEALTH',
  'DENTAL',
  'VISION',
  'PHARMACY_DISCOUNT',
  'GYM_MEMBERSHIP',
  'PREVENTIVE_CARE',
  'MATERNITY',
  'EMERGENCY_TRAVEL'
];

/**
 * Default coverage types for test data
 */
const DEFAULT_COVERAGE_TYPES = [
  'CONSULTATION',
  'EXAMINATION',
  'HOSPITALIZATION',
  'SURGERY',
  'EMERGENCY',
  'THERAPY',
  'SPECIALIST',
  'MATERNITY'
];

/**
 * Default document types for test data
 */
const DEFAULT_DOCUMENT_TYPES = [
  'RECEIPT',
  'PRESCRIPTION',
  'MEDICAL_REPORT',
  'EXAM_RESULT',
  'REFERRAL',
  'AUTHORIZATION'
];

/**
 * Seeds the database with Plan journey test data
 * 
 * @param prisma - The Prisma client instance
 * @param options - Configuration options for seeding
 * @returns A promise that resolves when seeding is complete
 */
export async function seedPlanJourney(
  prisma: PrismaClient,
  options: PlanSeedOptions = {}
): Promise<void> {
  console.log('Starting Plan journey test data seeding...');

  // Apply default options
  const {
    plansPerType = 1,
    benefitsPerPlan = 3,
    coveragePerPlan = 4,
    claimsPerPlan = 2,
    documentsPerClaim = 1,
    userIds = [uuidv4(), uuidv4()], // Default to 2 random user IDs if none provided
    claimStatuses = DEFAULT_CLAIM_STATUSES,
    cleanBeforeSeeding = false,
    includeExpiredPlans = false,
    includeFuturePlans = false,
    includeHighUtilization = false
  } = options;

  // Clean existing data if requested
  if (cleanBeforeSeeding) {
    console.log('Cleaning existing Plan journey data...');
    await cleanPlanData(prisma);
  }

  // Ensure plan types exist
  await seedPlanTypes(prisma);

  // Ensure claim types exist
  await seedClaimTypes(prisma);

  // Create plans for each type and user
  const createdPlans = await createPlans(
    prisma,
    userIds,
    plansPerType,
    includeExpiredPlans,
    includeFuturePlans
  );

  // Create benefits for each plan
  await createBenefits(
    prisma,
    createdPlans,
    benefitsPerPlan,
    includeHighUtilization
  );

  // Create coverage for each plan
  await createCoverage(prisma, createdPlans, coveragePerPlan);

  // Create claims for each plan
  await createClaims(
    prisma,
    createdPlans,
    claimsPerPlan,
    documentsPerClaim,
    claimStatuses
  );

  console.log('Plan journey test data seeding completed successfully!');
}

/**
 * Cleans existing Plan journey data from the database
 * 
 * @param prisma - The Prisma client instance
 */
async function cleanPlanData(prisma: PrismaClient): Promise<void> {
  try {
    // Delete in order to respect foreign key constraints
    await prisma.document.deleteMany({
      where: { entityType: 'CLAIM' }
    });
    await prisma.claim.deleteMany({});
    await prisma.benefit.deleteMany({});
    await prisma.coverage.deleteMany({});
    await prisma.plan.deleteMany({});
    console.log('Existing Plan journey data cleaned successfully');
  } catch (error) {
    console.error('Error cleaning Plan journey data:', error);
    throw error;
  }
}

/**
 * Seeds insurance plan types
 * 
 * @param prisma - The Prisma client instance
 */
async function seedPlanTypes(prisma: PrismaClient): Promise<void> {
  try {
    for (const name of DEFAULT_PLAN_TYPES) {
      await prisma.insurancePlanType.upsert({
        where: { name },
        update: {},
        create: {
          name,
          description: `Plano com cobertura ${name.toLowerCase()}`
        }
      });
    }
    console.log(`Ensured ${DEFAULT_PLAN_TYPES.length} insurance plan types exist`);
  } catch (error) {
    console.error('Error seeding insurance plan types:', error);
    throw error;
  }
}

/**
 * Seeds claim types
 * 
 * @param prisma - The Prisma client instance
 */
async function seedClaimTypes(prisma: PrismaClient): Promise<void> {
  try {
    const claimTypes = [
      { name: 'Consulta Médica', description: 'Reembolso para consulta médica' },
      { name: 'Exame', description: 'Reembolso para exames médicos' },
      { name: 'Terapia', description: 'Reembolso para sessões terapêuticas' },
      { name: 'Internação', description: 'Reembolso para internação hospitalar' },
      { name: 'Medicamento', description: 'Reembolso para medicamentos prescritos' },
      { name: 'Procedimento', description: 'Reembolso para procedimentos médicos' },
      { name: 'Emergência', description: 'Reembolso para atendimento de emergência' }
    ];

    for (const claimType of claimTypes) {
      await prisma.claimType.upsert({
        where: { name: claimType.name },
        update: {},
        create: claimType
      });
    }
    console.log(`Ensured ${claimTypes.length} claim types exist`);
  } catch (error) {
    console.error('Error seeding claim types:', error);
    throw error;
  }
}

/**
 * Creates insurance plans for testing
 * 
 * @param prisma - The Prisma client instance
 * @param userIds - User IDs to associate with plans
 * @param plansPerType - Number of plans to create per type
 * @param includeExpiredPlans - Whether to include expired plans
 * @param includeFuturePlans - Whether to include future plans
 * @returns Array of created plan IDs
 */
async function createPlans(
  prisma: PrismaClient,
  userIds: string[],
  plansPerType: number,
  includeExpiredPlans: boolean,
  includeFuturePlans: boolean
): Promise<string[]> {
  const planIds: string[] = [];
  const today = new Date();
  const planTypes = await prisma.insurancePlanType.findMany();

  try {
    // Create active plans
    for (const planType of planTypes) {
      for (let i = 0; i < plansPerType; i++) {
        // Rotate through available user IDs
        const userId = userIds[i % userIds.length];
        const planNumber = `${planType.name.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
        
        // Create active plan (current date range)
        const validityStart = new Date(today);
        validityStart.setDate(validityStart.getDate() - 30); // Started 30 days ago
        
        const validityEnd = new Date(today);
        validityEnd.setFullYear(validityEnd.getFullYear() + 1); // Ends 1 year from now
        
        const plan = await prisma.plan.create({
          data: {
            userId,
            planNumber,
            type: planType.name,
            validityStart,
            validityEnd,
            journeyId: 'PLAN',
            coverageDetails: {
              networkType: planType.name === 'Premium' ? 'NATIONAL' : 'REGIONAL',
              hasDental: planType.name !== 'Básico',
              hasVision: planType.name === 'Premium',
              annualLimit: planType.name === 'Básico' ? 50000 : 
                          planType.name === 'Standard' ? 100000 : 250000,
              deductible: planType.name === 'Básico' ? 500 : 
                         planType.name === 'Standard' ? 250 : 0
            }
          }
        });
        
        planIds.push(plan.id);
        console.log(`Created active plan: ${plan.planNumber} (${planType.name})`);
      }
    }

    // Create expired plans if requested
    if (includeExpiredPlans) {
      for (const planType of planTypes) {
        // Create one expired plan per type
        const userId = userIds[0];
        const planNumber = `EXP-${planType.name.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
        
        const validityStart = new Date(today);
        validityStart.setFullYear(validityStart.getFullYear() - 2); // Started 2 years ago
        
        const validityEnd = new Date(today);
        validityEnd.setFullYear(validityEnd.getFullYear() - 1); // Ended 1 year ago
        
        const plan = await prisma.plan.create({
          data: {
            userId,
            planNumber,
            type: planType.name,
            validityStart,
            validityEnd,
            journeyId: 'PLAN',
            coverageDetails: {
              networkType: planType.name === 'Premium' ? 'NATIONAL' : 'REGIONAL',
              hasDental: planType.name !== 'Básico',
              hasVision: planType.name === 'Premium',
              annualLimit: planType.name === 'Básico' ? 50000 : 
                          planType.name === 'Standard' ? 100000 : 250000,
              deductible: planType.name === 'Básico' ? 500 : 
                         planType.name === 'Standard' ? 250 : 0
            }
          }
        });
        
        planIds.push(plan.id);
        console.log(`Created expired plan: ${plan.planNumber} (${planType.name})`);
      }
    }

    // Create future plans if requested
    if (includeFuturePlans) {
      for (const planType of planTypes) {
        // Create one future plan per type
        const userId = userIds[0];
        const planNumber = `FUT-${planType.name.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
        
        const validityStart = new Date(today);
        validityStart.setMonth(validityStart.getMonth() + 1); // Starts next month
        
        const validityEnd = new Date(validityStart);
        validityEnd.setFullYear(validityEnd.getFullYear() + 1); // Ends 1 year after start
        
        const plan = await prisma.plan.create({
          data: {
            userId,
            planNumber,
            type: planType.name,
            validityStart,
            validityEnd,
            journeyId: 'PLAN',
            coverageDetails: {
              networkType: planType.name === 'Premium' ? 'NATIONAL' : 'REGIONAL',
              hasDental: planType.name !== 'Básico',
              hasVision: planType.name === 'Premium',
              annualLimit: planType.name === 'Básico' ? 50000 : 
                          planType.name === 'Standard' ? 100000 : 250000,
              deductible: planType.name === 'Básico' ? 500 : 
                         planType.name === 'Standard' ? 250 : 0
            }
          }
        });
        
        planIds.push(plan.id);
        console.log(`Created future plan: ${plan.planNumber} (${planType.name})`);
      }
    }

    console.log(`Created a total of ${planIds.length} insurance plans`);
    return planIds;
  } catch (error) {
    console.error('Error creating insurance plans:', error);
    throw error;
  }
}

/**
 * Creates benefits for testing
 * 
 * @param prisma - The Prisma client instance
 * @param planIds - Plan IDs to associate benefits with
 * @param benefitsPerPlan - Number of benefits to create per plan
 * @param includeHighUtilization - Whether to include high utilization data
 */
async function createBenefits(
  prisma: PrismaClient,
  planIds: string[],
  benefitsPerPlan: number,
  includeHighUtilization: boolean
): Promise<void> {
  try {
    let totalBenefits = 0;

    for (const planId of planIds) {
      const plan = await prisma.plan.findUnique({
        where: { id: planId }
      });

      if (!plan) continue;

      // Determine which benefits to include based on plan type
      let availableBenefitTypes = [...DEFAULT_BENEFIT_TYPES];
      
      // Basic plans have fewer benefits
      if (plan.type === 'Básico') {
        availableBenefitTypes = availableBenefitTypes.slice(0, 5);
      }

      // Shuffle and take the first N benefits
      const shuffledBenefits = availableBenefitTypes
        .sort(() => Math.random() - 0.5)
        .slice(0, benefitsPerPlan);

      for (const benefitType of shuffledBenefits) {
        // Generate benefit description based on type
        const description = getBenefitDescription(benefitType);
        
        // Generate limitations based on plan type
        const limitations = plan.type === 'Premium' ? null : 
                           plan.type === 'Standard' ? 'Limitado a 5 utilizações por ano' : 
                           'Limitado a 3 utilizações por ano';
        
        // Generate usage data if high utilization is requested
        const usage = includeHighUtilization ? 
                     plan.type === 'Básico' ? '3/3 utilizações' : 
                     plan.type === 'Standard' ? '4/5 utilizações' : 
                     '6/10 utilizações' : 
                     null;

        await prisma.benefit.create({
          data: {
            planId,
            type: benefitType,
            description,
            limitations,
            usage
          }
        });

        totalBenefits++;
      }
    }

    console.log(`Created ${totalBenefits} benefits for ${planIds.length} plans`);
  } catch (error) {
    console.error('Error creating benefits:', error);
    throw error;
  }
}

/**
 * Creates coverage items for testing
 * 
 * @param prisma - The Prisma client instance
 * @param planIds - Plan IDs to associate coverage with
 * @param coveragePerPlan - Number of coverage items to create per plan
 */
async function createCoverage(
  prisma: PrismaClient,
  planIds: string[],
  coveragePerPlan: number
): Promise<void> {
  try {
    let totalCoverage = 0;

    for (const planId of planIds) {
      const plan = await prisma.plan.findUnique({
        where: { id: planId }
      });

      if (!plan) continue;

      // Determine coverage percentages based on plan type
      const basePercentage = plan.type === 'Básico' ? 60 :
                            plan.type === 'Standard' ? 80 :
                            90;

      // Shuffle and take the first N coverage types
      const shuffledCoverageTypes = [...DEFAULT_COVERAGE_TYPES]
        .sort(() => Math.random() - 0.5)
        .slice(0, coveragePerPlan);

      for (const coverageType of shuffledCoverageTypes) {
        // Adjust percentage based on coverage type
        let percentage = basePercentage;
        if (coverageType === 'EMERGENCY') {
          percentage = Math.min(percentage + 10, 100); // Emergency coverage is higher
        } else if (coverageType === 'SURGERY') {
          percentage = Math.max(percentage - 10, 50); // Surgery coverage is lower
        }

        // Generate description based on type
        const description = getCoverageDescription(coverageType);
        
        // Generate limitations based on plan type
        const limitations = plan.type === 'Premium' ? null : 
                           `Cobertura limitada a ${percentage}% do valor`;

        // Calculate copayment based on percentage
        const copayment = 100 - percentage;

        await prisma.coverage.create({
          data: {
            planId,
            coverageType,
            description,
            limitations,
            copayment
          }
        });

        totalCoverage++;
      }
    }

    console.log(`Created ${totalCoverage} coverage items for ${planIds.length} plans`);
  } catch (error) {
    console.error('Error creating coverage:', error);
    throw error;
  }
}

/**
 * Creates claims for testing
 * 
 * @param prisma - The Prisma client instance
 * @param planIds - Plan IDs to associate claims with
 * @param claimsPerPlan - Number of claims to create per plan
 * @param documentsPerClaim - Number of documents to attach to each claim
 * @param claimStatuses - Claim statuses to use
 */
async function createClaims(
  prisma: PrismaClient,
  planIds: string[],
  claimsPerPlan: number,
  documentsPerClaim: number,
  claimStatuses: string[]
): Promise<void> {
  try {
    let totalClaims = 0;
    let totalDocuments = 0;
    const claimTypes = await prisma.claimType.findMany();

    for (const planId of planIds) {
      const plan = await prisma.plan.findUnique({
        where: { id: planId }
      });

      if (!plan) continue;

      // Skip future plans for claims (they shouldn't have claims yet)
      const today = new Date();
      if (plan.validityStart > today) continue;

      for (let i = 0; i < claimsPerPlan; i++) {
        // Select a random claim type and status
        const claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];
        const status = claimStatuses[Math.floor(Math.random() * claimStatuses.length)];
        
        // Generate a random amount based on claim type
        let amount = 0;
        switch (claimType.name) {
          case 'Consulta Médica':
            amount = 100 + Math.random() * 300;
            break;
          case 'Exame':
            amount = 200 + Math.random() * 800;
            break;
          case 'Terapia':
            amount = 150 + Math.random() * 250;
            break;
          case 'Internação':
            amount = 1000 + Math.random() * 9000;
            break;
          case 'Medicamento':
            amount = 50 + Math.random() * 450;
            break;
          case 'Procedimento':
            amount = 500 + Math.random() * 1500;
            break;
          case 'Emergência':
            amount = 300 + Math.random() * 1200;
            break;
          default:
            amount = 100 + Math.random() * 900;
        }
        
        // Round to 2 decimal places
        amount = Math.round(amount * 100) / 100;
        
        // Set dates based on status
        let submittedAt = null;
        let processedAt = null;
        
        if (status !== 'DRAFT') {
          // For non-draft claims, set submission date
          submittedAt = new Date();
          submittedAt.setDate(submittedAt.getDate() - Math.floor(Math.random() * 30));
          
          // For completed claims, set processed date
          if (['APPROVED', 'PAYMENT_PENDING', 'COMPLETED', 'REJECTED', 'DENIED'].includes(status)) {
            processedAt = new Date(submittedAt);
            processedAt.setDate(processedAt.getDate() + Math.floor(Math.random() * 14) + 1);
          }
        }
        
        // Create the claim
        const claim = await prisma.claim.create({
          data: {
            userId: plan.userId,
            planId,
            claimType: claimType.name,
            amount,
            status,
            submittedAt,
            processedAt,
            procedureCode: generateProcedureCode(),
            diagnosisCode: generateDiagnosisCode(),
            providerName: generateProviderName(),
            notes: status === 'ADDITIONAL_INFO_REQUIRED' ? 
                  'Por favor, forneça mais informações sobre o procedimento realizado.' : 
                  null
          }
        });
        
        totalClaims++;
        
        // Create documents for the claim
        if (documentsPerClaim > 0) {
          await createDocumentsForClaim(prisma, claim.id, documentsPerClaim);
          totalDocuments += documentsPerClaim;
        }
      }
    }

    console.log(`Created ${totalClaims} claims with ${totalDocuments} documents`);
  } catch (error) {
    console.error('Error creating claims:', error);
    throw error;
  }
}

/**
 * Creates documents for a claim
 * 
 * @param prisma - The Prisma client instance
 * @param claimId - Claim ID to associate documents with
 * @param count - Number of documents to create
 */
async function createDocumentsForClaim(
  prisma: PrismaClient,
  claimId: string,
  count: number
): Promise<void> {
  try {
    // Shuffle document types
    const shuffledDocTypes = [...DEFAULT_DOCUMENT_TYPES]
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
    
    for (const docType of shuffledDocTypes) {
      await prisma.document.create({
        data: {
          entityId: claimId,
          entityType: 'CLAIM',
          type: docType,
          filePath: `uploads/claims/${claimId}/${docType.toLowerCase()}_${uuidv4().substring(0, 8)}.pdf`
        }
      });
    }
  } catch (error) {
    console.error('Error creating documents for claim:', error);
    throw error;
  }
}

/**
 * Generates a description for a benefit type
 * 
 * @param benefitType - The type of benefit
 * @returns A description string
 */
function getBenefitDescription(benefitType: string): string {
  switch (benefitType) {
    case 'WELLNESS_PROGRAM':
      return 'Programa de bem-estar com acompanhamento personalizado';
    case 'TELEMEDICINE':
      return 'Consultas médicas online 24/7';
    case 'MENTAL_HEALTH':
      return 'Cobertura para terapia e saúde mental';
    case 'DENTAL':
      return 'Cobertura odontológica para procedimentos básicos e avançados';
    case 'VISION':
      return 'Cobertura para exames oftalmológicos e óculos';
    case 'PHARMACY_DISCOUNT':
      return 'Descontos em medicamentos em farmácias parceiras';
    case 'GYM_MEMBERSHIP':
      return 'Desconto em academias parceiras';
    case 'PREVENTIVE_CARE':
      return 'Cobertura para exames preventivos anuais';
    case 'MATERNITY':
      return 'Cobertura para pré-natal, parto e pós-parto';
    case 'EMERGENCY_TRAVEL':
      return 'Assistência médica em viagens nacionais e internacionais';
    default:
      return 'Benefício adicional do plano';
  }
}

/**
 * Generates a description for a coverage type
 * 
 * @param coverageType - The type of coverage
 * @returns A description string
 */
function getCoverageDescription(coverageType: string): string {
  switch (coverageType) {
    case 'CONSULTATION':
      return 'Consultas médicas com clínicos e especialistas';
    case 'EXAMINATION':
      return 'Exames laboratoriais e de imagem';
    case 'HOSPITALIZATION':
      return 'Internação hospitalar em quarto privativo ou semi-privativo';
    case 'SURGERY':
      return 'Procedimentos cirúrgicos eletivos e de urgência';
    case 'EMERGENCY':
      return 'Atendimento de emergência 24 horas';
    case 'THERAPY':
      return 'Sessões de fisioterapia, fonoaudiologia e terapia ocupacional';
    case 'SPECIALIST':
      return 'Consultas com médicos especialistas';
    case 'MATERNITY':
      return 'Acompanhamento pré-natal, parto e pós-parto';
    default:
      return 'Cobertura padrão do plano';
  }
}

/**
 * Generates a random procedure code
 * 
 * @returns A procedure code string
 */
function generateProcedureCode(): string {
  const prefixes = ['AMB', 'HOSP', 'DIAG', 'PROC', 'CONS'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}${number}`;
}

/**
 * Generates a random diagnosis code
 * 
 * @returns A diagnosis code string
 */
function generateDiagnosisCode(): string {
  // Generate a random ICD-10 style code
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const number = Math.floor(10 + Math.random() * 90);
  const decimal = Math.floor(Math.random() * 10);
  return `${letter}${number}.${decimal}`;
}

/**
 * Generates a random provider name
 * 
 * @returns A provider name string
 */
function generateProviderName(): string {
  const providers = [
    'Hospital São Lucas',
    'Clínica Santa Maria',
    'Centro Médico Paulista',
    'Hospital Israelita Albert Einstein',
    'Hospital Sírio-Libanês',
    'Hospital Alemão Oswaldo Cruz',
    'Hospital Samaritano',
    'Clínica São Camilo',
    'Centro Diagnóstico Fleury',
    'Laboratório Delboni Auriemo'
  ];
  
  return providers[Math.floor(Math.random() * providers.length)];
}