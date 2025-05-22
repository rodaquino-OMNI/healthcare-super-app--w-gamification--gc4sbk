import { PrismaClient, Permission, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ConnectionManager } from '../../src/connection';
import { TransactionService } from '../../src/transactions';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import { RetryStrategyFactory } from '../../src/errors/retry-strategies';
import { SeedOptions, UserSeedOptions } from './types';

/**
 * Configuration options for core entity seeding
 */
export interface CoreSeedOptions extends SeedOptions {
  /**
   * Options for user seeding
   */
  users?: UserSeedOptions;
  
  /**
   * Whether to seed permissions
   * @default true
   */
  seedPermissions?: boolean;
  
  /**
   * Whether to seed roles
   * @default true
   */
  seedRoles?: boolean;
  
  /**
   * Whether to seed users
   * @default true
   */
  seedUsers?: boolean;
  
  /**
   * Number of retry attempts for database operations
   * @default 3
   */
  retryAttempts?: number;
}

/**
 * Default options for core entity seeding
 */
const defaultOptions: CoreSeedOptions = {
  seedPermissions: true,
  seedRoles: true,
  seedUsers: true,
  retryAttempts: 3,
  users: {
    adminEmail: 'admin@austa.com.br',
    adminPassword: 'Password123!',
    testUserEmail: 'user@austa.com.br',
    testUserPassword: 'Password123!',
    createAdminUser: true,
    createTestUser: true
  },
  useTransactions: true,
  logEnabled: true
};

/**
 * Seeds core entities (permissions, roles, users) required across all journeys.
 * 
 * @param prisma - The Prisma client instance or ConnectionManager
 * @param options - Configuration options for seeding
 * @returns A promise that resolves when the core entities are seeded
 */
export async function seedCoreEntities(
  prisma: PrismaClient | ConnectionManager,
  options: CoreSeedOptions = {}
): Promise<void> {
  // Merge provided options with defaults
  const mergedOptions: CoreSeedOptions = { ...defaultOptions, ...options };
  const { 
    seedPermissions, 
    seedRoles, 
    seedUsers, 
    retryAttempts, 
    useTransactions, 
    logEnabled 
  } = mergedOptions;
  
  // Get the appropriate client
  const client = prisma instanceof ConnectionManager 
    ? await prisma.getClient() 
    : prisma;
  
  // Create transaction service if using transactions
  const transactionService = useTransactions 
    ? new TransactionService(client) 
    : null;
  
  // Create retry strategy factory
  const retryFactory = new RetryStrategyFactory();
  
  try {
    // Log start of seeding if enabled
    if (logEnabled) {
      console.log('Starting core entities seeding...');
    }
    
    // Use transaction if enabled
    if (useTransactions && transactionService) {
      await transactionService.transaction(async (tx) => {
        // Seed permissions if enabled
        if (seedPermissions) {
          if (logEnabled) console.log('Seeding permissions...');
          await seedPermissionsWithRetry(tx, { retryAttempts, logEnabled });
        }
        
        // Seed roles if enabled
        if (seedRoles) {
          if (logEnabled) console.log('Seeding roles...');
          await seedRolesWithRetry(tx, { retryAttempts, logEnabled });
        }
        
        // Seed users if enabled
        if (seedUsers) {
          if (logEnabled) console.log('Seeding users...');
          await seedUsersWithRetry(tx, mergedOptions.users, { retryAttempts, logEnabled });
        }
      });
    } else {
      // Seed without transaction
      // Seed permissions if enabled
      if (seedPermissions) {
        if (logEnabled) console.log('Seeding permissions...');
        await seedPermissionsWithRetry(client, { retryAttempts, logEnabled });
      }
      
      // Seed roles if enabled
      if (seedRoles) {
        if (logEnabled) console.log('Seeding roles...');
        await seedRolesWithRetry(client, { retryAttempts, logEnabled });
      }
      
      // Seed users if enabled
      if (seedUsers) {
        if (logEnabled) console.log('Seeding users...');
        await seedUsersWithRetry(client, mergedOptions.users, { retryAttempts, logEnabled });
      }
    }
    
    if (logEnabled) {
      console.log('Core entities seeding completed successfully!');
    }
  } catch (error) {
    // Transform error to DatabaseException if it's not already
    const dbError = error instanceof DatabaseException 
      ? error 
      : new DatabaseException(
          'Failed to seed core entities', 
          { 
            cause: error, 
            type: DatabaseErrorType.QUERY_ERROR,
            context: { options: mergedOptions }
          }
        );
    
    if (logEnabled) {
      console.error(`Error seeding core entities: ${dbError.message}`);
      console.error(dbError.stack);
    }
    
    throw dbError;
  }
}

