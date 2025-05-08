/**
 * Core Seed Module
 * 
 * @file core-seed.ts
 * @description Contains essential seeding functions for core entities (users, roles, permissions)
 * required across all journeys. This file is responsible for establishing the foundational data model
 * for testing, including user authentication, authorization roles, and system-wide permissions.
 * 
 * It's designed to work with the enhanced PrismaService and provides configurable options for
 * different testing scenarios. The module implements transaction management for atomic seed
 * operations, retry mechanisms for handling database connection issues, and improved error
 * classification and reporting for test diagnostics.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma.service';
import { TransactionIsolationLevel } from '../../src/transactions/transaction.interface';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import {
  SeedFunctionParams,
  SeedOptions,
  SeedResult,
  SeedStats,
  PermissionSeedData,
  RoleSeedData,
  UserSeedData,
  JourneyType
} from './types';
import {
  seedLogger,
  withTransaction,
  withRetry,
  safeUpsert,
  safeCreate,
  safeConnect,
  generateUserData,
  generateHashedPassword,
  executeSeedOperation,
  SeedOptions as UtilSeedOptions
} from './utils';

/**
 * Core seed configuration options
 */
export interface CoreSeedOptions extends SeedOptions {
  /** Whether to include admin users */
  includeAdminUsers?: boolean;
  /** Whether to include test users */
  includeTestUsers?: boolean;
  /** Number of additional test users to create */
  additionalTestUsers?: number;
  /** Custom password for test users (will be hashed) */
  testUserPassword?: string;
  /** Transaction isolation level for seed operations */
  isolationLevel?: TransactionIsolationLevel;
  /** Number of retry attempts for failed operations */
  retryAttempts?: number;
}

/**
 * Default core seed options
 */
const DEFAULT_CORE_SEED_OPTIONS: CoreSeedOptions = {
  cleanDatabase: false,
  logging: true,
  includeAdminUsers: true,
  includeTestUsers: true,
  additionalTestUsers: 0,
  testUserPassword: 'Password123!',
  isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
  retryAttempts: 3
};

/**
 * Default permissions for all journeys
 */
const DEFAULT_PERMISSIONS: PermissionSeedData[] = [
  // Health journey permissions
  { name: 'health:metrics:read', description: 'View health metrics', journey: 'health' },
  { name: 'health:metrics:write', description: 'Record health metrics', journey: 'health' },
  { name: 'health:history:read', description: 'View medical history', journey: 'health' },
  { name: 'health:history:write', description: 'Update medical history', journey: 'health' },
  { name: 'health:goals:read', description: 'View health goals', journey: 'health' },
  { name: 'health:goals:write', description: 'Set health goals', journey: 'health' },
  { name: 'health:devices:read', description: 'View connected devices', journey: 'health' },
  { name: 'health:devices:write', description: 'Manage device connections', journey: 'health' },
  
  // Care journey permissions
  { name: 'care:appointments:read', description: 'View appointments', journey: 'care' },
  { name: 'care:appointments:write', description: 'Manage appointments', journey: 'care' },
  { name: 'care:telemedicine:read', description: 'View telemedicine sessions', journey: 'care' },
  { name: 'care:telemedicine:write', description: 'Manage telemedicine sessions', journey: 'care' },
  { name: 'care:medications:read', description: 'View medications', journey: 'care' },
  { name: 'care:medications:write', description: 'Manage medications', journey: 'care' },
  { name: 'care:treatments:read', description: 'View treatment plans', journey: 'care' },
  { name: 'care:treatments:write', description: 'Manage treatment plans', journey: 'care' },
  
  // Plan journey permissions
  { name: 'plan:coverage:read', description: 'View coverage information', journey: 'plan' },
  { name: 'plan:claims:read', description: 'View claims', journey: 'plan' },
  { name: 'plan:claims:write', description: 'Submit and manage claims', journey: 'plan' },
  { name: 'plan:benefits:read', description: 'View benefits', journey: 'plan' },
  { name: 'plan:documents:read', description: 'View insurance documents', journey: 'plan' },
  { name: 'plan:documents:write', description: 'Upload insurance documents', journey: 'plan' },
  { name: 'plan:payments:read', description: 'View payment information', journey: 'plan' },
  { name: 'plan:simulator:use', description: 'Use cost simulator', journey: 'plan' },
  
  // Gamification permissions
  { name: 'game:achievements:read', description: 'View achievements', journey: null },
  { name: 'game:progress:read', description: 'View progress', journey: null },
  { name: 'game:rewards:read', description: 'View rewards', journey: null },
  { name: 'game:rewards:redeem', description: 'Redeem rewards', journey: null },
  { name: 'game:leaderboard:read', description: 'View leaderboards', journey: null },
];

