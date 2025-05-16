/**
 * @file test-database.helper.ts
 * @description Provides utilities for setting up and manipulating test database state for authentication tests.
 * This helper creates, seeds, and cleans up authentication-related database records (users, roles, permissions)
 * for testing user management, role-based access control, and permission verification.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

// Import interfaces from the auth package
import {
  IUser,
  IRole,
  IPermission,
  ICreateUser,
  IUserWithRoles,
  IUserWithPermissions,
} from '../../src/interfaces/user.interface';
import { JourneyType } from '../../src/interfaces/role.interface';

/**
 * Configuration options for the TestDatabaseHelper
 */
export interface TestDatabaseConfig {
  /**
   * Whether to use transactions for test isolation (default: true)
   */
  useTransactions?: boolean;

  /**
   * Whether to automatically clean up created entities after tests (default: true)
   */
  autoCleanup?: boolean;

  /**
   * Custom Prisma client instance (if not provided, a new one will be created)
   */
  prismaClient?: PrismaClient;

  /**
   * Default password for test users (default: 'Password123!')
   */
  defaultPassword?: string;

  /**
   * Number of salt rounds for password hashing (default: 10)
   */
  saltRounds?: number;
}

/**
 * Options for creating test users
 */
export interface CreateTestUserOptions {
  /**
   * User's email (default: generated unique email)
   */
  email?: string;

  /**
   * User's name (default: 'Test User')
   */
  name?: string;

  /**
   * User's plain text password (default: from TestDatabaseConfig)
   */
  password?: string;

  /**
   * User's phone number
   */
  phone?: string;

  /**
   * User's CPF (Brazilian tax ID)
   */
  cpf?: string;

  /**
   * Roles to assign to the user
   */
  roles?: number[];

  /**
   * Permissions to assign directly to the user
   */
  permissions?: number[];

  /**
   * Journey context for role assignments
   */
  journeyContext?: JourneyType;
}

/**
 * Options for creating test roles
 */
export interface CreateTestRoleOptions {
  /**
   * Role name (default: generated unique role name)
   */
  name?: string;

  /**
   * Role description (default: 'Test role description')
   */
  description?: string;

  /**
   * Journey type this role belongs to
   */
  journey?: JourneyType;

  /**
   * Whether this is a default role (default: false)
   */
  isDefault?: boolean;

  /**
   * Permissions to assign to this role
   */
  permissions?: number[];
}

/**
 * Options for creating test permissions
 */
export interface CreateTestPermissionOptions {
  /**
   * Permission name (default: generated unique permission name)
   */
  name?: string;

  /**
   * Permission description (default: 'Test permission description')
   */
  description?: string;

  /**
   * Journey this permission belongs to
   */
  journey?: JourneyType;
}

/**
 * Helper class for setting up and manipulating test database state for authentication tests
 */
export class TestDatabaseHelper {
  private prisma: PrismaClient;
  private config: Required<TestDatabaseConfig>;
  private createdUsers: string[] = [];
  private createdRoles: number[] = [];
  private createdPermissions: number[] = [];
  private transaction: Prisma.TransactionClient | null = null;

  /**
   * Creates a new TestDatabaseHelper instance
   * @param config Configuration options
   */
  constructor(config: TestDatabaseConfig = {}) {
    this.config = {
      useTransactions: config.useTransactions ?? true,
      autoCleanup: config.autoCleanup ?? true,
      prismaClient: config.prismaClient ?? new PrismaClient(),
      defaultPassword: config.defaultPassword ?? 'Password123!',
      saltRounds: config.saltRounds ?? 10,
    };

    this.prisma = this.config.prismaClient;
  }

  /**
   * Gets the current Prisma client or transaction client
   * @returns The appropriate Prisma client to use
   */
  private getClient(): PrismaClient | Prisma.TransactionClient {
    return this.transaction || this.prisma;
  }

