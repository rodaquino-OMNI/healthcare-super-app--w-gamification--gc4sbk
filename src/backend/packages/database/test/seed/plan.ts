/**
 * @file Plan Journey Seed Functions
 * 
 * Contains seed functions for the Plan journey ("Meu Plano & Benefu00edcios") test data,
 * including insurance plans, benefits, coverage, claims, and documents.
 */

import { PrismaClient } from '@prisma/client';
import { PlanContext } from '../../src/contexts/plan.context';
import { TestSeedOptions, prefixTestData, getCountByVolume, handleSeedError } from './types';

/**
 * Seeds Plan Journey test data.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 * @param planContext - Optional PlanContext instance for optimized operations
 */
export async function seedPlanJourneyData(
  prisma: PrismaClient, 
  options: TestSeedOptions,
  planContext?: PlanContext
): Promise<void> {
  try {
    // Sample plan types
    const planTypes = [
      { name: prefixTestData('Bu00e1sico', options), description: 'Plano com cobertura bu00e1sica' },
      { name: prefixTestData('Standard', options), description: 'Plano com cobertura intermediu00e1ria' },
      { name: prefixTestData('Premium', options), description: 'Plano com cobertura ampla' },
    ];
    
    for (const planType of planTypes) {
      // Use plan context if available for optimized operations
      if (planContext) {
        await planContext.upsertPlanType(planType);
      } else {
        await prisma.insurancePlanType.upsert({
          where: { name: planType.name },
          update: {},
          create: planType,
        });
      }
    }
    
    // Sample claim types
    const claimTypes = [
      { name: prefixTestData('Consulta Mu00e9dica', options), description: 'Reembolso para consulta mu00e9dica' },
      { name: prefixTestData('Exame', options), description: 'Reembolso para exames mu00e9dicos' },
      { name: prefixTestData('Terapia', options), description: 'Reembolso para sessu00f5es terapu00eauticas' },
      { name: prefixTestData('Internacu00e3o', options), description: 'Reembolso para internacu00e3o hospitalar' },
      { name: prefixTestData('Medicamento', options), description: 'Reembolso para medicamentos prescritos' },
    ];
    
    for (const claimType of claimTypes) {
      // Use plan context if available for optimized operations
      if (planContext) {
        await planContext.upsertClaimType(claimType);
      } else {
        await prisma.claimType.upsert({
          where: { name: claimType.name },
          update: {},
          create: claimType,
        });
      }
    }
    
    // Create insurance plans based on volume
    if (options.dataVolume !== 'small') {
      await seedInsurancePlansData(prisma, options, planContext);
    }
    
    // Create claims based on volume
    if (options.dataVolume !== 'small') {
      await seedClaimsData(prisma, options, planContext);
    }
    
    // Create benefits based on volume
    if (options.dataVolume !== 'small') {
      await seedBenefitsData(prisma, options, planContext);
    }
    
    // Create documents based on volume
    if (options.dataVolume !== 'small') {
      await seedDocumentsData(prisma, options, planContext);
    }
    
    if (options.logging) {
      console.log(`Created plan journey test data: ${planTypes.length} plan types, ${claimTypes.length} claim types`);
    }
  } catch (error) {
    if (options.errorHandling === 'throw') {
      throw error;
    } else if (options.errorHandling === 'log') {
      console.error(`Error seeding plan journey test data:`, error);
    }
  }
}

/**
 * Seeds insurance plans data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 * @param planContext - Optional PlanContext instance for optimized operations
 */
