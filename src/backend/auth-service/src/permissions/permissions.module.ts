import { Module } from '@nestjs/common';
import { PermissionsService } from '@app/auth/permissions/permissions.service';
import { PermissionsController } from '@app/auth/permissions/permissions.controller';
import { PrismaService } from '@austa/database';

/**
 * Module that provides the PermissionsService and PermissionsController for managing permissions in the auth service.
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
  providers: [PermissionsService, PrismaService],
  exports: [PermissionsService],
})
export class PermissionsModule {}