  /**
   * Starts a new transaction for test isolation
   * @returns Promise that resolves when the transaction is started
   */
  async startTransaction(): Promise<void> {
    if (this.config.useTransactions && !this.transaction) {
      this.transaction = await this.prisma.$transaction({
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 5000,
        timeout: 10000,
      } as any);
    }
  }

  /**
   * Commits the current transaction
   * @returns Promise that resolves when the transaction is committed
   */
  async commitTransaction(): Promise<void> {
    if (this.config.useTransactions && this.transaction) {
      await (this.transaction as any).$commit?.();
      this.transaction = null;
    }
  }

  /**
   * Rolls back the current transaction
   * @returns Promise that resolves when the transaction is rolled back
   */
  async rollbackTransaction(): Promise<void> {
    if (this.config.useTransactions && this.transaction) {
      await (this.transaction as any).$rollback?.();
      this.transaction = null;
    }
  }

  /**
   * Cleans up all entities created during tests
   * @returns Promise that resolves when cleanup is complete
   */
  async cleanup(): Promise<void> {
    const client = this.getClient();

    // Delete user roles and permissions first (foreign key constraints)
    if (this.createdUsers.length > 0) {
      await client.userRole.deleteMany({
        where: {
          userId: { in: this.createdUsers },
        },
      });

      await client.userPermission.deleteMany({
        where: {
          userId: { in: this.createdUsers },
        },
      });
    }

    // Delete role permissions
    if (this.createdRoles.length > 0) {
      await client.rolePermission.deleteMany({
        where: {
          roleId: { in: this.createdRoles },
        },
      });
    }

    // Delete users
    if (this.createdUsers.length > 0) {
      await client.user.deleteMany({
        where: {
          id: { in: this.createdUsers },
        },
      });
      this.createdUsers = [];
    }

    // Delete roles
    if (this.createdRoles.length > 0) {
      await client.role.deleteMany({
        where: {
          id: { in: this.createdRoles },
        },
      });
      this.createdRoles = [];
    }

    // Delete permissions
    if (this.createdPermissions.length > 0) {
      await client.permission.deleteMany({
        where: {
          id: { in: this.createdPermissions },
        },
      });
      this.createdPermissions = [];
    }
  }

  /**
   * Creates a test user with the specified options
   * @param options Options for creating the test user
   * @returns The created user
   */
  async createTestUser(options: CreateTestUserOptions = {}): Promise<IUser> {
    const client = this.getClient();
    const hashedPassword = await bcrypt.hash(
      options.password || this.config.defaultPassword,
      this.config.saltRounds
    );

    const user = await client.user.create({
      data: {
        id: randomUUID(),
        email: options.email || `test-user-${randomUUID()}@example.com`,
        name: options.name || 'Test User',
        password: hashedPassword,
        phone: options.phone,
        cpf: options.cpf,
      },
    });

    this.createdUsers.push(user.id);

    // Assign roles if specified
    if (options.roles && options.roles.length > 0) {
      await Promise.all(
        options.roles.map((roleId) =>
          client.userRole.create({
            data: {
              userId: user.id,
              roleId,
              journeyContext: options.journeyContext,
            },
          })
        )
      );
    }

    // Assign permissions if specified
    if (options.permissions && options.permissions.length > 0) {
      await Promise.all(
        options.permissions.map((permissionId) =>
          client.userPermission.create({
            data: {
              userId: user.id,
              permissionId,
            },
          })
        )
      );
    }

    return user;
  }

