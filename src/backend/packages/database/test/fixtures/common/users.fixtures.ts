/**
 * User test fixtures for all journey services.
 * 
 * This module provides standardized test fixtures for user entities shared across all journey services.
 * Contains predefined user objects with consistent test data for admin users, regular users, and specialized user types.
 * Essential for authentication, authorization, and user-related test scenarios across the application.
 */

import { User } from '@austa/interfaces/auth';
import { JourneyType } from '@austa/interfaces/common';
import { createRoleFixture, roleFixtures, createJourneyRoleFixture } from './roles.fixtures';

/**
 * Interface for user fixture with minimal required properties
 */
export interface UserFixture extends Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'roles'> {
  id?: string;
  roles?: string[];
}

/**
 * Interface for creating a user with specific options
 */
export interface CreateUserOptions {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  password?: string;
  roles?: string[];
  journey?: JourneyType | null;
}

/**
 * Base user fixtures with their default properties
 */
export const userFixtures: Record<string, UserFixture> = {
  admin: {
    id: 'user-admin-fixture',
    name: 'Admin User',
    email: 'admin@austa.com.br',
    password: 'Password123!', // Note: In real tests, this would be hashed
    phone: '+5511999999999',
    cpf: '12345678901',
    roles: ['Administrator'],
  },
  regular: {
    id: 'user-regular-fixture',
    name: 'Test User',
    email: 'user@austa.com.br',
    password: 'Password123!', // Note: In real tests, this would be hashed
    phone: '+5511888888888',
    cpf: '98765432109',
    roles: ['User'],
  },
  caregiver: {
    id: 'user-caregiver-fixture',
    name: 'Caregiver User',
    email: 'caregiver@austa.com.br',
    password: 'Password123!',
    phone: '+5511777777777',
    cpf: '87654321098',
    roles: ['Caregiver'],
  },
  provider: {
    id: 'user-provider-fixture',
    name: 'Provider User',
    email: 'provider@austa.com.br',
    password: 'Password123!',
    phone: '+5511666666666',
    cpf: '76543210987',
    roles: ['Provider'],
  },
};

/**
 * Journey-specific user fixtures
 */
export const journeyUserFixtures: Record<JourneyType, UserFixture[]> = {
  health: [
    {
      id: 'user-health-coach-fixture',
      name: 'Health Coach User',
      email: 'health-coach@austa.com.br',
      password: 'Password123!',
      phone: '+5511555555555',
      cpf: '65432109876',
      roles: ['Health Coach'],
    },
  ],
  care: [
    {
      id: 'user-nurse-fixture',
      name: 'Nurse User',
      email: 'nurse@austa.com.br',
      password: 'Password123!',
      phone: '+5511444444444',
      cpf: '54321098765',
      roles: ['Nurse'],
    },
  ],
  plan: [
    {
      id: 'user-insurance-agent-fixture',
      name: 'Insurance Agent User',
      email: 'insurance-agent@austa.com.br',
      password: 'Password123!',
      phone: '+5511333333333',
      cpf: '43210987654',
      roles: ['Insurance Agent'],
    },
  ],
};

/**
 * Create a user fixture with custom options
 * 
 * @param baseUser - The base user fixture to customize
 * @param options - Custom options for the user
 * @returns A customized user fixture
 */
