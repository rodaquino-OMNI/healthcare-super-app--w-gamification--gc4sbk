/**
 * @file User test fixtures for all journey services
 * 
 * This file provides standardized test fixtures for user entities shared across
 * all journey services. It contains predefined user objects with consistent test data
 * for admin users, regular users, and specialized user types.
 * 
 * These fixtures are essential for authentication, authorization, and user-related
 * test scenarios across the application.
 */

import * as bcrypt from 'bcrypt';

/**
 * Interface for user fixture data
 * Represents the core structure of a user entity for testing purposes
 */
export interface IUserFixture {
  /** Unique identifier for the user */
  id: string;
  /** Full name of the user */
  name: string;
  /** Email address of the user (unique) */
  email: string;
  /** Phone number of the user (optional) */
  phone?: string;
  /** CPF (Brazilian national ID) of the user (optional) */
  cpf?: string;
  /** Hashed password of the user */
  password: string;
  /** Raw password before hashing (for testing purposes only) */
  rawPassword?: string;
  /** Timestamp of when the user was created */
  createdAt: Date;
  /** Timestamp of when the user was last updated */
  updatedAt: Date;
}

/**
 * Interface for user fixture creation options
 * Used to customize user fixtures when creating them
 */
export interface ICreateUserFixtureOptions {
  /** Optional user ID override */
  id?: string;
  /** Optional name override */
  name?: string;
  /** Optional email override */
  email?: string;
  /** Optional phone override */
  phone?: string;
  /** Optional CPF override */
  cpf?: string;
  /** Optional raw password override (will be hashed) */
  password?: string;
  /** Optional creation date override */
  createdAt?: Date;
  /** Optional update date override */
  updatedAt?: Date;
}

/**
 * Enum for predefined user types
 * Used to identify different types of test users
 */
export enum UserFixtureType {
  ADMIN = 'admin',
  REGULAR = 'regular',
  CAREGIVER = 'caregiver',
  PROVIDER = 'provider',
  EXPIRED = 'expired',
  INACTIVE = 'inactive',
}

/**
 * Default password used for test users
 * All test users have this password unless explicitly overridden
 */
export const DEFAULT_USER_PASSWORD = 'Password123!';

/**
 * Default admin user fixture
 * Represents an administrator with full system access
 */
export const adminUserFixture: IUserFixture = {
  id: '00000000-0000-4000-a000-000000000001',
  name: 'Admin User',
  email: 'admin@austa.com.br',
  phone: '+5511999999999',
  cpf: '12345678901',
  password: bcrypt.hashSync(DEFAULT_USER_PASSWORD, 10),
  rawPassword: DEFAULT_USER_PASSWORD,
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z'),
};

/**
 * Default regular user fixture
 * Represents a standard user with normal access privileges
 */
export const regularUserFixture: IUserFixture = {
  id: '00000000-0000-4000-a000-000000000002',
  name: 'Test User',
  email: 'user@austa.com.br',
  phone: '+5511888888888',
  cpf: '98765432109',
  password: bcrypt.hashSync(DEFAULT_USER_PASSWORD, 10),
  rawPassword: DEFAULT_USER_PASSWORD,
  createdAt: new Date('2023-01-02T00:00:00Z'),
  updatedAt: new Date('2023-01-02T00:00:00Z'),
};

/**
 * Caregiver user fixture
 * Represents a user with delegated access to another user's health data
 */
export const caregiverUserFixture: IUserFixture = {
  id: '00000000-0000-4000-a000-000000000003',
  name: 'Caregiver User',
  email: 'caregiver@austa.com.br',
  phone: '+5511777777777',
  cpf: '11122233344',
  password: bcrypt.hashSync(DEFAULT_USER_PASSWORD, 10),
  rawPassword: DEFAULT_USER_PASSWORD,
  createdAt: new Date('2023-01-03T00:00:00Z'),
  updatedAt: new Date('2023-01-03T00:00:00Z'),
};

/**
 * Healthcare provider user fixture
 * Represents a healthcare provider with access to patient data
 */
export const providerUserFixture: IUserFixture = {
  id: '00000000-0000-4000-a000-000000000004',
  name: 'Provider User',
  email: 'provider@austa.com.br',
  phone: '+5511666666666',
  cpf: '44433322211',
  password: bcrypt.hashSync(DEFAULT_USER_PASSWORD, 10),
  rawPassword: DEFAULT_USER_PASSWORD,
  createdAt: new Date('2023-01-04T00:00:00Z'),
  updatedAt: new Date('2023-01-04T00:00:00Z'),
};

