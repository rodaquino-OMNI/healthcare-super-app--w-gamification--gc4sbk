import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Use standardized imports with path aliases
import { PermissionsService } from '@app/auth/permissions/permissions.service';
import { PermissionsController } from '@app/auth/permissions/permissions.controller';
import { PermissionsGuard } from '@app/auth/permissions/permissions.guard';
import { PrismaService } from '@app/shared/database/prisma.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { CacheService } from '@app/shared/cache/cache.service';

/**
 * Module that provides the PermissionsService for managing permissions in the auth service.
 * This module enables fine-grained access control for the three user journeys: Health, Care, and Plan.
 * 
 * The permissions system is built around a hierarchical format (journey:resource:action)
 * and supports the role-based access control (RBAC) system with journey-specific permissions.
 * 
 * Examples of permissions:
 * - health:metrics:read - View health metrics
 * - care:appointment:create - Schedule appointments
 * - plan:claim:submit - Submit insurance claims
 */
@Module({
  controllers: [PermissionsController],
  providers: [
    PermissionsService,
    PermissionsGuard,
    PrismaService,
    LoggerService,
    CacheService,
    Reflector
  ],
  exports: [PermissionsService, PermissionsGuard],
})
export class PermissionsModule {}