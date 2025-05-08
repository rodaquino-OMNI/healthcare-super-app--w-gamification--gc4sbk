/**
 * @austa/interfaces
 * 
 * This package centralizes TypeScript interfaces used across the AUSTA SuperApp backend services.
 * It provides standardized type definitions for entities, DTOs, and API contracts to ensure
 * consistent data structures and type safety throughout the application.
 *
 * The interfaces are organized by domain:
 * - auth: Authentication and authorization interfaces
 * - common: Shared utility interfaces used across all services
 * - gamification: Interfaces for the gamification engine
 * - journey: Journey-specific interfaces (health, care, plan)
 *
 * @example
 * // Import namespaced interfaces
 * import { Auth, Common, Gamification, Journey } from '@austa/interfaces';
 * 
 * // Use namespaced interfaces
 * const user: Auth.IUser = { id: '123', email: 'user@example.com' };
 * const metric: Journey.Health.IHealthMetric = { id: '456', type: Journey.Health.MetricType.HEART_RATE };
 * 
 * @example
 * // Import specific interfaces directly
 * import { Repository, FilterDto } from '@austa/interfaces';
 * import { IUser, JwtPayload } from '@austa/interfaces/auth';
 * import { IHealthMetric } from '@austa/interfaces/journey/health';
 * 
 * // Use directly imported interfaces
 * class UserRepository implements Repository<IUser> {
 *   // Implementation...
 * }
 *
 * ## Usage Best Practices
 * 
 * ### Import Patterns
 * 
 * For most use cases, prefer importing from the namespaced exports:
 * ```typescript
 * import { Auth, Journey } from '@austa/interfaces';
 * 
 * function processUser(user: Auth.IUser) {
 *   // Implementation using Auth.IUser
 * }
 * ```
 * 
 * For commonly used interfaces, you can import them directly:
 * ```typescript
 * import { IUser, JwtPayload } from '@austa/interfaces';
 * 
 * function validateToken(token: string): JwtPayload {
 *   // Implementation
 * }
 * ```
 * 
 * ### Troubleshooting
 * 
 * If you encounter module resolution issues:
 * 
 * 1. Ensure your tsconfig.json includes the proper path aliases:
 * ```json
 * {
 *   "compilerOptions": {
 *     "paths": {
 *       "@austa/*": ["src/backend/packages/*"]
 *     }
 *   }
 * }
 * ```
 * 
 * 2. Check that you're using the correct import path:
 * ```typescript
 * // Correct
 * import { Auth } from '@austa/interfaces';
 * 
 * // Incorrect
 * import { Auth } from '@austa/interfaces/dist';
 * ```
 * 
 * 3. For circular dependency issues, try importing specific interfaces instead of entire namespaces.
 *
 * @packageDocumentation
 */

// Re-export all auth interfaces
import * as Auth from './auth';
export { Auth };

// Re-export common interfaces
import * as Common from './common';
export { Common };

// Re-export all gamification interfaces
import * as Gamification from './gamification';
export { Gamification };

// Re-export all journey interfaces
import * as Journey from './journey';
export { Journey };

// Direct exports for backward compatibility and convenience
export { Repository } from './common/repository.interface';
export * from './common/dto';

// Export commonly used auth interfaces directly
// These are re-exported from auth/index.ts
export { 
  // User interfaces
  IUser,
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  
  // Auth interfaces
  JwtPayload,
  AuthSession,
  AuthState,
  
  // Request/Response interfaces
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
  TokenValidationResponseDto
} from './auth';

// Export commonly used gamification interfaces directly
// These are re-exported from gamification/index.ts
export { 
  // Event interfaces
  GamificationEvent, 
  EventType,
  
  // Achievement interfaces
  Achievement, 
  UserAchievement,
  
  // Profile interfaces
  GameProfile,
  
  // Quest interfaces
  Quest,
  UserQuest,
  
  // Reward interfaces
  Reward,
  UserReward
} from './gamification';

// Export commonly used journey interfaces directly
// Health Journey
export { 
  IHealthMetric, 
  IHealthGoal,
  IMedicalEvent,
  IDeviceConnection,
  MetricType,
  MetricSource,
  GoalType,
  GoalStatus,
  GoalPeriod,
  ConnectionStatus,
  DeviceType
} from './journey/health';

// Care Journey
export { 
  IAppointment, 
  IProvider,
  IMedication,
  ITelemedicineSession,
  ITreatmentPlan,
  AppointmentStatus,
  AppointmentType
} from './journey/care';

// Plan Journey
export { 
  IPlan, 
  IClaim,
  IBenefit,
  ICoverage,
  IDocument,
  ClaimStatus
} from './journey/plan';