/**
 * User with expired credentials fixture
 * Useful for testing expired token scenarios
 */
export const expiredUserFixture: IUserFixture = {
  id: '00000000-0000-4000-a000-000000000005',
  name: 'Expired User',
  email: 'expired@austa.com.br',
  phone: '+5511555555555',
  cpf: '55566677788',
  password: bcrypt.hashSync(DEFAULT_USER_PASSWORD, 10),
  rawPassword: DEFAULT_USER_PASSWORD,
  createdAt: new Date('2022-01-01T00:00:00Z'),
  updatedAt: new Date('2022-01-01T00:00:00Z'),
};

/**
 * Inactive user fixture
 * Useful for testing account status validation
 */
export const inactiveUserFixture: IUserFixture = {
  id: '00000000-0000-4000-a000-000000000006',
  name: 'Inactive User',
  email: 'inactive@austa.com.br',
  phone: '+5511444444444',
  cpf: '99988877766',
  password: bcrypt.hashSync(DEFAULT_USER_PASSWORD, 10),
  rawPassword: DEFAULT_USER_PASSWORD,
  createdAt: new Date('2023-01-05T00:00:00Z'),
  updatedAt: new Date('2023-01-05T00:00:00Z'),
};

/**
 * Map of predefined user fixtures by type
 * Provides easy access to all predefined user fixtures
 */
export const userFixturesByType: Record<UserFixtureType, IUserFixture> = {
  [UserFixtureType.ADMIN]: adminUserFixture,
  [UserFixtureType.REGULAR]: regularUserFixture,
  [UserFixtureType.CAREGIVER]: caregiverUserFixture,
  [UserFixtureType.PROVIDER]: providerUserFixture,
  [UserFixtureType.EXPIRED]: expiredUserFixture,
  [UserFixtureType.INACTIVE]: inactiveUserFixture,
};

/**
 * Creates a user fixture with custom options
 * 
 * @param options - Custom options to override default values
 * @returns A user fixture with the specified options
 */
export function createUserFixture(options: ICreateUserFixtureOptions = {}): IUserFixture {
  const now = new Date();
  const rawPassword = options.password || DEFAULT_USER_PASSWORD;
  
  return {
    id: options.id || `00000000-0000-4000-a000-${Math.floor(Math.random() * 1000000000).toString().padStart(12, '0')}`,
    name: options.name || `Test User ${Math.floor(Math.random() * 1000)}`,
    email: options.email || `user-${Math.floor(Math.random() * 10000)}@austa.com.br`,
    phone: options.phone || `+55119${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`,
    cpf: options.cpf || Math.floor(Math.random() * 100000000000).toString().padStart(11, '0'),
    password: bcrypt.hashSync(rawPassword, 10),
    rawPassword,
    createdAt: options.createdAt || now,
    updatedAt: options.updatedAt || now,
  };
}

/**
 * Creates multiple user fixtures with custom options
 * 
 * @param count - Number of user fixtures to create
 * @param baseOptions - Base options to apply to all created fixtures
 * @returns An array of user fixtures
 */
export function createUserFixtures(count: number, baseOptions: ICreateUserFixtureOptions = {}): IUserFixture[] {
  return Array.from({ length: count }, (_, index) => {
    return createUserFixture({
      ...baseOptions,
      name: baseOptions.name ? `${baseOptions.name} ${index + 1}` : undefined,
      email: baseOptions.email ? baseOptions.email.replace('@', `-${index + 1}@`) : undefined,
    });
  });
}

/**
 * Gets a predefined user fixture by type
 * 
 * @param type - The type of user fixture to retrieve
 * @returns The requested user fixture
 */
export function getUserFixtureByType(type: UserFixtureType): IUserFixture {
  return userFixturesByType[type];
}

/**
 * Creates a user fixture with a specific role
 * 
 * @param role - The role name to associate with the user
 * @param options - Additional options for the user fixture
 * @returns A user fixture with role information
 */
export function createUserWithRoleFixture(
  role: string,
  options: ICreateUserFixtureOptions = {}
): IUserFixture & { role: string } {
  return {
    ...createUserFixture(options),
    role,
  };
}

/**
 * All predefined user fixtures as an array
 * Useful for bulk operations and testing with multiple user types
 */
export const allUserFixtures: IUserFixture[] = [
  adminUserFixture,
  regularUserFixture,
  caregiverUserFixture,
  providerUserFixture,
  expiredUserFixture,
  inactiveUserFixture,
];