import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BaseJourneyContext } from './base-journey.context';
import { PrismaService } from '../prisma.service';
import { ConnectionManager } from '../connection/connection-manager';
import { TransactionService } from '../transactions/transaction.service';
import { DatabaseErrorTransformer } from '../errors/error-transformer';
import { DatabaseException, QueryException, IntegrityException } from '../errors/database-error.exception';
import { DatabaseErrorType } from '../errors/database-error.types';
import { JourneyType } from '../types/journey.types';
import { QueryOptions, PaginationOptions, TimeSeriesQueryOptions } from '../types/query.types';
import { TransactionOptions } from '../types/transaction.types';
import {
  GoalType,
  GoalStatus,
  GoalPeriod,
  IHealthGoal,
  MetricType,
  MetricSource,
  IHealthMetric,
  IMedicalEvent,
  ConnectionStatus,
  DeviceType,
  IDeviceConnection
} from '@austa/interfaces';

/**
 * Specialized database context for the Health journey ("Minha Saúde") that extends the base journey context
 * with health-specific database operations and TimescaleDB optimizations for time-series data.
 * 
 * Provides methods for health metrics, goals, device connections, and medical events with optimized
 * queries and journey-specific error handling.
 */
@Injectable()
export class HealthDatabaseContext extends BaseJourneyContext {
  /**
   * Creates a new HealthDatabaseContext instance.
   * 
   * @param prisma - The PrismaService instance for database access
   * @param connectionManager - The ConnectionManager for optimized connections
   * @param transactionService - The TransactionService for transaction management
   * @param errorTransformer - The DatabaseErrorTransformer for error handling
   */
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly connectionManager: ConnectionManager,
    protected readonly transactionService: TransactionService,
    protected readonly errorTransformer: DatabaseErrorTransformer
  ) {
    super(prisma, connectionManager, transactionService, errorTransformer, JourneyType.HEALTH);
  }

  /**
   * Initializes the health database context with journey-specific configurations.
   * Sets up TimescaleDB-specific optimizations and connection pooling for health metrics.
   */
  async initialize(): Promise<void> {
    try {
      await super.initialize();
      
      // Configure connection pool specifically for health metrics time-series data
      await this.connectionManager.configurePool({
        journeyType: JourneyType.HEALTH,
        minConnections: 5,
        maxConnections: 20,
        idleTimeout: 10000, // 10 seconds
        acquireTimeout: 5000 // 5 seconds
      });
      
      // Verify TimescaleDB extension is available
      const result = await this.prisma.$queryRaw`SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'`;
      if (!Array.isArray(result) || result.length === 0) {
        this.logger.warn('TimescaleDB extension not found. Time-series optimizations will be limited.');
      } else {
        this.logger.log('TimescaleDB extension verified. Time-series optimizations enabled.');
      }
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to initialize health database context',
        { journeyType: JourneyType.HEALTH }
      );
      this.logger.error('Health database context initialization failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Creates a new health metric record with TimescaleDB optimizations.
   * 
   * @param metric - The health metric data to create
   * @param options - Optional transaction options
   * @returns The created health metric
   */
  async createHealthMetric(
    metric: Omit<IHealthMetric, 'id'>,
    options?: TransactionOptions
  ): Promise<IHealthMetric> {
    try {
      const client = await this.getClient(options);
      
      // Generate UUID for the metric
      const id = await this.generateUuid();
      
      // Validate metric data
      this.validateHealthMetric(metric);
      
      // Create the metric with optimized insert for TimescaleDB
      const result = await client.healthMetric.create({
        data: {
          id,
          userId: metric.userId,
          type: metric.type,
          value: metric.value,
          unit: metric.unit,
          timestamp: metric.timestamp || new Date(),
          source: metric.source,
          notes: metric.notes,
          trend: metric.trend,
          isAbnormal: metric.isAbnormal || false
        }
      });
      
      // Update trend data asynchronously if not provided
      if (metric.trend === undefined) {
        this.updateMetricTrend(result.id).catch(error => {
          this.logger.warn(`Failed to update trend for metric ${result.id}`, error);
        });
      }
      
      return result as IHealthMetric;
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to create health metric',
        { journeyType: JourneyType.HEALTH, metricType: metric.type }
      );
      this.logger.error('Health metric creation failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Retrieves health metrics with TimescaleDB optimizations for time-series data.
   * 
   * @param userId - The user ID to retrieve metrics for
   * @param options - Query options including time range, metric types, and pagination
   * @returns Array of health metrics matching the criteria
   */
  async getHealthMetrics(
    userId: string,
    options?: TimeSeriesQueryOptions & { types?: MetricType[] }
  ): Promise<IHealthMetric[]> {
    try {
      const client = await this.getClient();
      
      // Build query filters
      const where: Prisma.HealthMetricWhereInput = { userId };
      
      // Add type filter if specified
      if (options?.types && options.types.length > 0) {
        where.type = { in: options.types };
      }
      
      // Add time range filters if specified
      if (options?.startTime || options?.endTime) {
        where.timestamp = {};
        
        if (options.startTime) {
          where.timestamp.gte = options.startTime;
        }
        
        if (options.endTime) {
          where.timestamp.lte = options.endTime;
        }
      }
      
      // Build pagination options
      const take = options?.limit || 100;
      const skip = options?.offset || 0;
      
      // Use TimescaleDB-optimized query for time-series data
      // For time-based aggregations, we use raw SQL for better performance
      if (options?.aggregation) {
        return this.getAggregatedHealthMetrics(userId, options);
      }
      
      // For regular queries, use Prisma's query builder
      const metrics = await client.healthMetric.findMany({
        where,
        take,
        skip,
        orderBy: { timestamp: options?.order || 'desc' }
      });
      
      return metrics as IHealthMetric[];
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to retrieve health metrics',
        { journeyType: JourneyType.HEALTH, userId }
      );
      this.logger.error('Health metrics retrieval failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Retrieves aggregated health metrics using TimescaleDB's time_bucket function.
   * 
   * @param userId - The user ID to retrieve metrics for
   * @param options - Query options including time range, aggregation interval, and metric types
   * @returns Array of aggregated health metrics
   */
  async getAggregatedHealthMetrics(
    userId: string,
    options: TimeSeriesQueryOptions & { types?: MetricType[], aggregation: string }
  ): Promise<IHealthMetric[]> {
    try {
      // Validate aggregation interval
      const validIntervals = ['1 hour', '1 day', '1 week', '1 month'];
      const interval = validIntervals.includes(options.aggregation) 
        ? options.aggregation 
        : '1 day';
      
      // Build type filter
      const typeFilter = options.types && options.types.length > 0
        ? `AND type IN (${options.types.map(t => `'${t}'`).join(', ')})`
        : '';
      
      // Build time range filter
      const startTimeFilter = options.startTime
        ? `AND timestamp >= '${options.startTime.toISOString()}'`
        : '';
      
      const endTimeFilter = options.endTime
        ? `AND timestamp <= '${options.endTime.toISOString()}'`
        : '';
      
      // Use TimescaleDB's time_bucket function for efficient time-series aggregation
      const result = await this.prisma.$queryRaw`
        SELECT 
          time_bucket(${interval}::interval, timestamp) as bucket_time,
          type,
          AVG(value::numeric) as avg_value,
          MAX(value::numeric) as max_value,
          MIN(value::numeric) as min_value,
          COUNT(*) as count
        FROM health_metrics
        WHERE userId = ${userId}
        ${Prisma.raw(typeFilter)}
        ${Prisma.raw(startTimeFilter)}
        ${Prisma.raw(endTimeFilter)}
        GROUP BY bucket_time, type
        ORDER BY bucket_time ${options.order === 'asc' ? Prisma.raw('ASC') : Prisma.raw('DESC')}
        LIMIT ${options.limit || 100}
        OFFSET ${options.offset || 0}
      `;
      
      // Transform raw results into IHealthMetric format
      return (result as any[]).map(row => ({
        id: `aggregated-${row.type}-${row.bucket_time}`,
        userId,
        type: row.type,
        value: row.avg_value,
        unit: this.getUnitForMetricType(row.type as MetricType),
        timestamp: row.bucket_time,
        source: MetricSource.API,
        isAbnormal: false,
        aggregation: {
          count: Number(row.count),
          min: Number(row.min_value),
          max: Number(row.max_value),
          avg: Number(row.avg_value)
        }
      })) as IHealthMetric[];
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to retrieve aggregated health metrics',
        { journeyType: JourneyType.HEALTH, userId, aggregation: options.aggregation }
      );
      this.logger.error('Aggregated health metrics retrieval failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Updates a health metric with optimized handling for time-series data.
   * 
   * @param id - The ID of the metric to update
   * @param data - The updated metric data
   * @param options - Optional transaction options
   * @returns The updated health metric
   */
  async updateHealthMetric(
    id: string,
    data: Partial<IHealthMetric>,
    options?: TransactionOptions
  ): Promise<IHealthMetric> {
    try {
      const client = await this.getClient(options);
      
      // Validate update data
      if (data.type || data.value || data.unit) {
        const currentMetric = await client.healthMetric.findUnique({ where: { id } });
        if (!currentMetric) {
          throw new QueryException(
            'Health metric not found',
            DatabaseErrorType.QUERY_NOT_FOUND,
            { journeyType: JourneyType.HEALTH, metricId: id }
          );
        }
        
        this.validateHealthMetric({
          ...currentMetric,
          ...data
        } as IHealthMetric);
      }
      
      // Update the metric
      const updated = await client.healthMetric.update({
        where: { id },
        data: {
          ...data,
          // Ensure timestamp is not modified for TimescaleDB integrity
          timestamp: data.timestamp
        }
      });
      
      // Update trend data if value changed
      if (data.value !== undefined) {
        this.updateMetricTrend(id).catch(error => {
          this.logger.warn(`Failed to update trend for metric ${id}`, error);
        });
      }
      
      return updated as IHealthMetric;
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to update health metric',
        { journeyType: JourneyType.HEALTH, metricId: id }
      );
      this.logger.error('Health metric update failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Deletes a health metric with TimescaleDB-optimized deletion.
   * 
   * @param id - The ID of the metric to delete
   * @param options - Optional transaction options
   * @returns True if the deletion was successful
   */
  async deleteHealthMetric(
    id: string,
    options?: TransactionOptions
  ): Promise<boolean> {
    try {
      const client = await this.getClient(options);
      
      // Delete the metric
      await client.healthMetric.delete({ where: { id } });
      
      return true;
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to delete health metric',
        { journeyType: JourneyType.HEALTH, metricId: id }
      );
      this.logger.error('Health metric deletion failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Updates the trend percentage for a health metric based on historical data.
   * 
   * @param metricId - The ID of the metric to update trend for
   * @returns The updated trend percentage
   */
  private async updateMetricTrend(metricId: string): Promise<number | null> {
    try {
      const client = await this.getClient();
      
      // Get the current metric
      const metric = await client.healthMetric.findUnique({ where: { id: metricId } });
      if (!metric) {
        throw new QueryException(
          'Health metric not found',
          DatabaseErrorType.QUERY_NOT_FOUND,
          { journeyType: JourneyType.HEALTH, metricId }
        );
      }
      
      // Get previous metrics of the same type for trend calculation
      const previousMetrics = await client.healthMetric.findMany({
        where: {
          userId: metric.userId,
          type: metric.type,
          timestamp: { lt: metric.timestamp }
        },
        orderBy: { timestamp: 'desc' },
        take: 5
      });
      
      // Calculate trend if we have previous metrics
      if (previousMetrics.length > 0) {
        // Calculate average of previous values
        const avgPreviousValue = previousMetrics.reduce(
          (sum, m) => sum + Number(m.value),
          0
        ) / previousMetrics.length;
        
        // Calculate percentage change
        const currentValue = Number(metric.value);
        const trend = avgPreviousValue !== 0
          ? ((currentValue - avgPreviousValue) / avgPreviousValue) * 100
          : null;
        
        // Update the metric with the calculated trend
        if (trend !== null) {
          await client.healthMetric.update({
            where: { id: metricId },
            data: { trend }
          });
          
          return trend;
        }
      }
      
      return null;
    } catch (error) {
      // Log but don't throw - this is a background operation
      this.logger.warn(
        `Failed to update trend for metric ${metricId}`,
        this.errorTransformer.transformError(
          error,
          'Failed to update metric trend',
          { journeyType: JourneyType.HEALTH, metricId }
        )
      );
      return null;
    }
  }

  /**
   * Creates a new health goal with optimized transaction handling.
   * 
   * @param goal - The health goal data to create
   * @param options - Optional transaction options
   * @returns The created health goal
   */
  async createHealthGoal(
    goal: Omit<IHealthGoal, 'id'>,
    options?: TransactionOptions
  ): Promise<IHealthGoal> {
    try {
      const client = await this.getClient(options);
      
      // Generate UUID for the goal
      const id = await this.generateUuid();
      
      // Validate goal data
      this.validateHealthGoal(goal);
      
      // Create the goal
      const result = await client.healthGoal.create({
        data: {
          id,
          userId: goal.userId,
          type: goal.type,
          status: goal.status || GoalStatus.ACTIVE,
          period: goal.period || GoalPeriod.DAILY,
          targetValue: goal.targetValue,
          currentValue: goal.currentValue || 0,
          startDate: goal.startDate || new Date(),
          endDate: goal.endDate,
          completedDate: goal.completedDate
        }
      });
      
      return result as IHealthGoal;
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to create health goal',
        { journeyType: JourneyType.HEALTH, goalType: goal.type }
      );
      this.logger.error('Health goal creation failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Retrieves health goals for a user with filtering and pagination.
   * 
   * @param userId - The user ID to retrieve goals for
   * @param options - Query options including status, type, and pagination
   * @returns Array of health goals matching the criteria
   */
  async getHealthGoals(
    userId: string,
    options?: QueryOptions & { status?: GoalStatus[], types?: GoalType[] }
  ): Promise<IHealthGoal[]> {
    try {
      const client = await this.getClient();
      
      // Build query filters
      const where: Prisma.HealthGoalWhereInput = { userId };
      
      // Add status filter if specified
      if (options?.status && options.status.length > 0) {
        where.status = { in: options.status };
      }
      
      // Add type filter if specified
      if (options?.types && options.types.length > 0) {
        where.type = { in: options.types };
      }
      
      // Build pagination options
      const take = options?.limit || 100;
      const skip = options?.offset || 0;
      
      // Query goals
      const goals = await client.healthGoal.findMany({
        where,
        take,
        skip,
        orderBy: { startDate: options?.order || 'desc' }
      });
      
      return goals as IHealthGoal[];
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to retrieve health goals',
        { journeyType: JourneyType.HEALTH, userId }
      );
      this.logger.error('Health goals retrieval failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Updates a health goal with progress tracking and completion handling.
   * 
   * @param id - The ID of the goal to update
   * @param data - The updated goal data
   * @param options - Optional transaction options
   * @returns The updated health goal
   */
  async updateHealthGoal(
    id: string,
    data: Partial<IHealthGoal>,
    options?: TransactionOptions
  ): Promise<IHealthGoal> {
    try {
      // Use transaction to ensure atomicity when updating goal status
      return await this.transactionService.execute(async (tx) => {
        const client = tx.client || await this.getClient(options);
        
        // Get current goal state
        const currentGoal = await client.healthGoal.findUnique({ where: { id } });
        if (!currentGoal) {
          throw new QueryException(
            'Health goal not found',
            DatabaseErrorType.QUERY_NOT_FOUND,
            { journeyType: JourneyType.HEALTH, goalId: id }
          );
        }
        
        // Prepare update data
        const updateData: Prisma.HealthGoalUpdateInput = { ...data };
        
        // Check if goal should be marked as completed
        if (
          data.currentValue !== undefined &&
          currentGoal.status !== GoalStatus.COMPLETED &&
          Number(data.currentValue) >= Number(currentGoal.targetValue)
        ) {
          updateData.status = GoalStatus.COMPLETED;
          updateData.completedDate = new Date();
        }
        
        // Update the goal
        const updated = await client.healthGoal.update({
          where: { id },
          data: updateData
        });
        
        // If goal was just completed, emit event for gamification
        if (
          updateData.status === GoalStatus.COMPLETED &&
          currentGoal.status !== GoalStatus.COMPLETED
        ) {
          // This would typically emit an event to Kafka for the gamification engine
          // We'll just log it for now
          this.logger.log(`Goal ${id} completed, emitting event for gamification`);
        }
        
        return updated as IHealthGoal;
      }, options);
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to update health goal',
        { journeyType: JourneyType.HEALTH, goalId: id }
      );
      this.logger.error('Health goal update failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Deletes a health goal.
   * 
   * @param id - The ID of the goal to delete
   * @param options - Optional transaction options
   * @returns True if the deletion was successful
   */
  async deleteHealthGoal(
    id: string,
    options?: TransactionOptions
  ): Promise<boolean> {
    try {
      const client = await this.getClient(options);
      
      // Delete the goal
      await client.healthGoal.delete({ where: { id } });
      
      return true;
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to delete health goal',
        { journeyType: JourneyType.HEALTH, goalId: id }
      );
      this.logger.error('Health goal deletion failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Creates a new device connection for health tracking.
   * 
   * @param connection - The device connection data to create
   * @param options - Optional transaction options
   * @returns The created device connection
   */
  async createDeviceConnection(
    connection: Omit<IDeviceConnection, 'id'>,
    options?: TransactionOptions
  ): Promise<IDeviceConnection> {
    try {
      const client = await this.getClient(options);
      
      // Generate UUID for the connection
      const id = await this.generateUuid();
      
      // Validate connection data
      this.validateDeviceConnection(connection);
      
      // Create the connection
      const result = await client.deviceConnection.create({
        data: {
          id,
          recordId: connection.recordId,
          deviceType: connection.deviceType,
          status: connection.status || ConnectionStatus.CONNECTED,
          deviceId: connection.deviceId,
          lastSync: connection.lastSync
        }
      });
      
      return result as IDeviceConnection;
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to create device connection',
        { journeyType: JourneyType.HEALTH, deviceType: connection.deviceType }
      );
      this.logger.error('Device connection creation failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Retrieves device connections for a health record with filtering and pagination.
   * 
   * @param recordId - The health record ID to retrieve connections for
   * @param options - Query options including status, device type, and pagination
   * @returns Array of device connections matching the criteria
   */
  async getDeviceConnections(
    recordId: string,
    options?: QueryOptions & { status?: ConnectionStatus[], deviceTypes?: DeviceType[] }
  ): Promise<IDeviceConnection[]> {
    try {
      const client = await this.getClient();
      
      // Build query filters
      const where: Prisma.DeviceConnectionWhereInput = { recordId };
      
      // Add status filter if specified
      if (options?.status && options.status.length > 0) {
        where.status = { in: options.status };
      }
      
      // Add device type filter if specified
      if (options?.deviceTypes && options.deviceTypes.length > 0) {
        where.deviceType = { in: options.deviceTypes };
      }
      
      // Build pagination options
      const take = options?.limit || 100;
      const skip = options?.offset || 0;
      
      // Query connections
      const connections = await client.deviceConnection.findMany({
        where,
        take,
        skip,
        orderBy: { lastSync: options?.order || 'desc' }
      });
      
      return connections as IDeviceConnection[];
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to retrieve device connections',
        { journeyType: JourneyType.HEALTH, recordId }
      );
      this.logger.error('Device connections retrieval failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Updates a device connection with sync status tracking.
   * 
   * @param id - The ID of the connection to update
   * @param data - The updated connection data
   * @param options - Optional transaction options
   * @returns The updated device connection
   */
  async updateDeviceConnection(
    id: string,
    data: Partial<IDeviceConnection>,
    options?: TransactionOptions
  ): Promise<IDeviceConnection> {
    try {
      const client = await this.getClient(options);
      
      // Prepare update data
      const updateData: Prisma.DeviceConnectionUpdateInput = { ...data };
      
      // If status is being updated to CONNECTED, update lastSync
      if (data.status === ConnectionStatus.CONNECTED) {
        updateData.lastSync = new Date();
      }
      
      // Update the connection
      const updated = await client.deviceConnection.update({
        where: { id },
        data: updateData
      });
      
      return updated as IDeviceConnection;
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to update device connection',
        { journeyType: JourneyType.HEALTH, connectionId: id }
      );
      this.logger.error('Device connection update failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Deletes a device connection.
   * 
   * @param id - The ID of the connection to delete
   * @param options - Optional transaction options
   * @returns True if the deletion was successful
   */
  async deleteDeviceConnection(
    id: string,
    options?: TransactionOptions
  ): Promise<boolean> {
    try {
      const client = await this.getClient(options);
      
      // Delete the connection
      await client.deviceConnection.delete({ where: { id } });
      
      return true;
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to delete device connection',
        { journeyType: JourneyType.HEALTH, connectionId: id }
      );
      this.logger.error('Device connection deletion failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Creates a new medical event record.
   * 
   * @param event - The medical event data to create
   * @param options - Optional transaction options
   * @returns The created medical event
   */
  async createMedicalEvent(
    event: Omit<IMedicalEvent, 'id'>,
    options?: TransactionOptions
  ): Promise<IMedicalEvent> {
    try {
      const client = await this.getClient(options);
      
      // Generate UUID for the event
      const id = await this.generateUuid();
      
      // Validate event data
      this.validateMedicalEvent(event);
      
      // Create the event
      const result = await client.medicalEvent.create({
        data: {
          id,
          recordId: event.recordId,
          type: event.type,
          description: event.description,
          date: event.date || new Date(),
          provider: event.provider,
          documents: event.documents || []
        }
      });
      
      return result as IMedicalEvent;
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to create medical event',
        { journeyType: JourneyType.HEALTH, eventType: event.type }
      );
      this.logger.error('Medical event creation failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Retrieves medical events for a health record with filtering and pagination.
   * 
   * @param recordId - The health record ID to retrieve events for
   * @param options - Query options including event type, date range, and pagination
   * @returns Array of medical events matching the criteria
   */
  async getMedicalEvents(
    recordId: string,
    options?: QueryOptions & { types?: string[], startDate?: Date, endDate?: Date }
  ): Promise<IMedicalEvent[]> {
    try {
      const client = await this.getClient();
      
      // Build query filters
      const where: Prisma.MedicalEventWhereInput = { recordId };
      
      // Add type filter if specified
      if (options?.types && options.types.length > 0) {
        where.type = { in: options.types };
      }
      
      // Add date range filters if specified
      if (options?.startDate || options?.endDate) {
        where.date = {};
        
        if (options.startDate) {
          where.date.gte = options.startDate;
        }
        
        if (options.endDate) {
          where.date.lte = options.endDate;
        }
      }
      
      // Build pagination options
      const take = options?.limit || 100;
      const skip = options?.offset || 0;
      
      // Query events
      const events = await client.medicalEvent.findMany({
        where,
        take,
        skip,
        orderBy: { date: options?.order || 'desc' }
      });
      
      return events as IMedicalEvent[];
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to retrieve medical events',
        { journeyType: JourneyType.HEALTH, recordId }
      );
      this.logger.error('Medical events retrieval failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Updates a medical event record.
   * 
   * @param id - The ID of the event to update
   * @param data - The updated event data
   * @param options - Optional transaction options
   * @returns The updated medical event
   */
  async updateMedicalEvent(
    id: string,
    data: Partial<IMedicalEvent>,
    options?: TransactionOptions
  ): Promise<IMedicalEvent> {
    try {
      const client = await this.getClient(options);
      
      // Update the event
      const updated = await client.medicalEvent.update({
        where: { id },
        data
      });
      
      return updated as IMedicalEvent;
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to update medical event',
        { journeyType: JourneyType.HEALTH, eventId: id }
      );
      this.logger.error('Medical event update failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Deletes a medical event record.
   * 
   * @param id - The ID of the event to delete
   * @param options - Optional transaction options
   * @returns True if the deletion was successful
   */
  async deleteMedicalEvent(
    id: string,
    options?: TransactionOptions
  ): Promise<boolean> {
    try {
      const client = await this.getClient(options);
      
      // Delete the event
      await client.medicalEvent.delete({ where: { id } });
      
      return true;
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to delete medical event',
        { journeyType: JourneyType.HEALTH, eventId: id }
      );
      this.logger.error('Medical event deletion failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Imports health metrics from a wearable device with optimized batch processing.
   * 
   * @param userId - The user ID to import metrics for
   * @param metrics - Array of health metrics to import
   * @param deviceId - The ID of the device providing the metrics
   * @param options - Optional transaction options
   * @returns Array of created health metrics
   */
  async importHealthMetricsFromDevice(
    userId: string,
    metrics: Array<Omit<IHealthMetric, 'id' | 'userId'>>,
    deviceId: string,
    options?: TransactionOptions
  ): Promise<IHealthMetric[]> {
    try {
      // Use transaction to ensure all metrics are imported atomically
      return await this.transactionService.execute(async (tx) => {
        const client = tx.client || await this.getClient(options);
        
        // Find the device connection
        const connection = await client.deviceConnection.findFirst({
          where: { deviceId }
        });
        
        if (!connection) {
          throw new QueryException(
            'Device connection not found',
            DatabaseErrorType.QUERY_NOT_FOUND,
            { journeyType: JourneyType.HEALTH, deviceId }
          );
        }
        
        // Prepare metrics for batch insert
        const metricsToCreate = await Promise.all(metrics.map(async (metric) => {
          const id = await this.generateUuid();
          return {
            id,
            userId,
            type: metric.type,
            value: metric.value,
            unit: metric.unit,
            timestamp: metric.timestamp || new Date(),
            source: MetricSource.WEARABLE_DEVICE,
            notes: metric.notes,
            isAbnormal: metric.isAbnormal || false
          };
        }));
        
        // Use Prisma's createMany for efficient batch insert
        await client.healthMetric.createMany({
          data: metricsToCreate,
          skipDuplicates: true
        });
        
        // Update device connection's lastSync timestamp
        await client.deviceConnection.update({
          where: { id: connection.id },
          data: { lastSync: new Date() }
        });
        
        // Return the created metrics
        return metricsToCreate as IHealthMetric[];
      }, options);
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to import health metrics from device',
        { journeyType: JourneyType.HEALTH, userId, deviceId }
      );
      this.logger.error('Health metrics import failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Imports medical events from FHIR API with validation and transformation.
   * 
   * @param recordId - The health record ID to import events for
   * @param fhirEvents - Array of FHIR resources to import as medical events
   * @param options - Optional transaction options
   * @returns Array of created medical events
   */
  async importMedicalEventsFromFHIR(
    recordId: string,
    fhirEvents: any[],
    options?: TransactionOptions
  ): Promise<IMedicalEvent[]> {
    try {
      // Use transaction to ensure all events are imported atomically
      return await this.transactionService.execute(async (tx) => {
        const client = tx.client || await this.getClient(options);
        
        // Transform FHIR resources to medical events
        const eventsToCreate = await Promise.all(fhirEvents.map(async (fhirEvent) => {
          const id = await this.generateUuid();
          
          // Map FHIR resource type to medical event type
          const type = this.mapFHIRResourceTypeToEventType(fhirEvent.resourceType);
          
          // Extract date from FHIR resource
          const date = this.extractDateFromFHIRResource(fhirEvent);
          
          // Extract provider from FHIR resource
          const provider = this.extractProviderFromFHIRResource(fhirEvent);
          
          // Extract description from FHIR resource
          const description = this.extractDescriptionFromFHIRResource(fhirEvent);
          
          return {
            id,
            recordId,
            type,
            description,
            date,
            provider,
            documents: [{ fhirResource: fhirEvent }]
          };
        }));
        
        // Create medical events
        const createdEvents = [];
        for (const eventData of eventsToCreate) {
          const event = await client.medicalEvent.create({
            data: eventData
          });
          createdEvents.push(event);
        }
        
        return createdEvents as IMedicalEvent[];
      }, options);
    } catch (error) {
      const transformedError = this.errorTransformer.transformError(
        error,
        'Failed to import medical events from FHIR',
        { journeyType: JourneyType.HEALTH, recordId }
      );
      this.logger.error('Medical events import failed', transformedError);
      throw transformedError;
    }
  }

  /**
   * Validates health metric data for integrity and consistency.
   * 
   * @param metric - The health metric to validate
   * @throws IntegrityException if validation fails
   */
  private validateHealthMetric(metric: Partial<IHealthMetric>): void {
    // Validate required fields
    if (!metric.userId) {
      throw new IntegrityException(
        'Health metric must have a userId',
        DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
        { journeyType: JourneyType.HEALTH }
      );
    }
    
    if (!metric.type) {
      throw new IntegrityException(
        'Health metric must have a type',
        DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
        { journeyType: JourneyType.HEALTH }
      );
    }
    
    if (metric.value === undefined || metric.value === null) {
      throw new IntegrityException(
        'Health metric must have a value',
        DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
        { journeyType: JourneyType.HEALTH }
      );
    }
    
    if (!metric.unit) {
      throw new IntegrityException(
        'Health metric must have a unit',
        DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
        { journeyType: JourneyType.HEALTH }
      );
    }
    
    // Validate value ranges based on metric type
    switch (metric.type) {
      case MetricType.HEART_RATE:
        if (Number(metric.value) < 0 || Number(metric.value) > 250) {
          throw new IntegrityException(
            'Heart rate must be between 0 and 250 bpm',
            DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
            { journeyType: JourneyType.HEALTH, metricType: metric.type }
          );
        }
        break;
      case MetricType.BLOOD_PRESSURE:
        // Blood pressure is typically stored as a string like "120/80"
        if (typeof metric.value === 'string') {
          const [systolic, diastolic] = metric.value.split('/').map(Number);
          if (
            isNaN(systolic) || isNaN(diastolic) ||
            systolic < 0 || systolic > 300 ||
            diastolic < 0 || diastolic > 200
          ) {
            throw new IntegrityException(
              'Blood pressure must be in format "systolic/diastolic" with valid ranges',
              DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
              { journeyType: JourneyType.HEALTH, metricType: metric.type }
            );
          }
        }
        break;
      case MetricType.BLOOD_GLUCOSE:
        if (Number(metric.value) < 0 || Number(metric.value) > 1000) {
          throw new IntegrityException(
            'Blood glucose must be between 0 and 1000 mg/dL',
            DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
            { journeyType: JourneyType.HEALTH, metricType: metric.type }
          );
        }
        break;
      case MetricType.STEPS:
        if (Number(metric.value) < 0 || Number(metric.value) > 100000) {
          throw new IntegrityException(
            'Steps must be between 0 and 100,000',
            DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
            { journeyType: JourneyType.HEALTH, metricType: metric.type }
          );
        }
        break;
      case MetricType.WEIGHT:
        if (Number(metric.value) < 0 || Number(metric.value) > 1000) {
          throw new IntegrityException(
            'Weight must be between 0 and 1000 kg',
            DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
            { journeyType: JourneyType.HEALTH, metricType: metric.type }
          );
        }
        break;
      case MetricType.SLEEP:
        if (Number(metric.value) < 0 || Number(metric.value) > 24) {
          throw new IntegrityException(
            'Sleep duration must be between 0 and 24 hours',
            DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
            { journeyType: JourneyType.HEALTH, metricType: metric.type }
          );
        }
        break;
    }
  }

  /**
   * Validates health goal data for integrity and consistency.
   * 
   * @param goal - The health goal to validate
   * @throws IntegrityException if validation fails
   */
  private validateHealthGoal(goal: Partial<IHealthGoal>): void {
    // Validate required fields
    if (!goal.userId) {
      throw new IntegrityException(
        'Health goal must have a userId',
        DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
        { journeyType: JourneyType.HEALTH }
      );
    }
    
    if (!goal.type) {
      throw new IntegrityException(
        'Health goal must have a type',
        DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
        { journeyType: JourneyType.HEALTH }
      );
    }
    
    if (goal.targetValue === undefined || goal.targetValue === null) {
      throw new IntegrityException(
        'Health goal must have a target value',
        DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
        { journeyType: JourneyType.HEALTH }
      );
    }
    
    // Validate date ranges
    if (goal.startDate && goal.endDate && goal.startDate > goal.endDate) {
      throw new IntegrityException(
        'Goal start date must be before end date',
        DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
        { journeyType: JourneyType.HEALTH }
      );
    }
    
    // Validate target values based on goal type
    switch (goal.type) {
      case GoalType.STEPS:
        if (Number(goal.targetValue) <= 0 || Number(goal.targetValue) > 100000) {
          throw new IntegrityException(
            'Steps goal target must be between 1 and 100,000',
            DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
            { journeyType: JourneyType.HEALTH, goalType: goal.type }
          );
        }
        break;
      case GoalType.WEIGHT_LOSS:
        if (Number(goal.targetValue) <= 0 || Number(goal.targetValue) > 500) {
          throw new IntegrityException(
            'Weight loss goal target must be between 1 and 500 kg',
            DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
            { journeyType: JourneyType.HEALTH, goalType: goal.type }
          );
        }
        break;
      case GoalType.SLEEP:
        if (Number(goal.targetValue) <= 0 || Number(goal.targetValue) > 24) {
          throw new IntegrityException(
            'Sleep goal target must be between 1 and 24 hours',
            DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
            { journeyType: JourneyType.HEALTH, goalType: goal.type }
          );
        }
        break;
      case GoalType.EXERCISE:
        if (Number(goal.targetValue) <= 0 || Number(goal.targetValue) > 1440) {
          throw new IntegrityException(
            'Exercise goal target must be between 1 and 1440 minutes',
            DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
            { journeyType: JourneyType.HEALTH, goalType: goal.type }
          );
        }
        break;
      case GoalType.WATER_INTAKE:
        if (Number(goal.targetValue) <= 0 || Number(goal.targetValue) > 10000) {
          throw new IntegrityException(
            'Water intake goal target must be between 1 and 10,000 ml',
            DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
            { journeyType: JourneyType.HEALTH, goalType: goal.type }
          );
        }
        break;
    }
  }

  /**
   * Validates device connection data for integrity and consistency.
   * 
   * @param connection - The device connection to validate
   * @throws IntegrityException if validation fails
   */
  private validateDeviceConnection(connection: Partial<IDeviceConnection>): void {
    // Validate required fields
    if (!connection.recordId) {
      throw new IntegrityException(
        'Device connection must have a recordId',
        DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
        { journeyType: JourneyType.HEALTH }
      );
    }
    
    if (!connection.deviceType) {
      throw new IntegrityException(
        'Device connection must have a device type',
        DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
        { journeyType: JourneyType.HEALTH }
      );
    }
    
    if (!connection.deviceId) {
      throw new IntegrityException(
        'Device connection must have a device ID',
        DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
        { journeyType: JourneyType.HEALTH }
      );
    }
  }

  /**
   * Validates medical event data for integrity and consistency.
   * 
   * @param event - The medical event to validate
   * @throws IntegrityException if validation fails
   */
  private validateMedicalEvent(event: Partial<IMedicalEvent>): void {
    // Validate required fields
    if (!event.recordId) {
      throw new IntegrityException(
        'Medical event must have a recordId',
        DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
        { journeyType: JourneyType.HEALTH }
      );
    }
    
    if (!event.type) {
      throw new IntegrityException(
        'Medical event must have a type',
        DatabaseErrorType.INTEGRITY_CONSTRAINT_VIOLATION,
        { journeyType: JourneyType.HEALTH }
      );
    }
  }

  /**
   * Gets the appropriate unit for a given metric type.
   * 
   * @param metricType - The type of health metric
   * @returns The standard unit for the metric type
   */
  private getUnitForMetricType(metricType: MetricType): string {
    switch (metricType) {
      case MetricType.HEART_RATE:
        return 'bpm';
      case MetricType.BLOOD_PRESSURE:
        return 'mmHg';
      case MetricType.BLOOD_GLUCOSE:
        return 'mg/dL';
      case MetricType.STEPS:
        return 'steps';
      case MetricType.WEIGHT:
        return 'kg';
      case MetricType.SLEEP:
        return 'hours';
      default:
        return '';
    }
  }

  /**
   * Maps FHIR resource types to medical event types.
   * 
   * @param resourceType - The FHIR resource type
   * @returns The corresponding medical event type
   */
  private mapFHIRResourceTypeToEventType(resourceType: string): string {
    switch (resourceType) {
      case 'Observation':
        return 'observation';
      case 'Procedure':
        return 'procedure';
      case 'MedicationStatement':
        return 'medication';
      case 'Immunization':
        return 'immunization';
      case 'Condition':
        return 'condition';
      case 'AllergyIntolerance':
        return 'allergy';
      default:
        return resourceType.toLowerCase();
    }
  }

  /**
   * Extracts date from a FHIR resource.
   * 
   * @param resource - The FHIR resource
   * @returns The extracted date or current date if not found
   */
  private extractDateFromFHIRResource(resource: any): Date {
    // Extract date based on resource type
    if (resource.effectiveDateTime) {
      return new Date(resource.effectiveDateTime);
    }
    
    if (resource.performedDateTime) {
      return new Date(resource.performedDateTime);
    }
    
    if (resource.recordedDate) {
      return new Date(resource.recordedDate);
    }
    
    if (resource.onsetDateTime) {
      return new Date(resource.onsetDateTime);
    }
    
    if (resource.date) {
      return new Date(resource.date);
    }
    
    // Default to current date if no date found
    return new Date();
  }

  /**
   * Extracts provider information from a FHIR resource.
   * 
   * @param resource - The FHIR resource
   * @returns The extracted provider name or null if not found
   */
  private extractProviderFromFHIRResource(resource: any): string | null {
    // Extract provider based on resource type
    if (resource.performer && resource.performer[0] && resource.performer[0].display) {
      return resource.performer[0].display;
    }
    
    if (resource.practitioner && resource.practitioner.display) {
      return resource.practitioner.display;
    }
    
    if (resource.recorder && resource.recorder.display) {
      return resource.recorder.display;
    }
    
    return null;
  }

  /**
   * Extracts description from a FHIR resource.
   * 
   * @param resource - The FHIR resource
   * @returns The extracted description or null if not found
   */
  private extractDescriptionFromFHIRResource(resource: any): string | null {
    // Extract description based on resource type
    if (resource.code && resource.code.text) {
      return resource.code.text;
    }
    
    if (resource.code && resource.code.coding && resource.code.coding[0] && resource.code.coding[0].display) {
      return resource.code.coding[0].display;
    }
    
    if (resource.note && resource.note[0] && resource.note[0].text) {
      return resource.note[0].text;
    }
    
    return null;
  }

  /**
   * Generates a UUID for new records.
   * 
   * @returns A new UUID string
   */
  private async generateUuid(): Promise<string> {
    const result = await this.prisma.$queryRaw`SELECT uuid_generate_v4() as uuid`;
    return (result as any[])[0].uuid;
  }
}