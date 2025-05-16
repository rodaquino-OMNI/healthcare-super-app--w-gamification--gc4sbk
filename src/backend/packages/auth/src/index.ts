/**
 * @austa/auth package
 * 
 * This package provides authentication and authorization functionality for the AUSTA SuperApp.
 * It includes services for user authentication, JWT token management, and role-based access control.
 */

// Core components
export * from './auth.service';
export * from './auth.module';

// DTOs
export * from './dto/create-user.dto';

// Types
export * from './types';

// Constants
export * from './constants';

// Utilities
export * from './utils/retry.util';

// Re-export from NestJS for convenience
export { JwtService } from '@nestjs/jwt';