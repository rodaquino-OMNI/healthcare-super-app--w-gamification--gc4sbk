/**
 * @austa/auth
 * 
 * This package provides authentication and authorization capabilities for the AUSTA SuperApp.
 * It includes JWT authentication, OAuth providers, role-based access control, and utilities
 * for secure authentication operations.
 */

// Core exports
export * from './auth.module';
export * from './auth.service';
export * from './token.service';
export * from './types';
export * from './constants';

// Authentication providers
export * from './providers';

// Authentication decorators
export * from './decorators';

// Authentication guards
export * from './guards/jwt-auth.guard';
export * from './guards/local-auth.guard';
export * from './guards/roles.guard';

// Authentication strategies
export * from './strategies/jwt.strategy';
export * from './strategies/local.strategy';
export * from './strategies/oauth.strategy';

// Data Transfer Objects
export * from './dto/login.dto';
export * from './dto/refresh-token.dto';
export * from './dto/token-response.dto';
export * from './dto/social-login.dto';
export * from './dto/mfa-verification.dto';

// Interfaces
export * from './interfaces';

// Utilities
export * from './utils/crypto.util';
export * from './utils/password.util';
export * from './utils/token.util';
export * from './utils/validation.util';