export const createUserFixture = (
  baseUser: keyof typeof userFixtures,
  options: CreateUserOptions = {}
): User => {
  const baseFix = { ...userFixtures[baseUser] };
  
  // Create the user with specified options or defaults from the base fixture
  const user: User = {
    id: options.id || baseFix.id || `user-${baseUser.toLowerCase()}-${Date.now()}`,
    name: options.name || baseFix.name,
    email: options.email || baseFix.email,
    password: options.password || baseFix.password,
    phone: options.phone || baseFix.phone,
    cpf: options.cpf || baseFix.cpf,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
  };
  
  // Add roles if specified in options, otherwise use base fixture roles
  const roleNames = options.roles || baseFix.roles || [];
  if (roleNames.length > 0) {
    // Convert role names to role objects
    user.roles = roleNames.map(roleName => {
      // Check if it's a standard role
      if (roleName in roleFixtures) {
        return createRoleFixture(roleName as keyof typeof roleFixtures);
      }
      
      // If not a standard role, it might be a journey-specific role
      // This is a simplified approach; in a real implementation, you'd need more robust role lookup
      for (const journey of Object.keys(journeyUserFixtures) as JourneyType[]) {
        const journeyRoles = journeyUserFixtures[journey];
        for (const journeyUser of journeyRoles) {
          if (journeyUser.roles?.includes(roleName)) {
            return createJourneyRoleFixture(journey);
          }
        }
      }
      
      // If role not found, create a basic user role as fallback
      console.warn(`Role not found: ${roleName}, using User role as fallback`);
      return createRoleFixture('user');
    });
  }
  
  return user;
};

/**
 * Create a journey-specific user fixture
 * 
 * @param journey - The journey type
 * @param userIndex - The index of the user in the journey users array
 * @param options - Custom options for the user
 * @returns A customized journey-specific user fixture
 */
export const createJourneyUserFixture = (
  journey: JourneyType,
  userIndex: number = 0,
  options: CreateUserOptions = {}
): User => {
  const journeyUsers = journeyUserFixtures[journey];
  if (!journeyUsers || !journeyUsers[userIndex]) {
    throw new Error(`Journey user fixture not found: ${journey} at index ${userIndex}`);
  }
  
  const baseFix = { ...journeyUsers[userIndex] };
  
  // Create the user with specified options or defaults from the base fixture
  const user: User = {
    id: options.id || baseFix.id || `user-${journey}-${userIndex}-${Date.now()}`,
    name: options.name || baseFix.name,
    email: options.email || baseFix.email,
    password: options.password || baseFix.password,
    phone: options.phone || baseFix.phone,
    cpf: options.cpf || baseFix.cpf,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
  };
  
  // Add roles if specified in options, otherwise use base fixture roles
  const roleNames = options.roles || baseFix.roles || [];
  if (roleNames.length > 0) {
    // Convert role names to role objects
    user.roles = roleNames.map(roleName => {
      // For journey-specific roles, try to find the matching role
      try {
        // First check if it's a journey-specific role
        return createJourneyRoleFixture(journey);
      } catch (error) {
        // If not found, check if it's a standard role
        if (roleName in roleFixtures) {
          return createRoleFixture(roleName as keyof typeof roleFixtures);
        }
        
        // If role not found, create a basic user role as fallback
        console.warn(`Role not found: ${roleName}, using User role as fallback`);
        return createRoleFixture('user');
      }
    });
  }
  
  return user;
};

/**
 * Create a user with admin role
 * 
 * @param options - Custom options for the admin user
 * @returns An admin user fixture
 */
export const createAdminUser = (options: CreateUserOptions = {}): User => {
  return createUserFixture('admin', options);
};

/**
 * Create a regular user
 * 
 * @param options - Custom options for the regular user
 * @returns A regular user fixture
 */
export const createRegularUser = (options: CreateUserOptions = {}): User => {
  return createUserFixture('regular', options);
};

/**
 * Create a caregiver user
 * 
 * @param options - Custom options for the caregiver user
 * @returns A caregiver user fixture
 */
export const createCaregiverUser = (options: CreateUserOptions = {}): User => {
  return createUserFixture('caregiver', options);
};

/**
 * Create a provider user
 * 
 * @param options - Custom options for the provider user
 * @returns A provider user fixture
 */
export const createProviderUser = (options: CreateUserOptions = {}): User => {
  return createUserFixture('provider', options);
};