/**
 * Seeds permissions for all journeys with retry capability.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Options for retry and logging
 */
async function seedPermissionsWithRetry(
  prisma: PrismaClient, 
  options: { retryAttempts: number; logEnabled: boolean }
): Promise<void> {
  const { retryAttempts, logEnabled } = options;
  const retryFactory = new RetryStrategyFactory();
  const retryStrategy = retryFactory.createExponentialBackoff(retryAttempts);
  
  try {
    await retryStrategy.execute(() => seedPermissions(prisma, { logEnabled }));
  } catch (error) {
    throw new DatabaseException(
      'Failed to seed permissions after multiple attempts', 
      { 
        cause: error, 
        type: DatabaseErrorType.QUERY_ERROR,
        context: { retryAttempts }
      }
    );
  }
}

/**
 * Seeds roles and assigns permissions with retry capability.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Options for retry and logging
 */
async function seedRolesWithRetry(
  prisma: PrismaClient, 
  options: { retryAttempts: number; logEnabled: boolean }
): Promise<void> {
  const { retryAttempts, logEnabled } = options;
  const retryFactory = new RetryStrategyFactory();
  const retryStrategy = retryFactory.createExponentialBackoff(retryAttempts);
  
  try {
    await retryStrategy.execute(() => seedRoles(prisma, { logEnabled }));
  } catch (error) {
    throw new DatabaseException(
      'Failed to seed roles after multiple attempts', 
      { 
        cause: error, 
        type: DatabaseErrorType.QUERY_ERROR,
        context: { retryAttempts }
      }
    );
  }
}

/**
 * Seeds default users with retry capability.
 * 
 * @param prisma - The Prisma client instance
 * @param userOptions - Options for user creation
 * @param options - Options for retry and logging
 */
async function seedUsersWithRetry(
  prisma: PrismaClient, 
  userOptions: UserSeedOptions = {}, 
  options: { retryAttempts: number; logEnabled: boolean }
): Promise<void> {
  const { retryAttempts, logEnabled } = options;
  const retryFactory = new RetryStrategyFactory();
  const retryStrategy = retryFactory.createExponentialBackoff(retryAttempts);
  
  try {
    await retryStrategy.execute(() => seedUsers(prisma, userOptions, { logEnabled }));
  } catch (error) {
    throw new DatabaseException(
      'Failed to seed users after multiple attempts', 
      { 
        cause: error, 
        type: DatabaseErrorType.QUERY_ERROR,
        context: { retryAttempts, userOptions }
      }
    );
  }
}

/**
 * Seeds permissions for all journeys.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Options for logging
 */
