/**
 * Database seeding script for the plan-service
 * 
 * This script populates the database with initial plan types, benefit categories,
 * and sample data needed for testing and development. It ensures consistent setup
 * across development environments and provides sample data for testing the claims
 * process and benefit calculations.
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';

// Create a logger instance for the seed script
const logger = new Logger('PlanServiceSeed');

// Create a Prisma client instance with logging
const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

// Configure Prisma client logging
prisma.$on('error', (e) => {
  logger.error(`Database error: ${e.message}`, e.target);
});

prisma.$on('warn', (e) => {
  logger.warn(`Database warning: ${e.message}`, e.target);
});

/**
 * Main seed function that orchestrates the seeding process
 */
async function main() {
  logger.log('Starting plan-service database seeding...');
  
  try {
    // Clean up existing data if in development environment
    if (process.env.NODE_ENV !== 'production') {
      await cleanupData();
    }
    
    // Seed plan types
    await seedPlanTypes();
    
    // Seed benefit categories
    await seedBenefitCategories();
    
    // Seed sample data for development and testing
    if (process.env.NODE_ENV !== 'production') {
      await seedSampleData();
    }
    
    logger.log('Plan-service database seeding completed successfully');
  } catch (error) {
    logger.error(`Error seeding database: ${error.message}`, error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Cleans up existing data to ensure a fresh seed
 * Only used in development environments
 */
async function cleanupData() {
  logger.log('Cleaning up existing data...');
  
  try {
    // Delete in reverse order of dependencies
    await prisma.claim.deleteMany({});
    await prisma.benefit.deleteMany({});
    await prisma.plan.deleteMany({});
    
    logger.log('Data cleanup completed');
  } catch (error) {
    logger.error(`Error during data cleanup: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Seeds the standard plan types used across the application
 */
async function seedPlanTypes() {
  logger.log('Seeding plan types...');
  
  const planTypes = [
    { code: 'HEALTH', name: 'Health Insurance', description: 'Comprehensive health insurance plan' },
    { code: 'DENTAL', name: 'Dental Insurance', description: 'Dental care coverage plan' },
    { code: 'VISION', name: 'Vision Insurance', description: 'Vision care coverage plan' },
    { code: 'LIFE', name: 'Life Insurance', description: 'Life insurance coverage' },
    { code: 'DISABILITY', name: 'Disability Insurance', description: 'Short and long-term disability coverage' },
  ];
  
  try {
    // Use upsert to ensure idempotent operation
    for (const planType of planTypes) {
      await prisma.planType.upsert({
        where: { code: planType.code },
        update: planType,
        create: planType,
      });
    }
    
    logger.log(`Seeded ${planTypes.length} plan types`);
  } catch (error) {
    logger.error(`Error seeding plan types: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Seeds the standard benefit categories used across the application
 */
async function seedBenefitCategories() {
  logger.log('Seeding benefit categories...');
  
  const benefitCategories = [
    { code: 'PREVENTIVE', name: 'Preventive Care', description: 'Routine check-ups and preventive services' },
    { code: 'EMERGENCY', name: 'Emergency Care', description: 'Emergency room and urgent care services' },
    { code: 'HOSPITAL', name: 'Hospital Services', description: 'Inpatient and outpatient hospital services' },
    { code: 'PRESCRIPTION', name: 'Prescription Drugs', description: 'Prescription medication coverage' },
    { code: 'SPECIALIST', name: 'Specialist Visits', description: 'Specialist physician consultations' },
    { code: 'MENTAL_HEALTH', name: 'Mental Health', description: 'Mental health and substance abuse services' },
    { code: 'MATERNITY', name: 'Maternity Care', description: 'Pregnancy and childbirth services' },
    { code: 'PEDIATRIC', name: 'Pediatric Care', description: 'Healthcare services for children' },
    { code: 'REHABILITATION', name: 'Rehabilitation', description: 'Physical, occupational, and speech therapy' },
    { code: 'WELLNESS', name: 'Wellness Programs', description: 'Health and wellness programs and incentives' },
    { code: 'DENTAL_BASIC', name: 'Basic Dental', description: 'Basic dental procedures like cleanings and fillings' },
    { code: 'DENTAL_MAJOR', name: 'Major Dental', description: 'Major dental procedures like crowns and bridges' },
    { code: 'VISION_EXAM', name: 'Vision Exams', description: 'Routine eye examinations' },
    { code: 'VISION_HARDWARE', name: 'Vision Hardware', description: 'Glasses, contacts, and other vision hardware' },
  ];
  
  try {
    // Use upsert to ensure idempotent operation
    for (const category of benefitCategories) {
      await prisma.benefitCategory.upsert({
        where: { code: category.code },
        update: category,
        create: category,
      });
    }
    
    logger.log(`Seeded ${benefitCategories.length} benefit categories`);
  } catch (error) {
    logger.error(`Error seeding benefit categories: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Seeds sample data for development and testing purposes
 * This includes sample users, plans, benefits, and claims
 */
async function seedSampleData() {
  logger.log('Seeding sample data for development and testing...');
  
  try {
    // Create sample users if they don't exist
    const users = [
      { id: 'sample-user-1', email: 'user1@example.com', name: 'Sample User 1' },
      { id: 'sample-user-2', email: 'user2@example.com', name: 'Sample User 2' },
    ];
    
    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      });
    }
    
    // Create sample plans
    const samplePlans = [
      {
        userId: 'sample-user-1',
        planNumber: 'HEALTH-2023-001',
        type: 'HEALTH',
        validityStart: new Date('2023-01-01'),
        validityEnd: new Date('2023-12-31'),
        coverageDetails: {
          network: 'Premium',
          hospital: true,
          dental: true,
          vision: true,
          pharmacy: true,
        },
      },
      {
        userId: 'sample-user-1',
        planNumber: 'DENTAL-2023-001',
        type: 'DENTAL',
        validityStart: new Date('2023-01-01'),
        validityEnd: new Date('2023-12-31'),
        coverageDetails: {
          network: 'Standard',
          preventive: true,
          basic: true,
          major: false,
          orthodontics: false,
        },
      },
      {
        userId: 'sample-user-2',
        planNumber: 'HEALTH-2023-002',
        type: 'HEALTH',
        validityStart: new Date('2023-01-01'),
        validityEnd: new Date('2023-12-31'),
        coverageDetails: {
          network: 'Standard',
          hospital: true,
          dental: false,
          vision: false,
          pharmacy: true,
        },
      },
    ];
    
    const createdPlans = [];
    
    for (const plan of samplePlans) {
      const createdPlan = await prisma.plan.upsert({
        where: { planNumber: plan.planNumber },
        update: plan,
        create: plan,
      });
      
      createdPlans.push(createdPlan);
    }
    
    // Create sample benefits for the first plan
    const sampleBenefits = [
      {
        planId: createdPlans[0].id,
        type: 'PREVENTIVE',
        description: 'Annual wellness check-up',
        limitations: 'Once per year',
        usage: 0,
      },
      {
        planId: createdPlans[0].id,
        type: 'HOSPITAL',
        description: 'Inpatient hospital stay',
        limitations: 'Up to 30 days per year',
        usage: 0,
      },
      {
        planId: createdPlans[0].id,
        type: 'PRESCRIPTION',
        description: 'Prescription drug coverage',
        limitations: '$10 copay for generic, $30 for brand name',
        usage: 2,
      },
      {
        planId: createdPlans[0].id,
        type: 'WELLNESS',
        description: 'Gym membership discount',
        limitations: 'Up to $50 per month',
        usage: 1,
      },
      {
        planId: createdPlans[1].id,
        type: 'DENTAL_BASIC',
        description: 'Dental cleanings and check-ups',
        limitations: 'Two per year',
        usage: 1,
      },
      {
        planId: createdPlans[1].id,
        type: 'DENTAL_BASIC',
        description: 'Dental X-rays',
        limitations: 'Once per year',
        usage: 0,
      },
    ];
    
    for (const benefit of sampleBenefits) {
      await prisma.benefit.create({
        data: benefit,
      });
    }
    
    // Create sample claims
    const sampleClaims = [
      {
        planId: createdPlans[0].id,
        type: 'MEDICAL_VISIT',
        amount: 150.00,
        status: 'APPROVED',
        submittedAt: new Date('2023-03-15'),
        processedAt: new Date('2023-03-20'),
        providerName: 'Dr. Smith Medical Group',
        notes: 'Routine check-up',
      },
      {
        planId: createdPlans[0].id,
        type: 'PRESCRIPTION',
        amount: 75.50,
        status: 'APPROVED',
        submittedAt: new Date('2023-04-10'),
        processedAt: new Date('2023-04-15'),
        providerName: 'Central Pharmacy',
        notes: 'Monthly medication',
      },
      {
        planId: createdPlans[0].id,
        type: 'EMERGENCY',
        amount: 1200.00,
        status: 'PENDING',
        submittedAt: new Date('2023-05-22'),
        processedAt: null,
        providerName: 'City Emergency Hospital',
        notes: 'Emergency room visit',
      },
      {
        planId: createdPlans[1].id,
        type: 'DENTAL_PROCEDURE',
        amount: 120.00,
        status: 'APPROVED',
        submittedAt: new Date('2023-02-28'),
        processedAt: new Date('2023-03-05'),
        providerName: 'Bright Smile Dental',
        notes: 'Regular cleaning',
      },
    ];
    
    for (const claim of sampleClaims) {
      await prisma.claim.create({
        data: claim,
      });
    }
    
    logger.log(`Seeded ${users.length} users, ${createdPlans.length} plans, ${sampleBenefits.length} benefits, and ${sampleClaims.length} claims`);
  } catch (error) {
    logger.error(`Error seeding sample data: ${error.message}`, error.stack);
    throw error;
  }
}

// Execute the main function
main()
  .catch((e) => {
    logger.error(`Fatal error during seeding: ${e.message}`, e.stack);
    process.exit(1);
  });