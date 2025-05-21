import { PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';

/**
 * Enhanced PrismaClient with connection pooling and error handling
 * This extends the base PrismaClient with additional functionality
 * specific to the plan-service seeding needs
 */
class SeedPrismaClient extends PrismaClient {
  private readonly logger = new Logger('PlanServiceSeed');

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'pretty',
    });
    this.logger.log('Initializing PrismaClient for seeding');
  }

  /**
   * Connect to the database with error handling
   */
  async connect(): Promise<void> {
    try {
      this.logger.log('Connecting to database...');
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error(`Failed to connect to database: ${error.message}`);
      throw error;
    }
  }

  /**
   * Disconnect from the database with error handling
   */
  async disconnect(): Promise<void> {
    try {
      this.logger.log('Disconnecting from database...');
      await this.$disconnect();
      this.logger.log('Database connection closed');
    } catch (error) {
      this.logger.error(`Failed to disconnect from database: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Main seed function that populates the database with initial data
 */
async function main() {
  const prisma = new SeedPrismaClient();
  const logger = new Logger('PlanServiceSeed');

  try {
    // Connect to the database
    await prisma.connect();

    // Clean up existing data before seeding
    await cleanupData(prisma, logger);

    // Seed plan types
    logger.log('Seeding plan types...');
    const planTypes = await seedPlanTypes(prisma, logger);
    logger.log(`Created ${planTypes.length} plan types`);

    // Seed benefit categories
    logger.log('Seeding benefit categories...');
    const benefitCategories = await seedBenefitCategories(prisma, logger);
    logger.log(`Created ${benefitCategories.length} benefit categories`);

    // Seed sample users
    logger.log('Seeding sample users...');
    const users = await seedUsers(prisma, logger);
    logger.log(`Created ${users.length} sample users`);

    // Seed sample plans
    logger.log('Seeding sample plans...');
    const plans = await seedSamplePlans(prisma, users, logger);
    logger.log(`Created ${plans.length} sample plans`);

    // Seed sample benefits
    logger.log('Seeding sample benefits...');
    const benefits = await seedSampleBenefits(prisma, plans, benefitCategories, logger);
    logger.log(`Created ${benefits.length} sample benefits`);

    // Seed sample claims
    logger.log('Seeding sample claims...');
    const claims = await seedSampleClaims(prisma, plans, logger);
    logger.log(`Created ${claims.length} sample claims`);

    logger.log('Seeding completed successfully');
  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`);
    logger.error(error.stack);
    throw error;
  } finally {
    // Always disconnect from the database
    await prisma.disconnect();
  }
}

/**
 * Clean up existing data before seeding to prevent duplicates
 */
