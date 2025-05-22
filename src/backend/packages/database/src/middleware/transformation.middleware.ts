import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

// Import journey-specific interfaces
import { JourneyType } from '../types/journey.types';
import { DatabaseMiddleware, MiddlewareContext } from './middleware.interface';

/**
 * Transformation rule interface for defining query transformations
 */
export interface TransformationRule {
  /**
   * Name of the transformation rule for identification and logging
   */
  name: string;
  
  /**
   * Optional journey type this rule applies to (undefined means all journeys)
   */
  journeyType?: JourneyType;
  
  /**
   * Optional model name this rule applies to (undefined means all models)
   */
  modelName?: string;
  
  /**
   * Optional operation type this rule applies to (undefined means all operations)
   */
  operation?: Prisma.PrismaAction;
  
  /**
   * Priority of the rule (higher numbers run first)
   */
  priority: number;
  
  /**
   * Function that transforms the query arguments
   * @param args The original query arguments
   * @param context The middleware context
   * @returns The transformed query arguments
   */
  transform: (args: any, context: MiddlewareContext) => any;
}

/**
 * Configuration options for the TransformationMiddleware
 */
export interface TransformationOptions {
  /**
   * Whether to enable multi-tenancy support
   */
  enableMultiTenancy?: boolean;
  
  /**
   * Whether to enable soft deletion support
   */
  enableSoftDeletion?: boolean;
  
  /**
   * Whether to enable automatic timestamp management
   */
  enableTimestamps?: boolean;
  
  /**
   * Whether to enable audit trail support
   */
  enableAuditTrail?: boolean;
  
  /**
   * Whether to enable automatic index optimization
   */
  enableIndexOptimization?: boolean;
  
  /**
   * Custom transformation rules to apply
   */
  customRules?: TransformationRule[];
}

/**
 * Middleware that transforms database operations before execution to optimize
 * performance and implement cross-cutting concerns.
 * 
 * This middleware provides:
 * - Journey-specific query transformations
 * - Multi-tenancy support
 * - Automatic index utilization optimization
 * - Support for soft deletion, timestamps, and audit trails
 * - Transformation chaining for complex operations
 */
@Injectable()
export class TransformationMiddleware implements DatabaseMiddleware {
  private readonly logger = new Logger(TransformationMiddleware.name);
  private readonly rules: TransformationRule[] = [];
  private readonly options: TransformationOptions;

  /**
   * Creates a new instance of TransformationMiddleware
   * @param configService Optional NestJS ConfigService for retrieving configuration values
   */
  constructor(private readonly configService?: ConfigService) {
    // Load configuration from environment or use defaults
    this.options = this.loadOptions();
    
    // Register built-in transformation rules
    this.registerBuiltInRules();
    
    // Register custom transformation rules if provided
    if (this.options.customRules) {
      this.options.customRules.forEach(rule => this.registerRule(rule));
    }
    
    this.logger.log(`TransformationMiddleware initialized with ${this.rules.length} rules`);
  }

  /**
   * Loads middleware options from configuration service or uses defaults
   */
  private loadOptions(): TransformationOptions {
    if (!this.configService) {
      return this.getDefaultOptions();
    }

    return {
      enableMultiTenancy: this.configService.get<boolean>('DATABASE_ENABLE_MULTI_TENANCY', true),
      enableSoftDeletion: this.configService.get<boolean>('DATABASE_ENABLE_SOFT_DELETION', true),
      enableTimestamps: this.configService.get<boolean>('DATABASE_ENABLE_TIMESTAMPS', true),
      enableAuditTrail: this.configService.get<boolean>('DATABASE_ENABLE_AUDIT_TRAIL', true),
      enableIndexOptimization: this.configService.get<boolean>('DATABASE_ENABLE_INDEX_OPTIMIZATION', true),
      customRules: [],
    };
  }

  /**
   * Returns default options for the middleware
   */
  private getDefaultOptions(): TransformationOptions {
    return {
      enableMultiTenancy: true,
      enableSoftDeletion: true,
      enableTimestamps: true,
      enableAuditTrail: true,
      enableIndexOptimization: true,
      customRules: [],
    };
  }

