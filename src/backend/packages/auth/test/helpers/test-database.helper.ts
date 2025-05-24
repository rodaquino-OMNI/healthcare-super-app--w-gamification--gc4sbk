/**
 * Test Database Helper
 * 
 * Provides utilities for setting up and manipulating test database state for authentication tests.
 * This helper creates, seeds, and cleans up authentication-related database records (users, roles,
 * permissions) for testing user management, role-based access control, and permission verification.
 */

import { PrismaClient, User, Role, Permission, Prisma } from '@prisma/client';
import { ConnectionManager } from '@austa/database/connection';
import { TransactionService } from '@austa/database/transactions';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

// Types for factory function options
export interface CreateUserOptions {
  email?: string;
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  isVerified?: boolean;
  roles?: string[] | Role[];
  permissions?: string[] | Permission[];
}

export interface CreateRoleOptions {
  name?: string;
  description?: string;
  permissions?: string[] | Permission[];
}

export interface CreatePermissionOptions {
  name?: string;
  description?: string;
  resource?: string;
  action?: string;
}

// Journey-specific user types
export interface HealthJourneyUserOptions extends CreateUserOptions {
  healthMetrics?: boolean;
  deviceConnections?: boolean;
  healthGoals?: boolean;
}

export interface CareJourneyUserOptions extends CreateUserOptions {
  appointments?: boolean;
  medications?: boolean;
  providers?: boolean;
}

export interface PlanJourneyUserOptions extends CreateUserOptions {
  plans?: boolean;
  claims?: boolean;
  benefits?: boolean;
}

/**
 * AuthTestDatabaseHelper class provides utilities for setting up and manipulating
 * test database state for authentication tests.
 */
export class AuthTestDatabaseHelper {
  private prisma: PrismaClient;
  private transactionService: TransactionService;
  private connectionManager: ConnectionManager;
  private testEntities: {
    users: User[];
    roles: Role[];
    permissions: Permission[];
  };

  /**
   * Creates a new instance of AuthTestDatabaseHelper
   */
  constructor() {
    this.connectionManager = new ConnectionManager({
      // Use test-specific connection configuration
      connectionString: process.env.TEST_DATABASE_URL,
      poolSize: 1,
      connectionTimeout: 5000,
    });
    
    this.prisma = this.connectionManager.getClient() as PrismaClient;
    this.transactionService = new TransactionService(this.prisma);
    
    // Initialize collections to track created test entities
    this.testEntities = {
      users: [],
      roles: [],
      permissions: [],
    };
  }

  /**
   * Initializes the test database with predefined test data
   */
  async initialize(): Promise<void> {
    // Create default test data in a transaction
    await this.transactionService.withTransaction(async (tx) => {
      // Create default permissions
      const readPermission = await this.createPermission({
        name: 'read',
        description: 'Read access',
        resource: 'all',
        action: 'read',
      }, tx);

      const writePermission = await this.createPermission({
        name: 'write',
        description: 'Write access',
        resource: 'all',
        action: 'write',
      }, tx);

      const deletePermission = await this.createPermission({
        name: 'delete',
        description: 'Delete access',
        resource: 'all',
        action: 'delete',
      }, tx);

      // Create default roles
      const adminRole = await this.createRole({
        name: 'admin',
        description: 'Administrator role',
        permissions: [readPermission, writePermission, deletePermission],
      }, tx);

      const userRole = await this.createRole({
        name: 'user',
        description: 'Standard user role',
        permissions: [readPermission],
      }, tx);

      // Create default admin user
      await this.createUser({
        email: 'admin@example.com',
        username: 'admin',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        isVerified: true,
        roles: [adminRole],
      }, tx);

      // Create default standard user
      await this.createUser({
        email: 'user@example.com',
        username: 'user',
        password: 'User123!',
        firstName: 'Standard',
        lastName: 'User',
        isActive: true,
        isVerified: true,
        roles: [userRole],
      }, tx);
    });
  }