/**
 * Default roles with their permissions
 */
const DEFAULT_ROLES: RoleSeedData[] = [
  {
    name: 'User',
    description: 'Standard user with access to all journeys',
    isDefault: true,
    journey: null,
    permissions: [
      // Health journey - basic access
      'health:metrics:read',
      'health:metrics:write',
      'health:history:read',
      'health:goals:read',
      'health:goals:write',
      'health:devices:read',
      'health:devices:write',
      
      // Care journey - basic access
      'care:appointments:read',
      'care:appointments:write',
      'care:telemedicine:read',
      'care:telemedicine:write',
      'care:medications:read',
      'care:medications:write',
      'care:treatments:read',
      
      // Plan journey - basic access
      'plan:coverage:read',
      'plan:claims:read',
      'plan:claims:write',
      'plan:benefits:read',
      'plan:documents:read',
      'plan:documents:write',
      'plan:payments:read',
      'plan:simulator:use',
      
      // Gamification
      'game:achievements:read',
      'game:progress:read',
      'game:rewards:read',
      'game:rewards:redeem',
      'game:leaderboard:read',
    ],
  },
  {
    name: 'Caregiver',
    description: 'User with delegated access to another user\'s health data',
    isDefault: false,
    journey: null,
    permissions: [
      'health:metrics:read',
      'health:history:read',
      'health:goals:read',
      'care:appointments:read',
      'care:appointments:write',
      'care:medications:read',
      'care:treatments:read',
    ],
  },
  {
    name: 'Provider',
    description: 'Healthcare provider with access to patient data',
    isDefault: false,
    journey: 'care',
    permissions: [
      'health:metrics:read',
      'health:history:read',
      'health:history:write',
      'care:appointments:read',
      'care:appointments:write',
      'care:telemedicine:read',
      'care:telemedicine:write',
      'care:medications:read',
      'care:medications:write',
      'care:treatments:read',
      'care:treatments:write',
    ],
  },
  {
    name: 'Administrator',
    description: 'System administrator with full access',
    isDefault: false,
    journey: null,
    permissions: DEFAULT_PERMISSIONS.map(p => p.name),
  },
];

/**
 * Default users for testing
 */
const DEFAULT_USERS: UserSeedData[] = [
  {
    name: 'Admin User',
    email: 'admin@austa.com.br',
    password: 'Password123!',
    phone: '+5511999999999',
    cpf: '12345678901',
    roles: ['Administrator']
  },
  {
    name: 'Test User',
    email: 'user@austa.com.br',
    password: 'Password123!',
    phone: '+5511888888888',
    cpf: '98765432109',
    roles: ['User']
  },
  {
    name: 'Provider User',
    email: 'provider@austa.com.br',
    password: 'Password123!',
    phone: '+5511777777777',
    cpf: '45678912301',
    roles: ['Provider']
  },
  {
    name: 'Caregiver User',
    email: 'caregiver@austa.com.br',
    password: 'Password123!',
    phone: '+5511666666666',
    cpf: '78912345601',
    roles: ['Caregiver']
  }
];

/**
 * Converts CoreSeedOptions to UtilSeedOptions for use with utility functions
 */
function toUtilOptions(options: CoreSeedOptions): UtilSeedOptions {
  return {
    useTransaction: true,
    isolationLevel: options.isolationLevel,
    logging: options.logging,
    retryAttempts: options.retryAttempts,
    throwOnError: true,
    journeyContext: 'core'
  };
}

/**
 * Seeds permissions for all journeys
 * 
 * @param params Seed function parameters
 * @param permissions Permissions to seed (defaults to DEFAULT_PERMISSIONS)
 * @returns Seed result with statistics
 */
