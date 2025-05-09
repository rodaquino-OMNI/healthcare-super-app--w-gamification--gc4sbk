/**
 * @file Common Test Fixtures
 * 
 * This barrel file exports all common test fixtures for easy importing in test files.
 * It provides centralized access to user, role, and permission fixtures,
 * simplifying test setup and promoting code reuse across all journey services.
 * 
 * @module @austa/database/test/fixtures/common
 */

// Import interfaces from the interfaces package
import {
  IUser,
  IUserProfile,
  IRole,
  IPermission,
  RoleId,
  PermissionId
} from '@austa/interfaces/auth';

// ===================================================
// User Fixtures
// ===================================================

/**
 * Mock user with admin role
 */
export const mockAdminUser: IUser = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Admin User',
  email: 'admin@austa.com.br',
  password: '$2b$10$dummyhashforadminpassword',
  phone: '+5511999999999',
  cpf: '12345678901',
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z')
};

/**
 * Mock regular user with standard permissions
 */
export const mockRegularUser: IUser = {
  id: '00000000-0000-0000-0000-000000000002',
  name: 'Test User',
  email: 'user@austa.com.br',
  password: '$2b$10$dummyhashforuserpassword',
  phone: '+5511888888888',
  cpf: '98765432109',
  createdAt: new Date('2023-01-02T00:00:00Z'),
  updatedAt: new Date('2023-01-02T00:00:00Z')
};

/**
 * Mock caregiver user with limited permissions
 */
export const mockCaregiverUser: IUser = {
  id: '00000000-0000-0000-0000-000000000003',
  name: 'Caregiver User',
  email: 'caregiver@austa.com.br',
  password: '$2b$10$dummyhashforcaregiverpassword',
  phone: '+5511777777777',
  cpf: '45678912345',
  createdAt: new Date('2023-01-03T00:00:00Z'),
  updatedAt: new Date('2023-01-03T00:00:00Z')
};

/**
 * Mock healthcare provider user
 */
export const mockProviderUser: IUser = {
  id: '00000000-0000-0000-0000-000000000004',
  name: 'Provider User',
  email: 'provider@austa.com.br',
  password: '$2b$10$dummyhashforproviderpassword',
  phone: '+5511666666666',
  cpf: '78912345678',
  createdAt: new Date('2023-01-04T00:00:00Z'),
  updatedAt: new Date('2023-01-04T00:00:00Z')
};

// ===================================================
// Role Fixtures
// ===================================================

/**
 * Mock user role with basic permissions
 */
export const mockUserRole: IRole = {
  id: 1,
  name: 'User',
  description: 'Standard user with access to all journeys',
  isDefault: true,
  journey: null,
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z')
};

/**
 * Mock caregiver role with limited permissions
 */
export const mockCaregiverRole: IRole = {
  id: 2,
  name: 'Caregiver',
  description: 'User with delegated access to another user\'s health data',
  isDefault: false,
  journey: null,
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z')
};

/**
 * Mock provider role with healthcare provider permissions
 */
export const mockProviderRole: IRole = {
  id: 3,
  name: 'Provider',
  description: 'Healthcare provider with access to patient data',
  isDefault: false,
  journey: 'care',
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z')
};

/**
 * Mock administrator role with full permissions
 */
export const mockAdminRole: IRole = {
  id: 4,
  name: 'Administrator',
  description: 'System administrator with full access',
  isDefault: false,
  journey: null,
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z')
};

// ===================================================
// Permission Fixtures
// ===================================================

/**
 * Health journey permission fixtures
 */
export const healthPermissions: IPermission[] = [
  {
    id: 1,
    name: 'health:metrics:read',
    description: 'View health metrics',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 2,
    name: 'health:metrics:write',
    description: 'Record health metrics',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 3,
    name: 'health:history:read',
    description: 'View medical history',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 4,
    name: 'health:history:write',
    description: 'Update medical history',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 5,
    name: 'health:goals:read',
    description: 'View health goals',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 6,
    name: 'health:goals:write',
    description: 'Set health goals',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 7,
    name: 'health:devices:read',
    description: 'View connected devices',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 8,
    name: 'health:devices:write',
    description: 'Manage device connections',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  }
];

/**
 * Care journey permission fixtures
 */
export const carePermissions: IPermission[] = [
  {
    id: 9,
    name: 'care:appointments:read',
    description: 'View appointments',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 10,
    name: 'care:appointments:write',
    description: 'Manage appointments',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 11,
    name: 'care:telemedicine:read',
    description: 'View telemedicine sessions',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 12,
    name: 'care:telemedicine:write',
    description: 'Manage telemedicine sessions',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 13,
    name: 'care:medications:read',
    description: 'View medications',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 14,
    name: 'care:medications:write',
    description: 'Manage medications',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 15,
    name: 'care:treatments:read',
    description: 'View treatment plans',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 16,
    name: 'care:treatments:write',
    description: 'Manage treatment plans',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  }
];