async function seedPermissions(
  prisma: PrismaClient, 
  options: { logEnabled: boolean } = { logEnabled: true }
): Promise<void> {
  const { logEnabled } = options;
  
  // Health journey permissions
  const healthPermissions = [
    { name: 'health:metrics:read', description: 'View health metrics' },
    { name: 'health:metrics:write', description: 'Record health metrics' },
    { name: 'health:history:read', description: 'View medical history' },
    { name: 'health:history:write', description: 'Update medical history' },
    { name: 'health:goals:read', description: 'View health goals' },
    { name: 'health:goals:write', description: 'Set health goals' },
    { name: 'health:devices:read', description: 'View connected devices' },
    { name: 'health:devices:write', description: 'Manage device connections' },
  ];
  
  // Care journey permissions
  const carePermissions = [
    { name: 'care:appointments:read', description: 'View appointments' },
    { name: 'care:appointments:write', description: 'Manage appointments' },
    { name: 'care:telemedicine:read', description: 'View telemedicine sessions' },
    { name: 'care:telemedicine:write', description: 'Manage telemedicine sessions' },
    { name: 'care:medications:read', description: 'View medications' },
    { name: 'care:medications:write', description: 'Manage medications' },
    { name: 'care:treatments:read', description: 'View treatment plans' },
    { name: 'care:treatments:write', description: 'Manage treatment plans' },
  ];
  
  // Plan journey permissions
  const planPermissions = [
    { name: 'plan:coverage:read', description: 'View coverage information' },
    { name: 'plan:claims:read', description: 'View claims' },
    { name: 'plan:claims:write', description: 'Submit and manage claims' },
    { name: 'plan:benefits:read', description: 'View benefits' },
    { name: 'plan:documents:read', description: 'View insurance documents' },
    { name: 'plan:documents:write', description: 'Upload insurance documents' },
    { name: 'plan:payments:read', description: 'View payment information' },
    { name: 'plan:simulator:use', description: 'Use cost simulator' },
  ];
  
  // Gamification permissions
  const gamificationPermissions = [
    { name: 'game:achievements:read', description: 'View achievements' },
    { name: 'game:progress:read', description: 'View progress' },
    { name: 'game:rewards:read', description: 'View rewards' },
    { name: 'game:rewards:redeem', description: 'Redeem rewards' },
    { name: 'game:leaderboard:read', description: 'View leaderboards' },
  ];
  
  const allPermissions = [
    ...healthPermissions,
    ...carePermissions,
    ...planPermissions,
    ...gamificationPermissions,
  ];
  
  // Create all permissions in the database
  if (logEnabled) {
    console.log(`Creating ${allPermissions.length} permissions...`);
  }
  
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
      if (error.code === 'P2002' && logEnabled) {
        console.log(`Permission ${permission.name} already exists, skipping...`);
      } else {
        // For other errors, transform and re-throw
        throw new DatabaseException(
          `Failed to create permission ${permission.name}`, 
          { 
            cause: error, 
            type: DatabaseErrorType.QUERY_ERROR,
            context: { permission }
          }
        );
      }
    }
  }
}

/**
 * Seeds roles and assigns permissions to them.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Options for logging
 */
async function seedRoles(
  prisma: PrismaClient, 
  options: { logEnabled: boolean } = { logEnabled: true }
): Promise<void> {
  const { logEnabled } = options;
  
  try {
    // Get all permissions
    const permissions = await prisma.permission.findMany();
    const permissionsByName = new Map<string, Permission>();
    
    // Create a map of permission names to IDs
    permissions.forEach(permission => {
      permissionsByName.set(permission.name, permission);
    });
    
    // Define roles with their permissions
    const roles = [
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
        permissions: permissions.map(p => p.name), // All permissions
      },
    ];
    
    // Create roles and assign permissions
    if (logEnabled) {
      console.log(`Creating ${roles.length} roles...`);
    }
    
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
          } else if (logEnabled) {
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
        
        if (logEnabled) {
          console.log(`Created role: ${roleData.name} with ${permissionConnections.length} permissions`);
        }
      } catch (error) {
        throw new DatabaseException(
          `Failed to create role ${role.name}`, 
          { 
            cause: error, 
            type: DatabaseErrorType.QUERY_ERROR,
            context: { role }
          }
        );
      }
    }
  } catch (error) {
    if (error instanceof DatabaseException) {
      throw error;
    }
    
    throw new DatabaseException(
      'Failed to seed roles', 
      { 
        cause: error, 
        type: DatabaseErrorType.QUERY_ERROR
      }
    );
  }
}

/**
 * Seeds default users.
 * 
 * @param prisma - The Prisma client instance
 * @param userOptions - Options for user creation
 * @param options - Options for logging
 */