export async function seedPermissions(
  params: SeedFunctionParams,
  permissions: PermissionSeedData[] = DEFAULT_PERMISSIONS
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const opts = { ...DEFAULT_CORE_SEED_OPTIONS, ...options };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  const stats: SeedStats = {
    created: {},
    updated: {},
    skipped: {},
    timeTakenMs: 0
  };
  
  logger.info(`Seeding ${permissions.length} permissions...`);
  
  const [result, executionTime] = await executeSeedOperation('seedPermissions', async () => {
    return withTransaction(prisma, async (tx) => {
      stats.created['permission'] = 0;
      stats.updated['permission'] = 0;
      stats.skipped['permission'] = 0;
      
      for (const permission of permissions) {
        try {
          // Use withRetry to handle transient errors
          await withRetry(async () => {
            const result = await safeUpsert(
              tx,
              'permission',
              { name: permission.name },
              permission,
              {},
              toUtilOptions(opts)
            );
            
            if (result) {
              if (result.createdAt === result.updatedAt) {
                stats.created['permission']++;
              } else {
                stats.updated['permission']++;
              }
            }
          }, toUtilOptions(opts));
        } catch (error) {
          // If creation fails due to unique constraint, just log and continue
          if (error instanceof DatabaseException && 
              error.type === DatabaseErrorType.CONSTRAINT) {
            logger.warn(`Permission ${permission.name} already exists, skipping...`);
            stats.skipped['permission']++;
          } else {
            // For other errors, re-throw
            throw error;
          }
        }
      }
      
      return stats;
    }, toUtilOptions(opts));
  }, toUtilOptions(opts));
  
  stats.timeTakenMs = executionTime;
  
  logger.info(`Permissions seeding completed: ${stats.created['permission']} created, ${stats.updated['permission']} updated, ${stats.skipped['permission']} skipped`);
  
  return {
    success: true,
    stats
  };
}

/**
 * Seeds roles and assigns permissions to them
 * 
 * @param params Seed function parameters
 * @param roles Roles to seed (defaults to DEFAULT_ROLES)
 * @returns Seed result with statistics
 */
export async function seedRoles(
  params: SeedFunctionParams,
  roles: RoleSeedData[] = DEFAULT_ROLES
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const opts = { ...DEFAULT_CORE_SEED_OPTIONS, ...options };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  const stats: SeedStats = {
    created: {},
    updated: {},
    skipped: {},
    timeTakenMs: 0
  };
  
  logger.info(`Seeding ${roles.length} roles...`);
  
  const [result, executionTime] = await executeSeedOperation('seedRoles', async () => {
    return withTransaction(prisma, async (tx) => {
      // Get all permissions
      const permissions = await tx.permission.findMany();
      const permissionsByName = new Map();
      
      // Create a map of permission names to IDs
      permissions.forEach(permission => {
        permissionsByName.set(permission.name, permission);
      });
      
      stats.created['role'] = 0;
      stats.updated['role'] = 0;
      stats.skipped['role'] = 0;
      
      for (const role of roles) {
        try {
          // Use withRetry to handle transient errors
          await withRetry(async () => {
            const { permissions: permissionNames, ...roleData } = role;
            
            // Create the role
            const createdRole = await safeUpsert(
              tx,
              'role',
              { name: roleData.name },
              roleData,
              roleData,
              toUtilOptions(opts)
            );
            
            if (createdRole) {
              if (createdRole.createdAt === createdRole.updatedAt) {
                stats.created['role']++;
              } else {
                stats.updated['role']++;
              }
              
              // Get valid permissions to connect
              const permissionConnections = [];
              for (const name of permissionNames) {
                const permission = permissionsByName.get(name);
                if (permission) {
                  permissionConnections.push({ id: permission.id });
                } else {
                  logger.warn(`Permission not found: ${name}`);
                }
              }
              
              // Connect permissions to the role
              if (permissionConnections.length > 0) {
                await tx.role.update({
                  where: { id: createdRole.id },
                  data: {
                    permissions: {
                      connect: permissionConnections,
                    },
                  },
                });
              }
              
              logger.debug(`Created/updated role: ${roleData.name} with ${permissionConnections.length} permissions`);
            }
          }, toUtilOptions(opts));
        } catch (error) {
          logger.error(`Error creating role ${role.name}:`, error);
          stats.skipped['role']++;
          
          // Only re-throw if we're configured to do so
          if (opts.throwOnError) {
            throw error;
          }
        }
      }
      
      return stats;
    }, toUtilOptions(opts));
  }, toUtilOptions(opts));
  
  stats.timeTakenMs = executionTime;
  
  logger.info(`Roles seeding completed: ${stats.created['role']} created, ${stats.updated['role']} updated, ${stats.skipped['role']} skipped`);
  
  return {
    success: true,
    stats
  };
}

