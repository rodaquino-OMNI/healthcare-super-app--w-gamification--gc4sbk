import { PrismaClient } from '@prisma/client';
import { PlanContext } from '../../src/contexts/plan.context';
import { TransactionService } from '../../src/transactions/transaction.service';
import { ClaimStatus } from '@austa/interfaces/journey/plan/claim.interface';

/**
 * Configuration options for plan journey seed data
 */
export interface PlanSeedOptions {
  /**
   * Number of insurance plans to create
   * @default 3
   */
  planCount?: number;

  /**
   * Number of benefits per plan
   * @default 5
   */
  benefitsPerPlan?: number;

  /**
   * Number of coverage items per plan
   * @default 4
   */
  coveragePerPlan?: number;

  /**
   * Number of claims to create per user
   * @default 3
   */
  claimsPerUser?: number;

  /**
   * Number of documents per claim
   * @default 2
   */
  documentsPerClaim?: number;

  /**
   * Include specific claim statuses in the seed data
   * If not provided, a mix of statuses will be used
   */
  includeClaimStatuses?: ClaimStatus[];

  /**
   * Specific user IDs to create claims for
   * If not provided, claims will be created for test users
   */
  userIds?: string[];

  /**
   * Region codes to use for plan availability
   * @default ['SP', 'RJ', 'MG']
   */
  regionCodes?: string[];

  /**
   * Whether to log detailed information during seeding
   * @default false
   */
  verbose?: boolean;
}

/**
 * Default seed options
 */
const defaultSeedOptions: PlanSeedOptions = {
  planCount: 3,
  benefitsPerPlan: 5,
  coveragePerPlan: 4,
  claimsPerUser: 3,
  documentsPerClaim: 2,
  regionCodes: ['SP', 'RJ', 'MG'],
  verbose: false,
};

/**
 * Plan types with their characteristics
 */
const planTypes = [
  { name: 'Básico', description: 'Plano com cobertura básica', monthlyPrice: 199.90 },
  { name: 'Standard', description: 'Plano com cobertura intermediária', monthlyPrice: 349.90 },
  { name: 'Premium', description: 'Plano com cobertura ampla', monthlyPrice: 599.90 },
];

/**
 * Benefit types for insurance plans
 */
const benefitTypes = [
  { name: 'Consultas Médicas', description: 'Cobertura para consultas médicas', limitPerYear: 12 },
  { name: 'Exames Básicos', description: 'Cobertura para exames básicos', limitPerYear: 24 },
  { name: 'Exames Especiais', description: 'Cobertura para exames especiais', limitPerYear: 6 },
  { name: 'Terapias', description: 'Cobertura para sessões terapêuticas', limitPerYear: 20 },
  { name: 'Internação', description: 'Cobertura para internação hospitalar', limitPerYear: 1 },
  { name: 'Emergência', description: 'Cobertura para atendimentos de emergência', limitPerYear: 4 },
  { name: 'Medicamentos', description: 'Cobertura para medicamentos prescritos', limitPerYear: 12 },
  { name: 'Odontologia', description: 'Cobertura para tratamentos odontológicos', limitPerYear: 2 },
];

/**
 * Coverage types for insurance plans
 */
const coverageTypes = [
  { type: 'MEDICAL_VISIT', description: 'Consultas médicas', copaymentAmount: 30.00 },
  { type: 'EMERGENCY', description: 'Atendimento de emergência', copaymentAmount: 100.00 },
  { type: 'HOSPITALIZATION', description: 'Internação hospitalar', copaymentAmount: 200.00 },
  { type: 'EXAMS', description: 'Exames diagnósticos', copaymentAmount: 50.00 },
  { type: 'THERAPY', description: 'Sessões terapêuticas', copaymentAmount: 40.00 },
  { type: 'MEDICATION', description: 'Medicamentos prescritos', copaymentAmount: 20.00 },
];

/**
 * Claim types for insurance claims
 */
const claimTypes = [
  { name: 'Consulta Médica', description: 'Reembolso para consulta médica' },
  { name: 'Exame', description: 'Reembolso para exames médicos' },
  { name: 'Terapia', description: 'Reembolso para sessões terapêuticas' },
  { name: 'Internação', description: 'Reembolso para internação hospitalar' },
  { name: 'Medicamento', description: 'Reembolso para medicamentos prescritos' },
];

/**
 * Document types for insurance claims
 */