async function seedUsers(
  prisma: PrismaClient, 
  userOptions: UserSeedOptions = {}, 
  options: { logEnabled: boolean } = { logEnabled: true }
): Promise<void> {
  const { logEnabled } = options;
  
  // Merge with default options
  const mergedOptions = {
    adminEmail: 'admin@austa.com.br',
    adminPassword: 'Password123!',
    testUserEmail: 'user@austa.com.br',
    testUserPassword: 'Password123!',
    createAdminUser: true,
    createTestUser: true,
    ...userOptions
  };
  
  try {
    // Create admin user if enabled
    if (mergedOptions.createAdminUser) {
      const adminPassword = await bcrypt.hash(mergedOptions.adminPassword, 10);
      const adminUser = await prisma.user.upsert({
        where: { email: mergedOptions.adminEmail },
        update: {
          password: adminPassword,
        },
        create: {
          name: 'Admin User',
          email: mergedOptions.adminEmail,
          password: adminPassword,
          phone: '+5511999999999',
          cpf: '12345678901',
        },
      });
      
      // Get the admin role
      const adminRole = await prisma.role.findUnique({
        where: { name: 'Administrator' },
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
        
        if (logEnabled) {
          console.log(`Created admin user: ${adminUser.email} with Administrator role`);
        }
      }
    }
    
    // Create regular test user if enabled
    if (mergedOptions.createTestUser) {
      const userPassword = await bcrypt.hash(mergedOptions.testUserPassword, 10);
      const testUser = await prisma.user.upsert({
        where: { email: mergedOptions.testUserEmail },
        update: {
          password: userPassword,
        },
        create: {
          name: 'Test User',
          email: mergedOptions.testUserEmail,
          password: userPassword,
          phone: '+5511888888888',
          cpf: '98765432109',
        },
      });
      
      // Get the default user role
      const userRole = await prisma.role.findFirst({
        where: { isDefault: true },
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
        
        if (logEnabled) {
          console.log(`Created test user: ${testUser.email} with ${userRole.name} role`);
        }
      }
    }
  } catch (error) {
    throw new DatabaseException(
      'Failed to seed users', 
      { 
        cause: error, 
        type: DatabaseErrorType.QUERY_ERROR,
        context: { userOptions: mergedOptions }
      }
    );
  }
}

/**
 * Creates a test user with the specified options.
 * 
 * @param prisma - The Prisma client instance
 * @param options - Options for creating the test user
 * @returns The created user
 */
export async function createTestUser(
  prisma: PrismaClient,
  options: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    cpf?: string;
    roleName?: string;
  }
): Promise<User> {
  const { email, password, name = 'Test User', phone = '+5511888888888', cpf = '98765432109', roleName = 'User' } = options;
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
      },
      create: {
        name,
        email,
        password: hashedPassword,
        phone,
        cpf,
      },
    });
    
    // Get the role
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });
    
    if (role) {
      // Assign role to user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          roles: {
            connect: { id: role.id },
          },
        },
      });
    }
    
    return user;
  } catch (error) {
    throw new DatabaseException(
      `Failed to create test user with email ${email}`, 
      { 
        cause: error, 
        type: DatabaseErrorType.QUERY_ERROR,
        context: { options }
      }
    );
  }
}

/**
 * Creates multiple test users with the specified options.
 * 
 * @param prisma - The Prisma client instance
 * @param count - Number of users to create
 * @param baseOptions - Base options for creating the test users
 * @returns The created users
 */
export async function createTestUsers(
  prisma: PrismaClient,
  count: number,
  baseOptions: {
    emailPrefix?: string;
    password?: string;
    namePrefix?: string;
    phonePrefix?: string;
    roleName?: string;
  } = {}
): Promise<User[]> {
  const {
    emailPrefix = 'test-user-',
    password = 'Password123!',
    namePrefix = 'Test User ',
    phonePrefix = '+551188888',
    roleName = 'User'
  } = baseOptions;
  
  const users: User[] = [];
  
  try {
    for (let i = 0; i < count; i++) {
      const user = await createTestUser(prisma, {
        email: `${emailPrefix}${i}@austa.com.br`,
        password,
        name: `${namePrefix}${i}`,
        phone: `${phonePrefix}${i.toString().padStart(4, '0')}`,
        cpf: `${(98765432100 + i).toString().padStart(11, '0')}`,
        roleName
      });
      
      users.push(user);
    }
    
    return users;
  } catch (error) {
    throw new DatabaseException(
      `Failed to create ${count} test users`, 
      { 
        cause: error, 
        type: DatabaseErrorType.QUERY_ERROR,
        context: { count, baseOptions }
      }
    );
  }
}

// Export all seed functions
export { seedPermissions, seedRoles, seedUsers };