export async function seedInsurancePlansData(
  prisma: PrismaClient, 
  options: TestSeedOptions,
  planContext?: PlanContext
): Promise<void> {
  // Implementation depends on data volume
  const planCount = getPlanCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${planCount} insurance plans...`);
  }
  
  // Get plan types
  const planTypes = await prisma.insurancePlanType.findMany();
  
  if (planTypes.length === 0) {
    return;
  }
  
  // Create plans
  for (let i = 0; i < planCount; i++) {
    // Select a random plan type
    const planType = planTypes[Math.floor(Math.random() * planTypes.length)];
    
    // Create the plan data
    const planData = {
      name: prefixTestData(`Plano ${planType.name} ${i + 1}`, options),
      description: `Plano de teste ${i + 1}`,
      typeId: planType.id,
      coverage: JSON.stringify({
        consultations: i % 3 === 0 ? 'full' : 'partial',
        exams: i % 2 === 0 ? 'full' : 'partial',
        hospitalizations: planType.name.includes('Premium') ? 'full' : 'partial',
      }),
      monthlyPrice: 100 + (i * 50), // 100-600 BRL
      active: true,
    };
    
    // Use plan context if available for optimized operations
    if (planContext) {
      await planContext.createInsurancePlan(planData);
    } else {
      await prisma.insurancePlan.create({ data: planData });
    }
  }
  
  // Assign plans to users
  const users = await prisma.user.findMany();
  const plans = await prisma.insurancePlan.findMany();
  
  if (users.length === 0 || plans.length === 0) {
    return;
  }
  
  for (const user of users) {
    // Select a random plan
    const plan = plans[Math.floor(Math.random() * plans.length)];
    
    // Create user plan data
    const userPlanData = {
      userId: user.id,
      planId: plan.id,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
      status: 'ACTIVE',
      policyNumber: `POL-${100000 + Math.floor(Math.random() * 900000)}`,
    };
    
    // Use plan context if available for optimized operations
    if (planContext) {
      await planContext.createUserPlan(userPlanData);
    } else {
      await prisma.userPlan.create({ data: userPlanData });
    }
  }
}

/**
 * Seeds claims data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 * @param planContext - Optional PlanContext instance for optimized operations
 */
export async function seedClaimsData(
  prisma: PrismaClient, 
  options: TestSeedOptions,
  planContext?: PlanContext
): Promise<void> {
  // Implementation depends on data volume
  const claimCount = getClaimCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${claimCount} insurance claims...`);
  }
  
  // Get users, plans, and claim types
  const userPlans = await prisma.userPlan.findMany({
    include: {
      user: true,
      plan: true,
    },
  });
  
  const claimTypes = await prisma.claimType.findMany();
  
  if (userPlans.length === 0 || claimTypes.length === 0) {
    return;
  }
  
  // Create claims
  for (let i = 0; i < claimCount; i++) {
    // Select a random user plan and claim type
    const userPlan = userPlans[Math.floor(Math.random() * userPlans.length)];
    const claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];
    
    // Create claim with dates spanning the last 90 days
    const date = new Date();
    date.setDate(date.getDate() - (i % 90));
    
    // Create the claim data
    const claimData = {
      userId: userPlan.userId,
      planId: userPlan.planId,
      typeId: claimType.id,
      amount: 100 + (i * 10), // 100-1000 BRL
      description: `Claim for ${claimType.name}`,
      status: i % 5 === 0 ? 'REJECTED' : (i % 3 === 0 ? 'APPROVED' : 'PENDING'),
      submittedAt: date,
      documentUrls: JSON.stringify([`https://example.com/docs/claim_${i + 1}.pdf`]),
    };
    
    // Use plan context if available for optimized operations
    if (planContext) {
      await planContext.createClaim(claimData);
    } else {
      await prisma.claim.create({ data: claimData });
    }
  }
}

/**
 * Seeds benefits data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 * @param planContext - Optional PlanContext instance for optimized operations
 */