const documentTypes = [
  { type: 'RECEIPT', description: 'Recibo de pagamento' },
  { type: 'MEDICAL_REPORT', description: 'Relatório médico' },
  { type: 'PRESCRIPTION', description: 'Receita médica' },
  { type: 'EXAM_RESULT', description: 'Resultado de exame' },
  { type: 'INVOICE', description: 'Nota fiscal' },
];

/**
 * Provider specialties for test data
 */
const providerSpecialties = [
  'Cardiologia',
  'Dermatologia',
  'Ortopedia',
  'Pediatria',
  'Psiquiatria',
  'Neurologia',
  'Oftalmologia',
  'Ginecologia',
];

/**
 * Generates a random date within the specified range
 * 
 * @param start - Start date
 * @param end - End date
 * @returns Random date between start and end
 */
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generates a random claim status based on the provided options
 * 
 * @param options - Seed options containing claim status preferences
 * @returns Random claim status
 */
function getRandomClaimStatus(options?: PlanSeedOptions): ClaimStatus {
  if (options?.includeClaimStatuses && options.includeClaimStatuses.length > 0) {
    const index = Math.floor(Math.random() * options.includeClaimStatuses.length);
    return options.includeClaimStatuses[index];
  }

  const statuses = [
    ClaimStatus.SUBMITTED,
    ClaimStatus.VALIDATING,
    ClaimStatus.PROCESSING,
    ClaimStatus.UNDER_REVIEW,
    ClaimStatus.APPROVED,
    ClaimStatus.PAYMENT_PENDING,
    ClaimStatus.COMPLETED,
    ClaimStatus.REJECTED,
    ClaimStatus.DENIED,
  ];

  const index = Math.floor(Math.random() * statuses.length);
  return statuses[index];
}

/**
 * Generates a random amount for a claim based on the claim type
 * 
 * @param claimType - Type of claim
 * @returns Random amount appropriate for the claim type
 */
function getRandomClaimAmount(claimType: string): number {
  switch (claimType) {
    case 'Consulta Médica':
      return Math.floor(Math.random() * 300) + 200; // 200-500
    case 'Exame':
      return Math.floor(Math.random() * 500) + 100; // 100-600
    case 'Terapia':
      return Math.floor(Math.random() * 200) + 150; // 150-350
    case 'Internação':
      return Math.floor(Math.random() * 5000) + 2000; // 2000-7000
    case 'Medicamento':
      return Math.floor(Math.random() * 300) + 50; // 50-350
    default:
      return Math.floor(Math.random() * 500) + 100; // 100-600
  }
}

/**
 * Generates a random provider ID for test data
 * 
 * @returns Random provider ID
 */
function getRandomProviderId(): string {
  return `provider-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Generates a random service code for test data
 * 
 * @param claimType - Type of claim
 * @returns Random service code appropriate for the claim type
 */
function getRandomServiceCode(claimType: string): string {
  const prefix = claimType.substring(0, 3).toUpperCase();
  return `${prefix}-${Math.floor(Math.random() * 10000)}`;
}

/**
 * Generates a random document URL for test data
 * 
 * @param documentType - Type of document
 * @param claimId - ID of the associated claim
 * @returns Random document URL
 */
function getRandomDocumentUrl(documentType: string, claimId: string): string {
  const fileExtensions = ['pdf', 'jpg', 'png'];
  const extension = fileExtensions[Math.floor(Math.random() * fileExtensions.length)];
  return `https://storage.austa.com.br/documents/${claimId}/${documentType.toLowerCase()}.${extension}`;
}

/**
 * Class that provides specialized seeding functions for Plan journey test data
 */
export class PlanSeedService {
  private planContext: PlanContext;
  private options: PlanSeedOptions;

  /**
   * Creates an instance of PlanSeedService
   * 
   * @param prisma - PrismaClient instance
   * @param options - Configuration options for seeding
   */
  constructor(
    private readonly prisma: PrismaClient,
    options?: PlanSeedOptions
  ) {
    const transactionService = new TransactionService(prisma);
    this.planContext = new PlanContext(prisma, transactionService);
    this.options = { ...defaultSeedOptions, ...options };
  }