  /**
   * Registers a transformation rule
   * @param rule The rule to register
   */
  public registerRule(rule: TransformationRule): void {
    this.rules.push(rule);
    // Sort rules by priority (highest first)
    this.rules.sort((a, b) => b.priority - a.priority);
    this.logger.debug(`Registered transformation rule: ${rule.name}`);
  }

  /**
   * Registers built-in transformation rules based on configuration
   */
  private registerBuiltInRules(): void {
    // Multi-tenancy support
    if (this.options.enableMultiTenancy) {
      this.registerRule(this.createMultiTenancyRule());
    }

    // Soft deletion support
    if (this.options.enableSoftDeletion) {
      this.registerRule(this.createSoftDeletionRule());
    }

    // Timestamp management
    if (this.options.enableTimestamps) {
      this.registerRule(this.createTimestampRule());
    }

    // Audit trail support
    if (this.options.enableAuditTrail) {
      this.registerRule(this.createAuditTrailRule());
    }

    // Index optimization
    if (this.options.enableIndexOptimization) {
      this.registerRule(this.createIndexOptimizationRule());
    }

    // Journey-specific rules
    this.registerJourneySpecificRules();
  }

  /**
   * Creates a rule for multi-tenancy support
   */
  private createMultiTenancyRule(): TransformationRule {
    return {
      name: 'MultiTenancy',
      priority: 1000, // Very high priority
      transform: (args, context) => {
        // Skip if no tenant ID in context
        if (!context.tenantId) {
          return args;
        }

        // Add tenant ID to where clause for all operations that support it
        if (args.where === undefined) {
          args.where = {};
        }

        // Only add tenant ID if the model has a tenantId field
        // This check is simplified - in a real implementation, you would check the model metadata
        const modelHasTenantId = true; // Placeholder for actual check
        
        if (modelHasTenantId) {
          args.where.tenantId = context.tenantId;
        }

        return args;
      },
    };
  }

  /**
   * Creates a rule for soft deletion support
   */
  private createSoftDeletionRule(): TransformationRule {
    return {
      name: 'SoftDeletion',
      priority: 900,
      transform: (args, context) => {
        // Skip if explicitly including deleted records
        if (context.includeDeleted) {
          return args;
        }

        // Only apply to models that support soft deletion
        // This check is simplified - in a real implementation, you would check the model metadata
        const modelHasSoftDelete = true; // Placeholder for actual check
        
        if (!modelHasSoftDelete) {
          return args;
        }

        // Add deletedAt IS NULL condition to where clause
        if (args.where === undefined) {
          args.where = {};
        }

        args.where.deletedAt = null;

        // For delete operations, transform to update with deletedAt
        if (context.operation === 'delete' || context.operation === 'deleteMany') {
          // Transform delete to update
          const now = new Date();
          return {
            ...args,
            data: {
              deletedAt: now,
            },
          };
        }

        return args;
      },
    };
  }

  /**
   * Creates a rule for automatic timestamp management
   */
  private createTimestampRule(): TransformationRule {
    return {
      name: 'Timestamps',
      priority: 800,
      transform: (args, context) => {
        // Only apply to create and update operations
        if (!['create', 'createMany', 'update', 'updateMany', 'upsert'].includes(context.operation)) {
          return args;
        }

        // Only apply to models that have timestamp fields
        // This check is simplified - in a real implementation, you would check the model metadata
        const modelHasTimestamps = true; // Placeholder for actual check
        
        if (!modelHasTimestamps) {
          return args;
        }

        const now = new Date();

        // For create operations, set createdAt and updatedAt
        if (['create', 'createMany', 'upsert'].includes(context.operation)) {
          if (!args.data) {
            args.data = {};
          }

          // Handle both single and batch operations
          if (Array.isArray(args.data)) {
            args.data = args.data.map(item => ({
              ...item,
              createdAt: item.createdAt || now,
              updatedAt: item.updatedAt || now,
            }));
          } else {
            args.data.createdAt = args.data.createdAt || now;
            args.data.updatedAt = args.data.updatedAt || now;
          }
        }

        // For update operations, set updatedAt
        if (['update', 'updateMany', 'upsert'].includes(context.operation)) {
          if (!args.data) {
            args.data = {};
          }

          // Handle both single and batch operations
          if (Array.isArray(args.data)) {
            args.data = args.data.map(item => ({
              ...item,
              updatedAt: now,
            }));
          } else {
            args.data.updatedAt = now;
          }
        }

        return args;
      },
    };
  }

