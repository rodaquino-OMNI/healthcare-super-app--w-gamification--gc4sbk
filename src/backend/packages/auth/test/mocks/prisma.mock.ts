/**
 * @file prisma.mock.ts
 * @description Mock implementation of PrismaService for auth package testing
 * Simulates database operations for User, Role, Permission, and UserRole models
 * with predefined test data, eliminating the need for a live database during tests.
 */

import { JourneyType } from '../../src/interfaces/role.interface';

/**
 * Mock data types that match the Prisma models for auth testing
 */
interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  cpf?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockRole {
  id: number;
  name: string;
  description: string;
  journey?: JourneyType | null;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MockPermission {
  id: number;
  name: string;
  description: string;
  journey?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockUserRole {
  id: number;
  userId: string;
  roleId: number;
  journeyContext?: JourneyType | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mock data store for auth testing
 */
interface MockDataStore {
  users: MockUser[];
  roles: MockRole[];
  permissions: MockPermission[];
  userRoles: MockUserRole[];
}

/**
 * Predefined test data for auth testing
 */
const mockData: MockDataStore = {
  users: [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@austa.health',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
      phone: '+5511999999999',
      cpf: '12345678900',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: '2',
      name: 'Health Journey User',
      email: 'health@austa.health',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
      phone: '+5511888888888',
      cpf: '98765432100',
      createdAt: new Date('2023-01-02T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z')
    },
    {
      id: '3',
      name: 'Care Journey User',
      email: 'care@austa.health',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
      createdAt: new Date('2023-01-03T00:00:00Z'),
      updatedAt: new Date('2023-01-03T00:00:00Z')
    },
    {
      id: '4',
      name: 'Plan Journey User',
      email: 'plan@austa.health',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
      createdAt: new Date('2023-01-04T00:00:00Z'),
      updatedAt: new Date('2023-01-04T00:00:00Z')
    },
    {
      id: '5',
      name: 'Regular User',
      email: 'user@austa.health',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
      createdAt: new Date('2023-01-05T00:00:00Z'),
      updatedAt: new Date('2023-01-05T00:00:00Z')
    }
  ],
  roles: [
    {
      id: 1,
      name: 'Admin',
      description: 'Administrator with full access',
      journey: JourneyType.GLOBAL,
      isDefault: false,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 2,
      name: 'User',
      description: 'Regular user with basic access',
      journey: JourneyType.GLOBAL,
      isDefault: true,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 3,
      name: 'Health Manager',
      description: 'User with health journey management capabilities',
      journey: JourneyType.HEALTH,
      isDefault: false,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 4,
      name: 'Care Provider',
      description: 'Healthcare provider with care journey access',
      journey: JourneyType.CARE,
      isDefault: false,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 5,
      name: 'Plan Administrator',
      description: 'Insurance plan administrator',
      journey: JourneyType.PLAN,
      isDefault: false,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    }
  ],
  permissions: [
    {
      id: 1,
      name: 'health:metrics:read',
      description: 'Read health metrics',
      journey: 'health',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 2,
      name: 'health:metrics:write',
      description: 'Create and update health metrics',
      journey: 'health',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 3,
      name: 'care:appointments:read',
      description: 'Read care appointments',
      journey: 'care',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 4,
      name: 'care:appointments:write',
      description: 'Create and update care appointments',
      journey: 'care',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 5,
      name: 'plan:claims:read',
      description: 'Read insurance claims',
      journey: 'plan',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 6,
      name: 'plan:claims:write',
      description: 'Create and update insurance claims',
      journey: 'plan',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 7,
      name: 'admin:users:read',
      description: 'Read user information',
      journey: 'global',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 8,
      name: 'admin:users:write',
      description: 'Create and update users',
      journey: 'global',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    }
  ],
  userRoles: [
    {
      id: 1,
      userId: '1',
      roleId: 1, // Admin
      journeyContext: null,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 2,
      userId: '2',
      roleId: 2, // User
      journeyContext: null,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 3,
      userId: '2',
      roleId: 3, // Health Manager
      journeyContext: JourneyType.HEALTH,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 4,
      userId: '3',
      roleId: 2, // User
      journeyContext: null,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 5,
      userId: '3',
      roleId: 4, // Care Provider
      journeyContext: JourneyType.CARE,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 6,
      userId: '4',
      roleId: 2, // User
      journeyContext: null,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 7,
      userId: '4',
      roleId: 5, // Plan Administrator
      journeyContext: JourneyType.PLAN,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    },
    {
      id: 8,
      userId: '5',
      roleId: 2, // User
      journeyContext: null,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z')
    }
  ]
};

/**
 * Helper type for Prisma query filters
 */
type FilterCondition<T> = Partial<T> | ((item: T) => boolean);

/**
 * Helper function to apply filters to collections
 */
function applyFilter<T>(items: T[], filter?: FilterCondition<T>): T[] {
  if (!filter) return [...items];
  
  if (typeof filter === 'function') {
    return items.filter(filter);
  }
  
  return items.filter(item => {
    for (const [key, value] of Object.entries(filter)) {
      if (item[key] !== value) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Helper function to apply pagination
 */
function applyPagination<T>(items: T[], skip?: number, take?: number): T[] {
  let result = [...items];
  
  if (skip !== undefined) {
    result = result.slice(skip);
  }
  
  if (take !== undefined) {
    result = result.slice(0, take);
  }
  
  return result;
}

/**
 * Helper function to generate a new ID
 */
function generateId(collection: any[]): number | string {
  if (collection.length === 0) return 1;
  
  const lastId = collection[collection.length - 1].id;
  return typeof lastId === 'number' ? lastId + 1 : String(Number(lastId) + 1);
}

/**
 * Mock implementation of PrismaService for auth package testing
 */
export class PrismaMock {
  private data: MockDataStore = JSON.parse(JSON.stringify(mockData)); // Deep clone to avoid modifying the original

  /**
   * Reset the mock data to its initial state
   */
  reset(): void {
    this.data = JSON.parse(JSON.stringify(mockData));
  }

  /**
   * User model operations
   */
  user = {
    findUnique: jest.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.id) {
        return this.data.users.find(user => user.id === where.id) || null;
      }
      if (where.email) {
        return this.data.users.find(user => user.email === where.email) || null;
      }
      return null;
    }),

    findFirst: jest.fn(async ({ where }: { where?: FilterCondition<MockUser> }) => {
      const filtered = applyFilter(this.data.users, where);
      return filtered.length > 0 ? filtered[0] : null;
    }),

    findMany: jest.fn(async ({ 
      where, 
      skip, 
      take,
      include
    }: { 
      where?: FilterCondition<MockUser>; 
      skip?: number; 
      take?: number;
      include?: { roles?: boolean; permissions?: boolean }
    } = {}) => {
      let users = applyFilter(this.data.users, where);
      users = applyPagination(users, skip, take);

      // Handle includes for relationships
      if (include) {
        return users.map(user => {
          const result: any = { ...user };

          if (include.roles) {
            const userRoles = this.data.userRoles.filter(ur => ur.userId === user.id);
            result.roles = userRoles.map(ur => 
              this.data.roles.find(role => role.id === ur.roleId)
            ).filter(Boolean);
          }

          if (include.permissions) {
            // Get all roles for this user
            const userRoles = this.data.userRoles.filter(ur => ur.userId === user.id);
            const roleIds = userRoles.map(ur => ur.roleId);
            
            // For simplicity, we're assuming a direct relationship between roles and permissions
            // In a real implementation, this would use a role_permissions join table
            const rolePermissions = this.data.permissions.filter(p => {
              // Match permissions to roles based on journey
              const matchingRoles = this.data.roles.filter(r => 
                roleIds.includes(r.id) && 
                r.journey === p.journey
              );
              return matchingRoles.length > 0;
            });
            
            result.permissions = rolePermissions;
          }

          return result;
        });
      }

      return users;
    }),

    create: jest.fn(async ({ data }: { data: Omit<MockUser, 'id' | 'createdAt' | 'updatedAt'> }) => {
      const newUser: MockUser = {
        id: String(generateId(this.data.users)),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.data.users.push(newUser);
      return newUser;
    }),

    update: jest.fn(async ({ 
      where, 
      data 
    }: { 
      where: { id: string }; 
      data: Partial<Omit<MockUser, 'id' | 'createdAt'>> 
    }) => {
      const index = this.data.users.findIndex(user => user.id === where.id);
      if (index === -1) throw new Error(`User with ID ${where.id} not found`);

      const updatedUser = {
        ...this.data.users[index],
        ...data,
        updatedAt: new Date()
      };

      this.data.users[index] = updatedUser;
      return updatedUser;
    }),

    delete: jest.fn(async ({ where }: { where: { id: string } }) => {
      const index = this.data.users.findIndex(user => user.id === where.id);
      if (index === -1) throw new Error(`User with ID ${where.id} not found`);

      const deletedUser = this.data.users[index];
      this.data.users.splice(index, 1);

      // Also delete related user roles
      this.data.userRoles = this.data.userRoles.filter(ur => ur.userId !== where.id);

      return deletedUser;
    }),

    count: jest.fn(async ({ where }: { where?: FilterCondition<MockUser> } = {}) => {
      return applyFilter(this.data.users, where).length;
    })
  };

  /**
   * Role model operations
   */
  role = {
    findUnique: jest.fn(async ({ where }: { where: { id?: number; name?: string } }) => {
      if (where.id !== undefined) {
        return this.data.roles.find(role => role.id === where.id) || null;
      }
      if (where.name) {
        return this.data.roles.find(role => role.name === where.name) || null;
      }
      return null;
    }),

    findFirst: jest.fn(async ({ where }: { where?: FilterCondition<MockRole> }) => {
      const filtered = applyFilter(this.data.roles, where);
      return filtered.length > 0 ? filtered[0] : null;
    }),

    findMany: jest.fn(async ({ 
      where, 
      skip, 
      take,
      include
    }: { 
      where?: FilterCondition<MockRole>; 
      skip?: number; 
      take?: number;
      include?: { permissions?: boolean; users?: boolean }
    } = {}) => {
      let roles = applyFilter(this.data.roles, where);
      roles = applyPagination(roles, skip, take);

      // Handle includes for relationships
      if (include) {
        return roles.map(role => {
          const result: any = { ...role };

          if (include.permissions) {
            // For simplicity, we're assuming a direct relationship between roles and permissions
            // based on journey type
            result.permissions = this.data.permissions.filter(p => 
              p.journey === role.journey || role.journey === JourneyType.GLOBAL
            );
          }

          if (include.users) {
            const userRoles = this.data.userRoles.filter(ur => ur.roleId === role.id);
            const userIds = userRoles.map(ur => ur.userId);
            result.users = this.data.users.filter(user => userIds.includes(user.id));
          }

          return result;
        });
      }

      return roles;
    }),

    create: jest.fn(async ({ data }: { data: Omit<MockRole, 'id' | 'createdAt' | 'updatedAt'> }) => {
      const newRole: MockRole = {
        id: Number(generateId(this.data.roles)),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.data.roles.push(newRole);
      return newRole;
    }),

    update: jest.fn(async ({ 
      where, 
      data 
    }: { 
      where: { id: number }; 
      data: Partial<Omit<MockRole, 'id' | 'createdAt'>> 
    }) => {
      const index = this.data.roles.findIndex(role => role.id === where.id);
      if (index === -1) throw new Error(`Role with ID ${where.id} not found`);

      const updatedRole = {
        ...this.data.roles[index],
        ...data,
        updatedAt: new Date()
      };

      this.data.roles[index] = updatedRole;
      return updatedRole;
    }),

    delete: jest.fn(async ({ where }: { where: { id: number } }) => {
      const index = this.data.roles.findIndex(role => role.id === where.id);
      if (index === -1) throw new Error(`Role with ID ${where.id} not found`);

      const deletedRole = this.data.roles[index];
      this.data.roles.splice(index, 1);

      // Also delete related user roles
      this.data.userRoles = this.data.userRoles.filter(ur => ur.roleId !== where.id);

      return deletedRole;
    }),

    count: jest.fn(async ({ where }: { where?: FilterCondition<MockRole> } = {}) => {
      return applyFilter(this.data.roles, where).length;
    })
  };

  /**
   * Permission model operations
   */
  permission = {
    findUnique: jest.fn(async ({ where }: { where: { id?: number; name?: string } }) => {
      if (where.id !== undefined) {
        return this.data.permissions.find(permission => permission.id === where.id) || null;
      }
      if (where.name) {
        return this.data.permissions.find(permission => permission.name === where.name) || null;
      }
      return null;
    }),

    findFirst: jest.fn(async ({ where }: { where?: FilterCondition<MockPermission> }) => {
      const filtered = applyFilter(this.data.permissions, where);
      return filtered.length > 0 ? filtered[0] : null;
    }),

    findMany: jest.fn(async ({ 
      where, 
      skip, 
      take 
    }: { 
      where?: FilterCondition<MockPermission>; 
      skip?: number; 
      take?: number 
    } = {}) => {
      let permissions = applyFilter(this.data.permissions, where);
      permissions = applyPagination(permissions, skip, take);
      return permissions;
    }),

    create: jest.fn(async ({ data }: { data: Omit<MockPermission, 'id' | 'createdAt' | 'updatedAt'> }) => {
      const newPermission: MockPermission = {
        id: Number(generateId(this.data.permissions)),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.data.permissions.push(newPermission);
      return newPermission;
    }),

    update: jest.fn(async ({ 
      where, 
      data 
    }: { 
      where: { id: number }; 
      data: Partial<Omit<MockPermission, 'id' | 'createdAt'>> 
    }) => {
      const index = this.data.permissions.findIndex(permission => permission.id === where.id);
      if (index === -1) throw new Error(`Permission with ID ${where.id} not found`);

      const updatedPermission = {
        ...this.data.permissions[index],
        ...data,
        updatedAt: new Date()
      };

      this.data.permissions[index] = updatedPermission;
      return updatedPermission;
    }),

    delete: jest.fn(async ({ where }: { where: { id: number } }) => {
      const index = this.data.permissions.findIndex(permission => permission.id === where.id);
      if (index === -1) throw new Error(`Permission with ID ${where.id} not found`);

      const deletedPermission = this.data.permissions[index];
      this.data.permissions.splice(index, 1);
      return deletedPermission;
    }),

    count: jest.fn(async ({ where }: { where?: FilterCondition<MockPermission> } = {}) => {
      return applyFilter(this.data.permissions, where).length;
    })
  };

  /**
   * UserRole model operations
   */
  userRole = {
    findUnique: jest.fn(async ({ where }: { where: { id?: number; userId_roleId?: { userId: string; roleId: number } } }) => {
      if (where.id !== undefined) {
        return this.data.userRoles.find(userRole => userRole.id === where.id) || null;
      }
      if (where.userId_roleId) {
        return this.data.userRoles.find(
          userRole => userRole.userId === where.userId_roleId?.userId && 
                     userRole.roleId === where.userId_roleId?.roleId
        ) || null;
      }
      return null;
    }),

    findFirst: jest.fn(async ({ where }: { where?: FilterCondition<MockUserRole> }) => {
      const filtered = applyFilter(this.data.userRoles, where);
      return filtered.length > 0 ? filtered[0] : null;
    }),

    findMany: jest.fn(async ({ 
      where, 
      skip, 
      take,
      include
    }: { 
      where?: FilterCondition<MockUserRole>; 
      skip?: number; 
      take?: number;
      include?: { user?: boolean; role?: boolean }
    } = {}) => {
      let userRoles = applyFilter(this.data.userRoles, where);
      userRoles = applyPagination(userRoles, skip, take);

      // Handle includes for relationships
      if (include) {
        return userRoles.map(userRole => {
          const result: any = { ...userRole };

          if (include.user) {
            result.user = this.data.users.find(user => user.id === userRole.userId) || null;
          }

          if (include.role) {
            result.role = this.data.roles.find(role => role.id === userRole.roleId) || null;
          }

          return result;
        });
      }

      return userRoles;
    }),

    create: jest.fn(async ({ data }: { data: Omit<MockUserRole, 'id' | 'createdAt' | 'updatedAt'> }) => {
      // Check if user and role exist
      const userExists = this.data.users.some(user => user.id === data.userId);
      if (!userExists) throw new Error(`User with ID ${data.userId} not found`);

      const roleExists = this.data.roles.some(role => role.id === data.roleId);
      if (!roleExists) throw new Error(`Role with ID ${data.roleId} not found`);

      const newUserRole: MockUserRole = {
        id: Number(generateId(this.data.userRoles)),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.data.userRoles.push(newUserRole);
      return newUserRole;
    }),

    update: jest.fn(async ({ 
      where, 
      data 
    }: { 
      where: { id: number }; 
      data: Partial<Omit<MockUserRole, 'id' | 'createdAt'>> 
    }) => {
      const index = this.data.userRoles.findIndex(userRole => userRole.id === where.id);
      if (index === -1) throw new Error(`UserRole with ID ${where.id} not found`);

      // Check if user and role exist if they're being updated
      if (data.userId) {
        const userExists = this.data.users.some(user => user.id === data.userId);
        if (!userExists) throw new Error(`User with ID ${data.userId} not found`);
      }

      if (data.roleId) {
        const roleExists = this.data.roles.some(role => role.id === data.roleId);
        if (!roleExists) throw new Error(`Role with ID ${data.roleId} not found`);
      }

      const updatedUserRole = {
        ...this.data.userRoles[index],
        ...data,
        updatedAt: new Date()
      };

      this.data.userRoles[index] = updatedUserRole;
      return updatedUserRole;
    }),

    delete: jest.fn(async ({ where }: { where: { id: number } }) => {
      const index = this.data.userRoles.findIndex(userRole => userRole.id === where.id);
      if (index === -1) throw new Error(`UserRole with ID ${where.id} not found`);

      const deletedUserRole = this.data.userRoles[index];
      this.data.userRoles.splice(index, 1);
      return deletedUserRole;
    }),

    count: jest.fn(async ({ where }: { where?: FilterCondition<MockUserRole> } = {}) => {
      return applyFilter(this.data.userRoles, where).length;
    })
  };

  /**
   * Transaction support
   */
  $transaction = jest.fn(async <T>(operations: Promise<T>[]) => {
    try {
      const results = [];
      for (const operation of operations) {
        results.push(await operation);
      }
      return results;
    } catch (error) {
      // Simulate transaction rollback
      this.reset();
      throw error;
    }
  });

  /**
   * Connect method (NestJS lifecycle hook simulation)
   */
  $connect = jest.fn(async () => Promise.resolve());

  /**
   * Disconnect method (NestJS lifecycle hook simulation)
   */
  $disconnect = jest.fn(async () => Promise.resolve());
}

/**
 * Create and export a singleton instance of the PrismaMock
 */
export const prismaMock = new PrismaMock();

/**
 * Export default for easier importing
 */
export default prismaMock;