# @austa/auth

A comprehensive authentication and authorization package for the AUSTA SuperApp ecosystem that provides standardized JWT authentication, role-based access control, and OAuth integration across all microservices.

## Overview

The `@austa/auth` package serves as the central authentication authority for the journey-centered architecture of the AUSTA SuperApp. It provides a unified approach to user authentication, session management, and authorization across all services, ensuring consistent security implementation and reducing code duplication. This package implements industry best practices for healthcare applications while supporting the unique requirements of each journey.

## Key Components

### AuthModule

Configurable NestJS module that provides authentication capabilities:

- JWT-based authentication with secure token management
- Role-based access control with journey-specific permissions
- Integration with Passport.js strategies
- Environment-based configuration

### Guards

Protect routes and resources with standardized authentication checks:

- `JwtAuthGuard`: Validates JWT tokens for protected routes
- `RolesGuard`: Enforces role-based access control
- `LocalAuthGuard`: Handles username/password authentication

### Decorators

Simplify controller-level authentication and authorization:

- `@CurrentUser()`: Extract authenticated user from request
- `@Roles()`: Define required roles for route access

### Strategies

Implement various authentication methods:

- `JwtStrategy`: Validates JWT tokens from Authorization header
- `LocalStrategy`: Authenticates users with username and password
- `OAuthStrategy`: Base class for social login providers

### Services

Provide core authentication business logic:

- `AuthService`: Handles user authentication and session management
- `TokenService`: Manages JWT token generation, validation, and refresh

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
      refreshTokenExpiresIn: '7d',
      enableRedisBlacklist: true,
      redisUrl: process.env.REDIS_URL
    }),
  ],
})
export class AppModule {}
```

### Protecting Routes with Guards

Use guards to protect controller routes:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@austa/auth';
import { User } from '@austa/interfaces/auth';

@Controller('health-metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HealthMetricsController {
  @Get()
  @Roles('user', 'health:viewer')
  async getMetrics(@CurrentUser() user: User) {
    // Implementation
    return { metrics: [], userId: user.id };
  }
  
  @Get('summary')
  @Roles('admin', 'health:admin')
  async getMetricsSummary() {
    // Admin-only implementation
    return { summary: {} };
  }
}
```

### Authentication in Services

Inject and use the AuthService in your own services:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthService } from '@austa/auth';

@Injectable()
export class UserService {
  constructor(private readonly authService: AuthService) {}

  async validateUserAccess(userId: string, token: string): Promise<boolean> {
    try {
      const payload = await this.authService.verifyToken(token);
      return payload.sub === userId;
    } catch (error) {
      return false;
    }
  }
}
```

### Custom Token Handling

Use the TokenService for advanced token operations:

```typescript
import { Injectable } from '@nestjs/common';
import { TokenService } from '@austa/auth';
import { TokenPayload } from '@austa/interfaces/auth';

@Injectable()
export class SessionService {
  constructor(private readonly tokenService: TokenService) {}

  async refreshUserSession(refreshToken: string): Promise<{ accessToken: string, refreshToken: string }> {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    
    // Generate new tokens
    const newPayload: TokenPayload = {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
    
    const accessToken = await this.tokenService.generateAccessToken(newPayload);
    const newRefreshToken = await this.tokenService.generateRefreshToken(newPayload);
    
    return { accessToken, refreshToken: newRefreshToken };
  }
}
```

### OAuth Integration

Extend the OAuthStrategy for custom providers:

```typescript
import { Injectable } from '@nestjs/common';
import { OAuthStrategy } from '@austa/auth/strategies';

@Injectable()
export class GoogleStrategy extends OAuthStrategy {
  constructor(authService: AuthService, configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    }, authService);
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return super.validateOAuthUser({
      provider: 'google',
      providerId: profile.id,
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      profilePicture: profile.photos[0].value,
    });
  }
}
```

## Journey-Specific Authorization

The auth package supports journey-specific roles and permissions:

### Health Journey

```typescript
@Controller('health')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HealthController {
  @Get('metrics')
  @Roles('user', 'health:viewer')
  getMetrics(@CurrentUser() user: User) {
    // Implementation
  }
  
  @Post('goals')
  @Roles('user', 'health:editor')
  createGoal(@Body() data: CreateGoalDto, @CurrentUser() user: User) {
    // Implementation
  }
}
```

### Care Journey

```typescript
@Controller('care')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CareController {
  @Get('appointments')
  @Roles('user', 'care:patient')
  getAppointments(@CurrentUser() user: User) {
    // Implementation
  }
  
  @Get('patients')
  @Roles('care:provider')
  getPatients(@CurrentUser() user: User) {
    // Implementation for healthcare providers
  }
}
```

### Plan Journey

```typescript
@Controller('plan')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanController {
  @Get('benefits')
  @Roles('user', 'plan:member')
  getBenefits(@CurrentUser() user: User) {
    // Implementation
  }
  
  @Post('claims')
  @Roles('user', 'plan:member')
  submitClaim(@Body() data: ClaimDto, @CurrentUser() user: User) {
    // Implementation
  }
}
```

## Technologies

- TypeScript 5.3.3
- NestJS 10.3.0
- Passport.js
- JSON Web Tokens (JWT)
- Redis (for token blacklisting)

## Contributing

When extending the auth package:

1. Maintain backward compatibility for existing authentication flows
2. Follow security best practices for authentication and authorization
3. Include comprehensive tests for all authentication components
4. Document all public APIs and interfaces
5. Consider journey-specific requirements when implementing new features