  /**
   * Creates a test role with the specified options
   * @param options Options for creating the test role
   * @returns The created role
   */
  async createTestRole(options: CreateTestRoleOptions = {}): Promise<IRole> {
    const client = this.getClient();

    const role = await client.role.create({
      data: {
        name: options.name || `test-role-${randomUUID()}`,
        description: options.description || 'Test role description',
        journey: options.journey,
        isDefault: options.isDefault ?? false,
      },
    });

    this.createdRoles.push(role.id);

    // Assign permissions if specified
    if (options.permissions && options.permissions.length > 0) {
      await Promise.all(
        options.permissions.map((permissionId) =>
          client.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId,
            },
          })
        )
      );
    }

    return role;
  }

  /**
   * Creates a test permission with the specified options
   * @param options Options for creating the test permission
   * @returns The created permission
   */
  async createTestPermission(options: CreateTestPermissionOptions = {}): Promise<IPermission> {
    const client = this.getClient();

    const permission = await client.permission.create({
      data: {
        name: options.name || `test-permission-${randomUUID()}`,
        description: options.description || 'Test permission description',
        journey: options.journey,
      },
    });

    this.createdPermissions.push(permission.id);

    return permission;
  }

  /**
   * Creates a test admin user with all permissions
   * @param options Additional options for the admin user
   * @returns The created admin user with roles and permissions
   */
  async createTestAdminUser(options: Partial<CreateTestUserOptions> = {}): Promise<IUserWithRolesAndPermissions> {
    // Create admin role if it doesn't exist
    const adminRole = await this.createTestRole({
      name: 'Admin',
      description: 'Administrator with all permissions',
      journey: JourneyType.GLOBAL,
    });

    // Create global permissions
    const adminPermissions = await Promise.all([
      this.createTestPermission({
        name: 'admin:all:manage',
        description: 'Manage all admin resources',
        journey: JourneyType.GLOBAL,
      }),
      this.createTestPermission({
        name: 'users:all:manage',
        description: 'Manage all users',
        journey: JourneyType.GLOBAL,
      }),
    ]);

    // Assign permissions to admin role
    await Promise.all(
      adminPermissions.map((permission) =>
        this.getClient().rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        })
      )
    );

    // Create admin user
    const user = await this.createTestUser({
      name: options.name || 'Admin User',
      email: options.email || `admin-${randomUUID()}@example.com`,
      password: options.password,
      roles: [adminRole.id],
    });

    // Return user with roles and permissions
    return this.getUserWithRolesAndPermissions(user.id);
  }

  /**
   * Creates a test user for a specific journey
   * @param journey The journey type
   * @param options Additional options for the journey user
   * @returns The created journey user with roles and permissions
   */
  async createTestJourneyUser(
    journey: JourneyType,
    options: Partial<CreateTestUserOptions> = {}
  ): Promise<IUserWithRolesAndPermissions> {
    // Create journey-specific role
    const journeyRole = await this.createTestRole({
      name: `${journey} User`,
      description: `Standard user for ${journey} journey`,
      journey,
    });

    // Create journey-specific permissions
    const journeyPermissions = await Promise.all([
      this.createTestPermission({
        name: `${journey}:read`,
        description: `Read access to ${journey} journey`,
        journey,
      }),
      this.createTestPermission({
        name: `${journey}:write`,
        description: `Write access to ${journey} journey`,
        journey,
      }),
    ]);

    // Assign permissions to journey role
    await Promise.all(
      journeyPermissions.map((permission) =>
        this.getClient().rolePermission.create({
          data: {
            roleId: journeyRole.id,
            permissionId: permission.id,
          },
        })
      )
    );

    // Create journey user
    const user = await this.createTestUser({
      name: options.name || `${journey} User`,
      email: options.email || `${journey.toLowerCase()}-user-${randomUUID()}@example.com`,
      password: options.password,
      roles: [journeyRole.id],
      journeyContext: journey,
    });

    // Return user with roles and permissions
    return this.getUserWithRolesAndPermissions(user.id);
  }

  /**
   * Creates a test health journey user
   * @param options Additional options for the health journey user
   * @returns The created health journey user with roles and permissions
   */
  async createTestHealthJourneyUser(
    options: Partial<CreateTestUserOptions> = {}
  ): Promise<IUserWithRolesAndPermissions> {
    return this.createTestJourneyUser(JourneyType.HEALTH, {
      name: 'Health Journey User',
      ...options,
    });
  }

  /**
   * Creates a test care journey user
   * @param options Additional options for the care journey user
   * @returns The created care journey user with roles and permissions
   */
  async createTestCareJourneyUser(
    options: Partial<CreateTestUserOptions> = {}
  ): Promise<IUserWithRolesAndPermissions> {
    return this.createTestJourneyUser(JourneyType.CARE, {
      name: 'Care Journey User',
      ...options,
    });
  }

  /**
   * Creates a test plan journey user
   * @param options Additional options for the plan journey user
   * @returns The created plan journey user with roles and permissions
   */
  async createTestPlanJourneyUser(
    options: Partial<CreateTestUserOptions> = {}
  ): Promise<IUserWithRolesAndPermissions> {
    return this.createTestJourneyUser(JourneyType.PLAN, {
      name: 'Plan Journey User',
      ...options,
    });
  }

  /**
   * Creates a test user with multiple journey roles
   * @param journeys The journey types to assign to the user
   * @param options Additional options for the multi-journey user
   * @returns The created multi-journey user with roles and permissions
   */
  async createTestMultiJourneyUser(
    journeys: JourneyType[],
    options: Partial<CreateTestUserOptions> = {}
  ): Promise<IUserWithRolesAndPermissions> {
    // Create roles for each journey
    const roles = await Promise.all(
      journeys.map((journey) =>
        this.createTestRole({
          name: `${journey} Role`,
          description: `Role for ${journey} journey`,
          journey,
        })
      )
    );

    // Create permissions for each journey
    const permissions = await Promise.all(
      journeys.flatMap((journey) => [
        this.createTestPermission({
          name: `${journey}:read`,
          description: `Read access to ${journey} journey`,
          journey,
        }),
        this.createTestPermission({
          name: `${journey}:write`,
          description: `Write access to ${journey} journey`,
          journey,
        }),
      ])
    );

    // Assign permissions to roles
    for (let i = 0; i < journeys.length; i++) {
      const journey = journeys[i];
      const role = roles[i];
      const journeyPermissions = permissions.filter((p) => p.journey === journey);

      await Promise.all(
        journeyPermissions.map((permission) =>
          this.getClient().rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
            },
          })
        )
      );
    }

    // Create multi-journey user
    const user = await this.createTestUser({
      name: options.name || 'Multi-Journey User',
      email: options.email || `multi-journey-${randomUUID()}@example.com`,
      password: options.password,
      roles: roles.map((role) => role.id),
    });

    // Return user with roles and permissions
    return this.getUserWithRolesAndPermissions(user.id);
  }

  /**
   * Gets a user with their roles and permissions
   * @param userId The ID of the user to retrieve
   * @returns The user with roles and permissions
   */
  async getUserWithRolesAndPermissions(userId: string): Promise<IUserWithRolesAndPermissions> {
    const client = this.getClient();

    const user = await client.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Extract roles
    const roles = user.userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      description: ur.role.description,
      journey: ur.role.journey as JourneyType | undefined,
      isDefault: ur.role.isDefault,
      createdAt: ur.role.createdAt,
      updatedAt: ur.role.updatedAt,
    }));

    // Extract permissions from roles
    const rolePermissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
        journey: rp.permission.journey as JourneyType | undefined,
        createdAt: rp.permission.createdAt,
        updatedAt: rp.permission.updatedAt,
      }))
    );

    // Extract direct permissions
    const directPermissions = user.userPermissions.map((up) => ({
      id: up.permission.id,
      name: up.permission.name,
      description: up.permission.description,
      journey: up.permission.journey as JourneyType | undefined,
      createdAt: up.permission.createdAt,
      updatedAt: up.permission.updatedAt,
    }));

    // Combine and deduplicate permissions
    const allPermissions = [...rolePermissions, ...directPermissions];
    const uniquePermissions = allPermissions.filter(
      (permission, index, self) =>
        index === self.findIndex((p) => p.id === permission.id)
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || undefined,
      cpf: user.cpf || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles,
      permissions: uniquePermissions,
    };
  }

  /**
   * Performs cleanup when the helper is no longer needed
   */
  async dispose(): Promise<void> {
    if (this.config.autoCleanup) {
      await this.cleanup();
    }

    if (this.transaction) {
      await this.rollbackTransaction();
    }
  }
}

