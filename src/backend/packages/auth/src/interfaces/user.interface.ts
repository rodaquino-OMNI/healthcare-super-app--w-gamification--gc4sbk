/**
 * User interfaces for the AUSTA SuperApp authentication system
 * Defines standardized user entity representations across all services
 */

/**
 * Base user interface representing the core user entity
 */
export interface IUser {
  /**
   * Unique identifier for the user
   */
  id: string;

  /**
   * User's full name
   */
  name: string;

  /**
   * User's email address (unique)
   */
  email: string;

  /**
   * User's hashed password (only used internally)
   */
  password?: string;

  /**
   * User's phone number
   */
  phone?: string;

  /**
   * User's CPF (Brazilian individual taxpayer registry) number
   */
  cpf?: string;

  /**
   * Timestamp when the user was created
   */
  createdAt?: Date;

  /**
   * Timestamp when the user was last updated
   */
  updatedAt?: Date;
}

/**
 * Interface for role entity associated with users
 */
export interface IRole {
  /**
   * Unique identifier for the role
   */
  id: number | string;

  /**
   * Name of the role (e.g., 'Admin', 'User')
   */
  name: string;

  /**
   * Description of the role's purpose and capabilities
   */
  description?: string;

  /**
   * Whether this role is assigned by default to new users
   */
  isDefault?: boolean;

  /**
   * Permissions associated with this role
   */
  permissions?: IPermission[];
}

/**
 * Interface for permission entity
 */
export interface IPermission {
  /**
   * Unique identifier for the permission
   */
  id: number | string;

  /**
   * Resource the permission applies to (e.g., 'health:metrics', 'care:appointment')
   */
  resource: string;

  /**
   * Action allowed on the resource (e.g., 'read', 'create', 'update', 'delete')
   */
  action: string;

  /**
   * Description of what this permission allows
   */
  description?: string;
}

/**
 * User interface with populated roles
 * Used when role information is needed along with user data
 */
export interface IUserWithRoles extends Omit<IUser, 'password'> {
  /**
   * Roles assigned to the user
   */
  roles: IRole[];
}

/**
 * User response interface for client-facing data
 * Excludes sensitive information like passwords
 */
export interface IUserResponse extends Omit<IUser, 'password'> {
  /**
   * Optional roles information when included in the response
   */
  roles?: IRole[];
}

/**
 * User creation data interface
 * Used when registering a new user
 */
export interface ICreateUser {
  /**
   * User's full name
   */
  name: string;

  /**
   * User's email address (unique)
   */
  email: string;

  /**
   * User's password (plain text, will be hashed)
   */
  password: string;

  /**
   * User's phone number
   */
  phone?: string;

  /**
   * User's CPF (Brazilian individual taxpayer registry) number
   */
  cpf?: string;
}

/**
 * User update data interface
 * Used when updating an existing user
 */
export interface IUpdateUser {
  /**
   * User's full name
   */
  name?: string;

  /**
   * User's email address
   */
  email?: string;

  /**
   * User's password (plain text, will be hashed)
   */
  password?: string;

  /**
   * User's phone number
   */
  phone?: string;

  /**
   * User's CPF number
   */
  cpf?: string;
}

/**
 * User credentials interface for authentication
 */
export interface IUserCredentials {
  /**
   * User's email address
   */
  email: string;

  /**
   * User's password (plain text)
   */
  password: string;
}