  /**
   * Seeds all Plan journey data based on the provided options
   * 
   * @returns Promise that resolves when seeding is complete
   */
  async seedAll(): Promise<void> {
    try {
      this.log('Starting Plan journey seed process...');

      // Seed insurance plan types
      await this.seedInsurancePlanTypes();

      // Seed claim types
      await this.seedClaimTypes();

      // Seed insurance plans
      const plans = await this.seedInsurancePlans();

      // Seed benefits for each plan
      for (const plan of plans) {
        await this.seedPlanBenefits(plan.id);
        await this.seedPlanCoverage(plan.id);
      }

      // Seed claims if user IDs are provided
      if (this.options.userIds && this.options.userIds.length > 0) {
        for (const userId of this.options.userIds) {
          await this.seedUserClaims(userId, plans[0].id);
        }
      }

      this.log('Plan journey seed process completed successfully!');
    } catch (error) {
      console.error('Error seeding Plan journey data:', error);
      throw error;
    }
  }

  /**
   * Seeds insurance plan types
   * 
   * @returns Promise that resolves when seeding is complete
   */
  async seedInsurancePlanTypes(): Promise<void> {
    try {
      this.log(`Seeding ${planTypes.length} insurance plan types...`);

      for (const planType of planTypes) {
        await this.prisma.insurancePlanType.upsert({
          where: { name: planType.name },
          update: {},
          create: planType,
        });
      }

      this.log(`Successfully seeded ${planTypes.length} insurance plan types.`);
    } catch (error) {
      console.error('Error seeding insurance plan types:', error);
      throw error;
    }
  }

  /**
   * Seeds claim types
   * 
   * @returns Promise that resolves when seeding is complete
   */
  async seedClaimTypes(): Promise<void> {
    try {
      this.log(`Seeding ${claimTypes.length} claim types...`);

      for (const claimType of claimTypes) {
        await this.prisma.claimType.upsert({
          where: { name: claimType.name },
          update: {},
          create: claimType,
        });
      }

      this.log(`Successfully seeded ${claimTypes.length} claim types.`);
    } catch (error) {
      console.error('Error seeding claim types:', error);
      throw error;
    }
  }

  /**
   * Seeds insurance plans with configurable options
   * 
   * @returns Array of created insurance plans
   */
  async seedInsurancePlans(): Promise<any[]> {
    try {
      const planCount = this.options.planCount || defaultSeedOptions.planCount;
      this.log(`Seeding ${planCount} insurance plans...`);

      const plans = [];
      const planTypeRecords = await this.prisma.insurancePlanType.findMany();

      // Create plans based on the plan types
      for (let i = 0; i < planCount; i++) {
        const planTypeIndex = i % planTypeRecords.length;
        const planType = planTypeRecords[planTypeIndex];
        
        const coveragePercentage = planType.name === 'Básico' ? 60 :
          planType.name === 'Standard' ? 80 : 100;

        const plan = await this.prisma.plan.create({
          data: {
            name: `${planType.name} ${new Date().getFullYear()}`,
            description: `Plano ${planType.name} com cobertura de ${coveragePercentage}%`,
            price: planTypes[planTypeIndex].monthlyPrice,
            coveragePercentage,
            planTypeId: planType.id,
            status: 'ACTIVE',
            regions: this.options.regionCodes || defaultSeedOptions.regionCodes,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          },
        });

        plans.push(plan);
        this.log(`Created plan: ${plan.name}`);
      }

      this.log(`Successfully seeded ${plans.length} insurance plans.`);
      return plans;
    } catch (error) {
      console.error('Error seeding insurance plans:', error);
      throw error;
    }
  }

