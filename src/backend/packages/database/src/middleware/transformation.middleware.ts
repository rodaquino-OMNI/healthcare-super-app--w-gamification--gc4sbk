import { Injectable, Logger } from '@nestjs/common';
import { MiddlewareContext, TransformationMiddleware, TransformationRule } from './middleware.interface';
import { DatabaseErrorException } from '../errors/database-error.exception';

/**
 * Transformation middleware that modifies database operations before execution
 * to optimize performance and implement cross-cutting concerns.
 * 
 * This middleware supports:
 * - Journey-specific query transformations
 * - Multi-tenancy support
 * - Automatic index utilization optimization
 * - Transformation chaining for complex operations
 * - Cross-cutting concerns (soft deletion, timestamps, audit trails)
 */
@Injectable()
export class QueryTransformationMiddleware implements TransformationMiddleware {
  private readonly logger = new Logger(QueryTransformationMiddleware.name);
  private transformations: Map<string, TransformationRule> = new Map<string, TransformationRule>();

  constructor() {
    this.registerDefaultTransformations();
  }

  /**
   * Adds a transformation rule to the middleware
   * 
   * @param rule The transformation rule to add
   */
  public addTransformation(rule: TransformationRule): void {
    if (this.transformations.has(rule.id)) {
      this.logger.warn(`Transformation rule with ID ${rule.id} already exists and will be overwritten`);
    }
    
    this.transformations.set(rule.id, rule);
    this.logger.debug(`Added transformation rule: ${rule.id}`);
  }

  /**
   * Removes a transformation rule from the middleware
   * 
   * @param ruleId The ID of the rule to remove
   */
  public removeTransformation(ruleId: string): void {
    if (!this.transformations.has(ruleId)) {
      this.logger.warn(`Transformation rule with ID ${ruleId} does not exist`);
      return;
    }
    
    this.transformations.delete(ruleId);
    this.logger.debug(`Removed transformation rule: ${ruleId}`);
  }

  /**
   * Applies transformation rules to database operation parameters before execution
   * 
   * @param params The operation parameters
   * @param context The operation context
   * @returns The transformed parameters
   */
  public async beforeExecute<T>(params: T, context: MiddlewareContext): Promise<T> {
    try {
      this.logger.debug(`Applying transformations for ${context.operationType} on ${context.entityName || 'unknown entity'}`);
      
      // Get applicable transformations for this operation
      const applicableRules = this.getApplicableRules(context);
      
      // Apply transformations in priority order (higher priority first)
      let transformedParams = params;
      for (const rule of applicableRules) {
        transformedParams = await rule.transform(transformedParams, context);
      }
      
      return transformedParams;
    } catch (error) {
      this.logger.error(
        `Error applying transformations for ${context.operationType} on ${context.entityName || 'unknown entity'}: ${error.message}`,
        error.stack
      );
      
      throw new DatabaseErrorException(
        'TRANSFORMATION_ERROR',
        `Failed to apply query transformations: ${error.message}`,
        { originalError: error, context }
      );
    }
  }