  /**
   * Creates a test user with the specified options
   * @param options User creation options
   * @param tx Optional transaction client
   * @returns The created user
   */
  async createUser(options: CreateUserOptions, tx?: Prisma.TransactionClient): Promise<User> {
    const client = tx || this.prisma;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(options.password || 'Password123!', salt);

    // Create the user
    const user = await client.user.create({
      data: {
        id: uuidv4(),
        email: options.email || `test-${uuidv4()}@example.com`,
        username: options.username || `test-user-${uuidv4()}`,
        password: hashedPassword,
        firstName: options.firstName || 'Test',
        lastName: options.lastName || 'User',
        isActive: options.isActive !== undefined ? options.isActive : true,
        isVerified: options.isVerified !== undefined ? options.isVerified : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Add roles if specified
    if (options.roles && options.roles.length > 0) {
      for (const role of options.roles) {
        const roleId = typeof role === 'string' ? role : role.id;
        await client.userRole.create({
          data: {
            userId: user.id,
            roleId: roleId,
          },
        });
      }
    }

    // Add direct permissions if specified
    if (options.permissions && options.permissions.length > 0) {
      for (const permission of options.permissions) {
        const permissionId = typeof permission === 'string' ? permission : permission.id;
        await client.userPermission.create({
          data: {
            userId: user.id,
            permissionId: permissionId,
          },
        });
      }
    }

    // Track the created user for cleanup
    if (!tx) {
      this.testEntities.users.push(user);
    }

    return user;
  }

  /**
   * Creates a test role with the specified options
   * @param options Role creation options
   * @param tx Optional transaction client
   * @returns The created role
   */
  async createRole(options: CreateRoleOptions, tx?: Prisma.TransactionClient): Promise<Role> {
    const client = tx || this.prisma;

    // Create the role
    const role = await client.role.create({
      data: {
        id: uuidv4(),
        name: options.name || `test-role-${uuidv4()}`,
        description: options.description || 'Test role',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Add permissions if specified
    if (options.permissions && options.permissions.length > 0) {
      for (const permission of options.permissions) {
        const permissionId = typeof permission === 'string' ? permission : permission.id;
        await client.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permissionId,
          },
        });
      }
    }

    // Track the created role for cleanup
    if (!tx) {
      this.testEntities.roles.push(role);
    }

    return role;
  }

  /**
   * Creates a test permission with the specified options
   * @param options Permission creation options
   * @param tx Optional transaction client
   * @returns The created permission
   */
  async createPermission(options: CreatePermissionOptions, tx?: Prisma.TransactionClient): Promise<Permission> {
    const client = tx || this.prisma;

    // Create the permission
    const permission = await client.permission.create({
      data: {
        id: uuidv4(),
        name: options.name || `test-permission-${uuidv4()}`,
        description: options.description || 'Test permission',
        resource: options.resource || 'test-resource',
        action: options.action || 'read',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Track the created permission for cleanup
    if (!tx) {
      this.testEntities.permissions.push(permission);
    }

    return permission;
  }

  /**
   * Creates a test user with Health journey specific permissions and data
   * @param options Health journey user options
   * @returns The created user with health journey permissions
   */
  async createHealthJourneyUser(options: HealthJourneyUserOptions): Promise<User> {
    return await this.transactionService.withTransaction(async (tx) => {
      // Create health-specific permissions
      const healthReadPermission = await this.createPermission({
        name: 'health:read',
        description: 'Read access to health data',
        resource: 'health',
        action: 'read',
      }, tx);

      const healthWritePermission = await this.createPermission({
        name: 'health:write',
        description: 'Write access to health data',
        resource: 'health',
        action: 'write',
      }, tx);

      // Create health role
      const healthRole = await this.createRole({
        name: 'health-user',
        description: 'Health journey user role',
        permissions: [healthReadPermission, healthWritePermission],
      }, tx);

      // Combine with any additional permissions
      const permissions = [
        healthReadPermission,
        healthWritePermission,
        ...(options.permissions || []),
      ];

      // Combine with any additional roles
      const roles = [
        healthRole,
        ...(options.roles || []),
      ];

      // Create the user with health journey permissions
      const user = await this.createUser({
        ...options,
        roles,
        permissions,
      }, tx);

      // If specified, create related health journey data
      if (options.healthMetrics) {
        // Create sample health metrics for this user
        // This would connect to the health service database
        // Implementation depends on the health service schema
      }

      if (options.deviceConnections) {
        // Create sample device connections for this user
        // This would connect to the health service database
        // Implementation depends on the health service schema
      }

      if (options.healthGoals) {
        // Create sample health goals for this user
        // This would connect to the health service database
        // Implementation depends on the health service schema
      }

      return user;
    });
  }

  /**
   * Creates a test user with Care journey specific permissions and data
   * @param options Care journey user options
   * @returns The created user with care journey permissions
   */
  async createCareJourneyUser(options: CareJourneyUserOptions): Promise<User> {
    return await this.transactionService.withTransaction(async (tx) => {
      // Create care-specific permissions
      const careReadPermission = await this.createPermission({
        name: 'care:read',
        description: 'Read access to care data',
        resource: 'care',
        action: 'read',
      }, tx);

      const careWritePermission = await this.createPermission({
        name: 'care:write',
        description: 'Write access to care data',
        resource: 'care',
        action: 'write',
      }, tx);

      // Create care role
      const careRole = await this.createRole({
        name: 'care-user',
        description: 'Care journey user role',
        permissions: [careReadPermission, careWritePermission],
      }, tx);

      // Combine with any additional permissions
      const permissions = [
        careReadPermission,
        careWritePermission,
        ...(options.permissions || []),
      ];

      // Combine with any additional roles
      const roles = [
        careRole,
        ...(options.roles || []),
      ];

      // Create the user with care journey permissions
      const user = await this.createUser({
        ...options,
        roles,
        permissions,
      }, tx);

      // If specified, create related care journey data
      if (options.appointments) {
        // Create sample appointments for this user
        // This would connect to the care service database
        // Implementation depends on the care service schema
      }

      if (options.medications) {
        // Create sample medications for this user
        // This would connect to the care service database
        // Implementation depends on the care service schema
      }

      if (options.providers) {
        // Create sample providers for this user
        // This would connect to the care service database
        // Implementation depends on the care service schema
      }

      return user;
    });
  }

  /**
   * Creates a test user with Plan journey specific permissions and data
   * @param options Plan journey user options
   * @returns The created user with plan journey permissions
   */
  async createPlanJourneyUser(options: PlanJourneyUserOptions): Promise<User> {
    return await this.transactionService.withTransaction(async (tx) => {
      // Create plan-specific permissions
      const planReadPermission = await this.createPermission({
        name: 'plan:read',
        description: 'Read access to plan data',
        resource: 'plan',
        action: 'read',
      }, tx);

      const planWritePermission = await this.createPermission({
        name: 'plan:write',
        description: 'Write access to plan data',
        resource: 'plan',
        action: 'write',
      }, tx);

      // Create plan role
      const planRole = await this.createRole({
        name: 'plan-user',
        description: 'Plan journey user role',
        permissions: [planReadPermission, planWritePermission],
      }, tx);

      // Combine with any additional permissions
      const permissions = [
        planReadPermission,
        planWritePermission,
        ...(options.permissions || []),
      ];

      // Combine with any additional roles
      const roles = [
        planRole,
        ...(options.roles || []),
      ];

      // Create the user with plan journey permissions
      const user = await this.createUser({
        ...options,
        roles,
        permissions,
      }, tx);

      // If specified, create related plan journey data
      if (options.plans) {
        // Create sample plans for this user
        // This would connect to the plan service database
        // Implementation depends on the plan service schema
      }

      if (options.claims) {
        // Create sample claims for this user
        // This would connect to the plan service database
        // Implementation depends on the plan service schema
      }

      if (options.benefits) {
        // Create sample benefits for this user
        // This would connect to the plan service database
        // Implementation depends on the plan service schema
      }

      return user;
    });
  }

  /**
   * Executes a function within a transaction for test isolation
   * @param fn Function to execute within a transaction
   * @returns Result of the function execution
   */
  async withTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.transactionService.withTransaction(fn);
  }

  /**
   * Retrieves a user by ID with optional relations
   * @param id User ID
   * @param includeRoles Whether to include roles
   * @param includePermissions Whether to include permissions
   * @returns The user with requested relations
   */
  async getUserById(id: string, includeRoles = false, includePermissions = false): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: includeRoles ? {
          include: {
            role: true,
          },
        } : undefined,
        permissions: includePermissions ? {
          include: {
            permission: true,
          },
        } : undefined,
      },
    });
  }

  /**
   * Retrieves a role by ID with optional relations
   * @param id Role ID
   * @param includePermissions Whether to include permissions
   * @returns The role with requested relations
   */
  async getRoleById(id: string, includePermissions = false): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: includePermissions ? {
          include: {
            permission: true,
          },
        } : undefined,
      },
    });
  }

  /**
   * Retrieves a permission by ID
   * @param id Permission ID
   * @returns The permission
   */
  async getPermissionById(id: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  /**
   * Cleans up all test data created by this helper
   */
  async cleanup(): Promise<void> {
    await this.transactionService.withTransaction(async (tx) => {
      // Delete user permissions and roles first (junction tables)
      for (const user of this.testEntities.users) {
        await tx.userPermission.deleteMany({
          where: { userId: user.id },
        });
        
        await tx.userRole.deleteMany({
          where: { userId: user.id },
        });
      }

      // Delete role permissions (junction table)
      for (const role of this.testEntities.roles) {
        await tx.rolePermission.deleteMany({
          where: { roleId: role.id },
        });
      }

      // Delete users
      if (this.testEntities.users.length > 0) {
        await tx.user.deleteMany({
          where: {
            id: { in: this.testEntities.users.map(u => u.id) },
          },
        });
      }

      // Delete roles
      if (this.testEntities.roles.length > 0) {
        await tx.role.deleteMany({
          where: {
            id: { in: this.testEntities.roles.map(r => r.id) },
          },
        });
      }

      // Delete permissions
      if (this.testEntities.permissions.length > 0) {
        await tx.permission.deleteMany({
          where: {
            id: { in: this.testEntities.permissions.map(p => p.id) },
          },
        });
      }
    });

    // Reset tracked entities
    this.testEntities = {
      users: [],
      roles: [],
      permissions: [],
    };
  }

  /**
   * Closes the database connection
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

/**
 * Creates a singleton instance of the AuthTestDatabaseHelper
 */
export const createAuthTestDatabaseHelper = (): AuthTestDatabaseHelper => {
  return new AuthTestDatabaseHelper();
};