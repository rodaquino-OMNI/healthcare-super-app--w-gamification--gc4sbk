import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { BaseJourneyContext } from './base-journey.context';
import { TransactionClient } from '../transactions/transaction.interface';
import { Transactional } from '../transactions/transaction.decorators';
import { TransactionService } from '../transactions/transaction.service';

// Import health-specific error classes
import {
  InvalidMetricValueError,
  MetricNotFoundError,
  MetricThresholdExceededError,
  MetricSourceUnavailableError,
} from '@austa/errors/journey/health/metrics.errors';

import {
  InvalidGoalParametersError,
  GoalNotFoundError,
  ConflictingGoalsError,
  GoalCompletionError,
} from '@austa/errors/journey/health/goals.errors';

import {
  DeviceConnectionFailureError,
  DeviceNotFoundError,
  SynchronizationFailedError,
  UnsupportedDeviceError,
} from '@austa/errors/journey/health/devices.errors';

import {
  FhirConnectionFailureError,
  InvalidResourceError,
  ResourceNotFoundError,
} from '@austa/errors/journey/health/fhir.errors';

// Import health-specific interfaces
import { IHealthMetric, MetricType, MetricSource } from '@austa/interfaces/journey/health/health-metric.interface';
import { IHealthGoal, GoalType, GoalStatus, GoalPeriod } from '@austa/interfaces/journey/health/health-goal.interface';
import { IDeviceConnection, DeviceType, ConnectionStatus } from '@austa/interfaces/journey/health/device-connection.interface';
import { IMedicalEvent } from '@austa/interfaces/journey/health/medical-event.interface';

/**
 * Specialized database context for the Health journey ("Minha Saúde")
 * that extends the base journey context with health-specific database operations
 * and TimescaleDB optimizations for time-series data.
 * 
 * Provides methods for health metrics, goals, device connections, and medical events
 * with optimized queries and journey-specific error handling.
 */
@Injectable()
export class HealthContext extends BaseJourneyContext {
  constructor(
    protected readonly prisma: PrismaClient,
    private readonly transactionService: TransactionService,
  ) {
    super(prisma);
  }

  /**
   * Retrieves a health metric by ID with optimized query
   * 
   * @param metricId - The unique identifier of the health metric
   * @returns The health metric details or throws MetricNotFoundError if not found
   */
  async getMetricById(metricId: string): Promise<IHealthMetric> {
    try {
      const metric = await this.prisma.healthMetric.findUnique({
        where: { id: metricId },
      });

      if (!metric) {
        throw new MetricNotFoundError(`Health metric with ID ${metricId} not found`);
      }

      return metric as unknown as IHealthMetric;
    } catch (error) {
      if (error instanceof MetricNotFoundError) {
        throw error;
      }
      throw new Error(
        `Failed to retrieve health metric with ID ${metricId}: ${error.message}`,
      );
    }
  }