export async function seedBenefitsData(
  prisma: PrismaClient, 
  options: TestSeedOptions,
  planContext?: PlanContext
): Promise<void> {
  // Implementation depends on data volume
  const benefitCount = getBenefitCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${benefitCount} benefits per plan...`);
  }
  
  // Get insurance plans
  const plans = await prisma.insurancePlan.findMany();
  
  if (plans.length === 0) {
    return;
  }
  
  // Sample benefit types
  const benefitTypes = [
    { name: 'Consultas', description: 'Cobertura para consultas mu00e9dicas' },
    { name: 'Exames', description: 'Cobertura para exames diagnu00f3sticos' },
    { name: 'Internacu00e3o', description: 'Cobertura para internacu00e3o hospitalar' },
    { name: 'Terapias', description: 'Cobertura para terapias complementares' },
    { name: 'Medicamentos', description: 'Cobertura para medicamentos prescritos' },
    { name: 'Odontologia', description: 'Cobertura para tratamentos odontolu00f3gicos' },
    { name: 'Emergu00eancia', description: 'Cobertura para atendu00edmentos de emergu00eancia' },
    { name: 'Maternidade', description: 'Cobertura para cuidados de maternidade' },
  ];
  
  // Create benefits for each plan
  for (const plan of plans) {
    // Determine number of benefits based on plan type
    let planBenefitCount = benefitCount;
    if (plan.name.includes('Premium')) {
      planBenefitCount = benefitTypes.length; // Premium plans get all benefits
    } else if (plan.name.includes('Standard')) {
      planBenefitCount = Math.ceil(benefitTypes.length * 0.75); // Standard plans get 75% of benefits
    } else {
      planBenefitCount = Math.ceil(benefitTypes.length * 0.5); // Basic plans get 50% of benefits
    }
    
    // Select benefits for this plan
    const selectedBenefits = [...benefitTypes]
      .sort(() => Math.random() - 0.5)
      .slice(0, planBenefitCount);
    
    for (const benefit of selectedBenefits) {
      // Determine coverage percentage based on plan type
      let coveragePercentage = 50;
      if (plan.name.includes('Premium')) {
        coveragePercentage = 100;
      } else if (plan.name.includes('Standard')) {
        coveragePercentage = 80;
      }
      
      // Create the benefit data
      const benefitData = {
        planId: plan.id,
        name: prefixTestData(benefit.name, options),
        description: benefit.description,
        coveragePercentage,
        annualLimit: plan.name.includes('Premium') ? null : (1000 * (coveragePercentage / 10)), // null for unlimited
        waitingPeriod: plan.name.includes('Premium') ? 0 : 30, // days
        details: JSON.stringify({
          network: plan.name.includes('Premium') ? 'national' : 'regional',
          preAuthorization: !plan.name.includes('Premium'),
          exclusions: ['Procedimentos estu00e9ticos', 'Tratamentos experimentais'],
        }),
      };
      
      // Use plan context if available for optimized operations
      if (planContext) {
        await planContext.createBenefit(benefitData);
      } else {
        await prisma.benefit.create({ data: benefitData });
      }
    }
  }
}

/**
 * Seeds documents data based on volume.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 * @param planContext - Optional PlanContext instance for optimized operations
 */
export async function seedDocumentsData(
  prisma: PrismaClient, 
  options: TestSeedOptions,
  planContext?: PlanContext
): Promise<void> {
  // Implementation depends on data volume
  const documentCount = getDocumentCountByVolume(options.dataVolume);
  
  if (options.logging) {
    console.log(`Creating ${documentCount} documents per user...`);
  }
  
  // Get user plans
  const userPlans = await prisma.userPlan.findMany();
  
  if (userPlans.length === 0) {
    return;
  }
  
  // Sample document types
  const documentTypes = [
    { name: 'Apu00f3lice', extension: 'pdf' },
    { name: 'Carteirinha', extension: 'pdf' },
    { name: 'Manual do Beneficiu00e1rio', extension: 'pdf' },
    { name: 'Rede Credenciada', extension: 'pdf' },
    { name: 'Tabela de Cobertura', extension: 'pdf' },
    { name: 'Declarau00e7u00e3o de Sau00fade', extension: 'pdf' },
  ];
  
  // Create documents for each user plan
  for (const userPlan of userPlans) {
    // Select documents for this user
    const userDocumentCount = Math.min(documentCount, documentTypes.length);
    const selectedDocuments = [...documentTypes]
      .sort(() => Math.random() - 0.5)
      .slice(0, userDocumentCount);
    
    for (const document of selectedDocuments) {
      // Create the document data
      const documentData = {
        userId: userPlan.userId,
        planId: userPlan.planId,
        name: prefixTestData(document.name, options),
        type: document.name,
        url: `https://example.com/documents/${userPlan.policyNumber}/${document.name.toLowerCase().replace(/\s+/g, '_')}.${document.extension}`,
        uploadedAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)), // Random date in last 90 days
        expiresAt: document.name === 'Apu00f3lice' ? new Date(userPlan.endDate) : null, // Only policy has expiration
        metadata: JSON.stringify({
          size: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
          contentType: `application/${document.extension}`,
          pages: Math.floor(Math.random() * 20) + 1, // 1-20 pages
        }),
      };
      
      // Use plan context if available for optimized operations
      if (planContext) {
        await planContext.createDocument(documentData);
      } else {
        await prisma.insuranceDocument.create({ data: documentData });
      }
    }
  }
}

/**
 * Gets the number of plans to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of plans to create
 */
function getPlanCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  return getCountByVolume(dataVolume, 0, 3, 10);
}

/**
 * Gets the number of claims to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of claims to create
 */
function getClaimCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  return getCountByVolume(dataVolume, 0, 10, 50);
}

/**
 * Gets the number of benefits to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of benefits to create
 */
function getBenefitCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  return getCountByVolume(dataVolume, 0, 4, 8);
}

/**
 * Gets the number of documents to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of documents to create
 */
function getDocumentCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  return getCountByVolume(dataVolume, 0, 3, 6);
}