/**
 * Create multiple users with different roles
 * 
 * @param count - Number of users to create
 * @param baseUser - Base user type to use as template
 * @param options - Custom options for the users
 * @returns An array of user fixtures
 */
export const createMultipleUsers = (
  count: number,
  baseUser: keyof typeof userFixtures = 'regular',
  options: CreateUserOptions = {}
): User[] => {
  const users: User[] = [];
  
  for (let i = 0; i < count; i++) {
    const userOptions: CreateUserOptions = {
      ...options,
      id: options.id ? `${options.id}-${i}` : undefined,
      email: options.email ? options.email.replace('@', `-${i}@`) : undefined,
      cpf: options.cpf ? `${options.cpf.substring(0, 9)}${i.toString().padStart(2, '0')}` : undefined,
    };
    
    users.push(createUserFixture(baseUser, userOptions));
  }
  
  return users;
};

/**
 * Create all standard user fixtures
 * 
 * @returns An array of all standard user fixtures
 */
export const createAllUserFixtures = (): User[] => {
  return Object.keys(userFixtures).map(key => createUserFixture(key as keyof typeof userFixtures));
};

/**
 * Create all journey-specific user fixtures
 * 
 * @returns An array of all journey-specific user fixtures
 */
export const createAllJourneyUserFixtures = (): User[] => {
  const users: User[] = [];
  
  Object.keys(journeyUserFixtures).forEach(journey => {
    const journeyType = journey as JourneyType;
    const journeyUsers = journeyUserFixtures[journeyType];
    
    journeyUsers.forEach((_, index) => {
      users.push(createJourneyUserFixture(journeyType, index));
    });
  });
  
  return users;
};

/**
 * Create a user with a specific role
 * 
 * @param roleName - The name of the role to assign to the user
 * @param options - Custom options for the user
 * @returns A user fixture with the specified role
 */
export const createUserWithRole = (roleName: string, options: CreateUserOptions = {}): User => {
  // Determine the best base user type based on the requested role
  let baseUser: keyof typeof userFixtures = 'regular';
  
  if (roleName === 'Administrator') {
    baseUser = 'admin';
  } else if (roleName === 'Caregiver') {
    baseUser = 'caregiver';
  } else if (roleName === 'Provider') {
    baseUser = 'provider';
  }
  
  // Create the user with the specified role
  return createUserFixture(baseUser, {
    ...options,
    roles: [roleName],
  });
};

/**
 * Create a user with multiple roles
 * 
 * @param roleNames - The names of the roles to assign to the user
 * @param options - Custom options for the user
 * @returns A user fixture with the specified roles
 */
export const createUserWithRoles = (roleNames: string[], options: CreateUserOptions = {}): User => {
  // Determine the best base user type based on the requested roles
  let baseUser: keyof typeof userFixtures = 'regular';
  
  if (roleNames.includes('Administrator')) {
    baseUser = 'admin';
  } else if (roleNames.includes('Caregiver')) {
    baseUser = 'caregiver';
  } else if (roleNames.includes('Provider')) {
    baseUser = 'provider';
  }
  
  // Create the user with the specified roles
  return createUserFixture(baseUser, {
    ...options,
    roles: roleNames,
  });
};

/**
 * Create a user for a specific journey
 * 
 * @param journey - The journey type
 * @param options - Custom options for the user
 * @returns A user fixture for the specified journey
 */
export const createUserForJourney = (journey: JourneyType, options: CreateUserOptions = {}): User => {
  // Try to create a journey-specific user if available
  try {
    return createJourneyUserFixture(journey, 0, options);
  } catch (error) {
    // If no journey-specific user is available, create a regular user with journey-appropriate roles
    const journeyRoleMap: Record<JourneyType, string[]> = {
      health: ['User'],
      care: ['User'],
      plan: ['User'],
    };
    
    return createUserFixture('regular', {
      ...options,
      roles: journeyRoleMap[journey],
    });
  }
};