  /**
   * Creates a rule for audit trail support
   */
  private createAuditTrailRule(): TransformationRule {
    return {
      name: 'AuditTrail',
      priority: 700,
      transform: (args, context) => {
        // Skip if no user ID in context
        if (!context.userId) {
          return args;
        }

        // Only apply to operations that modify data
        if (!['create', 'createMany', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(context.operation)) {
          return args;
        }

        // Only apply to models that support audit trail
        // This check is simplified - in a real implementation, you would check the model metadata
        const modelHasAuditFields = true; // Placeholder for actual check
        
        if (!modelHasAuditFields) {
          return args;
        }

        // For create operations, set createdBy
        if (['create', 'createMany', 'upsert'].includes(context.operation)) {
          if (!args.data) {
            args.data = {};
          }

          // Handle both single and batch operations
          if (Array.isArray(args.data)) {
            args.data = args.data.map(item => ({
              ...item,
              createdBy: item.createdBy || context.userId,
            }));
          } else {
            args.data.createdBy = args.data.createdBy || context.userId;
          }
        }

        // For update operations, set updatedBy
        if (['update', 'updateMany', 'upsert'].includes(context.operation)) {
          if (!args.data) {
            args.data = {};
          }

          // Handle both single and batch operations
          if (Array.isArray(args.data)) {
            args.data = args.data.map(item => ({
              ...item,
              updatedBy: context.userId,
            }));
          } else {
            args.data.updatedBy = context.userId;
          }
        }

        return args;
      },
    };
  }

  /**
   * Creates a rule for automatic index optimization
   */
  private createIndexOptimizationRule(): TransformationRule {
    return {
      name: 'IndexOptimization',
      priority: 500,
      transform: (args, context) => {
        // Only apply to find operations
        if (!['findUnique', 'findFirst', 'findMany'].includes(context.operation)) {
          return args;
        }

        // Skip if no where clause
        if (!args.where) {
          return args;
        }

        // Get available indexes for the model
        // This is a simplified implementation - in a real implementation, you would
        // retrieve the actual indexes from the database schema or model metadata
        const availableIndexes = this.getAvailableIndexes(context.model);
        
        if (!availableIndexes || availableIndexes.length === 0) {
          return args;
        }

        // Check if we can optimize the query using available indexes
        const optimizedWhere = this.optimizeWhereClause(args.where, availableIndexes);
        
        if (optimizedWhere) {
          args.where = optimizedWhere;
        }

        return args;
      },
    };
  }

  /**
   * Registers journey-specific transformation rules
   */
  private registerJourneySpecificRules(): void {
    // Health journey rules
    this.registerRule({
      name: 'HealthJourneyTransformation',
      journeyType: 'health',
      priority: 600,
      transform: (args, context) => {
        // Apply health journey-specific transformations
        // For example, automatically filter health metrics by date range
        if (context.model === 'HealthMetric' && context.operation === 'findMany') {
          if (!args.where) {
            args.where = {};
          }
          
          // If no date range is specified, default to last 30 days
          if (!args.where.date) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            args.where.date = {
              gte: thirtyDaysAgo,
            };
          }
        }
        
        return args;
      },
    });

    // Care journey rules
    this.registerRule({
      name: 'CareJourneyTransformation',
      journeyType: 'care',
      priority: 600,
      transform: (args, context) => {
        // Apply care journey-specific transformations
        // For example, automatically filter appointments by status
        if (context.model === 'Appointment' && context.operation === 'findMany') {
          if (!args.where) {
            args.where = {};
          }
          
          // If no status filter is specified, exclude cancelled appointments by default
          if (!args.where.status) {
            args.where.status = {
              not: 'CANCELLED',
            };
          }
        }
        
        return args;
      },
    });

    // Plan journey rules
    this.registerRule({
      name: 'PlanJourneyTransformation',
      journeyType: 'plan',
      priority: 600,
      transform: (args, context) => {
        // Apply plan journey-specific transformations
        // For example, automatically filter claims by status
        if (context.model === 'Claim' && context.operation === 'findMany') {
          if (!args.where) {
            args.where = {};
          }
          
          // If no status filter is specified, exclude rejected claims by default
          if (!args.where.status) {
            args.where.status = {
              not: 'REJECTED',
            };
          }
        }
        
        return args;
      },
    });
  }