/**
 * Seeds default users and assigns roles to them
 * 
 * @param params Seed function parameters
 * @param users Users to seed (defaults to DEFAULT_USERS)
 * @returns Seed result with statistics
 */
export async function seedUsers(
  params: SeedFunctionParams,
  users: UserSeedData[] = DEFAULT_USERS
): Promise<SeedResult> {
  const { prisma, options = {} } = params;
  const opts = { ...DEFAULT_CORE_SEED_OPTIONS, ...options };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  const stats: SeedStats = {
    created: {},
    updated: {},
    skipped: {},
    timeTakenMs: 0
  };
  
  // Filter users based on options
  let usersToSeed = [...users];
  
  if (!opts.includeAdminUsers) {
    usersToSeed = usersToSeed.filter(user => 
      !user.roles?.includes('Administrator'));
  }
  
  if (!opts.includeTestUsers) {
    usersToSeed = usersToSeed.filter(user => 
      user.roles?.includes('Administrator'));
  }
  
  logger.info(`Seeding ${usersToSeed.length} users...`);
  
  const [result, executionTime] = await executeSeedOperation('seedUsers', async () => {
    return withTransaction(prisma, async (tx) => {
      // Get all roles
      const roles = await tx.role.findMany();
      const rolesByName = new Map();
      
      // Create a map of role names to IDs
      roles.forEach(role => {
        rolesByName.set(role.name, role);
      });
      
      stats.created['user'] = 0;
      stats.updated['user'] = 0;
      stats.skipped['user'] = 0;
      
      // Process each user
      for (const userData of usersToSeed) {
        try {
          // Use withRetry to handle transient errors
          await withRetry(async () => {
            const { roles: roleNames, password, ...userDataWithoutRoles } = userData;
            
            // Hash the password
            const hashedPassword = await generateHashedPassword(password || opts.testUserPassword);
            
            // Create or update the user
            const user = await safeUpsert(
              tx,
              'user',
              { email: userData.email },
              { ...userDataWithoutRoles, password: hashedPassword, isTestData: true },
              { ...userDataWithoutRoles, password: hashedPassword },
              toUtilOptions(opts)
            );
            
            if (user) {
              if (user.createdAt === user.updatedAt) {
                stats.created['user']++;
              } else {
                stats.updated['user']++;
              }
              
              // Connect roles if specified
              if (roleNames && roleNames.length > 0) {
                const roleConnections = [];
                
                for (const name of roleNames) {
                  const role = rolesByName.get(name);
                  if (role) {
                    roleConnections.push({ id: role.id });
                  } else {
                    logger.warn(`Role not found: ${name}`);
                  }
                }
                
                if (roleConnections.length > 0) {
                  await tx.user.update({
                    where: { id: user.id },
                    data: {
                      roles: {
                        connect: roleConnections,
                      },
                    },
                  });
                }
                
                logger.debug(`Created/updated user: ${userData.email} with ${roleConnections.length} roles`);
              }
            }
          }, toUtilOptions(opts));
        } catch (error) {
          logger.error(`Error creating user ${userData.email}:`, error);
          stats.skipped['user']++;
          
          // Only re-throw if we're configured to do so
          if (opts.throwOnError) {
            throw error;
          }
        }
      }
      
      // Create additional test users if requested
      if (opts.additionalTestUsers > 0) {
        logger.info(`Creating ${opts.additionalTestUsers} additional test users...`);
        
        // Get the default user role
        const defaultRole = await tx.role.findFirst({
          where: { isDefault: true },
        });
        
        if (!defaultRole) {
          logger.warn('No default role found for additional test users');
        }
        
        for (let i = 0; i < opts.additionalTestUsers; i++) {
          try {
            // Generate random user data
            const testUserData = generateUserData(`test-user-${i}`, {
              name: `Test User ${i + 1}`,
              email: `test-user-${i + 1}@austa.com.br`,
              isTestData: true
            });
            
            // Hash the password
            const hashedPassword = await generateHashedPassword(opts.testUserPassword);
            
            // Create the user
            const user = await safeCreate(
              tx,
              'user',
              { email: testUserData.email },
              { ...testUserData, password: hashedPassword },
              toUtilOptions(opts)
            );
            
            if (user) {
              stats.created['user']++;
              
              // Connect default role if available
              if (defaultRole) {
                await tx.user.update({
                  where: { id: user.id },
                  data: {
                    roles: {
                      connect: { id: defaultRole.id },
                    },
                  },
                });
                
                logger.debug(`Created test user: ${testUserData.email} with default role`);
              } else {
                logger.debug(`Created test user: ${testUserData.email} without role`);
              }
            }
          } catch (error) {
            logger.error(`Error creating additional test user ${i + 1}:`, error);
            stats.skipped['user']++;
            
            // Continue with the next user even if this one fails
            continue;
          }
        }
      }
      
      return stats;
    }, toUtilOptions(opts));
  }, toUtilOptions(opts));
  
  stats.timeTakenMs = executionTime;
  
  logger.info(`Users seeding completed: ${stats.created['user']} created, ${stats.updated['user']} updated, ${stats.skipped['user']} skipped`);
  
  return {
    success: true,
    stats
  };
}