/**
 * Plan journey permission fixtures
 */
export const planPermissions: IPermission[] = [
  {
    id: 17,
    name: 'plan:coverage:read',
    description: 'View coverage information',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 18,
    name: 'plan:claims:read',
    description: 'View claims',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 19,
    name: 'plan:claims:write',
    description: 'Submit and manage claims',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 20,
    name: 'plan:benefits:read',
    description: 'View benefits',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 21,
    name: 'plan:documents:read',
    description: 'View insurance documents',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 22,
    name: 'plan:documents:write',
    description: 'Upload insurance documents',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 23,
    name: 'plan:payments:read',
    description: 'View payment information',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 24,
    name: 'plan:simulator:use',
    description: 'Use cost simulator',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  }
];

/**
 * Gamification permission fixtures
 */
export const gamificationPermissions: IPermission[] = [
  {
    id: 25,
    name: 'game:achievements:read',
    description: 'View achievements',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 26,
    name: 'game:progress:read',
    description: 'View progress',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 27,
    name: 'game:rewards:read',
    description: 'View rewards',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 28,
    name: 'game:rewards:redeem',
    description: 'Redeem rewards',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    id: 29,
    name: 'game:leaderboard:read',
    description: 'View leaderboards',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  }
];

/**
 * All permissions combined
 */
export const allPermissions: IPermission[] = [
  ...healthPermissions,
  ...carePermissions,
  ...planPermissions,
  ...gamificationPermissions
];

// ===================================================
// User Namespace
// ===================================================

/**
 * Namespace for user-related test fixtures
 */
export namespace users {
  export const {
    mockAdminUser,
    mockRegularUser,
    mockCaregiverUser,
    mockProviderUser
  } = {
    mockAdminUser,
    mockRegularUser,
    mockCaregiverUser,
    mockProviderUser
  };

  /**
   * Interface for user creation options
   */
  export interface CreateUserOptions {
    id?: string;
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    cpf?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }

  /**
   * Creates a mock user with custom properties
   * @param options Custom properties for the user
   * @returns A mock user with the specified properties
   */
  export function createMockUser(options: CreateUserOptions = {}): IUser {
    const id = options.id || `user-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();
    
    return {
      id,
      name: options.name || `Test User ${id}`,
      email: options.email || `user-${id}@austa.com.br`,
      password: options.password || '$2b$10$dummyhashforpassword',
      phone: options.phone || `+55119${Math.floor(Math.random() * 10000000)}`,
      cpf: options.cpf || `${Math.floor(Math.random() * 100000000000).toString().padStart(11, '0')}`,
      createdAt: options.createdAt || now,
      updatedAt: options.updatedAt || now
    };
  }

  /**
   * Creates a batch of mock users
   * @param count Number of users to create
   * @param baseOptions Base options to apply to all users
   * @returns An array of mock users
   */
  export function createMockUsers(count: number, baseOptions: CreateUserOptions = {}): IUser[] {
    return Array.from({ length: count }, (_, i) => 
      createMockUser({
        ...baseOptions,
        id: baseOptions.id ? `${baseOptions.id}-${i}` : undefined,
        email: baseOptions.email ? `${baseOptions.email.split('@')[0]}-${i}@${baseOptions.email.split('@')[1]}` : undefined
      })
    );
  }

  /**
   * Creates a mock user profile with extended information
   * @param user Base user to extend with profile information
   * @returns A mock user profile
   */
  export function createMockUserProfile(user: IUser): IUserProfile {
    const { password, ...userWithoutPassword } = user;
    
    return {
      ...userWithoutPassword,
      preferredLanguage: 'pt-BR',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'not_specified',
      address: {
        street: 'Rua Exemplo',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        country: 'Brasil'
      },
      emergencyContact: {
        name: 'Contato de Emergência',
        phone: '+5511987654321',
        relationship: 'Familiar'
      },
      notificationPreferences: {
        email: true,
        push: true,
        sms: false,
        inApp: true
      }
    };
  }
}

// ===================================================
// Role Namespace
// ===================================================

/**
 * Namespace for role-related test fixtures
 */
export namespace roles {
  export const {
    mockUserRole,
    mockCaregiverRole,
    mockProviderRole,
    mockAdminRole
  } = {
    mockUserRole,
    mockCaregiverRole,
    mockProviderRole,
    mockAdminRole
  };

  /**
   * Interface for role creation options
   */
  export interface CreateRoleOptions {
    id?: RoleId;
    name?: string;
    description?: string;
    isDefault?: boolean;
    journey?: string | null;
    permissions?: IPermission[];
    createdAt?: Date;
    updatedAt?: Date;
  }

  /**
   * Creates a mock role with custom properties
   * @param options Custom properties for the role
   * @returns A mock role with the specified properties
   */
  export function createMockRole(options: CreateRoleOptions = {}): IRole {
    const id = options.id || Math.floor(Math.random() * 1000) + 100;
    const now = new Date();
    
    return {
      id,
      name: options.name || `Role ${id}`,
      description: options.description || `Description for role ${id}`,
      isDefault: options.isDefault !== undefined ? options.isDefault : false,
      journey: options.journey,
      permissions: options.permissions || [],
      createdAt: options.createdAt || now,
      updatedAt: options.updatedAt || now
    };
  }

  /**
   * Creates a batch of mock roles
   * @param count Number of roles to create
   * @param baseOptions Base options to apply to all roles
   * @returns An array of mock roles
   */
  export function createMockRoles(count: number, baseOptions: CreateRoleOptions = {}): IRole[] {
    return Array.from({ length: count }, (_, i) => 
      createMockRole({
        ...baseOptions,
        id: baseOptions.id ? baseOptions.id + i : undefined,
        name: baseOptions.name ? `${baseOptions.name}-${i}` : undefined
      })
    );
  }

  /**
   * Creates a role with permissions for a specific journey
   * @param journey The journey to create permissions for ('health', 'care', 'plan', or 'game')
   * @param options Additional role options
   * @returns A role with journey-specific permissions
   */
  export function createJourneyRole(journey: 'health' | 'care' | 'plan' | 'game', options: CreateRoleOptions = {}): IRole {
    let journeyPermissions: IPermission[] = [];
    
    switch (journey) {
      case 'health':
        journeyPermissions = healthPermissions;
        break;
      case 'care':
        journeyPermissions = carePermissions;
        break;
      case 'plan':
        journeyPermissions = planPermissions;
        break;
      case 'game':
        journeyPermissions = gamificationPermissions;
        break;
    }
    
    return createMockRole({
      name: options.name || `${journey.charAt(0).toUpperCase() + journey.slice(1)} Role`,
      description: options.description || `Role for ${journey} journey`,
      journey: journey === 'game' ? null : journey,
      permissions: journeyPermissions,
      ...options
    });
  }
}

// ===================================================
// Permission Namespace
// ===================================================

/**
 * Namespace for permission-related test fixtures
 */
export namespace permissions {
  export const {
    healthPermissions,
    carePermissions,
    planPermissions,
    gamificationPermissions,
    allPermissions
  } = {
    healthPermissions,
    carePermissions,
    planPermissions,
    gamificationPermissions,
    allPermissions
  };

  /**
   * Interface for permission creation options
   */
  export interface CreatePermissionOptions {
    id?: PermissionId;
    name?: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }

  /**
   * Creates a mock permission with custom properties
   * @param options Custom properties for the permission
   * @returns A mock permission with the specified properties
   */
  export function createMockPermission(options: CreatePermissionOptions = {}): IPermission {
    const id = options.id || Math.floor(Math.random() * 1000) + 100;
    const now = new Date();
    
    return {
      id,
      name: options.name || `permission:resource:action-${id}`,
      description: options.description || `Description for permission ${id}`,
      createdAt: options.createdAt || now,
      updatedAt: options.updatedAt || now
    };
  }

  /**
   * Creates a batch of mock permissions
   * @param count Number of permissions to create
   * @param baseOptions Base options to apply to all permissions
   * @returns An array of mock permissions
   */
  export function createMockPermissions(count: number, baseOptions: CreatePermissionOptions = {}): IPermission[] {
    return Array.from({ length: count }, (_, i) => 
      createMockPermission({
        ...baseOptions,
        id: baseOptions.id ? baseOptions.id + i : undefined,
        name: baseOptions.name ? `${baseOptions.name}-${i}` : undefined
      })
    );
  }

  /**
   * Creates a permission with a specific journey, resource, and action
   * @param journey The journey for the permission ('health', 'care', 'plan', or 'game')
   * @param resource The resource the permission applies to
   * @param action The action the permission allows ('read', 'write', 'delete', etc.)
   * @param options Additional permission options
   * @returns A permission with the specified journey, resource, and action
   */
  export function createJourneyPermission(
    journey: 'health' | 'care' | 'plan' | 'game',
    resource: string,
    action: string,
    options: CreatePermissionOptions = {}
  ): IPermission {
    const name = `${journey}:${resource}:${action}`;
    const description = options.description || `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource} in ${journey} journey`;
    
    return createMockPermission({
      name,
      description,
      ...options
    });
  }

  /**
   * Gets permissions for a specific journey
   * @param journey The journey to get permissions for ('health', 'care', 'plan', or 'game')
   * @returns An array of permissions for the specified journey
   */
  export function getJourneyPermissions(journey: 'health' | 'care' | 'plan' | 'game'): IPermission[] {
    switch (journey) {
      case 'health':
        return healthPermissions;
      case 'care':
        return carePermissions;
      case 'plan':
        return planPermissions;
      case 'game':
        return gamificationPermissions;
      default:
        return [];
    }
  }
}

// ===================================================
// Scenarios Namespace
// ===================================================

/**
 * Namespace for common test scenarios
 */
export namespace scenarios {
  /**
   * Creates a basic auth setup with users, roles, and permissions
   * @returns An object containing users, roles, and permissions for basic testing
   */
  export function createBasicAuthSetup() {
    return {
      users: {
        admin: mockAdminUser,
        regular: mockRegularUser,
        caregiver: mockCaregiverUser,
        provider: mockProviderUser
      },
      roles: {
        user: mockUserRole,
        caregiver: mockCaregiverRole,
        provider: mockProviderRole,
        admin: mockAdminRole
      },
      permissions: {
        health: healthPermissions,
        care: carePermissions,
        plan: planPermissions,
        gamification: gamificationPermissions
      }
    };
  }

  /**
   * Creates a user with specific roles and permissions
   * @param roleNames Names of roles to assign to the user
   * @param userOptions Custom properties for the user
   * @returns A user with the specified roles and their associated permissions
   */
  export function createUserWithRoles(
    roleNames: ('User' | 'Caregiver' | 'Provider' | 'Administrator')[],
    userOptions: users.CreateUserOptions = {}
  ) {
    const user = users.createMockUser(userOptions);
    const userRoles: IRole[] = [];
    
    // Assign roles based on names
    roleNames.forEach(roleName => {
      switch (roleName) {
        case 'User':
          userRoles.push(mockUserRole);
          break;
        case 'Caregiver':
          userRoles.push(mockCaregiverRole);
          break;
        case 'Provider':
          userRoles.push(mockProviderRole);
          break;
        case 'Administrator':
          userRoles.push(mockAdminRole);
          break;
      }
    });
    
    return {
      user,
      roles: userRoles
    };
  }

  /**
   * Creates a journey-specific test environment with users, roles, and permissions
   * @param journey The journey to create the environment for ('health', 'care', 'plan', or 'game')
   * @returns An object containing journey-specific users, roles, and permissions
   */
  export function createJourneyEnvironment(journey: 'health' | 'care' | 'plan' | 'game') {
    const journeyPermissions = permissions.getJourneyPermissions(journey);
    const journeyRole = roles.createJourneyRole(journey, {
      permissions: journeyPermissions
    });
    
    const journeyUser = users.createMockUser({
      name: `${journey.charAt(0).toUpperCase() + journey.slice(1)} Journey User`
    });
    
    return {
      user: journeyUser,
      role: journeyRole,
      permissions: journeyPermissions
    };
  }

  /**
   * Creates a complete test environment with all users, roles, and permissions
   * @returns An object containing all users, roles, and permissions for comprehensive testing
   */
  export function createCompleteEnvironment() {
    // Create users for each role
    const adminUser = mockAdminUser;
    const regularUser = mockRegularUser;
    const caregiverUser = mockCaregiverUser;
    const providerUser = mockProviderUser;
    
    // Create roles with permissions
    const userRole = { ...mockUserRole, permissions: [...healthPermissions, ...carePermissions, ...planPermissions, ...gamificationPermissions] };
    const caregiverRole = { ...mockCaregiverRole, permissions: [...healthPermissions.slice(0, 2), ...carePermissions.slice(0, 2)] };
    const providerRole = { ...mockProviderRole, permissions: [...healthPermissions.slice(0, 4), ...carePermissions] };
    const adminRole = { ...mockAdminRole, permissions: allPermissions };
    
    return {
      users: {
        admin: adminUser,
        regular: regularUser,
        caregiver: caregiverUser,
        provider: providerUser
      },
      roles: {
        user: userRole,
        caregiver: caregiverRole,
        provider: providerRole,
        admin: adminRole
      },
      permissions: {
        health: healthPermissions,
        care: carePermissions,
        plan: planPermissions,
        gamification: gamificationPermissions,
        all: allPermissions
      }
    };
  }
}