/**
 * Interface for a user with roles and permissions
 * Extends IUserWithRoles and IUserWithPermissions
 */
export interface IUserWithRolesAndPermissions extends IUserWithRoles, IUserWithPermissions {}

/**
 * Creates a test database helper with the specified configuration
 * @param config Configuration options for the helper
 * @returns A new TestDatabaseHelper instance
 */
export function createTestDatabaseHelper(config: TestDatabaseConfig = {}): TestDatabaseHelper {
  return new TestDatabaseHelper(config);
}

/**
 * Creates a test user with the specified options
 * @param options Options for creating the test user
 * @param config Configuration options for the helper
 * @returns The created user
 */
export async function createTestUser(
  options: CreateTestUserOptions = {},
  config: TestDatabaseConfig = {}
): Promise<IUser> {
  const helper = createTestDatabaseHelper(config);
  try {
    return await helper.createTestUser(options);
  } finally {
    await helper.dispose();
  }
}

/**
 * Creates a test admin user with all permissions
 * @param options Additional options for the admin user
 * @param config Configuration options for the helper
 * @returns The created admin user with roles and permissions
 */
export async function createTestAdminUser(
  options: Partial<CreateTestUserOptions> = {},
  config: TestDatabaseConfig = {}
): Promise<IUserWithRolesAndPermissions> {
  const helper = createTestDatabaseHelper(config);
  try {
    return await helper.createTestAdminUser(options);
  } finally {
    await helper.dispose();
  }
}