/**
 * Seeds all core entities (permissions, roles, users)
 * 
 * @param params Seed function parameters
 * @param options Core seed options
 * @returns Seed result with statistics
 */
export async function seedCoreEntities(
  params: SeedFunctionParams,
  options: CoreSeedOptions = DEFAULT_CORE_SEED_OPTIONS
): Promise<SeedResult> {
  const { prisma } = params;
  const opts = { ...DEFAULT_CORE_SEED_OPTIONS, ...options };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  const combinedStats: SeedStats = {
    created: {},
    updated: {},
    skipped: {},
    timeTakenMs: 0
  };
  
  logger.info('Starting core entities seeding...');
  
  const startTime = Date.now();
  
  try {
    // Seed permissions
    const permissionsResult = await seedPermissions({ prisma, options: opts });
    Object.assign(combinedStats.created, permissionsResult.stats.created);
    Object.assign(combinedStats.updated, permissionsResult.stats.updated);
    Object.assign(combinedStats.skipped, permissionsResult.stats.skipped);
    
    // Seed roles
    const rolesResult = await seedRoles({ prisma, options: opts });
    Object.assign(combinedStats.created, rolesResult.stats.created);
    Object.assign(combinedStats.updated, rolesResult.stats.updated);
    Object.assign(combinedStats.skipped, rolesResult.stats.skipped);
    
    // Seed users
    const usersResult = await seedUsers({ prisma, options: opts });
    Object.assign(combinedStats.created, usersResult.stats.created);
    Object.assign(combinedStats.updated, usersResult.stats.updated);
    Object.assign(combinedStats.skipped, usersResult.stats.skipped);
    
    const endTime = Date.now();
    combinedStats.timeTakenMs = endTime - startTime;
    
    logger.info(`Core entities seeding completed in ${combinedStats.timeTakenMs}ms`);
    
    return {
      success: true,
      stats: combinedStats
    };
  } catch (error) {
    logger.error('Core entities seeding failed:', error);
    
    const endTime = Date.now();
    combinedStats.timeTakenMs = endTime - startTime;
    
    return {
      success: false,
      error: error.message,
      stats: combinedStats
    };
  }
}

/**
 * Creates a test user with specific roles
 * 
 * @param prisma Prisma client or transaction
 * @param userData User data (email, name, etc.)
 * @param roleNames Names of roles to assign
 * @param options Seed options
 * @returns Created user or null if creation failed
 */
