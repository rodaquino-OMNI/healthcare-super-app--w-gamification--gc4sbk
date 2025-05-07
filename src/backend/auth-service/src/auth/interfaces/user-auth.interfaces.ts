import { IRole } from '@app/auth/roles/interfaces/role.interface';
import { IPermission } from '@app/auth/permissions/interfaces/permission.interface';
import { IUserProfile } from '@austa/interfaces/auth';

/**
 * Represents an authenticated user in the system.
 * This interface is used to type the user object attached to requests
 * after successful authentication through guards.
 */
export interface AuthenticatedUser {
  /** Unique identifier for the user */
  id: string;
  
  /** User's email address used for authentication */
  email: string;
  
  /** User's full name */
  name: string;
  
  /** User's phone number (optional) */
  phone?: string;
  
  /** User's CPF (Brazilian national ID) (optional) */
  cpf?: string;
  
  /** Roles assigned to the user */
  roles?: IRole[];
  
  /** Direct permissions assigned to the user (separate from role-based permissions) */
  permissions?: IPermission[];
  
  /** Additional profile information */
  profile?: IUserProfile;
  
  /** Timestamp when the user was created */
  createdAt: Date;
  
  /** Timestamp when the user was last updated */
  updatedAt: Date;
  
  /** Current active session information */
  session?: SessionInfo;
}

/**
 * Represents user credentials used for authentication.
 * This interface standardizes the structure of login and registration data.
 */
export interface UserCredentials {
  /** User's email address */
  email: string;
  
  /** User's password (plain text during request, never stored) */
  password: string;
  
  /** Remember user preference for extended session duration */
  rememberMe?: boolean;
  
  /** Device information for security tracking */
  deviceInfo?: DeviceInfo;
}

/**
 * Represents device information for security tracking and session management.
 * Used to identify suspicious login attempts and manage active sessions.
 */
export interface DeviceInfo {
  /** Device type (mobile, desktop, tablet, etc.) */
  type: string;
  
  /** Device name or model */
  name?: string;
  
  /** Operating system */
  os?: string;
  
  /** Browser or app name */
  browser?: string;
  
  /** IP address of the device */
  ipAddress?: string;
  
  /** Unique device identifier (when available) */
  deviceId?: string;
}

/**
 * Represents multi-factor authentication verification data.
 * Used for secondary authentication steps after password verification.
 */
export interface MfaVerification {
  /** User ID being verified */
  userId: string;
  
  /** Verification code entered by the user */
  code: string;
  
  /** Method used for verification (sms, email, authenticator) */
  method: 'sms' | 'email' | 'authenticator';
  
  /** Verification request ID to match with sent code */
  requestId?: string;
  
  /** Device information for security tracking */
  deviceInfo?: DeviceInfo;
}

/**
 * Represents session information for tracking authenticated sessions.
 * Used for session management, activity tracking, and security monitoring.
 */
export interface SessionInfo {
  /** Unique session identifier */
  id: string;
  
  /** User ID associated with this session */
  userId: string;
  
  /** JWT token ID (jti claim) for this session */
  tokenId: string;
  
  /** Timestamp when the session was created */
  createdAt: Date;
  
  /** Timestamp when the session expires */
  expiresAt: Date;
  
  /** Last activity timestamp for this session */
  lastActivityAt: Date;
  
  /** Device information for this session */
  deviceInfo: DeviceInfo;
  
  /** IP address of the last request */
  ipAddress?: string;
  
  /** Whether this session used MFA for authentication */
  mfaVerified: boolean;
  
  /** Whether this is an extended session (remember me) */
  isExtended: boolean;
  
  /** Whether this session is currently active */
  isActive: boolean;
}