async function cleanupData(prisma: SeedPrismaClient, logger: Logger): Promise<void> {
  logger.log('Cleaning up existing data...');

  try {
    // Delete in reverse order of dependencies
    await prisma.claim.deleteMany({
      where: {
        OR: [
          { planId: { startsWith: 'seed-' } },
          { userId: { startsWith: 'seed-' } }
        ]
      }
    });
    logger.log('Cleaned up claims');

    await prisma.benefit.deleteMany({
      where: {
        plan: {
          OR: [
            { planNumber: { startsWith: 'SEED-' } },
            { userId: { startsWith: 'seed-' } }
          ]
        }
      }
    });
    logger.log('Cleaned up benefits');

    await prisma.plan.deleteMany({
      where: {
        OR: [
          { planNumber: { startsWith: 'SEED-' } },
          { userId: { startsWith: 'seed-' } }
        ]
      }
    });
    logger.log('Cleaned up plans');

    await prisma.user.deleteMany({
      where: {
        id: { startsWith: 'seed-' }
      }
    });
    logger.log('Cleaned up seed users');

    logger.log('Data cleanup completed');
  } catch (error) {
    logger.error(`Data cleanup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Seed plan types
 */
async function seedPlanTypes(prisma: SeedPrismaClient, logger: Logger): Promise<string[]> {
  const planTypes = [
    'HEALTH',     // General health insurance
    'DENTAL',     // Dental coverage
    'VISION',     // Vision coverage
    'PHARMACY',   // Prescription drug coverage
    'MENTAL',     // Mental health coverage
    'FAMILY',     // Family coverage plan
    'INDIVIDUAL', // Individual coverage plan
    'SENIOR',     // Senior/Medicare plan
    'PREMIUM',    // Premium tier plan
    'BASIC'       // Basic tier plan
  ];

  try {
    // We're not actually storing plan types in a separate table,
    // but we return the list for reference in other seed functions
    return planTypes;
  } catch (error) {
    logger.error(`Failed to seed plan types: ${error.message}`);
    throw error;
  }
}

/**
 * Seed benefit categories
 */
async function seedBenefitCategories(prisma: SeedPrismaClient, logger: Logger): Promise<string[]> {
  const benefitCategories = [
    'WELLNESS',        // Wellness programs and preventive care
    'HOSPITAL',        // Hospital coverage
    'EMERGENCY',       // Emergency services
    'SPECIALIST',      // Specialist visits
    'PRIMARY_CARE',    // Primary care visits
    'DIAGNOSTIC',      // Diagnostic tests and imaging
    'MATERNITY',       // Maternity and newborn care
    'PEDIATRIC',       // Pediatric services
    'PRESCRIPTION',    // Prescription drugs
    'REHABILITATION',  // Rehabilitation services
    'MENTAL_HEALTH',   // Mental health services
    'PREVENTIVE',      // Preventive dental care
    'BASIC_DENTAL',    // Basic dental procedures
    'MAJOR_DENTAL',    // Major dental procedures
    'ORTHODONTICS',    // Orthodontic services
    'VISION_EXAM',     // Vision examinations
    'FRAMES',          // Eyeglass frames
    'LENSES',          // Eyeglass lenses
    'CONTACTS',        // Contact lenses
    'LASER_SURGERY',   // Laser eye surgery
    'GYM',             // Gym membership
    'NUTRITION',       // Nutritional counseling
    'ALTERNATIVE',     // Alternative medicine (acupuncture, etc.)
    'TELEHEALTH',      // Telehealth services
    'TRANSPORTATION'   // Medical transportation
  ];

  try {
    // We're not actually storing benefit categories in a separate table,
    // but we return the list for reference in other seed functions
    return benefitCategories;
  } catch (error) {
    logger.error(`Failed to seed benefit categories: ${error.message}`);
    throw error;
  }
}

/**
 * Seed sample users for testing
 */
async function seedUsers(prisma: SeedPrismaClient, logger: Logger): Promise<any[]> {
  const sampleUsers = [
    {
      id: 'seed-user-1',
      email: 'seed-user1@example.com',
      name: 'Seed User One'
    },
    {
      id: 'seed-user-2',
      email: 'seed-user2@example.com',
      name: 'Seed User Two'
    },
    {
      id: 'seed-user-3',
      email: 'seed-user3@example.com',
      name: 'Seed User Three'
    }
  ];

  try {
    const createdUsers = [];

    for (const user of sampleUsers) {
      const createdUser = await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      });
      createdUsers.push(createdUser);
    }

    return createdUsers;
  } catch (error) {
    logger.error(`Failed to seed users: ${error.message}`);
    throw error;
  }
}

/**
 * Seed sample plans for testing
 */
async function seedSamplePlans(prisma: SeedPrismaClient, users: any[], logger: Logger): Promise<any[]> {
  try {
    const plans = [];

    // Health plan for user 1
    plans.push(await prisma.plan.create({
      data: {
        userId: users[0].id,
        planNumber: 'SEED-HEALTH-001',
        type: 'HEALTH',
        validityStart: new Date('2023-01-01'),
        validityEnd: new Date('2023-12-31'),
        coverageDetails: {
          network: 'Premium',
          hospital: true,
          emergency: true,
          primaryCare: true,
          specialist: true,
          maternity: true,
          mentalHealth: true,
          prescription: true,
          deductible: 500,
          outOfPocketMax: 5000,
          coinsurance: 20
        }
      }
    }));

    // Dental plan for user 1
    plans.push(await prisma.plan.create({
      data: {
        userId: users[0].id,
        planNumber: 'SEED-DENTAL-001',
        type: 'DENTAL',
        validityStart: new Date('2023-01-01'),
        validityEnd: new Date('2023-12-31'),
        coverageDetails: {
          network: 'Standard',
          preventive: true,
          basic: true,
          major: true,
          orthodontics: false,
          deductible: 50,
          annualMax: 1500
        }
      }
    }));

    // Vision plan for user 1
    plans.push(await prisma.plan.create({
      data: {
        userId: users[0].id,
        planNumber: 'SEED-VISION-001',
        type: 'VISION',
        validityStart: new Date('2023-01-01'),
        validityEnd: new Date('2023-12-31'),
        coverageDetails: {
          network: 'Standard',
          exam: true,
          frames: true,
          lenses: true,
          contacts: true,
          laserSurgery: false,
          examCopay: 10,
          materialsCopay: 25,
          frameAllowance: 150
        }
      }
    }));

    // Health plan for user 2
    plans.push(await prisma.plan.create({
      data: {
        userId: users[1].id,
        planNumber: 'SEED-HEALTH-002',
        type: 'HEALTH',
        validityStart: new Date('2023-01-01'),
        validityEnd: new Date('2023-12-31'),
        coverageDetails: {
          network: 'Basic',
          hospital: true,
          emergency: true,
          primaryCare: true,
          specialist: true,
          maternity: false,
          mentalHealth: false,
          prescription: true,
          deductible: 1000,
          outOfPocketMax: 7500,
          coinsurance: 30
        }
      }
    }));

    // Premium health plan for user 3
    plans.push(await prisma.plan.create({
      data: {
        userId: users[2].id,
        planNumber: 'SEED-PREMIUM-001',
        type: 'PREMIUM',
        validityStart: new Date('2023-01-01'),
        validityEnd: new Date('2023-12-31'),
        coverageDetails: {
          network: 'Premium',
          hospital: true,
          emergency: true,
          primaryCare: true,
          specialist: true,
          maternity: true,
          mentalHealth: true,
          prescription: true,
          vision: true,
          dental: true,
          deductible: 250,
          outOfPocketMax: 2500,
          coinsurance: 10
        }
      }
    }));

    return plans;
  } catch (error) {
    logger.error(`Failed to seed sample plans: ${error.message}`);
    throw error;
  }
}

/**
 * Seed sample benefits for testing
 */
async function seedSampleBenefits(
  prisma: SeedPrismaClient,
  plans: any[],
  benefitCategories: string[],
  logger: Logger
): Promise<any[]> {
  try {
    const benefits = [];

    // Benefits for health plan (user 1)
    const healthPlan = plans.find(p => p.planNumber === 'SEED-HEALTH-001');
    if (healthPlan) {
      benefits.push(await prisma.benefit.create({
        data: {
          planId: healthPlan.id,
          type: 'WELLNESS',
          description: 'Annual wellness check-up',
          limitations: 'Once per year',
          usage: 0
        }
      }));

      benefits.push(await prisma.benefit.create({
        data: {
          planId: healthPlan.id,
          type: 'PRIMARY_CARE',
          description: 'Primary care physician visits',
          limitations: '$20 copay per visit',
          usage: 0
        }
      }));

      benefits.push(await prisma.benefit.create({
        data: {
          planId: healthPlan.id,
          type: 'SPECIALIST',
          description: 'Specialist visits',
          limitations: '$40 copay per visit',
          usage: 0
        }
      }));

      benefits.push(await prisma.benefit.create({
        data: {
          planId: healthPlan.id,
          type: 'HOSPITAL',
          description: 'Hospital stay',
          limitations: '$250 per day, up to 5 days',
          usage: 0
        }
      }));

      benefits.push(await prisma.benefit.create({
        data: {
          planId: healthPlan.id,
          type: 'PRESCRIPTION',
          description: 'Prescription drugs',
          limitations: 'Tier 1: $10, Tier 2: $30, Tier 3: $50',
          usage: 0
        }
      }));

      benefits.push(await prisma.benefit.create({
        data: {
          planId: healthPlan.id,
          type: 'GYM',
          description: 'Gym membership discount',
          limitations: 'Up to $50 per month',
          usage: 0
        }
      }));
    }

    // Benefits for dental plan (user 1)
    const dentalPlan = plans.find(p => p.planNumber === 'SEED-DENTAL-001');
    if (dentalPlan) {
      benefits.push(await prisma.benefit.create({
        data: {
          planId: dentalPlan.id,
          type: 'PREVENTIVE',
          description: 'Preventive dental care',
          limitations: 'Covered at 100%, no deductible',
          usage: 0
        }
      }));

      benefits.push(await prisma.benefit.create({
        data: {
          planId: dentalPlan.id,
          type: 'BASIC_DENTAL',
          description: 'Basic dental procedures',
          limitations: 'Covered at 80% after deductible',
          usage: 0
        }
      }));

      benefits.push(await prisma.benefit.create({
        data: {
          planId: dentalPlan.id,
          type: 'MAJOR_DENTAL',
          description: 'Major dental procedures',
          limitations: 'Covered at 50% after deductible',
          usage: 0
        }
      }));
    }

    // Benefits for vision plan (user 1)
    const visionPlan = plans.find(p => p.planNumber === 'SEED-VISION-001');
    if (visionPlan) {
      benefits.push(await prisma.benefit.create({
        data: {
          planId: visionPlan.id,
          type: 'VISION_EXAM',
          description: 'Eye examination',
          limitations: 'One exam per year, $10 copay',
          usage: 0
        }
      }));

      benefits.push(await prisma.benefit.create({
        data: {
          planId: visionPlan.id,
          type: 'FRAMES',
          description: 'Eyeglass frames',
          limitations: 'Up to $150 allowance every 24 months',
          usage: 0
        }
      }));

      benefits.push(await prisma.benefit.create({
        data: {
          planId: visionPlan.id,
          type: 'LENSES',
          description: 'Eyeglass lenses',
          limitations: 'Standard lenses covered in full once per year',
          usage: 0
        }
      }));

      benefits.push(await prisma.benefit.create({
        data: {
          planId: visionPlan.id,
          type: 'CONTACTS',
          description: 'Contact lenses',
          limitations: 'Up to $150 allowance per year in lieu of glasses',
          usage: 0
        }
      }));
    }

    // Benefits for basic health plan (user 2)
    const basicHealthPlan = plans.find(p => p.planNumber === 'SEED-HEALTH-002');
    if (basicHealthPlan) {
      benefits.push(await prisma.benefit.create({
        data: {
          planId: basicHealthPlan.id,
          type: 'WELLNESS',
          description: 'Annual wellness check-up',
          limitations: 'Once per year',
          usage: 0
        }
      }));

      benefits.push(await prisma.benefit.create({
        data: {
          planId: basicHealthPlan.id,
          type: 'PRIMARY_CARE',
          description: 'Primary care physician visits',
          limitations: '$30 copay per visit',
          usage: 0
        }
      }));

      benefits.push(await prisma.benefit.create({
        data: {
          planId: basicHealthPlan.id,
          type: 'EMERGENCY',
          description: 'Emergency room visits',
          limitations: '$250 copay, waived if admitted',
          usage: 0
        }
      }));
    }

    // Benefits for premium plan (user 3)
    const premiumPlan = plans.find(p => p.planNumber === 'SEED-PREMIUM-001');
    if (premiumPlan) {
      benefits.push(await prisma.benefit.create({
        data: {
          planId: premiumPlan.id,
          type: 'WELLNESS',
          description: 'Comprehensive wellness program',
          limitations: 'Unlimited access',
          usage: 0
        }
      }));

      benefits.push(await prisma.benefit.create({
        data: {
          planId: premiumPlan.id,
          type: 'TELEHEALTH',
          description: '24/7 telehealth services',
          limitations: 'No copay, unlimited access',
          usage: 0
        }
      }));

      benefits.push(await prisma.benefit.create({
        data: {
          planId: premiumPlan.id,
          type: 'ALTERNATIVE',
          description: 'Alternative medicine coverage',
          limitations: 'Up to 20 visits per year combined',
          usage: 0
        }
      }));

      benefits.push(await prisma.benefit.create({
        data: {
          planId: premiumPlan.id,
          type: 'NUTRITION',
          description: 'Nutritionist consultations',
          limitations: 'Up to 6 visits per year',
          usage: 0
        }
      }));
    }

    return benefits;
  } catch (error) {
    logger.error(`Failed to seed sample benefits: ${error.message}`);
    throw error;
  }
}

/**
 * Seed sample claims for testing
 */
async function seedSampleClaims(prisma: SeedPrismaClient, plans: any[], logger: Logger): Promise<any[]> {
  try {
    const claims = [];
    const claimStatuses = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DENIED', 'PAID'];
    const claimTypes = ['MEDICAL_VISIT', 'PRESCRIPTION', 'HOSPITAL', 'DENTAL', 'VISION', 'EMERGENCY'];

    // Claims for health plan (user 1)
    const healthPlan = plans.find(p => p.planNumber === 'SEED-HEALTH-001');
    if (healthPlan) {
      // Approved claim
      claims.push(await prisma.claim.create({
        data: {
          planId: healthPlan.id,
          userId: healthPlan.userId,
          type: 'MEDICAL_VISIT',
          amount: 150.00,
          status: 'APPROVED',
          providerName: 'Dr. Smith Medical Group',
          procedureCode: 'E0101',
          diagnosisCode: 'J00',
          notes: 'Annual physical examination',
          submittedAt: new Date('2023-03-15'),
          processedAt: new Date('2023-03-20')
        }
      }));

      // Paid claim
      claims.push(await prisma.claim.create({
        data: {
          planId: healthPlan.id,
          userId: healthPlan.userId,
          type: 'PRESCRIPTION',
          amount: 75.50,
          status: 'PAID',
          providerName: 'Central Pharmacy',
          procedureCode: 'P0201',
          diagnosisCode: 'E11',
          notes: 'Monthly medication',
          submittedAt: new Date('2023-02-10'),
          processedAt: new Date('2023-02-15')
        }
      }));

      // Denied claim
      claims.push(await prisma.claim.create({
        data: {
          planId: healthPlan.id,
          userId: healthPlan.userId,
          type: 'HOSPITAL',
          amount: 2500.00,
          status: 'DENIED',
          providerName: 'City Hospital',
          procedureCode: 'H0301',
          diagnosisCode: 'S06',
          notes: 'Emergency room visit - out of network',
          submittedAt: new Date('2023-04-05'),
          processedAt: new Date('2023-04-12')
        }
      }));

      // Draft claim
      claims.push(await prisma.claim.create({
        data: {
          planId: healthPlan.id,
          userId: healthPlan.userId,
          type: 'MEDICAL_VISIT',
          amount: 200.00,
          status: 'DRAFT',
          providerName: 'Specialist Clinic',
          procedureCode: 'S0401',
          diagnosisCode: 'M54',
          notes: 'Specialist consultation',
          submittedAt: null,
          processedAt: null
        }
      }));
    }

    // Claims for dental plan (user 1)
    const dentalPlan = plans.find(p => p.planNumber === 'SEED-DENTAL-001');
    if (dentalPlan) {
      // Approved claim
      claims.push(await prisma.claim.create({
        data: {
          planId: dentalPlan.id,
          userId: dentalPlan.userId,
          type: 'DENTAL',
          amount: 120.00,
          status: 'APPROVED',
          providerName: 'Smile Dental Care',
          procedureCode: 'D0120',
          diagnosisCode: 'K02',
          notes: 'Routine cleaning and examination',
          submittedAt: new Date('2023-05-20'),
          processedAt: new Date('2023-05-25')
        }
      }));

      // Under review claim
      claims.push(await prisma.claim.create({
        data: {
          planId: dentalPlan.id,
          userId: dentalPlan.userId,
          type: 'DENTAL',
          amount: 850.00,
          status: 'UNDER_REVIEW',
          providerName: 'Smile Dental Care',
          procedureCode: 'D2740',
          diagnosisCode: 'K08',
          notes: 'Crown procedure',
          submittedAt: new Date('2023-06-10'),
          processedAt: null
        }
      }));
    }

    // Claims for premium plan (user 3)
    const premiumPlan = plans.find(p => p.planNumber === 'SEED-PREMIUM-001');
    if (premiumPlan) {
      // Approved claim
      claims.push(await prisma.claim.create({
        data: {
          planId: premiumPlan.id,
          userId: premiumPlan.userId,
          type: 'MEDICAL_VISIT',
          amount: 300.00,
          status: 'APPROVED',
          providerName: 'Premium Health Partners',
          procedureCode: 'E0201',
          diagnosisCode: 'I10',
          notes: 'Comprehensive health assessment',
          submittedAt: new Date('2023-03-01'),
          processedAt: new Date('2023-03-03')
        }
      }));

      // Paid claim
      claims.push(await prisma.claim.create({
        data: {
          planId: premiumPlan.id,
          userId: premiumPlan.userId,
          type: 'PRESCRIPTION',
          amount: 150.00,
          status: 'PAID',
          providerName: 'Premium Pharmacy',
          procedureCode: 'P0301',
          diagnosisCode: 'J45',
          notes: 'Specialty medication',
          submittedAt: new Date('2023-04-15'),
          processedAt: new Date('2023-04-17')
        }
      }));
    }

    return claims;
  } catch (error) {
    logger.error(`Failed to seed sample claims: ${error.message}`);
    throw error;
  }
}

// Execute the main function
main()
  .catch((e) => {
    console.error('Seed script failed:', e);
    process.exit(1);
  })
  .finally(() => {
    // Script completed
    console.log('Seed script execution completed');
  });