export async function createTestUser(
  prisma: PrismaClient | PrismaService,
  userData: Partial<UserSeedData>,
  roleNames: string[] = ['User'],
  options: CoreSeedOptions = DEFAULT_CORE_SEED_OPTIONS
): Promise<any> {
  const opts = { ...DEFAULT_CORE_SEED_OPTIONS, ...options };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  return withTransaction(prisma, async (tx) => {
    try {
      // Generate complete user data with defaults for missing fields
      const completeUserData = {
        name: userData.name || `Test User ${Date.now()}`,
        email: userData.email || `test-${Date.now()}@austa.com.br`,
        phone: userData.phone || `+551199${Math.floor(Math.random() * 10000000)}`,
        cpf: userData.cpf || `${Math.floor(Math.random() * 100000000000).toString().padStart(11, '0')}`,
        password: opts.testUserPassword,
        isTestData: true,
        ...userData
      };
      
      // Hash the password
      const hashedPassword = await generateHashedPassword(completeUserData.password);
      
      // Create the user
      const { password, ...userDataWithoutPassword } = completeUserData;
      const user = await safeCreate(
        tx,
        'user',
        { email: completeUserData.email },
        { ...userDataWithoutPassword, password: hashedPassword },
        toUtilOptions(opts)
      );
      
      if (!user) {
        logger.error(`Failed to create test user: ${completeUserData.email}`);
        return null;
      }
      
      // Get the roles
      const roles = await tx.role.findMany({
        where: { name: { in: roleNames } },
      });
      
      if (roles.length === 0) {
        logger.warn(`No roles found with names: ${roleNames.join(', ')}`);
        return user;
      }
      
      // Connect roles to the user
      await tx.user.update({
        where: { id: user.id },
        data: {
          roles: {
            connect: roles.map(role => ({ id: role.id })),
          },
        },
      });
      
      logger.debug(`Created test user: ${completeUserData.email} with roles: ${roleNames.join(', ')}`);
      
      return user;
    } catch (error) {
      logger.error(`Error creating test user:`, error);
      
      if (opts.throwOnError) {
        throw error;
      }
      
      return null;
    }
  }, toUtilOptions(opts));
}

/**
 * Gets a test user with specific roles, creating one if it doesn't exist
 * 
 * @param prisma Prisma client or transaction
 * @param email Email of the user to get or create
 * @param roleNames Names of roles to assign if creating
 * @param options Seed options
 * @returns User or null if not found and creation failed
 */
export async function getOrCreateTestUser(
  prisma: PrismaClient | PrismaService,
  email: string,
  roleNames: string[] = ['User'],
  options: CoreSeedOptions = DEFAULT_CORE_SEED_OPTIONS
): Promise<any> {
  const opts = { ...DEFAULT_CORE_SEED_OPTIONS, ...options };
  const logger = seedLogger;
  logger.setEnabled(opts.logging);
  
  return withTransaction(prisma, async (tx) => {
    try {
      // Try to find the user first
      const existingUser = await tx.user.findUnique({
        where: { email },
        include: { roles: true },
      });
      
      if (existingUser) {
        logger.debug(`Found existing user: ${email}`);
        return existingUser;
      }
      
      // User doesn't exist, create a new one
      return createTestUser(tx, { email }, roleNames, opts);
    } catch (error) {
      logger.error(`Error getting or creating test user:`, error);
      
      if (opts.throwOnError) {
        throw error;
      }
      
      return null;
    }
  }, toUtilOptions(opts));
}

/**
 * Gets a test user with admin privileges, creating one if it doesn't exist
 * 
 * @param prisma Prisma client or transaction
 * @param email Email of the admin user to get or create
 * @param options Seed options
 * @returns Admin user or null if not found and creation failed
 */
export async function getOrCreateAdminUser(
  prisma: PrismaClient | PrismaService,
  email: string = 'admin@austa.com.br',
  options: CoreSeedOptions = DEFAULT_CORE_SEED_OPTIONS
): Promise<any> {
  return getOrCreateTestUser(prisma, email, ['Administrator'], options);
}

/**
 * Gets a test user with standard privileges, creating one if it doesn't exist
 * 
 * @param prisma Prisma client or transaction
 * @param email Email of the standard user to get or create
 * @param options Seed options
 * @returns Standard user or null if not found and creation failed
 */
export async function getOrCreateStandardUser(
  prisma: PrismaClient | PrismaService,
  email: string = 'user@austa.com.br',
  options: CoreSeedOptions = DEFAULT_CORE_SEED_OPTIONS
): Promise<any> {
  return getOrCreateTestUser(prisma, email, ['User'], options);
}

/**
 * Default export that includes all core seed functions
 */
export default {
  seedPermissions,
  seedRoles,
  seedUsers,
  seedCoreEntities,
  createTestUser,
  getOrCreateTestUser,
  getOrCreateAdminUser,
  getOrCreateStandardUser,
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLES,
  DEFAULT_USERS,
  DEFAULT_CORE_SEED_OPTIONS
};