  /**
   * Gets available indexes for a model
   * @param model The model name
   * @returns Array of available indexes
   */
  private getAvailableIndexes(model: string): Array<{ name: string; fields: string[] }> {
    // This is a simplified implementation - in a real implementation, you would
    // retrieve the actual indexes from the database schema or model metadata
    const indexMap: Record<string, Array<{ name: string; fields: string[] }>> = {
      'User': [
        { name: 'User_email_idx', fields: ['email'] },
        { name: 'User_tenantId_idx', fields: ['tenantId'] },
      ],
      'HealthMetric': [
        { name: 'HealthMetric_userId_idx', fields: ['userId'] },
        { name: 'HealthMetric_type_idx', fields: ['type'] },
        { name: 'HealthMetric_date_idx', fields: ['date'] },
        { name: 'HealthMetric_userId_type_date_idx', fields: ['userId', 'type', 'date'] },
      ],
      'Appointment': [
        { name: 'Appointment_userId_idx', fields: ['userId'] },
        { name: 'Appointment_providerId_idx', fields: ['providerId'] },
        { name: 'Appointment_date_idx', fields: ['date'] },
        { name: 'Appointment_status_idx', fields: ['status'] },
        { name: 'Appointment_userId_status_idx', fields: ['userId', 'status'] },
      ],
      'Claim': [
        { name: 'Claim_userId_idx', fields: ['userId'] },
        { name: 'Claim_status_idx', fields: ['status'] },
        { name: 'Claim_submissionDate_idx', fields: ['submissionDate'] },
        { name: 'Claim_userId_status_idx', fields: ['userId', 'status'] },
      ],
    };

    return indexMap[model] || [];
  }

  /**
   * Optimizes a where clause based on available indexes
   * @param where The original where clause
   * @param indexes Available indexes for the model
   * @returns Optimized where clause or null if no optimization is possible
   */
  private optimizeWhereClause(
    where: Record<string, any>,
    indexes: Array<{ name: string; fields: string[] }>,
  ): Record<string, any> | null {
    // Extract fields from the where clause
    const whereFields = Object.keys(where);
    
    if (whereFields.length === 0) {
      return null;
    }

    // Find the best matching index (most fields covered)
    let bestIndex = null;
    let bestCoverage = 0;

    for (const index of indexes) {
      const coverage = index.fields.filter(field => whereFields.includes(field)).length;
      
      if (coverage > bestCoverage) {
        bestIndex = index;
        bestCoverage = coverage;
      }
    }

    // If we found a good index match, optimize the query
    if (bestIndex && bestCoverage > 0) {
      this.logger.debug(`Using index ${bestIndex.name} for query optimization`);
      
      // In a real implementation, you might reorder conditions or add hints
      // For now, we'll just return the original where clause
      return where;
    }

    return null;
  }

  /**
   * Transforms query arguments before execution
   * @param params The middleware parameters
   * @returns The transformed parameters
   */
  async beforeExecute(params: {
    args: any;
    dataPath: string[];
    runInTransaction: boolean;
    context: MiddlewareContext;
  }): Promise<any> {
    const { args, context } = params;
    let transformedArgs = { ...args };

    // Apply each transformation rule in order
    for (const rule of this.rules) {
      // Skip rules that don't apply to this journey
      if (rule.journeyType && rule.journeyType !== context.journeyType) {
        continue;
      }

      // Skip rules that don't apply to this model
      if (rule.modelName && rule.modelName !== context.model) {
        continue;
      }

      // Skip rules that don't apply to this operation
      if (rule.operation && rule.operation !== context.operation) {
        continue;
      }

      try {
        transformedArgs = rule.transform(transformedArgs, context);
      } catch (error) {
        this.logger.error(
          `Error applying transformation rule ${rule.name}: ${error.message}`,
          error.stack,
        );
      }
    }

    return { ...params, args: transformedArgs };
  }

  /**
   * Processes the result after query execution
   * @param params The middleware parameters
   * @returns The processed result
   */
  async afterExecute(params: {
    args: any;
    dataPath: string[];
    runInTransaction: boolean;
    context: MiddlewareContext;
    result: any;
  }): Promise<any> {
    // No post-processing needed for transformation middleware
    return params;
  }
}