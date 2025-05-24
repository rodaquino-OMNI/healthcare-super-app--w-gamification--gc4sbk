/**
 * Mock implementation of the PrismaService tailored for auth package testing.
 * Simulates database operations for User, Role, Permission, and UserRole models
 * with predefined test data, eliminating the need for a live database during tests.
 */
import { jest } from '@jest/globals';
import { JourneyType } from '../../src/interfaces/role.interface';

/**
 * Type definitions for the mock Prisma models
 */
interface MockUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  cpf?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockRole {
  id: number;
  name: string;
  description?: string;
  journeyType: JourneyType;
  createdAt: Date;
  updatedAt: Date;
}

interface MockPermission {
  id: number;
  name: string;
  description: string;
  journeyType: JourneyType;
  createdAt: Date;
  updatedAt: Date;
}

interface MockUserRole {
  id: number;
  userId: string;
  roleId: number;
  journeyType: JourneyType;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Predefined test data for auth models
 */
const mockUsers: MockUser[] = [
  {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
    phone: '+5511999999999',
    cpf: '12345678900',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: '2',
    name: 'Admin User',
    email: 'admin@example.com',
    password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
    phone: '+5511888888888',
    cpf: '98765432100',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: '3',
    name: 'Health Journey User',
    email: 'health@example.com',
    password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: '4',
    name: 'Care Journey User',
    email: 'care@example.com',
    password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: '5',
    name: 'Plan Journey User',
    email: 'plan@example.com',
    password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  }
];

const mockRoles: MockRole[] = [
  {
    id: 1,
    name: 'Admin',
    description: 'Global administrator with full access',
    journeyType: JourneyType.GLOBAL,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 2,
    name: 'User',
    description: 'Regular user with basic access',
    journeyType: JourneyType.GLOBAL,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 3,
    name: 'HealthUser',
    description: 'User with access to health journey features',
    journeyType: JourneyType.HEALTH,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 4,
    name: 'CareUser',
    description: 'User with access to care journey features',
    journeyType: JourneyType.CARE,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 5,
    name: 'PlanUser',
    description: 'User with access to plan journey features',
    journeyType: JourneyType.PLAN,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  }
];

const mockPermissions: MockPermission[] = [
  {
    id: 1,
    name: 'user:read',
    description: 'Read user information',
    journeyType: JourneyType.GLOBAL,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 2,
    name: 'user:write',
    description: 'Create and update user information',
    journeyType: JourneyType.GLOBAL,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 3,
    name: 'user:delete',
    description: 'Delete user accounts',
    journeyType: JourneyType.GLOBAL,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 4,
    name: 'health:read',
    description: 'Read health journey data',
    journeyType: JourneyType.HEALTH,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 5,
    name: 'health:write',
    description: 'Create and update health journey data',
    journeyType: JourneyType.HEALTH,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 6,
    name: 'care:read',
    description: 'Read care journey data',
    journeyType: JourneyType.CARE,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 7,
    name: 'care:write',
    description: 'Create and update care journey data',
    journeyType: JourneyType.CARE,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 8,
    name: 'plan:read',
    description: 'Read plan journey data',
    journeyType: JourneyType.PLAN,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 9,
    name: 'plan:write',
    description: 'Create and update plan journey data',
    journeyType: JourneyType.PLAN,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  }
];

const mockUserRoles: MockUserRole[] = [
  {
    id: 1,
    userId: '1',
    roleId: 2, // Regular user
    journeyType: JourneyType.GLOBAL,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 2,
    userId: '2',
    roleId: 1, // Admin
    journeyType: JourneyType.GLOBAL,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 3,
    userId: '3',
    roleId: 3, // HealthUser
    journeyType: JourneyType.HEALTH,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 4,
    userId: '4',
    roleId: 4, // CareUser
    journeyType: JourneyType.CARE,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 5,
    userId: '5',
    roleId: 5, // PlanUser
    journeyType: JourneyType.PLAN,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  }
];

/**
 * Helper function to deep clone objects to prevent test data mutation
 */
const cloneData = <T>(data: T): T => JSON.parse(JSON.stringify(data));

/**
 * Helper function to filter data based on where conditions
 */
const filterData = <T extends Record<string, any>>(data: T[], where: any): T[] => {
  if (!where) return cloneData(data);

  return data.filter(item => {
    return Object.entries(where).every(([key, value]) => {
      // Handle nested conditions
      if (key === 'OR' && Array.isArray(value)) {
        return value.some(condition => filterData([item], condition).length > 0);
      }
      
      if (key === 'AND' && Array.isArray(value)) {
        return value.every(condition => filterData([item], condition).length > 0);
      }
      
      // Handle special operators
      if (typeof value === 'object' && value !== null) {
        return Object.entries(value).every(([op, opValue]) => {
          switch (op) {
            case 'equals':
              return item[key] === opValue;
            case 'not':
              return item[key] !== opValue;
            case 'in':
              return Array.isArray(opValue) && opValue.includes(item[key]);
            case 'notIn':
              return Array.isArray(opValue) && !opValue.includes(item[key]);
            case 'contains':
              return typeof item[key] === 'string' && item[key].includes(String(opValue));
            case 'startsWith':
              return typeof item[key] === 'string' && item[key].startsWith(String(opValue));
            case 'endsWith':
              return typeof item[key] === 'string' && item[key].endsWith(String(opValue));
            default:
              return false;
          }
        });
      }
      
      // Direct equality comparison
      return item[key] === value;
    });
  });
};

/**
 * Helper function to include related data
 */
const includeRelated = <T extends Record<string, any>>(data: T[], include: any): T[] => {
  if (!include) return cloneData(data);

  return data.map(item => {
    const result = { ...item };
    
    Object.entries(include).forEach(([key, value]) => {
      if (key === 'roles' && value === true) {
        // Include roles for a user
        if ('id' in item) {
          const userRoles = filterData(mockUserRoles, { userId: item.id });
          result.roles = userRoles.map(ur => {
            const role = filterData(mockRoles, { id: ur.roleId })[0];
            return role ? { ...role } : null;
          }).filter(Boolean);
        }
      }
      
      if (key === 'permissions' && value === true) {
        // This is a simplified implementation
        // In a real scenario, you would need to handle the role-permission relationship
        if ('id' in item && 'journeyType' in item) {
          result.permissions = filterData(mockPermissions, { journeyType: item.journeyType });
        }
      }
      
      if (key === 'user' && value === true) {
        // Include user for a user role
        if ('userId' in item) {
          const user = filterData(mockUsers, { id: item.userId })[0];
          result.user = user ? { ...user } : null;
        }
      }
      
      if (key === 'role' && value === true) {
        // Include role for a user role
        if ('roleId' in item) {
          const role = filterData(mockRoles, { id: item.roleId })[0];
          result.role = role ? { ...role } : null;
        }
      }
    });
    
    return result;
  });
};

/**
 * Helper function to select specific fields
 */
const selectFields = <T extends Record<string, any>>(data: T[], select: any): Partial<T>[] => {
  if (!select) return cloneData(data);

  return data.map(item => {
    const result: Partial<T> = {};
    
    Object.entries(select).forEach(([key, value]) => {
      if (value === true && key in item) {
        result[key as keyof T] = item[key];
      }
    });
    
    return result;
  });
};

/**
 * Helper function to order data
 */
const orderData = <T extends Record<string, any>>(data: T[], orderBy: any): T[] => {
  if (!orderBy) return cloneData(data);

  const result = cloneData(data);
  
  return result.sort((a, b) => {
    for (const [field, direction] of Object.entries(orderBy)) {
      if (!(field in a) || !(field in b)) continue;
      
      if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
      if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
    }
    
    return 0;
  });
};

/**
 * Helper function to paginate data
 */
const paginateData = <T>(data: T[], skip?: number, take?: number): T[] => {
  let result = cloneData(data);
  
  if (skip !== undefined) {
    result = result.slice(skip);
  }
  
  if (take !== undefined) {
    result = result.slice(0, take);
  }
  
  return result;
};

/**
 * Create a mock implementation of the Prisma client for auth testing
 */
export const createPrismaMock = () => {
  // Local copies of data that can be modified during tests
  let users = cloneData(mockUsers);
  let roles = cloneData(mockRoles);
  let permissions = cloneData(mockPermissions);
  let userRoles = cloneData(mockUserRoles);

  // Reset data to initial state
  const resetData = () => {
    users = cloneData(mockUsers);
    roles = cloneData(mockRoles);
    permissions = cloneData(mockPermissions);
    userRoles = cloneData(mockUserRoles);
  };

  // Mock implementation of the user model
  const userMock = {
    findUnique: jest.fn().mockImplementation(({ where, include, select }) => {
      const filtered = filterData(users, where);
      if (filtered.length === 0) return null;
      
      let result = includeRelated(filtered, include);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    findFirst: jest.fn().mockImplementation(({ where, include, select, orderBy }) => {
      const filtered = filterData(users, where);
      if (filtered.length === 0) return null;
      
      let result = includeRelated(filtered, include);
      if (orderBy) result = orderData(result, orderBy);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    findMany: jest.fn().mockImplementation(({ where, include, select, orderBy, skip, take }) => {
      let result = filterData(users, where);
      
      result = includeRelated(result, include);
      if (orderBy) result = orderData(result, orderBy);
      result = paginateData(result, skip, take);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result);
    }),
    create: jest.fn().mockImplementation(({ data, include, select }) => {
      const newUser: MockUser = {
        id: String(users.length + 1),
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        cpf: data.cpf,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      users.push(newUser);
      
      let result = [newUser];
      result = includeRelated(result, include);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    update: jest.fn().mockImplementation(({ where, data, include, select }) => {
      const index = users.findIndex(user => {
        return Object.entries(where).every(([key, value]) => user[key as keyof MockUser] === value);
      });
      
      if (index === -1) throw new Error('User not found');
      
      users[index] = {
        ...users[index],
        ...data,
        updatedAt: new Date(),
      };
      
      let result = [users[index]];
      result = includeRelated(result, include);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    delete: jest.fn().mockImplementation(({ where, include, select }) => {
      const index = users.findIndex(user => {
        return Object.entries(where).every(([key, value]) => user[key as keyof MockUser] === value);
      });
      
      if (index === -1) throw new Error('User not found');
      
      const deletedUser = users[index];
      users.splice(index, 1);
      
      let result = [deletedUser];
      result = includeRelated(result, include);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    count: jest.fn().mockImplementation(({ where }) => {
      const filtered = filterData(users, where);
      return Promise.resolve(filtered.length);
    }),
  };

  // Mock implementation of the role model
  const roleMock = {
    findUnique: jest.fn().mockImplementation(({ where, include, select }) => {
      const filtered = filterData(roles, where);
      if (filtered.length === 0) return null;
      
      let result = includeRelated(filtered, include);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    findFirst: jest.fn().mockImplementation(({ where, include, select, orderBy }) => {
      const filtered = filterData(roles, where);
      if (filtered.length === 0) return null;
      
      let result = includeRelated(filtered, include);
      if (orderBy) result = orderData(result, orderBy);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    findMany: jest.fn().mockImplementation(({ where, include, select, orderBy, skip, take }) => {
      let result = filterData(roles, where);
      
      result = includeRelated(result, include);
      if (orderBy) result = orderData(result, orderBy);
      result = paginateData(result, skip, take);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result);
    }),
    create: jest.fn().mockImplementation(({ data, include, select }) => {
      const newRole: MockRole = {
        id: roles.length + 1,
        name: data.name,
        description: data.description,
        journeyType: data.journeyType,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      roles.push(newRole);
      
      let result = [newRole];
      result = includeRelated(result, include);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    update: jest.fn().mockImplementation(({ where, data, include, select }) => {
      const index = roles.findIndex(role => {
        return Object.entries(where).every(([key, value]) => role[key as keyof MockRole] === value);
      });
      
      if (index === -1) throw new Error('Role not found');
      
      roles[index] = {
        ...roles[index],
        ...data,
        updatedAt: new Date(),
      };
      
      let result = [roles[index]];
      result = includeRelated(result, include);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    delete: jest.fn().mockImplementation(({ where, include, select }) => {
      const index = roles.findIndex(role => {
        return Object.entries(where).every(([key, value]) => role[key as keyof MockRole] === value);
      });
      
      if (index === -1) throw new Error('Role not found');
      
      const deletedRole = roles[index];
      roles.splice(index, 1);
      
      let result = [deletedRole];
      result = includeRelated(result, include);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    count: jest.fn().mockImplementation(({ where }) => {
      const filtered = filterData(roles, where);
      return Promise.resolve(filtered.length);
    }),
  };

  // Mock implementation of the permission model
  const permissionMock = {
    findUnique: jest.fn().mockImplementation(({ where, include, select }) => {
      const filtered = filterData(permissions, where);
      if (filtered.length === 0) return null;
      
      let result = includeRelated(filtered, include);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    findFirst: jest.fn().mockImplementation(({ where, include, select, orderBy }) => {
      const filtered = filterData(permissions, where);
      if (filtered.length === 0) return null;
      
      let result = includeRelated(filtered, include);
      if (orderBy) result = orderData(result, orderBy);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    findMany: jest.fn().mockImplementation(({ where, include, select, orderBy, skip, take }) => {
      let result = filterData(permissions, where);
      
      result = includeRelated(result, include);
      if (orderBy) result = orderData(result, orderBy);
      result = paginateData(result, skip, take);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result);
    }),
    create: jest.fn().mockImplementation(({ data, include, select }) => {
      const newPermission: MockPermission = {
        id: permissions.length + 1,
        name: data.name,
        description: data.description,
        journeyType: data.journeyType,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      permissions.push(newPermission);
      
      let result = [newPermission];
      result = includeRelated(result, include);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    update: jest.fn().mockImplementation(({ where, data, include, select }) => {
      const index = permissions.findIndex(permission => {
        return Object.entries(where).every(([key, value]) => permission[key as keyof MockPermission] === value);
      });
      
      if (index === -1) throw new Error('Permission not found');
      
      permissions[index] = {
        ...permissions[index],
        ...data,
        updatedAt: new Date(),
      };
      
      let result = [permissions[index]];
      result = includeRelated(result, include);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    delete: jest.fn().mockImplementation(({ where, include, select }) => {
      const index = permissions.findIndex(permission => {
        return Object.entries(where).every(([key, value]) => permission[key as keyof MockPermission] === value);
      });
      
      if (index === -1) throw new Error('Permission not found');
      
      const deletedPermission = permissions[index];
      permissions.splice(index, 1);
      
      let result = [deletedPermission];
      result = includeRelated(result, include);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    count: jest.fn().mockImplementation(({ where }) => {
      const filtered = filterData(permissions, where);
      return Promise.resolve(filtered.length);
    }),
  };

  // Mock implementation of the userRole model
  const userRoleMock = {
    findUnique: jest.fn().mockImplementation(({ where, include, select }) => {
      const filtered = filterData(userRoles, where);
      if (filtered.length === 0) return null;
      
      let result = includeRelated(filtered, include);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    findFirst: jest.fn().mockImplementation(({ where, include, select, orderBy }) => {
      const filtered = filterData(userRoles, where);
      if (filtered.length === 0) return null;
      
      let result = includeRelated(filtered, include);
      if (orderBy) result = orderData(result, orderBy);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    findMany: jest.fn().mockImplementation(({ where, include, select, orderBy, skip, take }) => {
      let result = filterData(userRoles, where);
      
      result = includeRelated(result, include);
      if (orderBy) result = orderData(result, orderBy);
      result = paginateData(result, skip, take);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result);
    }),
    create: jest.fn().mockImplementation(({ data, include, select }) => {
      const newUserRole: MockUserRole = {
        id: userRoles.length + 1,
        userId: data.userId,
        roleId: data.roleId,
        journeyType: data.journeyType,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      userRoles.push(newUserRole);
      
      let result = [newUserRole];
      result = includeRelated(result, include);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    update: jest.fn().mockImplementation(({ where, data, include, select }) => {
      const index = userRoles.findIndex(userRole => {
        return Object.entries(where).every(([key, value]) => userRole[key as keyof MockUserRole] === value);
      });
      
      if (index === -1) throw new Error('UserRole not found');
      
      userRoles[index] = {
        ...userRoles[index],
        ...data,
        updatedAt: new Date(),
      };
      
      let result = [userRoles[index]];
      result = includeRelated(result, include);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    delete: jest.fn().mockImplementation(({ where, include, select }) => {
      const index = userRoles.findIndex(userRole => {
        return Object.entries(where).every(([key, value]) => userRole[key as keyof MockUserRole] === value);
      });
      
      if (index === -1) throw new Error('UserRole not found');
      
      const deletedUserRole = userRoles[index];
      userRoles.splice(index, 1);
      
      let result = [deletedUserRole];
      result = includeRelated(result, include);
      if (select) result = selectFields(result, select);
      
      return Promise.resolve(result[0]);
    }),
    count: jest.fn().mockImplementation(({ where }) => {
      const filtered = filterData(userRoles, where);
      return Promise.resolve(filtered.length);
    }),
  };

  // Mock implementation of transaction methods
  const $transaction = jest.fn().mockImplementation(async (callback) => {
    if (typeof callback === 'function') {
      return callback(prismaMock);
    }
    return Promise.all(callback);
  });

  // Create the complete Prisma mock
  const prismaMock = {
    user: userMock,
    role: roleMock,
    permission: permissionMock,
    userRole: userRoleMock,
    $transaction,
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $on: jest.fn(),
    $use: jest.fn(),
    $executeRaw: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([]),
    _resetData: resetData,
  };

  return prismaMock;
};

/**
 * Mock implementation of the PrismaService for auth package testing
 */
export class PrismaMock {
  private prisma = createPrismaMock();

  /**
   * Get the mock Prisma client instance
   */
  get client() {
    return this.prisma;
  }

  /**
   * Reset the mock data to its initial state
   */
  resetData() {
    this.prisma._resetData();
  }

  /**
   * Mock implementation of onModuleInit lifecycle method
   */
  async onModuleInit() {
    await this.prisma.$connect();
  }

  /**
   * Mock implementation of onModuleDestroy lifecycle method
   */
  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  /**
   * Mock implementation of enableShutdownHooks method
   */
  enableShutdownHooks(app: any) {
    // This is a mock implementation, so we don't need to do anything
  }
}

/**
 * Default export of the PrismaMock class
 */
export default PrismaMock;