  /**
   * Gets applicable transformation rules for the given context
   * 
   * @param context The operation context
   * @returns Array of applicable transformation rules sorted by priority
   */
  private getApplicableRules(context: MiddlewareContext): TransformationRule[] {
    const { operationType, entityName, journeyContext } = context;
    
    // Filter rules that apply to this operation and entity
    const applicableRules = Array.from(this.transformations.values()).filter(rule => {
      // Check if rule applies to this operation type
      const matchesOperationType = rule.operationTypes.includes('*') || 
                                  rule.operationTypes.includes(operationType);
      
      // Check if rule applies to this entity
      const matchesEntityType = !entityName || 
                               rule.entityTypes.includes('*') || 
                               rule.entityTypes.includes(entityName);
      
      // Check if rule applies to this journey context
      const matchesJourneyContext = !journeyContext || 
                                   !rule.journeyContexts || 
                                   rule.journeyContexts.includes('*') || 
                                   rule.journeyContexts.includes(journeyContext as string);
      
      return matchesOperationType && matchesEntityType && matchesJourneyContext;
    });
    
    // Sort by priority (higher priority first)
    return applicableRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Registers default transformation rules
   */
  private registerDefaultTransformations(): void {
    // Add soft deletion transformation
    this.addTransformation({
      id: 'soft-deletion',
      entityTypes: ['*'],
      operationTypes: ['findMany', 'findUnique', 'findFirst', 'count', 'aggregate'],
      priority: 100,
      journeyContexts: ['*'],
      transform: <T>(params: T, context: MiddlewareContext): T => {
        // Skip if explicitly requesting deleted records
        if (context.metadata?.includeDeleted) {
          return params;
        }
        
        // Add isDeleted: false to where clause if the entity supports soft deletion
        const entitySupportsDelete = this.entitySupportsSoftDeletion(context.entityName);
        if (entitySupportsDelete) {
          const paramsWithWhere = params as any;
          
          if (!paramsWithWhere.where) {
            paramsWithWhere.where = {};
          }
          
          paramsWithWhere.where.isDeleted = false;
          
          return paramsWithWhere as T;
        }
        
        return params;
      }
    });

    // Add timestamp transformation for create operations
    this.addTransformation({
      id: 'create-timestamps',
      entityTypes: ['*'],
      operationTypes: ['create', 'createMany'],
      priority: 90,
      journeyContexts: ['*'],
      transform: <T>(params: T, context: MiddlewareContext): T => {
        const now = new Date();
        const entitySupportsTimestamps = this.entitySupportsTimestamps(context.entityName);
        
        if (entitySupportsTimestamps) {
          const paramsWithData = params as any;
          
          if (context.operationType === 'create') {
            if (!paramsWithData.data) {
              paramsWithData.data = {};
            }
            
            paramsWithData.data.createdAt = paramsWithData.data.createdAt || now;
            paramsWithData.data.updatedAt = paramsWithData.data.updatedAt || now;
          } else if (context.operationType === 'createMany') {
            if (!paramsWithData.data || !Array.isArray(paramsWithData.data)) {
              return params;
            }
            
            paramsWithData.data = paramsWithData.data.map(item => ({
              ...item,
              createdAt: item.createdAt || now,
              updatedAt: item.updatedAt || now
            }));
          }
          
          return paramsWithData as T;
        }
        
        return params;
      }
    });

    // Add timestamp transformation for update operations
    this.addTransformation({
      id: 'update-timestamps',
      entityTypes: ['*'],
      operationTypes: ['update', 'updateMany', 'upsert'],
      priority: 90,
      journeyContexts: ['*'],
      transform: <T>(params: T, context: MiddlewareContext): T => {
        const now = new Date();
        const entitySupportsTimestamps = this.entitySupportsTimestamps(context.entityName);
        
        if (entitySupportsTimestamps) {
          const paramsWithData = params as any;
          
          if (context.operationType === 'update' || context.operationType === 'upsert') {
            if (!paramsWithData.data) {
              paramsWithData.data = {};
            }
            
            paramsWithData.data.updatedAt = now;
            
            // For upsert, also set createdAt if creating
            if (context.operationType === 'upsert' && paramsWithData.create) {
              paramsWithData.create.createdAt = paramsWithData.create.createdAt || now;
              paramsWithData.create.updatedAt = paramsWithData.create.updatedAt || now;
            }
          } else if (context.operationType === 'updateMany') {
            if (!paramsWithData.data) {
              paramsWithData.data = {};
            }
            
            paramsWithData.data.updatedAt = now;
          }
          
          return paramsWithData as T;
        }
        
        return params;
      }
    });

    // Add multi-tenancy transformation
    this.addTransformation({
      id: 'multi-tenancy',
      entityTypes: ['*'],
      operationTypes: ['findMany', 'findUnique', 'findFirst', 'count', 'aggregate', 'update', 'updateMany', 'delete', 'deleteMany'],
      priority: 110, // Higher priority than soft deletion
      journeyContexts: ['*'],
      transform: <T>(params: T, context: MiddlewareContext): T => {
        // Skip if no tenant ID in context
        if (!context.metadata?.tenantId) {
          return params;
        }
        
        // Add tenantId to where clause if the entity supports multi-tenancy
        const entitySupportsMultiTenancy = this.entitySupportsMultiTenancy(context.entityName);
        if (entitySupportsMultiTenancy) {
          const paramsWithWhere = params as any;
          
          if (!paramsWithWhere.where) {
            paramsWithWhere.where = {};
          }
          
          paramsWithWhere.where.tenantId = context.metadata.tenantId;
          
          return paramsWithWhere as T;
        }
        
        return params;
      }
    });

    // Add journey-specific transformations
    this.registerJourneySpecificTransformations();
    
    // Add index optimization transformations
    this.registerIndexOptimizationTransformations();
    
    // Add audit trail transformations
    this.registerAuditTrailTransformations();
  }

  /**
   * Registers journey-specific transformation rules
   */
  private registerJourneySpecificTransformations(): void {
    // Health journey transformations
    this.registerHealthJourneyTransformations();
    
    // Care journey transformations
    this.registerCareJourneyTransformations();
    
    // Plan journey transformations
    this.registerPlanJourneyTransformations();
  }

  /**
   * Registers Health journey-specific transformation rules
   */
  private registerHealthJourneyTransformations(): void {
    // Add time-series optimization for health metrics
    this.addTransformation({
      id: 'health-metrics-timeseries',
      entityTypes: ['HealthMetric'],
      operationTypes: ['findMany', 'aggregate'],
      priority: 80,
      journeyContexts: ['health'],
      transform: <T>(params: T, context: MiddlewareContext): T => {
        const paramsWithWhere = params as any;
        
        // Skip if no time range in query
        if (!paramsWithWhere.where || (!paramsWithWhere.where.timestamp && !paramsWithWhere.where.createdAt)) {
          return params;
        }
        
        // Optimize time-series queries by adding proper index hints
        if (!paramsWithWhere._hints) {
          paramsWithWhere._hints = {};
        }
        
        // Use TimescaleDB hypertable optimization if available
        paramsWithWhere._hints.useTimescaleDb = true;
        
        // Add time-bucket aggregation for aggregate queries if needed
        if (context.operationType === 'aggregate' && context.metadata?.timeBucket) {
          paramsWithWhere._hints.timeBucket = context.metadata.timeBucket;
        }
        
        return paramsWithWhere as T;
      }
    });
    
    // Add device connection optimization
    this.addTransformation({
      id: 'health-device-connection',
      entityTypes: ['DeviceConnection'],
      operationTypes: ['findMany', 'findFirst'],
      priority: 80,
      journeyContexts: ['health'],
      transform: <T>(params: T, context: MiddlewareContext): T => {
        const paramsWithWhere = params as any;
        
        // Automatically include device details for better frontend rendering
        if (!paramsWithWhere.include) {
          paramsWithWhere.include = {};
        }
        
        // Include device details by default unless explicitly disabled
        if (context.metadata?.includeDeviceDetails !== false && paramsWithWhere.include.device === undefined) {
          paramsWithWhere.include.device = true;
        }
        
        return paramsWithWhere as T;
      }
    });
  }

  /**
   * Registers Care journey-specific transformation rules
   */
  private registerCareJourneyTransformations(): void {
    // Add appointment status optimization
    this.addTransformation({
      id: 'care-appointment-status',
      entityTypes: ['Appointment'],
      operationTypes: ['findMany', 'count'],
      priority: 80,
      journeyContexts: ['care'],
      transform: <T>(params: T, context: MiddlewareContext): T => {
        const paramsWithWhere = params as any;
        
        // Add index optimization for appointment status queries
        if (paramsWithWhere.where && paramsWithWhere.where.status) {
          if (!paramsWithWhere._hints) {
            paramsWithWhere._hints = {};
          }
          
          paramsWithWhere._hints.useIndex = 'Appointment.status_userId_idx';
        }
        
        // Automatically include provider details for better frontend rendering
        if (!paramsWithWhere.include) {
          paramsWithWhere.include = {};
        }
        
        // Include provider details by default unless explicitly disabled
        if (context.metadata?.includeProviderDetails !== false && paramsWithWhere.include.provider === undefined) {
          paramsWithWhere.include.provider = true;
        }
        
        return paramsWithWhere as T;
      }
    });
    
    // Add medication reminder optimization
    this.addTransformation({
      id: 'care-medication-reminder',
      entityTypes: ['MedicationReminder'],
      operationTypes: ['findMany'],
      priority: 80,
      journeyContexts: ['care'],
      transform: <T>(params: T, context: MiddlewareContext): T => {
        const paramsWithWhere = params as any;
        
        // Optimize queries for upcoming medication reminders
        if (paramsWithWhere.where && paramsWithWhere.where.reminderTime && paramsWithWhere.where.reminderTime.gte) {
          if (!paramsWithWhere._hints) {
            paramsWithWhere._hints = {};
          }
          
          paramsWithWhere._hints.useIndex = 'MedicationReminder.userId_reminderTime_idx';
          
          // Default ordering for medication reminders is by reminderTime ascending
          if (!paramsWithWhere.orderBy) {
            paramsWithWhere.orderBy = { reminderTime: 'asc' };
          }
        }
        
        return paramsWithWhere as T;
      }
    });
  }

  /**
   * Registers Plan journey-specific transformation rules
   */
  private registerPlanJourneyTransformations(): void {
    // Add claim status optimization
    this.addTransformation({
      id: 'plan-claim-status',
      entityTypes: ['Claim'],
      operationTypes: ['findMany', 'count'],
      priority: 80,
      journeyContexts: ['plan'],
      transform: <T>(params: T, context: MiddlewareContext): T => {
        const paramsWithWhere = params as any;
        
        // Add index optimization for claim status queries
        if (paramsWithWhere.where && paramsWithWhere.where.status) {
          if (!paramsWithWhere._hints) {
            paramsWithWhere._hints = {};
          }
          
          paramsWithWhere._hints.useIndex = 'Claim.userId_status_idx';
        }
        
        // Default ordering for claims is by submissionDate descending
        if (!paramsWithWhere.orderBy) {
          paramsWithWhere.orderBy = { submissionDate: 'desc' };
        }
        
        return paramsWithWhere as T;
      }
    });
    
    // Add benefit coverage optimization
    this.addTransformation({
      id: 'plan-benefit-coverage',
      entityTypes: ['Benefit', 'Coverage'],
      operationTypes: ['findMany'],
      priority: 80,
      journeyContexts: ['plan'],
      transform: <T>(params: T, context: MiddlewareContext): T => {
        const paramsWithWhere = params as any;
        
        // Automatically include related data for better frontend rendering
        if (!paramsWithWhere.include) {
          paramsWithWhere.include = {};
        }
        
        // For benefits, include coverage details by default
        if (context.entityName === 'Benefit' && context.metadata?.includeCoverageDetails !== false) {
          paramsWithWhere.include.coverage = true;
        }
        
        // For coverage, include plan details by default
        if (context.entityName === 'Coverage' && context.metadata?.includePlanDetails !== false) {
          paramsWithWhere.include.plan = true;
        }
        
        return paramsWithWhere as T;
      }
    });
  }

  /**
   * Registers index optimization transformation rules
   */
  private registerIndexOptimizationTransformations(): void {
    // Add general index optimization transformation
    this.addTransformation({
      id: 'index-optimization',
      entityTypes: ['*'],
      operationTypes: ['findMany', 'findFirst', 'count', 'aggregate'],
      priority: 70, // Lower priority than journey-specific optimizations
      journeyContexts: ['*'],
      transform: <T>(params: T, context: MiddlewareContext): T => {
        const paramsWithWhere = params as any;
        
        // Skip if no where clause or hints already set
        if (!paramsWithWhere.where || paramsWithWhere._hints) {
          return params;
        }
        
        // Analyze query to suggest index optimizations
        const suggestedIndex = this.suggestIndexForQuery(paramsWithWhere.where, context.entityName);
        if (suggestedIndex) {
          if (!paramsWithWhere._hints) {
            paramsWithWhere._hints = {};
          }
          
          paramsWithWhere._hints.useIndex = suggestedIndex;
          this.logger.debug(`Suggested index ${suggestedIndex} for query on ${context.entityName}`);
        }
        
        return paramsWithWhere as T;
      }
    });
  }

  /**
   * Registers audit trail transformation rules
   */
  private registerAuditTrailTransformations(): void {
    // Add audit trail for write operations
    this.addTransformation({
      id: 'audit-trail',
      entityTypes: ['*'],
      operationTypes: ['create', 'createMany', 'update', 'updateMany', 'delete', 'deleteMany'],
      priority: 120, // Highest priority to capture final state
      journeyContexts: ['*'],
      transform: <T>(params: T, context: MiddlewareContext): T => {
        // Skip if audit trail is disabled or no user ID in context
        if (context.metadata?.skipAudit || !context.userId) {
          return params;
        }
        
        // Skip if entity doesn't support audit trails
        const entitySupportsAudit = this.entitySupportsAuditTrail(context.entityName);
        if (!entitySupportsAudit) {
          return params;
        }
        
        // Clone params to avoid modifying the original
        const paramsWithAudit = { ...params } as any;
        
        // Add audit metadata to the operation context for later processing
        if (!context.metadata) {
          context.metadata = {};
        }
        
        context.metadata.auditInfo = {
          userId: context.userId,
          operationType: context.operationType,
          entityName: context.entityName,
          timestamp: new Date(),
          params: JSON.stringify(params)
        };
        
        return paramsWithAudit as T;
      }
    });
  }

  /**
   * Suggests an appropriate index for a query based on the where clause
   * 
   * @param where The where clause of the query
   * @param entityName The name of the entity being queried
   * @returns The name of the suggested index, or undefined if no suggestion
   */
  private suggestIndexForQuery(where: Record<string, any>, entityName?: string): string | undefined {
    if (!entityName) {
      return undefined;
    }
    
    // Get the fields used in the where clause
    const whereFields = Object.keys(where);
    
    // Skip if no fields or too many fields
    if (whereFields.length === 0 || whereFields.length > 3) {
      return undefined;
    }
    
    // Check for common index patterns based on entity type
    switch (entityName) {
      case 'User':
        if (whereFields.includes('email')) {
          return 'User.email_idx';
        }
        break;
        
      case 'HealthMetric':
        if (whereFields.includes('userId') && whereFields.includes('type')) {
          return 'HealthMetric.userId_type_idx';
        }
        if (whereFields.includes('userId') && whereFields.includes('timestamp')) {
          return 'HealthMetric.userId_timestamp_idx';
        }
        break;
        
      case 'Appointment':
        if (whereFields.includes('userId') && whereFields.includes('date')) {
          return 'Appointment.userId_date_idx';
        }
        break;
        
      case 'Claim':
        if (whereFields.includes('userId') && whereFields.includes('status')) {
          return 'Claim.userId_status_idx';
        }
        break;
        
      case 'MedicationReminder':
        if (whereFields.includes('userId') && whereFields.includes('reminderTime')) {
          return 'MedicationReminder.userId_reminderTime_idx';
        }
        break;
        
      default:
        // For any entity, suggest userId index if it's the only field
        if (whereFields.length === 1 && whereFields.includes('userId')) {
          return `${entityName}.userId_idx`;
        }
        
        // For any entity with id as the only field, use primary key
        if (whereFields.length === 1 && whereFields.includes('id')) {
          return `${entityName}.id_idx`;
        }
    }
    
    return undefined;
  }

  /**
   * Checks if an entity supports soft deletion
   * 
   * @param entityName The name of the entity
   * @returns True if the entity supports soft deletion
   */
  private entitySupportsSoftDeletion(entityName?: string): boolean {
    if (!entityName) {
      return false;
    }
    
    // List of entities that support soft deletion
    const softDeleteEntities = [
      'User',
      'HealthMetric',
      'HealthGoal',
      'DeviceConnection',
      'Appointment',
      'Provider',
      'Medication',
      'Treatment',
      'Claim',
      'Benefit',
      'Coverage',
      'Plan',
      'Document',
      'Achievement',
      'Quest',
      'Reward',
      'Profile',
      'Rule'
    ];
    
    return softDeleteEntities.includes(entityName);
  }

  /**
   * Checks if an entity supports timestamps
   * 
   * @param entityName The name of the entity
   * @returns True if the entity supports timestamps
   */
  private entitySupportsTimestamps(entityName?: string): boolean {
    if (!entityName) {
      return false;
    }
    
    // Most entities support timestamps, list those that don't
    const nonTimestampEntities = [
      '_prisma_migrations',
      'AuditLog', // Has its own timestamp field
      'MetricRollup' // Has its own timestamp fields
    ];
    
    return !nonTimestampEntities.includes(entityName);
  }

  /**
   * Checks if an entity supports multi-tenancy
   * 
   * @param entityName The name of the entity
   * @returns True if the entity supports multi-tenancy
   */
  private entitySupportsMultiTenancy(entityName?: string): boolean {
    if (!entityName) {
      return false;
    }
    
    // List of entities that support multi-tenancy
    const multiTenancyEntities = [
      'User',
      'HealthMetric',
      'HealthGoal',
      'DeviceConnection',
      'Appointment',
      'Provider',
      'Medication',
      'Treatment',
      'Claim',
      'Benefit',
      'Coverage',
      'Plan',
      'Document',
      'Achievement',
      'Quest',
      'Reward',
      'Profile',
      'Rule'
    ];
    
    return multiTenancyEntities.includes(entityName);
  }

  /**
   * Checks if an entity supports audit trails
   * 
   * @param entityName The name of the entity
   * @returns True if the entity supports audit trails
   */
  private entitySupportsAuditTrail(entityName?: string): boolean {
    if (!entityName) {
      return false;
    }
    
    // List of entities that don't support audit trails
    const nonAuditEntities = [
      '_prisma_migrations',
      'AuditLog', // Avoid recursive audit logging
      'MetricRollup', // Aggregated data doesn't need audit
      'LoginAttempt', // High-volume entity
      'ApiRequest' // High-volume entity
    ];
    
    return !nonAuditEntities.includes(entityName);
  }
}