  /**
   * Seeds benefits for a specific plan
   * 
   * @param planId - ID of the plan to add benefits to
   * @returns Promise that resolves when seeding is complete
   */
  async seedPlanBenefits(planId: string): Promise<void> {
    try {
      const benefitsPerPlan = this.options.benefitsPerPlan || defaultSeedOptions.benefitsPerPlan;
      this.log(`Seeding ${benefitsPerPlan} benefits for plan ${planId}...`);

      // Get the plan to determine coverage percentage
      const plan = await this.prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        throw new Error(`Plan with ID ${planId} not found`);
      }

      // Select random benefits from the benefit types
      const selectedBenefits = [...benefitTypes]
        .sort(() => 0.5 - Math.random())
        .slice(0, benefitsPerPlan);

      for (const benefit of selectedBenefits) {
        // Create the benefit if it doesn't exist
        const createdBenefit = await this.prisma.benefit.upsert({
          where: { name: benefit.name },
          update: {},
          create: benefit,
        });

        // Connect the benefit to the plan
        await this.prisma.planBenefit.create({
          data: {
            planId,
            benefitId: createdBenefit.id,
            coveragePercentage: plan.coveragePercentage,
            limitPerYear: benefit.limitPerYear,
            waitingPeriodDays: Math.floor(Math.random() * 60), // 0-60 days waiting period
          },
        });

        this.log(`Added benefit ${benefit.name} to plan ${planId}`);
      }

      this.log(`Successfully seeded ${selectedBenefits.length} benefits for plan ${planId}.`);
    } catch (error) {
      console.error(`Error seeding benefits for plan ${planId}:`, error);
      throw error;
    }
  }

  /**
   * Seeds coverage items for a specific plan
   * 
   * @param planId - ID of the plan to add coverage to
   * @returns Promise that resolves when seeding is complete
   */
  async seedPlanCoverage(planId: string): Promise<void> {
    try {
      const coveragePerPlan = this.options.coveragePerPlan || defaultSeedOptions.coveragePerPlan;
      this.log(`Seeding ${coveragePerPlan} coverage items for plan ${planId}...`);

      // Get the plan to determine coverage percentage
      const plan = await this.prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        throw new Error(`Plan with ID ${planId} not found`);
      }

      // Select random coverage types
      const selectedCoverage = [...coverageTypes]
        .sort(() => 0.5 - Math.random())
        .slice(0, coveragePerPlan);

      for (const coverage of selectedCoverage) {
        // Generate random service codes for this coverage type
        const serviceCodes = Array.from({ length: 3 }, () => 
          `${coverage.type}-${Math.floor(Math.random() * 10000)}`
        );

        // Create the coverage item
        await this.prisma.coverage.create({
          data: {
            planId,
            type: coverage.type,
            description: coverage.description,
            coveragePercentage: plan.coveragePercentage,
            copaymentAmount: coverage.copaymentAmount,
            serviceCodes,
            isOutOfNetworkCovered: plan.coveragePercentage > 70, // Only higher tier plans cover out-of-network
            outOfNetworkCoveragePercentage: plan.coveragePercentage > 70 ? plan.coveragePercentage - 20 : 0,
          },
        });

        this.log(`Added coverage ${coverage.type} to plan ${planId}`);
      }

      this.log(`Successfully seeded ${selectedCoverage.length} coverage items for plan ${planId}.`);
    } catch (error) {
      console.error(`Error seeding coverage for plan ${planId}:`, error);
      throw error;
    }
  }

  /**
   * Seeds claims for a specific user
   * 
   * @param userId - ID of the user to create claims for
   * @param planId - ID of the plan associated with the claims
   * @returns Promise that resolves when seeding is complete
   */
  async seedUserClaims(userId: string, planId: string): Promise<void> {
    try {
      const claimsPerUser = this.options.claimsPerUser || defaultSeedOptions.claimsPerUser;
      this.log(`Seeding ${claimsPerUser} claims for user ${userId}...`);

      // Get claim types
      const claimTypeRecords = await this.prisma.claimType.findMany();

      // Create claims
      for (let i = 0; i < claimsPerUser; i++) {
        // Select a random claim type
        const claimTypeIndex = Math.floor(Math.random() * claimTypeRecords.length);
        const claimType = claimTypeRecords[claimTypeIndex];

        // Generate random claim data
        const serviceDate = randomDate(
          new Date(new Date().setMonth(new Date().getMonth() - 3)), // 3 months ago
          new Date() // Today
        );

        const providerId = getRandomProviderId();
        const serviceCode = getRandomServiceCode(claimType.name);
        const amount = getRandomClaimAmount(claimType.name);
        const status = getRandomClaimStatus(this.options);

        // Create the claim
        const claim = await this.prisma.claim.create({
          data: {
            userId,
            planId,
            claimTypeId: claimType.id,
            providerId,
            serviceCode,
            serviceDate,
            amount,
            status,
            statusNotes: status === ClaimStatus.REJECTED || status === ClaimStatus.DENIED
              ? 'Documentation incomplete or invalid'
              : null,
          },
        });

        this.log(`Created claim of type ${claimType.name} for user ${userId} with status ${status}`);

        // Add documents to the claim
        await this.seedClaimDocuments(claim.id);
      }

      this.log(`Successfully seeded ${claimsPerUser} claims for user ${userId}.`);
    } catch (error) {
      console.error(`Error seeding claims for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Seeds documents for a specific claim
   * 
   * @param claimId - ID of the claim to add documents to
   * @returns Promise that resolves when seeding is complete
   */
  async seedClaimDocuments(claimId: string): Promise<void> {
    try {
      const documentsPerClaim = this.options.documentsPerClaim || defaultSeedOptions.documentsPerClaim;
      this.log(`Seeding ${documentsPerClaim} documents for claim ${claimId}...`);

      // Get the claim to determine its status
      const claim = await this.prisma.claim.findUnique({
        where: { id: claimId },
      });

      if (!claim) {
        throw new Error(`Claim with ID ${claimId} not found`);
      }

      // Select random document types
      const selectedDocumentTypes = [...documentTypes]
        .sort(() => 0.5 - Math.random())
        .slice(0, documentsPerClaim);

      for (const documentType of selectedDocumentTypes) {
        const fileUrl = getRandomDocumentUrl(documentType.type, claimId);
        const fileSize = Math.floor(Math.random() * 5 * 1024 * 1024) + 100 * 1024; // 100KB - 5MB

        // Determine verification status based on claim status
        let verificationStatus = 'PENDING';
        if (
          claim.status === ClaimStatus.APPROVED ||
          claim.status === ClaimStatus.PAYMENT_PENDING ||
          claim.status === ClaimStatus.COMPLETED
        ) {
          verificationStatus = 'VERIFIED';
        } else if (
          claim.status === ClaimStatus.REJECTED ||
          claim.status === ClaimStatus.DENIED
        ) {
          verificationStatus = 'REJECTED';
        }

        // Create the document
        await this.prisma.document.create({
          data: {
            claimId,
            type: documentType.type,
            description: documentType.description,
            fileUrl,
            fileSize,
            mimeType: fileUrl.endsWith('pdf') ? 'application/pdf' : 
                      fileUrl.endsWith('jpg') ? 'image/jpeg' : 'image/png',
            verificationStatus,
            verificationNotes: verificationStatus === 'REJECTED'
              ? 'Document is illegible or incomplete'
              : null,
          },
        });

        this.log(`Added document of type ${documentType.type} to claim ${claimId}`);
      }

      this.log(`Successfully seeded ${selectedDocumentTypes.length} documents for claim ${claimId}.`);
    } catch (error) {
      console.error(`Error seeding documents for claim ${claimId}:`, error);
      throw error;
    }
  }

  /**
   * Seeds a specific claim scenario for testing
   * 
   * @param userId - ID of the user to create the claim for
   * @param planId - ID of the plan associated with the claim
   * @param scenario - Specific claim scenario to create
   * @returns Created claim
   */
  async seedClaimScenario(
    userId: string,
    planId: string,
    scenario: 'approved' | 'denied' | 'pending' | 'additional_info' | 'processing'
  ): Promise<any> {
    try {
      this.log(`Seeding ${scenario} claim scenario for user ${userId}...`);

      // Get a random claim type
      const claimTypes = await this.prisma.claimType.findMany();
      const claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];

      // Generate base claim data
      const serviceDate = randomDate(
        new Date(new Date().setMonth(new Date().getMonth() - 1)), // 1 month ago
        new Date() // Today
      );
      const providerId = getRandomProviderId();
      const serviceCode = getRandomServiceCode(claimType.name);
      const amount = getRandomClaimAmount(claimType.name);

      // Set status based on scenario
      let status: ClaimStatus;
      let statusNotes: string | null = null;

      switch (scenario) {
        case 'approved':
          status = ClaimStatus.APPROVED;
          break;
        case 'denied':
          status = ClaimStatus.DENIED;
          statusNotes = 'Claim denied due to policy exclusions';
          break;
        case 'pending':
          status = ClaimStatus.SUBMITTED;
          break;
        case 'additional_info':
          status = ClaimStatus.ADDITIONAL_INFO_REQUIRED;
          statusNotes = 'Please provide additional documentation for this claim';
          break;
        case 'processing':
          status = ClaimStatus.PROCESSING;
          break;
        default:
          status = ClaimStatus.SUBMITTED;
      }

      // Create the claim
      const claim = await this.prisma.claim.create({
        data: {
          userId,
          planId,
          claimTypeId: claimType.id,
          providerId,
          serviceCode,
          serviceDate,
          amount,
          status,
          statusNotes,
        },
      });

      this.log(`Created ${scenario} claim scenario for user ${userId}`);

      // Add appropriate documents based on scenario
      const documentsToAdd = scenario === 'additional_info' ? 1 : 2;
      
      for (let i = 0; i < documentsToAdd; i++) {
        const documentType = documentTypes[i];
        const fileUrl = getRandomDocumentUrl(documentType.type, claim.id);
        const fileSize = Math.floor(Math.random() * 2 * 1024 * 1024) + 100 * 1024; // 100KB - 2MB

        // Determine verification status based on scenario
        let verificationStatus = 'PENDING';
        if (scenario === 'approved') {
          verificationStatus = 'VERIFIED';
        } else if (scenario === 'denied') {
          verificationStatus = 'REJECTED';
        } else if (scenario === 'additional_info') {
          verificationStatus = 'INSUFFICIENT';
        }

        await this.prisma.document.create({
          data: {
            claimId: claim.id,
            type: documentType.type,
            description: documentType.description,
            fileUrl,
            fileSize,
            mimeType: fileUrl.endsWith('pdf') ? 'application/pdf' : 
                      fileUrl.endsWith('jpg') ? 'image/jpeg' : 'image/png',
            verificationStatus,
            verificationNotes: verificationStatus === 'REJECTED' || verificationStatus === 'INSUFFICIENT'
              ? 'Additional documentation required'
              : null,
          },
        });
      }

      return claim;
    } catch (error) {
      console.error(`Error seeding ${scenario} claim scenario:`, error);
      throw error;
    }
  }

  /**
   * Seeds a complete plan with benefits, coverage, and claims for testing
   * 
   * @param userId - ID of the user to associate with the plan
   * @param planType - Type of plan to create ('basic', 'standard', or 'premium')
   * @returns Created plan with associated data
   */
  async seedCompletePlanScenario(
    userId: string,
    planType: 'basic' | 'standard' | 'premium' = 'standard'
  ): Promise<any> {
    try {
      this.log(`Seeding complete ${planType} plan scenario for user ${userId}...`);

      // Map plan type to database plan type
      const planTypeName = planType === 'basic' ? 'Básico' :
                          planType === 'premium' ? 'Premium' : 'Standard';

      // Get the plan type
      const planTypeRecord = await this.prisma.insurancePlanType.findUnique({
        where: { name: planTypeName },
      });

      if (!planTypeRecord) {
        throw new Error(`Plan type ${planTypeName} not found`);
      }

      // Create the plan
      const coveragePercentage = planType === 'basic' ? 60 :
                               planType === 'premium' ? 100 : 80;

      const planTypeIndex = planTypes.findIndex(pt => pt.name === planTypeName);
      const plan = await this.prisma.plan.create({
        data: {
          name: `${planTypeName} Complete Test`,
          description: `Plano ${planTypeName} completo para testes com cobertura de ${coveragePercentage}%`,
          price: planTypes[planTypeIndex].monthlyPrice,
          coveragePercentage,
          planTypeId: planTypeRecord.id,
          status: 'ACTIVE',
          regions: this.options.regionCodes || defaultSeedOptions.regionCodes,
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        },
      });

      // Add all benefits to the plan
      for (const benefit of benefitTypes) {
        // Create the benefit if it doesn't exist
        const createdBenefit = await this.prisma.benefit.upsert({
          where: { name: benefit.name },
          update: {},
          create: benefit,
        });

        // Connect the benefit to the plan
        await this.prisma.planBenefit.create({
          data: {
            planId: plan.id,
            benefitId: createdBenefit.id,
            coveragePercentage,
            limitPerYear: benefit.limitPerYear,
            waitingPeriodDays: planType === 'premium' ? 0 : Math.floor(Math.random() * 30), // Premium has no waiting period
          },
        });
      }

      // Add all coverage types to the plan
      for (const coverage of coverageTypes) {
        // Generate service codes for this coverage type
        const serviceCodes = Array.from({ length: 3 }, () => 
          `${coverage.type}-${Math.floor(Math.random() * 10000)}`
        );

        // Create the coverage item
        await this.prisma.coverage.create({
          data: {
            planId: plan.id,
            type: coverage.type,
            description: coverage.description,
            coveragePercentage,
            copaymentAmount: planType === 'premium' ? 0 : coverage.copaymentAmount, // Premium has no copayment
            serviceCodes,
            isOutOfNetworkCovered: planType !== 'basic', // Basic doesn't cover out-of-network
            outOfNetworkCoveragePercentage: planType === 'premium' ? 80 : 
                                          planType === 'standard' ? 60 : 0,
          },
        });
      }

      // Create one claim of each scenario type
      const scenarios: Array<'approved' | 'denied' | 'pending' | 'additional_info' | 'processing'> = [
        'approved', 'denied', 'pending', 'additional_info', 'processing'
      ];

      for (const scenario of scenarios) {
        await this.seedClaimScenario(userId, plan.id, scenario);
      }

      this.log(`Successfully seeded complete ${planType} plan scenario for user ${userId}.`);
      return plan;
    } catch (error) {
      console.error(`Error seeding complete ${planType} plan scenario:`, error);
      throw error;
    }
  }

  /**
   * Cleans up all Plan journey test data
   * 
   * @returns Promise that resolves when cleanup is complete
   */
  async cleanup(): Promise<void> {
    try {
      this.log('Cleaning up Plan journey test data...');

      // Delete in order to respect foreign key constraints
      await this.prisma.document.deleteMany({});
      await this.prisma.claim.deleteMany({});
      await this.prisma.coverage.deleteMany({});
      await this.prisma.planBenefit.deleteMany({});
      await this.prisma.benefit.deleteMany({});
      await this.prisma.plan.deleteMany({});
      await this.prisma.claimType.deleteMany({});
      await this.prisma.insurancePlanType.deleteMany({});

      this.log('Successfully cleaned up Plan journey test data.');
    } catch (error) {
      console.error('Error cleaning up Plan journey test data:', error);
      throw error;
    }
  }

  /**
   * Logs a message if verbose option is enabled
   * 
   * @param message - Message to log
   */
  private log(message: string): void {
    if (this.options.verbose) {
      console.log(`[PlanSeed] ${message}`);
    }
  }
}

/**
 * Creates a new PlanSeedService instance with the provided options
 * 
 * @param prisma - PrismaClient instance
 * @param options - Configuration options for seeding
 * @returns PlanSeedService instance
 */
export function createPlanSeedService(
  prisma: PrismaClient,
  options?: PlanSeedOptions
): PlanSeedService {
  return new PlanSeedService(prisma, options);
}

/**
 * Seeds all Plan journey data with the provided options
 * 
 * @param prisma - PrismaClient instance
 * @param options - Configuration options for seeding
 * @returns Promise that resolves when seeding is complete
 */
export async function seedPlanJourney(
  prisma: PrismaClient,
  options?: PlanSeedOptions
): Promise<void> {
  const seedService = createPlanSeedService(prisma, options);
  await seedService.seedAll();
}

/**
 * Seeds a specific claim scenario for testing
 * 
 * @param prisma - PrismaClient instance
 * @param userId - ID of the user to create the claim for
 * @param planId - ID of the plan associated with the claim
 * @param scenario - Specific claim scenario to create
 * @param options - Configuration options for seeding
 * @returns Created claim
 */
export async function seedClaimScenario(
  prisma: PrismaClient,
  userId: string,
  planId: string,
  scenario: 'approved' | 'denied' | 'pending' | 'additional_info' | 'processing',
  options?: PlanSeedOptions
): Promise<any> {
  const seedService = createPlanSeedService(prisma, options);
  return seedService.seedClaimScenario(userId, planId, scenario);
}

/**
 * Seeds a complete plan with benefits, coverage, and claims for testing
 * 
 * @param prisma - PrismaClient instance
 * @param userId - ID of the user to associate with the plan
 * @param planType - Type of plan to create ('basic', 'standard', or 'premium')
 * @param options - Configuration options for seeding
 * @returns Created plan with associated data
 */
export async function seedCompletePlanScenario(
  prisma: PrismaClient,
  userId: string,
  planType: 'basic' | 'standard' | 'premium' = 'standard',
  options?: PlanSeedOptions
): Promise<any> {
  const seedService = createPlanSeedService(prisma, options);
  return seedService.seedCompletePlanScenario(userId, planType);
}

/**
 * Cleans up all Plan journey test data
 * 
 * @param prisma - PrismaClient instance
 * @returns Promise that resolves when cleanup is complete
 */
export async function cleanupPlanJourney(prisma: PrismaClient): Promise<void> {
  const seedService = createPlanSeedService(prisma, { verbose: true });
  await seedService.cleanup();
}