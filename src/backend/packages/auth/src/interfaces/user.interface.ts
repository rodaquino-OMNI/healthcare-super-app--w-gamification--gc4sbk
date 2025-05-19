/**
 * User interfaces for the AUSTA SuperApp authentication system
 * Defines standardized user entity representations across all services
 */

/**
 * Base user interface representing core user properties
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
   * User's email address (used for authentication)
   */
  email: string;

  /**
   * User's hashed password (should never be exposed in responses)
   */
  password: string;

  /**
   * User's phone number
   */
  phone?: string;

  /**
   * User's CPF (Brazilian tax ID)
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
 * Role interface for user authorization
 */
export interface IRole {
  /**
   * Unique identifier for the role
   */
  id: number;

  /**
   * Name of the role (e.g., 'Admin', 'User')
   */
  name: string;

  /**
   * Description of the role's purpose and permissions
   */
  description?: string;

  /**
   * Whether this role is assigned by default to new users
   */
  isDefault?: boolean;

  /**
   * Timestamp when the role was created
   */
  createdAt?: Date;

  /**
   * Timestamp when the role was last updated
   */
  updatedAt?: Date;
}

/**
 * Permission interface for fine-grained access control
 */
export interface IPermission {
  /**
   * Unique identifier for the permission
   */
  id: number;

  /**
   * Name of the permission (e.g., 'health:metrics:read')
   */
  name: string;

  /**
   * Description of what the permission allows
   */
  description?: string;

  /**
   * The journey this permission belongs to (health, care, plan)
   */
  journey?: string;

  /**
   * Timestamp when the permission was created
   */
  createdAt?: Date;

  /**
   * Timestamp when the permission was last updated
   */
  updatedAt?: Date;
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
 * User interface with populated permissions
 * Used when detailed permission information is needed
 */
export interface IUserWithPermissions extends Omit<IUser, 'password'> {
  /**
   * Permissions assigned to the user (directly or via roles)
   */
  permissions: IPermission[];
}

/**
 * User interface with both roles and permissions
 * Used for comprehensive access control checks
 */
export interface IUserWithRolesAndPermissions extends Omit<IUser, 'password'> {
  /**
   * Roles assigned to the user
   */
  roles: IRole[];

  /**
   * Permissions assigned to the user (directly or via roles)
   */
  permissions: IPermission[];
}

/**
 * User response interface for client-facing data
 * Excludes sensitive information like passwords
 */
export interface IUserResponse extends Omit<IUser, 'password'> {
  /**
   * Roles assigned to the user (optional, included based on request context)
   */
  roles?: IRole[];

  /**
   * Permissions assigned to the user (optional, included based on request context)
   */
  permissions?: IPermission[];
}

/**
 * Minimal user information for public display
 * Used in contexts where only basic user information is needed
 */
export interface IUserPublic {
  /**
   * Unique identifier for the user
   */
  id: string;

  /**
   * User's full name
   */
  name: string;

  /**
   * User's email address
   */
  email: string;
}

/**
 * User creation payload interface
 * Used when creating a new user
 */
export interface ICreateUser {
  /**
   * User's full name
   */
  name: string;

  /**
   * User's email address
   */
  email: string;

  /**
   * User's plain text password (will be hashed before storage)
   */
  password: string;

  /**
   * User's phone number
   */
  phone?: string;

  /**
   * User's CPF (Brazilian tax ID)
   */
  cpf?: string;
}

/**
 * User update payload interface
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
   * User's plain text password (will be hashed before storage)
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
}