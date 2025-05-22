/**
 * @file Core Seed Functions
 * 
 * Contains seed functions for core data that is shared across all journeys,
 * including permissions, roles, and users.
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { TestSeedOptions, prefixTestData, getCountByVolume, handleSeedError } from './types';

/**
 * Seeds core data (permissions, roles, users) for all journeys.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
export async function seedCoreData(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  try {
    // Create permissions
    if (options.logging) {
      console.log('Creating test permissions...');
    }
    await seedTestPermissions(prisma, options);
    
    // Create roles
    if (options.logging) {
      console.log('Creating test roles...');
    }
    await seedTestRoles(prisma, options);
    
    // Create users
    if (options.logging) {
      console.log('Creating test users...');
    }
    await seedTestUsers(prisma, options);
  } catch (error) {
    if (options.errorHandling === 'throw') {
      throw error;
    } else if (options.errorHandling === 'log') {
      console.error('Error seeding core data:', error);
    }
  }
}

/**
 * Seeds test permissions for all journeys.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
export async function seedTestPermissions(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  // Health journey permissions
  const healthPermissions = [
    { name: prefixTestData('health:metrics:read', options), description: 'View health metrics' },
    { name: prefixTestData('health:metrics:write', options), description: 'Record health metrics' },
    { name: prefixTestData('health:history:read', options), description: 'View medical history' },
    { name: prefixTestData('health:history:write', options), description: 'Update medical history' },
    { name: prefixTestData('health:goals:read', options), description: 'View health goals' },
    { name: prefixTestData('health:goals:write', options), description: 'Set health goals' },
    { name: prefixTestData('health:devices:read', options), description: 'View connected devices' },
    { name: prefixTestData('health:devices:write', options), description: 'Manage device connections' },
  ];
  
  // Care journey permissions
  const carePermissions = [
    { name: prefixTestData('care:appointments:read', options), description: 'View appointments' },
    { name: prefixTestData('care:appointments:write', options), description: 'Manage appointments' },
    { name: prefixTestData('care:telemedicine:read', options), description: 'View telemedicine sessions' },
    { name: prefixTestData('care:telemedicine:write', options), description: 'Manage telemedicine sessions' },
    { name: prefixTestData('care:medications:read', options), description: 'View medications' },
    { name: prefixTestData('care:medications:write', options), description: 'Manage medications' },
    { name: prefixTestData('care:treatments:read', options), description: 'View treatment plans' },
    { name: prefixTestData('care:treatments:write', options), description: 'Manage treatment plans' },
  ];
  
  // Plan journey permissions
  const planPermissions = [
    { name: prefixTestData('plan:coverage:read', options), description: 'View coverage information' },
    { name: prefixTestData('plan:claims:read', options), description: 'View claims' },
    { name: prefixTestData('plan:claims:write', options), description: 'Submit and manage claims' },
    { name: prefixTestData('plan:benefits:read', options), description: 'View benefits' },
    { name: prefixTestData('plan:documents:read', options), description: 'View insurance documents' },
    { name: prefixTestData('plan:documents:write', options), description: 'Upload insurance documents' },
    { name: prefixTestData('plan:payments:read', options), description: 'View payment information' },
    { name: prefixTestData('plan:simulator:use', options), description: 'Use cost simulator' },
  ];
  
  // Gamification permissions
  const gamificationPermissions = [
    { name: prefixTestData('game:achievements:read', options), description: 'View achievements' },
    { name: prefixTestData('game:progress:read', options), description: 'View progress' },
    { name: prefixTestData('game:rewards:read', options), description: 'View rewards' },
    { name: prefixTestData('game:rewards:redeem', options), description: 'Redeem rewards' },
    { name: prefixTestData('game:leaderboard:read', options), description: 'View leaderboards' },
  ];
  
  // Filter permissions based on selected journeys
  let allPermissions = [];
  
  if (options.journeys?.includes('health')) {
    allPermissions = [...allPermissions, ...healthPermissions];
  }
  
  if (options.journeys?.includes('care')) {
    allPermissions = [...allPermissions, ...carePermissions];
  }
  
  if (options.journeys?.includes('plan')) {
    allPermissions = [...allPermissions, ...planPermissions];
  }
  
  if (options.journeys?.includes('gamification')) {
    allPermissions = [...allPermissions, ...gamificationPermissions];
  }
  
  // Create all permissions in the database
  for (const permission of allPermissions) {
    try {
      // Try to create the permission, ignore if it already exists
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
    } catch (error) {
      // If creation fails due to unique constraint, just log and continue
      if (error.code === 'P2002') {
        if (options.logging) {
          console.log(`Permission ${permission.name} already exists, skipping...`);
        }
      } else {
        // For other errors, handle based on error handling strategy
        if (options.errorHandling === 'throw') {
          throw error;
        } else if (options.errorHandling === 'log') {
          console.error(`Error creating permission ${permission.name}:`, error);
        }
      }
    }
  }
}

/**
 * Seeds test roles and assigns permissions to them.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
export async function seedTestRoles(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  // Get all permissions
  const permissions = await prisma.permission.findMany();
  const permissionsByName = new Map();
  
  // Create a map of permission names to IDs
  permissions.forEach(permission => {
    permissionsByName.set(permission.name, permission);
  });
  
  // Define roles with their permissions
  const roles = [
    {
      name: prefixTestData('User', options),
      description: 'Standard user with access to all journeys',
      isDefault: true,
      journey: null,
      permissions: permissions
        .filter(p => !p.name.includes('ADMIN'))
        .map(p => p.name),
    },
    {
      name: prefixTestData('Caregiver', options),
      description: 'User with delegated access to another user\'s health data',
      isDefault: false,
      journey: null,
      permissions: permissions
        .filter(p => p.name.includes('health:') || p.name.includes('care:'))
        .filter(p => p.name.includes(':read'))
        .map(p => p.name),
    },
    {
      name: prefixTestData('Provider', options),
      description: 'Healthcare provider with access to patient data',
      isDefault: false,
      journey: 'care',
      permissions: permissions
        .filter(p => p.name.includes('health:') || p.name.includes('care:'))
        .map(p => p.name),
    },
    {
      name: prefixTestData('Administrator', options),
      description: 'System administrator with full access',
      isDefault: false,
      journey: null,
      permissions: permissions.map(p => p.name), // All permissions
    },
  ];
  
  // Create roles and assign permissions
  for (const role of roles) {
    try {
      const { permissions: permissionNames, ...roleData } = role;
      
      // Create the role
      const createdRole = await prisma.role.upsert({
        where: { name: roleData.name },
        update: roleData,
        create: roleData,
      });
      
      // Get valid permissions to connect
      const permissionConnections = [];
      for (const name of permissionNames) {
        const permission = permissionsByName.get(name);
        if (permission) {
          permissionConnections.push({ id: permission.id });
        } else if (options.logging) {
          console.warn(`Permission not found: ${name}`);
        }
      }
      
      // Connect permissions to the role
      if (permissionConnections.length > 0) {
        await prisma.role.update({
          where: { id: createdRole.id },
          data: {
            permissions: {
              connect: permissionConnections,
            },
          },
        });
      }
      
      if (options.logging) {
        console.log(`Created test role: ${roleData.name} with ${permissionConnections.length} permissions`);
      }
    } catch (error) {
      if (options.errorHandling === 'throw') {
        throw error;
      } else if (options.errorHandling === 'log') {
        console.error(`Error creating role:`, error);
      }
    }
  }
}

/**
 * Seeds test users with different roles.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Test seed options
 */