  /**
   * Retrieves health metrics for a specific user with pagination and filtering
   * Uses TimescaleDB optimizations for time-series data queries
   * 
   * @param userId - The unique identifier of the user
   * @param type - Optional filter for metric type
   * @param startDate - Optional start date for filtering metrics
   * @param endDate - Optional end date for filtering metrics
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of items per page (default: 10)
   * @returns Paginated list of health metrics for the specified user
   */
  async getUserMetrics(
    userId: string,
    type?: MetricType,
    startDate?: Date,
    endDate?: Date,
    page = 1,
    limit = 10,
  ): Promise<{ metrics: IHealthMetric[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;
      const where: Prisma.HealthMetricWhereInput = { userId };
      
      if (type) {
        where.type = type;
      }

      if (startDate || endDate) {
        where.timestamp = {};
        
        if (startDate) {
          where.timestamp.gte = startDate;
        }
        
        if (endDate) {
          where.timestamp.lte = endDate;
        }
      }

      // Use raw SQL for TimescaleDB optimized query when appropriate
      if (this.shouldUseTimescaleDB(type, startDate, endDate)) {
        return this.getMetricsWithTimescaleDB(userId, type, startDate, endDate, page, limit);
      }

      // Otherwise use standard Prisma query
      const [metrics, total] = await Promise.all([
        this.prisma.healthMetric.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            timestamp: 'desc',
          },
        }),
        this.prisma.healthMetric.count({ where }),
      ]);

      return {
        metrics: metrics as unknown as IHealthMetric[],
        total,
        page,
        limit,
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve health metrics for user ${userId}: ${error.message}`,
      );
    }
  }

  /**
   * Determines if TimescaleDB optimizations should be used based on query parameters
   * 
   * @param type - The metric type being queried
   * @param startDate - The start date for the query range
   * @param endDate - The end date for the query range
   * @returns True if TimescaleDB optimizations should be used
   */
  private shouldUseTimescaleDB(
    type?: MetricType,
    startDate?: Date,
    endDate?: Date,
  ): boolean {
    // Use TimescaleDB for time-range queries on specific metric types
    // that benefit from time-series optimizations
    const timeSeriesOptimizedMetrics = [
      MetricType.HEART_RATE,
      MetricType.BLOOD_PRESSURE,
      MetricType.BLOOD_GLUCOSE,
      MetricType.STEPS,
      MetricType.SLEEP,
      MetricType.OXYGEN_SATURATION,
    ];

    // Use TimescaleDB if querying a time range for an optimized metric type
    return (
      (startDate !== undefined || endDate !== undefined) &&
      (type === undefined || timeSeriesOptimizedMetrics.includes(type))
    );
  }

  /**
   * Retrieves health metrics using TimescaleDB optimized queries
   * 
   * @param userId - The unique identifier of the user
   * @param type - Optional filter for metric type
   * @param startDate - Optional start date for filtering metrics
   * @param endDate - Optional end date for filtering metrics
   * @param page - Page number for pagination
   * @param limit - Number of items per page
   * @returns Paginated list of health metrics for the specified user
   */
  private async getMetricsWithTimescaleDB(
    userId: string,
    type?: MetricType,
    startDate?: Date,
    endDate?: Date,
    page = 1,
    limit = 10,
  ): Promise<{ metrics: IHealthMetric[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    let query = Prisma.sql`
      SELECT * FROM "HealthMetric"
      WHERE "userId" = ${userId}
    `;

    let countQuery = Prisma.sql`
      SELECT COUNT(*) FROM "HealthMetric"
      WHERE "userId" = ${userId}
    `;

    if (type) {
      query = Prisma.sql`${query} AND "type" = ${type}`;
      countQuery = Prisma.sql`${countQuery} AND "type" = ${type}`;
    }

    if (startDate) {
      query = Prisma.sql`${query} AND "timestamp" >= ${startDate}`;
      countQuery = Prisma.sql`${countQuery} AND "timestamp" >= ${startDate}`;
    }

    if (endDate) {
      query = Prisma.sql`${query} AND "timestamp" <= ${endDate}`;
      countQuery = Prisma.sql`${countQuery} AND "timestamp" <= ${endDate}`;
    }

    // Add time_bucket for appropriate aggregation when needed
    if (this.shouldUseTimeBucket(startDate, endDate)) {
      const interval = this.determineTimeBucketInterval(startDate, endDate);
      query = Prisma.sql`
        SELECT 
          time_bucket(${interval}, "timestamp") as bucket,
          "type",
          AVG("value") as value,
          MAX("id") as id,
          ${userId} as "userId",
          MAX("unit") as unit,
          MAX("source") as source,
          MAX("isAbnormal") as "isAbnormal",
          MAX("notes") as notes,
          MAX("trend") as trend
        FROM "HealthMetric"
        WHERE "userId" = ${userId}
        ${type ? Prisma.sql`AND "type" = ${type}` : Prisma.sql``}
        ${startDate ? Prisma.sql`AND "timestamp" >= ${startDate}` : Prisma.sql``}
        ${endDate ? Prisma.sql`AND "timestamp" <= ${endDate}` : Prisma.sql``}
        GROUP BY bucket, "type"
        ORDER BY bucket DESC
        LIMIT ${limit} OFFSET ${skip}
      `;
    } else {
      // Standard query with pagination
      query = Prisma.sql`
        ${query}
        ORDER BY "timestamp" DESC
        LIMIT ${limit} OFFSET ${skip}
      `;
    }

    const [metricsResult, countResult] = await Promise.all([
      this.prisma.$queryRaw(query),
      this.prisma.$queryRaw(countQuery),
    ]);

    const metrics = metricsResult as unknown as IHealthMetric[];
    const total = Number((countResult as any)[0].count);

    return {
      metrics,
      total,
      page,
      limit,
    };
  }

  /**
   * Determines if time_bucket aggregation should be used based on date range
   * 
   * @param startDate - The start date for the query range
   * @param endDate - The end date for the query range
   * @returns True if time_bucket should be used
   */
  private shouldUseTimeBucket(startDate?: Date, endDate?: Date): boolean {
    if (!startDate || !endDate) {
      return false;
    }

    // Use time_bucket for ranges longer than 24 hours
    const diffHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return diffHours > 24;
  }

  /**
   * Determines the appropriate time_bucket interval based on date range
   * 
   * @param startDate - The start date for the query range
   * @param endDate - The end date for the query range
   * @returns SQL interval string for time_bucket
   */
  private determineTimeBucketInterval(startDate?: Date, endDate?: Date): string {
    if (!startDate || !endDate) {
      return '1 hour';
    }

    const diffHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    
    if (diffHours > 720) { // 30 days
      return '1 day';
    } else if (diffHours > 168) { // 7 days
      return '6 hours';
    } else if (diffHours > 72) { // 3 days
      return '3 hours';
    } else if (diffHours > 24) { // 1 day
      return '1 hour';
    } else {
      return '15 minutes';
    }
  }

  /**
   * Creates a new health metric with optimized transaction pattern
   * 
   * @param data - The health metric data to create
   * @returns The created health metric
   */
  @Transactional()
  async createMetric(
    data: Prisma.HealthMetricCreateInput,
    client?: TransactionClient,
  ): Promise<IHealthMetric> {
    const prisma = client || this.prisma;
    
    try {
      // Validate metric data
      this.validateMetricData(data);

      // Create the metric
      const metric = await prisma.healthMetric.create({
        data,
      });

      return metric as unknown as IHealthMetric;
    } catch (error) {
      if (
        error instanceof InvalidMetricValueError ||
        error instanceof MetricThresholdExceededError
      ) {
        throw error;
      }
      throw new Error(`Failed to create health metric: ${error.message}`);
    }
  }

  /**
   * Validates health metric data before creation
   * 
   * @param data - The health metric data to validate
   * @throws InvalidMetricValueError if the data is invalid
   */
  private validateMetricData(data: Prisma.HealthMetricCreateInput): void {
    // Check for required fields
    if (data.value === undefined || data.value === null) {
      throw new InvalidMetricValueError('Metric value is required');
    }

    if (!data.type) {
      throw new InvalidMetricValueError('Metric type is required');
    }

    if (!data.unit) {
      throw new InvalidMetricValueError('Metric unit is required');
    }

    // Validate value based on metric type
    switch (data.type) {
      case MetricType.HEART_RATE:
        if (data.value < 0 || data.value > 250) {
          throw new InvalidMetricValueError(
            `Heart rate value ${data.value} is outside valid range (0-250 bpm)`,
          );
        }
        break;
      case MetricType.BLOOD_PRESSURE:
        // For blood pressure, we expect a string like "120/80"
        if (typeof data.value === 'string') {
          const bpPattern = /^\d{2,3}\/\d{2,3}$/;
          if (!bpPattern.test(data.value)) {
            throw new InvalidMetricValueError(
              `Blood pressure value ${data.value} is invalid. Expected format: "120/80"`,
            );
          }
        } else {
          throw new InvalidMetricValueError(
            'Blood pressure must be provided as a string in format "120/80"',
          );
        }
        break;
      case MetricType.BLOOD_GLUCOSE:
        if (data.value < 0 || data.value > 500) {
          throw new InvalidMetricValueError(
            `Blood glucose value ${data.value} is outside valid range (0-500 mg/dL)`,
          );
        }
        break;
      case MetricType.WEIGHT:
        if (data.value < 0 || data.value > 500) {
          throw new InvalidMetricValueError(
            `Weight value ${data.value} is outside valid range (0-500 kg)`,
          );
        }
        break;
      case MetricType.STEPS:
        if (data.value < 0 || data.value > 100000) {
          throw new InvalidMetricValueError(
            `Steps value ${data.value} is outside valid range (0-100000 steps)`,
          );
        }
        break;
      case MetricType.SLEEP:
        if (data.value < 0 || data.value > 24) {
          throw new InvalidMetricValueError(
            `Sleep value ${data.value} is outside valid range (0-24 hours)`,
          );
        }
        break;
      case MetricType.OXYGEN_SATURATION:
        if (data.value < 0 || data.value > 100) {
          throw new InvalidMetricValueError(
            `Oxygen saturation value ${data.value} is outside valid range (0-100%)`,
          );
        }
        break;
      case MetricType.BODY_TEMPERATURE:
        if (data.value < 30 || data.value > 45) {
          throw new InvalidMetricValueError(
            `Body temperature value ${data.value} is outside valid range (30-45°C)`,
          );
        }
        break;
    }

    // Check for abnormal values and set isAbnormal flag if not already set
    if (data.isAbnormal === undefined) {
      data.isAbnormal = this.isMetricValueAbnormal(data.type as MetricType, data.value);
    }
  }

  /**
   * Determines if a metric value is abnormal based on healthy ranges
   * 
   * @param type - The type of health metric
   * @param value - The value to check
   * @returns True if the value is outside normal range
   */
  private isMetricValueAbnormal(type: MetricType, value: any): boolean {
    switch (type) {
      case MetricType.HEART_RATE:
        return value < 60 || value > 100;
      case MetricType.BLOOD_PRESSURE:
        if (typeof value === 'string') {
          const [systolic, diastolic] = value.split('/').map(Number);
          return systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60;
        }
        return false;
      case MetricType.BLOOD_GLUCOSE:
        return value < 70 || value > 140;
      case MetricType.OXYGEN_SATURATION:
        return value < 95;
      case MetricType.BODY_TEMPERATURE:
        return value < 36 || value > 37.5;
      default:
        return false;
    }
  }

  /**
   * Bulk creates multiple health metrics with optimized transaction pattern
   * Useful for importing data from wearable devices
   * 
   * @param metrics - Array of health metric data to create
   * @returns The created health metrics
   */
  @Transactional()
  async bulkCreateMetrics(
    metrics: Prisma.HealthMetricCreateInput[],
    client?: TransactionClient,
  ): Promise<IHealthMetric[]> {
    const prisma = client || this.prisma;
    
    try {
      // Validate all metrics before creating any
      metrics.forEach(metric => this.validateMetricData(metric));

      // Create all metrics in a single transaction
      const createdMetrics = await Promise.all(
        metrics.map(metric => prisma.healthMetric.create({ data: metric }))
      );

      return createdMetrics as unknown as IHealthMetric[];
    } catch (error) {
      if (
        error instanceof InvalidMetricValueError ||
        error instanceof MetricThresholdExceededError
      ) {
        throw error;
      }
      throw new Error(`Failed to bulk create health metrics: ${error.message}`);
    }
  }

  /**
   * Retrieves a health goal by ID with optimized query
   * 
   * @param goalId - The unique identifier of the health goal
   * @returns The health goal details or throws GoalNotFoundError if not found
   */
  async getGoalById(goalId: string): Promise<IHealthGoal> {
    try {
      const goal = await this.prisma.healthGoal.findUnique({
        where: { id: goalId },
      });

      if (!goal) {
        throw new GoalNotFoundError(`Health goal with ID ${goalId} not found`);
      }

      return goal as unknown as IHealthGoal;
    } catch (error) {
      if (error instanceof GoalNotFoundError) {
        throw error;
      }
      throw new Error(
        `Failed to retrieve health goal with ID ${goalId}: ${error.message}`,
      );
    }
  }

  /**
   * Retrieves health goals for a specific user with filtering
   * 
   * @param userId - The unique identifier of the user
   * @param status - Optional filter for goal status
   * @param type - Optional filter for goal type
   * @returns List of health goals for the specified user
   */
  async getUserGoals(
    userId: string,
    status?: GoalStatus,
    type?: GoalType,
  ): Promise<IHealthGoal[]> {
    try {
      const where: Prisma.HealthGoalWhereInput = { recordId: userId };
      
      if (status) {
        where.status = status;
      }

      if (type) {
        where.type = type;
      }

      const goals = await this.prisma.healthGoal.findMany({
        where,
        orderBy: [
          { status: 'asc' },
          { endDate: 'asc' },
        ],
      });

      return goals as unknown as IHealthGoal[];
    } catch (error) {
      throw new Error(
        `Failed to retrieve health goals for user ${userId}: ${error.message}`,
      );
    }
  }

  /**
   * Creates a new health goal with optimized transaction pattern
   * 
   * @param data - The health goal data to create
   * @returns The created health goal
   */
  @Transactional()
  async createGoal(
    data: Prisma.HealthGoalCreateInput,
    client?: TransactionClient,
  ): Promise<IHealthGoal> {
    const prisma = client || this.prisma;
    
    try {
      // Validate goal data
      await this.validateGoalData(data, prisma);

      // Create the goal
      const goal = await prisma.healthGoal.create({
        data: {
          ...data,
          status: GoalStatus.ACTIVE,
          currentValue: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return goal as unknown as IHealthGoal;
    } catch (error) {
      if (
        error instanceof InvalidGoalParametersError ||
        error instanceof ConflictingGoalsError
      ) {
        throw error;
      }
      throw new Error(`Failed to create health goal: ${error.message}`);
    }
  }

  /**
   * Validates health goal data before creation
   * 
   * @param data - The health goal data to validate
   * @param client - Optional transaction client
   * @throws InvalidGoalParametersError if the data is invalid
   * @throws ConflictingGoalsError if the goal conflicts with existing goals
   */
  private async validateGoalData(
    data: Prisma.HealthGoalCreateInput,
    client?: TransactionClient,
  ): Promise<void> {
    const prisma = client || this.prisma;

    // Check for required fields
    if (!data.type) {
      throw new InvalidGoalParametersError('Goal type is required');
    }

    if (!data.title) {
      throw new InvalidGoalParametersError('Goal title is required');
    }

    if (data.targetValue === undefined || data.targetValue === null) {
      throw new InvalidGoalParametersError('Goal target value is required');
    }

    if (!data.unit) {
      throw new InvalidGoalParametersError('Goal unit is required');
    }

    if (!data.period) {
      throw new InvalidGoalParametersError('Goal period is required');
    }

    if (!data.startDate) {
      throw new InvalidGoalParametersError('Goal start date is required');
    }

    // Validate target value based on goal type
    switch (data.type) {
      case GoalType.STEPS:
        if (data.targetValue <= 0 || data.targetValue > 100000) {
          throw new InvalidGoalParametersError(
            `Steps goal target ${data.targetValue} is outside valid range (1-100000 steps)`,
          );
        }
        break;
      case GoalType.SLEEP:
        if (data.targetValue <= 0 || data.targetValue > 24) {
          throw new InvalidGoalParametersError(
            `Sleep goal target ${data.targetValue} is outside valid range (1-24 hours)`,
          );
        }
        break;
      case GoalType.WATER:
        if (data.targetValue <= 0 || data.targetValue > 10000) {
          throw new InvalidGoalParametersError(
            `Water intake goal target ${data.targetValue} is outside valid range (1-10000 ml)`,
          );
        }
        break;
      case GoalType.WEIGHT:
        if (data.targetValue <= 0 || data.targetValue > 500) {
          throw new InvalidGoalParametersError(
            `Weight goal target ${data.targetValue} is outside valid range (1-500 kg)`,
          );
        }
        break;
      case GoalType.EXERCISE:
        if (data.targetValue <= 0 || data.targetValue > 1440) {
          throw new InvalidGoalParametersError(
            `Exercise goal target ${data.targetValue} is outside valid range (1-1440 minutes)`,
          );
        }
        break;
    }

    // Check for conflicting goals (same type and overlapping period)
    const existingGoals = await prisma.healthGoal.findMany({
      where: {
        recordId: data.recordId,
        type: data.type,
        status: GoalStatus.ACTIVE,
      },
    });

    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;

    for (const existingGoal of existingGoals) {
      const existingStartDate = new Date(existingGoal.startDate);
      const existingEndDate = existingGoal.endDate ? new Date(existingGoal.endDate) : null;

      // Check for overlap
      const overlap = (
        // New goal starts during existing goal
        (startDate >= existingStartDate && (!existingEndDate || startDate <= existingEndDate)) ||
        // New goal ends during existing goal
        (endDate && endDate >= existingStartDate && (!existingEndDate || endDate <= existingEndDate)) ||
        // New goal encompasses existing goal
        (startDate <= existingStartDate && endDate && (!existingEndDate || endDate >= existingEndDate))
      );

      if (overlap) {
        throw new ConflictingGoalsError(
          `A goal of type ${data.type} already exists for this period`,
          existingGoal.id,
        );
      }
    }
  }

  /**
   * Updates a health goal's progress with optimized transaction pattern
   * 
   * @param goalId - The unique identifier of the health goal
   * @param currentValue - The new current value for the goal
   * @returns The updated health goal
   */
  @Transactional()
  async updateGoalProgress(
    goalId: string,
    currentValue: number,
    client?: TransactionClient,
  ): Promise<IHealthGoal> {
    const prisma = client || this.prisma;
    
    try {
      const goal = await prisma.healthGoal.findUnique({
        where: { id: goalId },
      });

      if (!goal) {
        throw new GoalNotFoundError(`Health goal with ID ${goalId} not found`);
      }

      if (goal.status !== GoalStatus.ACTIVE) {
        throw new GoalCompletionError(
          `Cannot update progress for goal with status ${goal.status}`,
        );
      }

      // Check if goal is completed with this update
      const isCompleted = currentValue >= goal.targetValue;
      const status = isCompleted ? GoalStatus.COMPLETED : GoalStatus.ACTIVE;
      const completedDate = isCompleted ? new Date() : null;

      // Update the goal
      const updatedGoal = await prisma.healthGoal.update({
        where: { id: goalId },
        data: {
          currentValue,
          status,
          completedDate,
          updatedAt: new Date(),
        },
      });

      return updatedGoal as unknown as IHealthGoal;
    } catch (error) {
      if (
        error instanceof GoalNotFoundError ||
        error instanceof GoalCompletionError
      ) {
        throw error;
      }
      throw new Error(
        `Failed to update progress for goal ${goalId}: ${error.message}`,
      );
    }
  }

  /**
   * Retrieves a device connection by ID with optimized query
   * 
   * @param connectionId - The unique identifier of the device connection
   * @returns The device connection details or throws DeviceNotFoundError if not found
   */
  async getDeviceConnectionById(connectionId: string): Promise<IDeviceConnection> {
    try {
      const connection = await this.prisma.deviceConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new DeviceNotFoundError(`Device connection with ID ${connectionId} not found`);
      }

      return connection as unknown as IDeviceConnection;
    } catch (error) {
      if (error instanceof DeviceNotFoundError) {
        throw error;
      }
      throw new Error(
        `Failed to retrieve device connection with ID ${connectionId}: ${error.message}`,
      );
    }
  }

  /**
   * Retrieves device connections for a specific user
   * 
   * @param userId - The unique identifier of the user
   * @param status - Optional filter for connection status
   * @returns List of device connections for the specified user
   */
  async getUserDeviceConnections(
    userId: string,
    status?: ConnectionStatus,
  ): Promise<IDeviceConnection[]> {
    try {
      const where: Prisma.DeviceConnectionWhereInput = { recordId: userId };
      
      if (status) {
        where.status = status;
      }

      const connections = await this.prisma.deviceConnection.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return connections as unknown as IDeviceConnection[];
    } catch (error) {
      throw new Error(
        `Failed to retrieve device connections for user ${userId}: ${error.message}`,
      );
    }
  }

  /**
   * Creates a new device connection with optimized transaction pattern
   * 
   * @param data - The device connection data to create
   * @returns The created device connection
   */
  @Transactional()
  async createDeviceConnection(
    data: Prisma.DeviceConnectionCreateInput,
    client?: TransactionClient,
  ): Promise<IDeviceConnection> {
    const prisma = client || this.prisma;
    
    try {
      // Check if device is supported
      if (!this.isDeviceSupported(data.deviceType as DeviceType)) {
        throw new UnsupportedDeviceError(
          `Device type ${data.deviceType} is not supported`,
        );
      }

      // Check for existing connection with same device ID
      const existingConnection = await prisma.deviceConnection.findFirst({
        where: {
          recordId: data.recordId,
          deviceId: data.deviceId,
        },
      });

      if (existingConnection) {
        // Update existing connection instead of creating a new one
        const updatedConnection = await prisma.deviceConnection.update({
          where: { id: existingConnection.id },
          data: {
            status: ConnectionStatus.CONNECTED,
            updatedAt: new Date(),
          },
        });

        return updatedConnection as unknown as IDeviceConnection;
      }

      // Create new connection
      const connection = await prisma.deviceConnection.create({
        data: {
          ...data,
          status: ConnectionStatus.CONNECTED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return connection as unknown as IDeviceConnection;
    } catch (error) {
      if (error instanceof UnsupportedDeviceError) {
        throw error;
      }
      throw new Error(`Failed to create device connection: ${error.message}`);
    }
  }

  /**
   * Checks if a device type is supported by the platform
   * 
   * @param deviceType - The type of device to check
   * @returns True if the device type is supported
   */
  private isDeviceSupported(deviceType: DeviceType): boolean {
    const supportedDevices = [
      DeviceType.SMARTWATCH,
      DeviceType.FITNESS_TRACKER,
      DeviceType.SMART_SCALE,
      DeviceType.BLOOD_PRESSURE_MONITOR,
      DeviceType.GLUCOSE_MONITOR,
      DeviceType.SLEEP_TRACKER,
    ];

    return supportedDevices.includes(deviceType);
  }

  /**
   * Updates a device connection status with optimized transaction pattern
   * 
   * @param connectionId - The unique identifier of the device connection
   * @param status - The new status for the connection
   * @returns The updated device connection
   */
  @Transactional()
  async updateDeviceConnectionStatus(
    connectionId: string,
    status: ConnectionStatus,
    client?: TransactionClient,
  ): Promise<IDeviceConnection> {
    const prisma = client || this.prisma;
    
    try {
      const connection = await prisma.deviceConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new DeviceNotFoundError(`Device connection with ID ${connectionId} not found`);
      }

      // Update the connection status
      const updatedConnection = await prisma.deviceConnection.update({
        where: { id: connectionId },
        data: {
          status,
          lastSync: status === ConnectionStatus.CONNECTED ? new Date() : connection.lastSync,
          updatedAt: new Date(),
        },
      });

      return updatedConnection as unknown as IDeviceConnection;
    } catch (error) {
      if (error instanceof DeviceNotFoundError) {
        throw error;
      }
      throw new Error(
        `Failed to update status for device connection ${connectionId}: ${error.message}`,
      );
    }
  }

  /**
   * Synchronizes data from a connected device with optimized transaction pattern
   * 
   * @param connectionId - The unique identifier of the device connection
   * @param metrics - Array of health metrics from the device
   * @returns The updated device connection with synchronized metrics
   */
  @Transactional()
  async synchronizeDeviceData(
    connectionId: string,
    metrics: Prisma.HealthMetricCreateInput[],
    client?: TransactionClient,
  ): Promise<{ connection: IDeviceConnection; metrics: IHealthMetric[] }> {
    const prisma = client || this.prisma;
    
    try {
      const connection = await prisma.deviceConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new DeviceNotFoundError(`Device connection with ID ${connectionId} not found`);
      }

      if (connection.status !== ConnectionStatus.CONNECTED) {
        throw new SynchronizationFailedError(
          `Cannot synchronize data for device with status ${connection.status}`,
        );
      }

      // Create all metrics in a single transaction
      const createdMetrics = await Promise.all(
        metrics.map(metric => {
          // Set source to WEARABLE_DEVICE if not specified
          if (!metric.source) {
            metric.source = MetricSource.WEARABLE_DEVICE;
          }
          
          // Validate metric data
          this.validateMetricData(metric);
          
          // Create the metric
          return prisma.healthMetric.create({ data: metric });
        })
      );

      // Update the connection's last sync timestamp
      const updatedConnection = await prisma.deviceConnection.update({
        where: { id: connectionId },
        data: {
          lastSync: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        connection: updatedConnection as unknown as IDeviceConnection,
        metrics: createdMetrics as unknown as IHealthMetric[],
      };
    } catch (error) {
      if (
        error instanceof DeviceNotFoundError ||
        error instanceof SynchronizationFailedError ||
        error instanceof InvalidMetricValueError
      ) {
        throw error;
      }
      throw new Error(
        `Failed to synchronize data for device connection ${connectionId}: ${error.message}`,
      );
    }
  }

  /**
   * Retrieves a medical event by ID with optimized query
   * 
   * @param eventId - The unique identifier of the medical event
   * @returns The medical event details or throws error if not found
   */
  async getMedicalEventById(eventId: string): Promise<IMedicalEvent> {
    try {
      const event = await this.prisma.medicalEvent.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new Error(`Medical event with ID ${eventId} not found`);
      }

      return event as unknown as IMedicalEvent;
    } catch (error) {
      throw new Error(
        `Failed to retrieve medical event with ID ${eventId}: ${error.message}`,
      );
    }
  }

  /**
   * Retrieves medical events for a specific user with pagination and filtering
   * 
   * @param userId - The unique identifier of the user
   * @param type - Optional filter for event type
   * @param startDate - Optional start date for filtering events
   * @param endDate - Optional end date for filtering events
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of items per page (default: 10)
   * @returns Paginated list of medical events for the specified user
   */
  async getUserMedicalEvents(
    userId: string,
    type?: string,
    startDate?: Date,
    endDate?: Date,
    page = 1,
    limit = 10,
  ): Promise<{ events: IMedicalEvent[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;
      const where: Prisma.MedicalEventWhereInput = { recordId: userId };
      
      if (type) {
        where.type = type;
      }

      if (startDate || endDate) {
        where.date = {};
        
        if (startDate) {
          where.date.gte = startDate;
        }
        
        if (endDate) {
          where.date.lte = endDate;
        }
      }

      const [events, total] = await Promise.all([
        this.prisma.medicalEvent.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            date: 'desc',
          },
        }),
        this.prisma.medicalEvent.count({ where }),
      ]);

      return {
        events: events as unknown as IMedicalEvent[],
        total,
        page,
        limit,
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve medical events for user ${userId}: ${error.message}`,
      );
    }
  }

  /**
   * Creates a new medical event with optimized transaction pattern
   * 
   * @param data - The medical event data to create
   * @returns The created medical event
   */
  @Transactional()
  async createMedicalEvent(
    data: Prisma.MedicalEventCreateInput,
    client?: TransactionClient,
  ): Promise<IMedicalEvent> {
    const prisma = client || this.prisma;
    
    try {
      // Validate event data
      if (!data.type) {
        throw new Error('Medical event type is required');
      }

      if (!data.date) {
        throw new Error('Medical event date is required');
      }

      // Create the event
      const event = await prisma.medicalEvent.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return event as unknown as IMedicalEvent;
    } catch (error) {
      throw new Error(`Failed to create medical event: ${error.message}`);
    }
  }

  /**
   * Updates a medical event with optimized transaction pattern
   * 
   * @param eventId - The unique identifier of the medical event
   * @param data - The medical event data to update
   * @returns The updated medical event
   */
  @Transactional()
  async updateMedicalEvent(
    eventId: string,
    data: Prisma.MedicalEventUpdateInput,
    client?: TransactionClient,
  ): Promise<IMedicalEvent> {
    const prisma = client || this.prisma;
    
    try {
      const event = await prisma.medicalEvent.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new Error(`Medical event with ID ${eventId} not found`);
      }

      // Update the event
      const updatedEvent = await prisma.medicalEvent.update({
        where: { id: eventId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return updatedEvent as unknown as IMedicalEvent;
    } catch (error) {
      throw new Error(
        `Failed to update medical event ${eventId}: ${error.message}`,
      );
    }
  }

  /**
   * Imports FHIR resources as medical events with optimized transaction pattern
   * 
   * @param userId - The unique identifier of the user
   * @param fhirResources - Array of FHIR resources to import
   * @returns The created medical events
   */
  @Transactional()
  async importFhirResources(
    userId: string,
    fhirResources: any[],
    client?: TransactionClient,
  ): Promise<IMedicalEvent[]> {
    const prisma = client || this.prisma;
    
    try {
      // Validate FHIR resources
      for (const resource of fhirResources) {
        if (!resource.resourceType) {
          throw new InvalidResourceError('FHIR resource type is required');
        }

        // Additional validation based on resource type
        switch (resource.resourceType) {
          case 'Observation':
            if (!resource.code || !resource.effectiveDateTime) {
              throw new InvalidResourceError('Invalid Observation resource: missing required fields');
            }
            break;
          case 'Condition':
            if (!resource.code || !resource.onsetDateTime) {
              throw new InvalidResourceError('Invalid Condition resource: missing required fields');
            }
            break;
          case 'Procedure':
            if (!resource.code || !resource.performedDateTime) {
              throw new InvalidResourceError('Invalid Procedure resource: missing required fields');
            }
            break;
          case 'MedicationStatement':
            if (!resource.medicationCodeableConcept || !resource.effectiveDateTime) {
              throw new InvalidResourceError('Invalid MedicationStatement resource: missing required fields');
            }
            break;
          default:
            throw new InvalidResourceError(`Unsupported FHIR resource type: ${resource.resourceType}`);
        }
      }

      // Convert FHIR resources to medical events
      const medicalEventData = fhirResources.map(resource => {
        let type: string;
        let description: string;
        let date: Date;

        switch (resource.resourceType) {
          case 'Observation':
            type = 'observation';
            description = `${resource.code.text || resource.code.coding[0].display}: ${resource.valueQuantity?.value || 'N/A'} ${resource.valueQuantity?.unit || ''}`;
            date = new Date(resource.effectiveDateTime);
            break;
          case 'Condition':
            type = 'diagnosis';
            description = resource.code.text || resource.code.coding[0].display;
            date = new Date(resource.onsetDateTime);
            break;
          case 'Procedure':
            type = 'procedure';
            description = resource.code.text || resource.code.coding[0].display;
            date = new Date(resource.performedDateTime);
            break;
          case 'MedicationStatement':
            type = 'medication';
            description = resource.medicationCodeableConcept.text || resource.medicationCodeableConcept.coding[0].display;
            date = new Date(resource.effectiveDateTime);
            break;
          default:
            // This should never happen due to validation above
            throw new InvalidResourceError(`Unsupported FHIR resource type: ${resource.resourceType}`);
        }

        return {
          recordId: userId,
          type,
          description,
          date,
          provider: resource.performer?.[0]?.display || resource.recorder?.display || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      // Create all medical events in a single transaction
      const createdEvents = await Promise.all(
        medicalEventData.map(data => prisma.medicalEvent.create({ data }))
      );

      return createdEvents as unknown as IMedicalEvent[];
    } catch (error) {
      if (
        error instanceof InvalidResourceError ||
        error instanceof ResourceNotFoundError
      ) {
        throw error;
      }
      throw new Error(`Failed to import FHIR resources: ${error.message}`);
    }
  }
}