/**
 * Creates a test health journey user
 * @param options Additional options for the health journey user
 * @param config Configuration options for the helper
 * @returns The created health journey user with roles and permissions
 */
export async function createTestHealthJourneyUser(
  options: Partial<CreateTestUserOptions> = {},
  config: TestDatabaseConfig = {}
): Promise<IUserWithRolesAndPermissions> {
  const helper = createTestDatabaseHelper(config);
  try {
    return await helper.createTestHealthJourneyUser(options);
  } finally {
    await helper.dispose();
  }
}

/**
 * Creates a test care journey user
 * @param options Additional options for the care journey user
 * @param config Configuration options for the helper
 * @returns The created care journey user with roles and permissions
 */
export async function createTestCareJourneyUser(
  options: Partial<CreateTestUserOptions> = {},
  config: TestDatabaseConfig = {}
): Promise<IUserWithRolesAndPermissions> {
  const helper = createTestDatabaseHelper(config);
  try {
    return await helper.createTestCareJourneyUser(options);
  } finally {
    await helper.dispose();
  }
}

/**
 * Creates a test plan journey user
 * @param options Additional options for the plan journey user
 * @param config Configuration options for the helper
 * @returns The created plan journey user with roles and permissions
 */
export async function createTestPlanJourneyUser(
  options: Partial<CreateTestUserOptions> = {},
  config: TestDatabaseConfig = {}
): Promise<IUserWithRolesAndPermissions> {
  const helper = createTestDatabaseHelper(config);
  try {
    return await helper.createTestPlanJourneyUser(options);
  } finally {
    await helper.dispose();
  }
}

/**
 * Creates a test user with multiple journey roles
 * @param journeys The journey types to assign to the user
 * @param options Additional options for the multi-journey user
 * @param config Configuration options for the helper
 * @returns The created multi-journey user with roles and permissions
 */
export async function createTestMultiJourneyUser(
  journeys: JourneyType[],
  options: Partial<CreateTestUserOptions> = {},
  config: TestDatabaseConfig = {}
): Promise<IUserWithRolesAndPermissions> {
  const helper = createTestDatabaseHelper(config);
  try {
    return await helper.createTestMultiJourneyUser(journeys, options);
  } finally {
    await helper.dispose();
  }
}