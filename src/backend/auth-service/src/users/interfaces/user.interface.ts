import { IBaseUser } from '@austa/interfaces/auth';
import { IRole } from '@app/auth/roles/interfaces/role.interface';
import { IPermission } from '@app/auth/permissions/interfaces/permission.interface';

/**
 * Represents a user in the authentication service.
 * Extends the base user interface from @austa/interfaces with auth-service specific properties.
 * Used throughout the service for type-checking, validation, and ensuring data consistency.
 * 
 * This interface is part of the journey-centered architecture, supporting the authentication
 * needs across all three user journeys ("Minha Saúde", "Cuidar-me Agora", and "Meu Plano & Benefícios").
 */
export interface IUser extends IBaseUser {
  /**
   * Unique identifier for the user.
   * This property is immutable after creation.
   */
  readonly id: string;

  /**
   * Full name of the user.
   */
  name: string;

  /**
   * Email address of the user (must be unique).
   * Used as the primary identifier for authentication.
   */
  email: string;

  /**
   * Phone number of the user (optional).
   * Can be used for MFA and notifications.
   */
  phone?: string;

  /**
   * CPF (Brazilian national ID) of the user (optional).
   * Used for identity verification in Brazilian healthcare context.
   */
  cpf?: string;

  /**
   * Hashed password of the user.
   * Never stored in plain text.
   */
  password: string;

  /**
   * Timestamp of when the user was created.
   * This property is immutable after creation.
   */
  readonly createdAt: Date;

  /**
   * Timestamp of when the user was last updated.
   */
  updatedAt: Date;

  /**
   * User's assigned roles for role-based access control.
   * Optional as roles might be loaded separately from the user entity.
   */
  roles?: IRole[];

  /**
   * Indicates if the user's email has been verified.
   * Used for security and access control purposes.
   */
  isEmailVerified?: boolean;

  /**
   * Indicates if the user account is currently active.
   * Inactive accounts cannot authenticate or access the system.
   */
  isActive?: boolean;

  /**
   * Last successful login timestamp.
   * Used for security monitoring and session management.
   */
  lastLoginAt?: Date;

  /**
   * Validates if the provided password matches the user's hashed password.
   * @param password The plain text password to validate
   * @returns True if the password is valid, false otherwise
   * @throws AuthenticationError if validation process fails
   */
  validatePassword(password: string): Promise<boolean>;

  /**
   * Updates the user's password with a new hashed value.
   * @param newPassword The new plain text password to hash and store
   * @throws ValidationError if the password doesn't meet security requirements
   * @throws DatabaseError if the update operation fails
   */
  updatePassword(newPassword: string): Promise<void>;

  /**
   * Checks if the user has a specific role assigned.
   * @param roleName The name of the role to check
   * @returns True if the user has the role, false otherwise
   * @throws RoleNotFoundError if the specified role doesn't exist
   */
  hasRole(roleName: string): boolean;

  /**
   * Checks if the user has a specific permission through any of their assigned roles.
   * @param permissionName The name of the permission to check
   * @returns True if the user has the permission, false otherwise
   * @throws PermissionNotFoundError if the specified permission doesn't exist
   */
  hasPermission(permissionName: string): boolean;

  /**
   * Marks the user's email as verified.
   * @returns Promise that resolves when the operation is complete
   * @throws DatabaseError if the update operation fails
   */
  verifyEmail(): Promise<void>;

  /**
   * Updates the last login timestamp to the current time.
   * @returns Promise that resolves when the operation is complete
   * @throws DatabaseError if the update operation fails
   */
  updateLastLogin(): Promise<void>;
  
  /**
   * Gets the user's journey preferences for a specific journey.
   * This supports the journey-centered architecture by providing user settings
   * specific to each journey ("Minha Saúde", "Cuidar-me Agora", or "Meu Plano & Benefícios").
   * 
   * @param journeyId The identifier of the journey to get preferences for
   * @returns Journey-specific user preferences
   * @throws JourneyNotFoundError if the specified journey doesn't exist
   */
  getJourneyPreferences(journeyId: string): Record<string, unknown>;
}