# @austa/auth

A comprehensive authentication and authorization package for the AUSTA SuperApp ecosystem that provides standardized implementation of JWT authentication, role-based access control (RBAC), and session management across all microservices.

## Overview

The `@austa/auth` package serves as the security foundation for the journey-centered architecture of the AUSTA SuperApp. By centralizing authentication and authorization functionality, it ensures consistent security implementation, reduces code duplication, and simplifies maintenance across all services. This package implements healthcare-grade security practices while supporting the unique requirements of each journey.

## Key Components

### Authentication Module (`AuthModule`)

Provides a configurable NestJS module for authentication services:

- Environment-based configuration for different deployment scenarios
- Integration with Passport.js strategies
- JWT token management with secure defaults
- Session handling with Redis support

### Authentication Service (`AuthService`)

Implements core authentication business logic:

- User registration and login
- Password hashing and verification
- Account management operations
- Journey-specific authentication flows

### Token Service (`TokenService`)

Handles all JWT token operations:

- Token generation with configurable expiration
- Token validation and verification
- Refresh token rotation
- Token blacklisting for secure logout

### Authentication Strategies

Implements various authentication methods:

- JWT-based authentication (`JwtStrategy`)
- Username/password authentication (`LocalStrategy`)
- OAuth provider integration (`OAuthStrategy`)
- Custom authentication flows

### Guards

Protects routes with authentication and authorization checks:

- JWT authentication guard (`JwtAuthGuard`)
- Role-based access control (`RolesGuard`)
- Local authentication guard (`LocalAuthGuard`)
- Journey-specific authorization guards

### Decorators

Provides convenient access to authentication context:

- Current user extraction (`@CurrentUser()`)
- Role requirements definition (`@Roles()`)
- Permission-based access control
- Journey-specific authorization decorators

## Installation

```bash
# npm
npm install @austa/auth

# yarn
yarn add @austa/auth
```

## Usage

### Module Registration

Import and register the AuthModule in your NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '@austa/auth';

@Module({
  imports: [
    AuthModule.forRoot({
      jwtSecret: process.env.JWT_SECRET,
      jwtExpiresIn: '1h',
      refreshExpiresIn: '7d',
      redisUrl: process.env.REDIS_URL,
      journey: 'health', // Specify the journey context
    }),
  ],
})
export class AppModule {}
```

### Protecting Routes with Guards

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from '@austa/auth';

@Controller('health-metrics')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply both authentication and authorization
export class HealthMetricsController {
  
  @Get()
  @Roles('user', 'health:viewer') // Require either 'user' role or 'health:viewer' role
  findAll() {
    // This route is protected and requires authentication and specific roles
    return { metrics: [] };
  }
  
  @Get('sensitive')
  @Roles('admin') // Only admins can access this route
  findSensitive() {
    // This route is protected and requires admin role
    return { sensitiveMetrics: [] };
  }
}
```

### Accessing the Current User

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '@austa/auth';
import { User } from '@austa/interfaces/auth';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  
  @Get()
  getProfile(@CurrentUser() user: User) {
    // The CurrentUser decorator extracts the authenticated user from the request
    return user;
  }
  
  @Get('email')
  getEmail(@CurrentUser('email') email: string) {
    // You can also extract specific properties from the user
    return { email };
  }
}
```

### Authentication Service Usage

```typescript
import { Injectable } from '@nestjs/common';
import { AuthService } from '@austa/auth';

@Injectable()
export class UserService {
  constructor(private readonly authService: AuthService) {}

  async login(email: string, password: string) {
    const result = await this.authService.validateUser(email, password);
    if (result.success) {
      return this.authService.login(result.user);
    }
    // Handle authentication failure
  }

  async register(userData: RegisterUserDto) {
    return this.authService.register(userData);
  }
}
```

### OAuth Integration

```typescript
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService, OAuthGuard } from '@austa/auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(OAuthGuard('google'))
  googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(OAuthGuard('google'))
  googleAuthCallback(@Req() req) {
    // Handle successful Google authentication
    return this.authService.oauthLogin(req.user);
  }
}
```

### Custom JWT Strategy

```typescript
import { Injectable } from '@nestjs/common';
import { JwtStrategy } from '@austa/auth/strategies';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomJwtStrategy extends JwtStrategy {
  constructor(
    configService: ConfigService,
    // Add your custom dependencies here
  ) {
    super({
      jwtSecret: configService.get('JWT_SECRET'),
      // Override default options
    });
  }

  // Override the validate method for custom validation logic
  async validate(payload: any) {
    // Custom validation logic
    const user = await super.validate(payload);
    // Add custom properties or perform additional checks
    return user;
  }
}
```

## Technologies

- TypeScript 5.3+
- NestJS 10.3+
- Passport.js 0.6+
- JSON Web Tokens (JWT) 9.0+
- Redis 7.0+ (for token blacklisting and session management)
- bcrypt 5.1+ (for password hashing)

## Integration with Other Packages

- `@austa/interfaces`: Uses shared TypeScript interfaces for user profiles, tokens, and authentication data
- `@austa/errors`: Leverages centralized error handling for authentication and authorization failures
- `@austa/logging`: Integrates with structured logging for security events and authentication attempts
- `@austa/database`: Connects to user repositories and authentication data stores

## Contributing

When extending the auth package:

1. Maintain backward compatibility with existing authentication flows
2. Follow security best practices for authentication and authorization
3. Include comprehensive tests for all security-critical components
4. Document all public APIs and interfaces
5. Consider journey-specific requirements when implementing new features