export async function seedTestUsers(prisma: PrismaClient, options: TestSeedOptions): Promise<void> {
  try {
    // Determine number of users to create based on data volume
    const userCount = getUserCountByVolume(options.dataVolume);
    
    // Create admin user
    const adminPassword = await bcrypt.hash('TestPassword123!', 10);
    const adminUser = await prisma.user.create({
      data: {
        name: prefixTestData('Admin User', options),
        email: prefixTestData('admin@test.com', options),
        password: adminPassword,
        phone: '+5511999999999',
        cpf: '12345678901',
      },
    });
    
    // Get the admin role
    const adminRole = await prisma.role.findFirst({
      where: { name: { contains: 'Administrator' } },
    });
    
    if (adminRole) {
      // Assign admin role to admin user
      await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          roles: {
            connect: { id: adminRole.id },
          },
        },
      });
      if (options.logging) {
        console.log(`Created test admin user: ${adminUser.email} with Administrator role`);
      }
    }
    
    // Create regular test users
    const userPassword = await bcrypt.hash('TestPassword123!', 10);
    const userRole = await prisma.role.findFirst({
      where: { isDefault: true },
    });
    
    // Create additional test users based on volume
    for (let i = 1; i <= userCount; i++) {
      const testUser = await prisma.user.create({
        data: {
          name: prefixTestData(`Test User ${i}`, options),
          email: prefixTestData(`user${i}@test.com`, options),
          password: userPassword,
          phone: `+551188888888${i.toString().padStart(2, '0')}`,
          cpf: `9876543210${i.toString().padStart(2, '0')}`,
        },
      });
      
      if (userRole) {
        // Assign user role to test user
        await prisma.user.update({
          where: { id: testUser.id },
          data: {
            roles: {
              connect: { id: userRole.id },
            },
          },
        });
      }
    }
    
    if (options.logging) {
      console.log(`Created ${userCount} test users with default role`);
    }
  } catch (error) {
    if (options.errorHandling === 'throw') {
      throw error;
    } else if (options.errorHandling === 'log') {
      console.error(`Error creating users:`, error);
    }
  }
}

/**
 * Gets the number of users to create based on data volume.
 * 
 * @param dataVolume - The data volume option
 * @returns The number of users to create
 */
function getUserCountByVolume(dataVolume: 'small' | 'medium' | 'large'): number {
  return getCountByVolume(dataVolume, 2, 10, 50);
}