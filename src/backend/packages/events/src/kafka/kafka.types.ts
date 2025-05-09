/**
 * @file kafka.types.ts
 * @description TypeScript type definitions for Kafka operations, including event types, message formats,
 * configuration options, and callback signatures. This type system ensures type safety across all
 * Kafka operations in the application.
 */

import { KafkaMessage, Consumer, Producer, ProducerRecord, RecordMetadata } from 'kafkajs';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { IVersionedEvent } from '../interfaces/event-versioning.interface';
import { IEventValidator, ValidationResult } from '../interfaces/event-validation.interface';
import { IEventResponse } from '../interfaces/event-response.interface';
import { IKafkaConsumer, IKafkaProducer } from './kafka.interfaces';
import { ClassConstructor } from 'class-transformer';
import { ZodSchema } from 'zod';

// Import journey-specific event payloads
import { IHealthMetricEventPayload, IHealthGoalEventPayload } from '../dto/health-metric-event.dto';
import { IAppointmentEventPayload, IMedicationEventPayload } from '../dto/appointment-event.dto';
import { IClaimEventPayload, IBenefitEventPayload } from '../dto/claim-event.dto';

/**
 * Represents the journey types in the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GAMIFICATION = 'gamification',
  NOTIFICATION = 'notification',
  SYSTEM = 'system'
}

/**
 * Represents the event categories within each journey
 */
export enum EventCategory {
  // Health Journey Categories
  HEALTH_METRIC = 'health-metric',
  HEALTH_GOAL = 'health-goal',
  HEALTH_INSIGHT = 'health-insight',
  DEVICE_SYNC = 'device-sync',
  
  // Care Journey Categories
  APPOINTMENT = 'appointment',
  MEDICATION = 'medication',
  TELEMEDICINE = 'telemedicine',
  CARE_PLAN = 'care-plan',
  
  // Plan Journey Categories
  CLAIM = 'claim',
  BENEFIT = 'benefit',
  PLAN_SELECTION = 'plan-selection',
  REWARD = 'reward',
  
  // Gamification Categories
  ACHIEVEMENT = 'achievement',
  QUEST = 'quest',
  LEVEL = 'level',
  POINT = 'point',
  LEADERBOARD = 'leaderboard',
  
  // Notification Categories
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in-app',
  
  // System Categories
  AUDIT = 'audit',
  ERROR = 'error',
  LIFECYCLE = 'lifecycle',
  PERFORMANCE = 'performance'
}

/**
 * Represents the specific event types for the Health journey
 */
export enum HealthEventType {
  // Health Metric Events
  METRIC_RECORDED = 'health.metric.recorded',
  METRIC_UPDATED = 'health.metric.updated',
  METRIC_DELETED = 'health.metric.deleted',
  
  // Health Goal Events
  GOAL_CREATED = 'health.goal.created',
  GOAL_UPDATED = 'health.goal.updated',
  GOAL_ACHIEVED = 'health.goal.achieved',
  GOAL_FAILED = 'health.goal.failed',
  GOAL_PROGRESS = 'health.goal.progress',
  
  // Health Insight Events
  INSIGHT_GENERATED = 'health.insight.generated',
  INSIGHT_VIEWED = 'health.insight.viewed',
  
  // Device Sync Events
  DEVICE_CONNECTED = 'health.device.connected',
  DEVICE_DISCONNECTED = 'health.device.disconnected',
  DEVICE_DATA_SYNCED = 'health.device.data_synced'
}

/**
 * Represents the specific event types for the Care journey
 */
export enum CareEventType {
  // Appointment Events
  APPOINTMENT_REQUESTED = 'care.appointment.requested',
  APPOINTMENT_SCHEDULED = 'care.appointment.scheduled',
  APPOINTMENT_CONFIRMED = 'care.appointment.confirmed',
  APPOINTMENT_CANCELED = 'care.appointment.canceled',
  APPOINTMENT_COMPLETED = 'care.appointment.completed',
  APPOINTMENT_MISSED = 'care.appointment.missed',
  
  // Medication Events
  MEDICATION_PRESCRIBED = 'care.medication.prescribed',
  MEDICATION_TAKEN = 'care.medication.taken',
  MEDICATION_SKIPPED = 'care.medication.skipped',
  MEDICATION_REFILL_REQUESTED = 'care.medication.refill_requested',
  MEDICATION_REFILL_FULFILLED = 'care.medication.refill_fulfilled',
  
  // Telemedicine Events
  TELEMEDICINE_SESSION_REQUESTED = 'care.telemedicine.session_requested',
  TELEMEDICINE_SESSION_STARTED = 'care.telemedicine.session_started',
  TELEMEDICINE_SESSION_ENDED = 'care.telemedicine.session_ended',
  
  // Care Plan Events
  CARE_PLAN_CREATED = 'care.plan.created',
  CARE_PLAN_UPDATED = 'care.plan.updated',
  CARE_PLAN_COMPLETED = 'care.plan.completed',
  CARE_PLAN_PROGRESS = 'care.plan.progress'
}

/**
 * Represents the specific event types for the Plan journey
 */
export enum PlanEventType {
  // Claim Events
  CLAIM_SUBMITTED = 'plan.claim.submitted',
  CLAIM_APPROVED = 'plan.claim.approved',
  CLAIM_REJECTED = 'plan.claim.rejected',
  CLAIM_UPDATED = 'plan.claim.updated',
  
  // Benefit Events
  BENEFIT_UTILIZED = 'plan.benefit.utilized',
  BENEFIT_ADDED = 'plan.benefit.added',
  BENEFIT_REMOVED = 'plan.benefit.removed',
  BENEFIT_UPDATED = 'plan.benefit.updated',
  
  // Plan Selection Events
  PLAN_VIEWED = 'plan.selection.viewed',
  PLAN_COMPARED = 'plan.selection.compared',
  PLAN_SELECTED = 'plan.selection.selected',
  PLAN_CHANGED = 'plan.selection.changed',
  
  // Reward Events
  REWARD_EARNED = 'plan.reward.earned',
  REWARD_REDEEMED = 'plan.reward.redeemed',
  REWARD_EXPIRED = 'plan.reward.expired'
}

/**
 * Represents the specific event types for the Gamification journey
 */
export enum GamificationEventType {
  // Achievement Events
  ACHIEVEMENT_UNLOCKED = 'gamification.achievement.unlocked',
  ACHIEVEMENT_PROGRESS = 'gamification.achievement.progress',
  
  // Quest Events
  QUEST_STARTED = 'gamification.quest.started',
  QUEST_COMPLETED = 'gamification.quest.completed',
  QUEST_FAILED = 'gamification.quest.failed',
  QUEST_PROGRESS = 'gamification.quest.progress',
  
  // Level Events
  LEVEL_UP = 'gamification.level.up',
  
  // Point Events
  POINTS_EARNED = 'gamification.points.earned',
  POINTS_SPENT = 'gamification.points.spent',
  
  // Leaderboard Events
  LEADERBOARD_POSITION_CHANGED = 'gamification.leaderboard.position_changed',
  LEADERBOARD_UPDATED = 'gamification.leaderboard.updated'
}

/**
 * Represents the specific event types for the Notification journey
 */
export enum NotificationEventType {
  // Push Notification Events
  PUSH_SENT = 'notification.push.sent',
  PUSH_DELIVERED = 'notification.push.delivered',
  PUSH_OPENED = 'notification.push.opened',
  PUSH_FAILED = 'notification.push.failed',
  
  // Email Notification Events
  EMAIL_SENT = 'notification.email.sent',
  EMAIL_DELIVERED = 'notification.email.delivered',
  EMAIL_OPENED = 'notification.email.opened',
  EMAIL_CLICKED = 'notification.email.clicked',
  EMAIL_FAILED = 'notification.email.failed',
  
  // SMS Notification Events
  SMS_SENT = 'notification.sms.sent',
  SMS_DELIVERED = 'notification.sms.delivered',
  SMS_FAILED = 'notification.sms.failed',
  
  // In-App Notification Events
  IN_APP_CREATED = 'notification.in_app.created',
  IN_APP_DELIVERED = 'notification.in_app.delivered',
  IN_APP_READ = 'notification.in_app.read',
  IN_APP_CLICKED = 'notification.in_app.clicked',
  IN_APP_DISMISSED = 'notification.in_app.dismissed'
}

/**
 * Represents the specific event types for System events
 */
export enum SystemEventType {
  // Audit Events
  AUDIT_USER_LOGIN = 'system.audit.user_login',
  AUDIT_USER_LOGOUT = 'system.audit.user_logout',
  AUDIT_DATA_ACCESS = 'system.audit.data_access',
  AUDIT_DATA_CHANGE = 'system.audit.data_change',
  
  // Error Events
  ERROR_APPLICATION = 'system.error.application',
  ERROR_INTEGRATION = 'system.error.integration',
  ERROR_SECURITY = 'system.error.security',
  
  // Lifecycle Events
  LIFECYCLE_SERVICE_STARTED = 'system.lifecycle.service_started',
  LIFECYCLE_SERVICE_STOPPED = 'system.lifecycle.service_stopped',
  LIFECYCLE_DEPLOYMENT = 'system.lifecycle.deployment',
  
  // Performance Events
  PERFORMANCE_THRESHOLD_EXCEEDED = 'system.performance.threshold_exceeded',
  PERFORMANCE_LATENCY_REPORT = 'system.performance.latency_report'
}

/**
 * Union type of all event types
 */
export type EventType = 
  | HealthEventType
  | CareEventType
  | PlanEventType
  | GamificationEventType
  | NotificationEventType
  | SystemEventType;

/**
 * Represents the possible states of a Kafka consumer
 */
export enum KafkaConsumerState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  PAUSED = 'paused',
  ERROR = 'error'
}

/**
 * Represents the possible states of a Kafka producer
 */
export enum KafkaProducerState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

/**
 * Represents the possible delivery guarantees for Kafka messages
 */
export enum DeliveryGuarantee {
  AT_MOST_ONCE = 'at-most-once',
  AT_LEAST_ONCE = 'at-least-once',
  EXACTLY_ONCE = 'exactly-once'
}

/**
 * Represents the possible compression types for Kafka messages
 */
export enum KafkaCompressionType {
  NONE = 'none',
  GZIP = 'gzip',
  SNAPPY = 'snappy',
  LZ4 = 'lz4',
  ZSTD = 'zstd'
}

/**
 * Represents the possible acknowledgment levels for Kafka producers
 */
export enum KafkaAcks {
  NONE = 0,
  LEADER = 1,
  ALL = -1
}

/**
 * Represents a Kafka event that extends the base event interface
 */
export type KafkaEvent<T = unknown> = IBaseEvent<T> & {
  topic: string;
  partition?: number;
  offset?: string;
  key?: string;
  headers?: KafkaHeaders;
};

/**
 * Represents a versioned Kafka event
 */
export type VersionedKafkaEvent<T = unknown> = KafkaEvent<T> & IVersionedEvent;

/**
 * Represents a health journey event in Kafka
 */
export interface HealthKafkaEvent<T = unknown> extends KafkaEvent<T> {
  type: HealthEventType;
  journey: JourneyType.HEALTH;
  category: EventCategory;
}

/**
 * Represents a care journey event in Kafka
 */
export interface CareKafkaEvent<T = unknown> extends KafkaEvent<T> {
  type: CareEventType;
  journey: JourneyType.CARE;
  category: EventCategory;
}

/**
 * Represents a plan journey event in Kafka
 */
export interface PlanKafkaEvent<T = unknown> extends KafkaEvent<T> {
  type: PlanEventType;
  journey: JourneyType.PLAN;
  category: EventCategory;
}

/**
 * Represents a gamification event in Kafka
 */
export interface GamificationKafkaEvent<T = unknown> extends KafkaEvent<T> {
  type: GamificationEventType;
  journey: JourneyType.GAMIFICATION;
  category: EventCategory;
}

/**
 * Represents a notification event in Kafka
 */
export interface NotificationKafkaEvent<T = unknown> extends KafkaEvent<T> {
  type: NotificationEventType;
  journey: JourneyType.NOTIFICATION;
  category: EventCategory;
}

/**
 * Represents a system event in Kafka
 */
export interface SystemKafkaEvent<T = unknown> extends KafkaEvent<T> {
  type: SystemEventType;
  journey: JourneyType.SYSTEM;
  category: EventCategory;
}

/**
 * Union type of all journey-specific Kafka events
 */
export type JourneyKafkaEvent<T = unknown> =
  | HealthKafkaEvent<T>
  | CareKafkaEvent<T>
  | PlanKafkaEvent<T>
  | GamificationKafkaEvent<T>
  | NotificationKafkaEvent<T>
  | SystemKafkaEvent<T>;

/**
 * Maps event types to their corresponding payload types for type-safe event handling
 */
export interface EventTypeToPayloadMap {
  // Health Journey Events
  [HealthEventType.METRIC_RECORDED]: IHealthMetricEventPayload;
  [HealthEventType.METRIC_UPDATED]: IHealthMetricEventPayload;
  [HealthEventType.METRIC_DELETED]: { metricId: string };
  [HealthEventType.GOAL_CREATED]: IHealthGoalEventPayload;
  [HealthEventType.GOAL_UPDATED]: IHealthGoalEventPayload;
  [HealthEventType.GOAL_ACHIEVED]: IHealthGoalEventPayload;
  [HealthEventType.GOAL_FAILED]: IHealthGoalEventPayload;
  [HealthEventType.GOAL_PROGRESS]: IHealthGoalEventPayload & { progress: number };
  [HealthEventType.INSIGHT_GENERATED]: { insightId: string; userId: string; type: string; content: string };
  [HealthEventType.INSIGHT_VIEWED]: { insightId: string; userId: string };
  [HealthEventType.DEVICE_CONNECTED]: { deviceId: string; userId: string; deviceType: string };
  [HealthEventType.DEVICE_DISCONNECTED]: { deviceId: string; userId: string };
  [HealthEventType.DEVICE_DATA_SYNCED]: { deviceId: string; userId: string; dataType: string; count: number };
  
  // Care Journey Events
  [CareEventType.APPOINTMENT_REQUESTED]: IAppointmentEventPayload;
  [CareEventType.APPOINTMENT_SCHEDULED]: IAppointmentEventPayload;
  [CareEventType.APPOINTMENT_CONFIRMED]: IAppointmentEventPayload;
  [CareEventType.APPOINTMENT_CANCELED]: IAppointmentEventPayload & { reason?: string };
  [CareEventType.APPOINTMENT_COMPLETED]: IAppointmentEventPayload;
  [CareEventType.APPOINTMENT_MISSED]: IAppointmentEventPayload;
  [CareEventType.MEDICATION_PRESCRIBED]: IMedicationEventPayload;
  [CareEventType.MEDICATION_TAKEN]: IMedicationEventPayload & { takenAt: string };
  [CareEventType.MEDICATION_SKIPPED]: IMedicationEventPayload & { reason?: string };
  [CareEventType.MEDICATION_REFILL_REQUESTED]: IMedicationEventPayload;
  [CareEventType.MEDICATION_REFILL_FULFILLED]: IMedicationEventPayload;
  [CareEventType.TELEMEDICINE_SESSION_REQUESTED]: { sessionId: string; userId: string; providerId: string };
  [CareEventType.TELEMEDICINE_SESSION_STARTED]: { sessionId: string; startTime: string };
  [CareEventType.TELEMEDICINE_SESSION_ENDED]: { sessionId: string; duration: number };
  [CareEventType.CARE_PLAN_CREATED]: { planId: string; userId: string; items: Array<{ type: string; description: string }> };
  [CareEventType.CARE_PLAN_UPDATED]: { planId: string; userId: string; items: Array<{ type: string; description: string }> };
  [CareEventType.CARE_PLAN_COMPLETED]: { planId: string; userId: string };
  [CareEventType.CARE_PLAN_PROGRESS]: { planId: string; userId: string; progress: number };
  
  // Plan Journey Events
  [PlanEventType.CLAIM_SUBMITTED]: IClaimEventPayload;
  [PlanEventType.CLAIM_APPROVED]: IClaimEventPayload & { approvedAmount: number };
  [PlanEventType.CLAIM_REJECTED]: IClaimEventPayload & { reason: string };
  [PlanEventType.CLAIM_UPDATED]: IClaimEventPayload;
  [PlanEventType.BENEFIT_UTILIZED]: IBenefitEventPayload;
  [PlanEventType.BENEFIT_ADDED]: IBenefitEventPayload;
  [PlanEventType.BENEFIT_REMOVED]: { benefitId: string; userId: string };
  [PlanEventType.BENEFIT_UPDATED]: IBenefitEventPayload;
  [PlanEventType.PLAN_VIEWED]: { planId: string; userId: string };
  [PlanEventType.PLAN_COMPARED]: { planIds: string[]; userId: string };
  [PlanEventType.PLAN_SELECTED]: { planId: string; userId: string; effectiveDate: string };
  [PlanEventType.PLAN_CHANGED]: { oldPlanId: string; newPlanId: string; userId: string; effectiveDate: string };
  [PlanEventType.REWARD_EARNED]: { rewardId: string; userId: string; points: number };
  [PlanEventType.REWARD_REDEEMED]: { rewardId: string; userId: string; points: number };
  [PlanEventType.REWARD_EXPIRED]: { rewardId: string; userId: string; points: number };
  
  // Gamification Events
  [GamificationEventType.ACHIEVEMENT_UNLOCKED]: { achievementId: string; userId: string; timestamp: string };
  [GamificationEventType.ACHIEVEMENT_PROGRESS]: { achievementId: string; userId: string; progress: number };
  [GamificationEventType.QUEST_STARTED]: { questId: string; userId: string; startTime: string };
  [GamificationEventType.QUEST_COMPLETED]: { questId: string; userId: string; completionTime: string; reward?: { type: string; value: number } };
  [GamificationEventType.QUEST_FAILED]: { questId: string; userId: string; reason?: string };
  [GamificationEventType.QUEST_PROGRESS]: { questId: string; userId: string; progress: number };
  [GamificationEventType.LEVEL_UP]: { userId: string; oldLevel: number; newLevel: number; timestamp: string };
  [GamificationEventType.POINTS_EARNED]: { userId: string; points: number; source: string; timestamp: string };
  [GamificationEventType.POINTS_SPENT]: { userId: string; points: number; reason: string; timestamp: string };
  [GamificationEventType.LEADERBOARD_POSITION_CHANGED]: { userId: string; oldPosition: number; newPosition: number; leaderboardId: string };
  [GamificationEventType.LEADERBOARD_UPDATED]: { leaderboardId: string; timestamp: string };
  
  // Notification Events
  [NotificationEventType.PUSH_SENT]: { notificationId: string; userId: string; deviceId: string; timestamp: string };
  [NotificationEventType.PUSH_DELIVERED]: { notificationId: string; userId: string; deviceId: string; timestamp: string };
  [NotificationEventType.PUSH_OPENED]: { notificationId: string; userId: string; deviceId: string; timestamp: string };
  [NotificationEventType.PUSH_FAILED]: { notificationId: string; userId: string; deviceId: string; error: string; timestamp: string };
  [NotificationEventType.EMAIL_SENT]: { notificationId: string; userId: string; email: string; timestamp: string };
  [NotificationEventType.EMAIL_DELIVERED]: { notificationId: string; userId: string; email: string; timestamp: string };
  [NotificationEventType.EMAIL_OPENED]: { notificationId: string; userId: string; email: string; timestamp: string };
  [NotificationEventType.EMAIL_CLICKED]: { notificationId: string; userId: string; email: string; linkId: string; timestamp: string };
  [NotificationEventType.EMAIL_FAILED]: { notificationId: string; userId: string; email: string; error: string; timestamp: string };
  [NotificationEventType.SMS_SENT]: { notificationId: string; userId: string; phoneNumber: string; timestamp: string };
  [NotificationEventType.SMS_DELIVERED]: { notificationId: string; userId: string; phoneNumber: string; timestamp: string };
  [NotificationEventType.SMS_FAILED]: { notificationId: string; userId: string; phoneNumber: string; error: string; timestamp: string };
  [NotificationEventType.IN_APP_CREATED]: { notificationId: string; userId: string; content: string; timestamp: string };
  [NotificationEventType.IN_APP_DELIVERED]: { notificationId: string; userId: string; timestamp: string };
  [NotificationEventType.IN_APP_READ]: { notificationId: string; userId: string; timestamp: string };
  [NotificationEventType.IN_APP_CLICKED]: { notificationId: string; userId: string; actionId?: string; timestamp: string };
  [NotificationEventType.IN_APP_DISMISSED]: { notificationId: string; userId: string; timestamp: string };
  
  // System Events
  [SystemEventType.AUDIT_USER_LOGIN]: { userId: string; ipAddress: string; userAgent: string; timestamp: string; success: boolean };
  [SystemEventType.AUDIT_USER_LOGOUT]: { userId: string; ipAddress: string; timestamp: string };
  [SystemEventType.AUDIT_DATA_ACCESS]: { userId: string; resourceType: string; resourceId: string; action: string; timestamp: string };
  [SystemEventType.AUDIT_DATA_CHANGE]: { userId: string; resourceType: string; resourceId: string; changes: Record<string, { old: unknown; new: unknown }>; timestamp: string };
  [SystemEventType.ERROR_APPLICATION]: { service: string; errorCode: string; message: string; stackTrace?: string; timestamp: string };
  [SystemEventType.ERROR_INTEGRATION]: { service: string; integration: string; errorCode: string; message: string; timestamp: string };
  [SystemEventType.ERROR_SECURITY]: { service: string; securityType: string; message: string; ipAddress?: string; userId?: string; timestamp: string };
  [SystemEventType.LIFECYCLE_SERVICE_STARTED]: { service: string; version: string; environment: string; timestamp: string };
  [SystemEventType.LIFECYCLE_SERVICE_STOPPED]: { service: string; reason: string; timestamp: string };
  [SystemEventType.LIFECYCLE_DEPLOYMENT]: { service: string; version: string; environment: string; timestamp: string };
  [SystemEventType.PERFORMANCE_THRESHOLD_EXCEEDED]: { service: string; metric: string; threshold: number; value: number; timestamp: string };
  [SystemEventType.PERFORMANCE_LATENCY_REPORT]: { service: string; endpoint: string; p50: number; p90: number; p99: number; timestamp: string };
}

/**
 * Type-safe event payload extractor based on event type
 */
export type PayloadForEventType<T extends EventType> = EventTypeToPayloadMap[T];

/**
 * Type-safe Kafka event with payload based on event type
 */
export type TypedKafkaEvent<T extends EventType> = KafkaEvent<PayloadForEventType<T>> & {
  type: T;
};

/**
 * Represents the headers for a Kafka message
 */
export type KafkaHeaders = Record<string, Buffer | string | null | undefined>;

/**
 * Represents the configuration for a Kafka consumer
 */
export interface KafkaConsumerConfig {
  clientId: string;
  groupId: string;
  brokers: string[];
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
  topics: string[];
  fromBeginning?: boolean;
  autoCommit?: boolean;
  autoCommitInterval?: number;
  maxBytesPerPartition?: number;
  minBytes?: number;
  maxBytes?: number;
  maxWaitTimeInMs?: number;
  retry?: {
    maxRetries: number;
    initialRetryTimeInMs: number;
    maxRetryTimeInMs: number;
    retryFactor: number;
  };
  heartbeatInterval?: number;
  sessionTimeout?: number;
  rebalanceTimeout?: number;
  allowAutoTopicCreation?: boolean;
  readUncommitted?: boolean;
}

/**
 * Represents the configuration for a Kafka producer
 */
export interface KafkaProducerConfig {
  clientId: string;
  brokers: string[];
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
  acks?: KafkaAcks;
  timeout?: number;
  compression?: KafkaCompressionType;
  maxRetries?: number;
  retry?: {
    maxRetries: number;
    initialRetryTimeInMs: number;
    maxRetryTimeInMs: number;
    retryFactor: number;
  };
  idempotent?: boolean;
  transactionalId?: string;
  transactionTimeout?: number;
  allowAutoTopicCreation?: boolean;
  deliveryGuarantee?: DeliveryGuarantee;
}

/**
 * Represents the options for sending a Kafka message
 */
export interface KafkaSendOptions {
  topic: string;
  key?: string;
  partition?: number;
  headers?: KafkaHeaders;
  timestamp?: string;
  acks?: KafkaAcks;
  timeout?: number;
  compression?: KafkaCompressionType;
}

/**
 * Represents the result of sending a Kafka message
 */
export interface KafkaSendResult {
  topic: string;
  partition: number;
  errorCode: number;
  baseOffset: string;
  logAppendTime?: string;
  logStartOffset?: string;
  recordErrors?: Array<{
    batchIndex: number;
    batchIndexErrorCode: number;
    errorMessage?: string;
  }>;
  recordMetadata: RecordMetadata;
}

/**
 * Represents a batch of Kafka messages
 */
export interface KafkaBatch {
  topic: string;
  partition: number;
  highWatermark: string;
  messages: KafkaMessage[];
  isEmpty(): boolean;
  firstOffset(): string | null;
  lastOffset(): string;
  offsetLag(): string;
}

/**
 * Represents a callback function for handling Kafka messages
 */
export type KafkaMessageHandler<T = unknown> = (
  message: KafkaMessage,
  topic: string,
  partition: number
) => Promise<void> | void;

/**
 * Represents a callback function for handling Kafka batches
 */
export type KafkaBatchHandler = (
  batch: KafkaBatch,
  topic: string,
  partition: number
) => Promise<void> | void;

/**
 * Represents a callback function for handling Kafka errors
 */
export type KafkaErrorHandler = (
  error: Error,
  topic?: string,
  partition?: number
) => Promise<void> | void;

/**
 * Represents a callback function for handling Kafka consumer state changes
 */
export type KafkaConsumerStateHandler = (
  state: KafkaConsumerState,
  consumer: IKafkaConsumer
) => Promise<void> | void;

/**
 * Represents a callback function for handling Kafka producer state changes
 */
export type KafkaProducerStateHandler = (
  state: KafkaProducerState,
  producer: IKafkaProducer
) => Promise<void> | void;

/**
 * Represents a function that transforms a Kafka message into an event
 */
export type KafkaMessageTransformer<T = unknown> = (
  message: KafkaMessage
) => Promise<T> | T;

/**
 * Represents a function that transforms an event into a Kafka message
 */
export type EventToKafkaMessageTransformer<T = unknown> = (
  event: T,
  options?: KafkaSendOptions
) => Promise<ProducerRecord> | ProducerRecord;

/**
 * Represents a function that validates a Kafka message
 */
export type KafkaMessageValidator<T = unknown> = (
  message: KafkaMessage
) => Promise<ValidationResult> | ValidationResult;

/**
 * Represents a function that validates an event
 */
export type EventValidator<T = unknown> = (
  event: T
) => Promise<ValidationResult> | ValidationResult;

/**
 * Represents a function that processes a Kafka message
 */
export type KafkaMessageProcessor<T = unknown, R = unknown> = (
  message: KafkaMessage
) => Promise<IEventResponse<R>> | IEventResponse<R>;

/**
 * Represents a function that processes an event
 */
export type EventProcessor<T = unknown, R = unknown> = (
  event: T
) => Promise<IEventResponse<R>> | IEventResponse<R>;

/**
 * Represents the options for subscribing to Kafka topics
 */
export interface KafkaSubscribeOptions {
  topics: string | string[];
  fromBeginning?: boolean;
  autoCommit?: boolean;
}

/**
 * Represents the options for committing Kafka offsets
 */
export interface KafkaCommitOptions {
  topics: Array<{
    topic: string;
    partitions: Array<{
      partition: number;
      offset: string;
    }>;
  }>;
}

/**
 * Represents the options for seeking to a specific offset in Kafka
 */
export interface KafkaSeekOptions {
  topic: string;
  partition: number;
  offset: string;
}

/**
 * Represents the options for pausing Kafka consumption
 */
export interface KafkaPauseOptions {
  topics: Array<{
    topic: string;
    partitions?: number[];
  }>;
}

/**
 * Represents the options for resuming Kafka consumption
 */
export interface KafkaResumeOptions extends KafkaPauseOptions {}

/**
 * Represents the health status of a Kafka connection
 */
export interface KafkaHealthStatus {
  status: 'up' | 'down';
  details: {
    connected: boolean;
    brokers: Array<{
      nodeId: number;
      host: string;
      port: number;
      connected: boolean;
    }>;
    topics: string[];
  };
  error?: Error;
}

/**
 * Represents the metrics for Kafka operations
 */
export interface KafkaMetrics {
  messagesSent: number;
  messagesReceived: number;
  messagesProcessed: number;
  messagesFailedProcessing: number;
  messagesFailedValidation: number;
  messagesRetried: number;
  messagesDlq: number; // Dead Letter Queue
  avgProcessingTimeMs: number;
  avgSendTimeMs: number;
  lastProcessedAt?: Date;
  lastSentAt?: Date;
  lastErrorAt?: Date;
  lastError?: Error;
}

/**
 * Represents the options for creating a dead letter queue
 */
export interface DeadLetterQueueOptions {
  enabled: boolean;
  topic: string;
  maxRetries?: number;
  retryBackoffMs?: number;
  headerPrefix?: string;
}

/**
 * Represents the headers added to dead letter queue messages
 */
export interface DeadLetterQueueHeaders {
  originalTopic: string;
  failureReason: string;
  failureTimestamp: string;
  retryCount: string;
  originalKey?: string;
  originalPartition?: string;
  originalOffset?: string;
  originalTimestamp?: string;
}

/**
 * Represents the options for retrying failed messages
 */
export interface RetryOptions {
  enabled: boolean;
  maxRetries: number;
  initialRetryTimeInMs: number;
  maxRetryTimeInMs: number;
  retryFactor: number; // For exponential backoff
  retryTopicPrefix?: string;
  headerPrefix?: string;
}

/**
 * Represents the headers added to retry messages
 */
export interface RetryHeaders {
  retryCount: string;
  originalTopic: string;
  failureReason: string;
  failureTimestamp: string;
  nextRetryTimestamp: string;
  originalKey?: string;
  originalPartition?: string;
  originalOffset?: string;
  originalTimestamp?: string;
}

/**
 * Represents the options for circuit breaking
 */
export interface CircuitBreakerOptions {
  enabled: boolean;
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenAfterMs: number;
  monitorWindowMs: number;
  fallbackFn?: (error: Error) => Promise<void> | void;
}

/**
 * Represents the state of a circuit breaker
 */
export enum CircuitBreakerState {
  CLOSED = 'closed', // Normal operation, requests pass through
  OPEN = 'open',     // Circuit is open, requests fail fast
  HALF_OPEN = 'half-open' // Testing if the service is back online
}

/**
 * Represents the options for Kafka message serialization
 */
export interface SerializationOptions {
  format: 'json' | 'avro' | 'protobuf' | 'binary';
  schemaRegistry?: {
    url: string;
    auth?: {
      username: string;
      password: string;
    };
  };
  schemaId?: number;
  schemaVersion?: number;
  encoding?: BufferEncoding;
}

/**
 * Represents the options for Kafka message compression
 */
export interface CompressionOptions {
  type: KafkaCompressionType;
  level?: number; // Compression level (algorithm-specific)
}

/**
 * Represents the options for Kafka message batching
 */
export interface BatchingOptions {
  enabled: boolean;
  size: number; // Maximum number of messages in a batch
  timeoutMs: number; // Maximum time to wait before sending a batch
  compression?: KafkaCompressionType;
}

/**
 * Represents the options for Kafka message tracing
 */
export interface TracingOptions {
  enabled: boolean;
  propagation: 'w3c' | 'b3' | 'jaeger' | 'custom';
  headerPrefix?: string;
  sampleRate?: number; // 0.0 to 1.0
  serviceName?: string;
}

/**
 * Represents the options for Kafka message validation
 */
export interface ValidationOptions {
  enabled: boolean;
  validator: IEventValidator | EventValidator;
  failOnError?: boolean;
  logInvalidMessages?: boolean;
  validationStrategy?: 'class-validator' | 'zod' | 'custom';
  classValidatorOptions?: {
    whitelist?: boolean;
    forbidNonWhitelisted?: boolean;
    forbidUnknownValues?: boolean;
    skipMissingProperties?: boolean;
    validationError?: {
      target?: boolean;
      value?: boolean;
    };
  };
  zodOptions?: {
    strict?: boolean;
    errorMap?: (issue: any, ctx: any) => { message: string };
  };
}

/**
 * Represents a class validator for event validation
 */
export interface ClassValidatorOptions<T> {
  classType: ClassConstructor<T>;
  options?: {
    whitelist?: boolean;
    forbidNonWhitelisted?: boolean;
    forbidUnknownValues?: boolean;
    skipMissingProperties?: boolean;
  };
}

/**
 * Represents a Zod schema validator for event validation
 */
export interface ZodValidatorOptions<T> {
  schema: ZodSchema<T>;
  options?: {
    strict?: boolean;
    errorMap?: (issue: any, ctx: any) => { message: string };
  };
}

/**
 * Represents a custom validator function for event validation
 */
export interface CustomValidatorOptions<T> {
  validate: (data: unknown) => Promise<ValidationResult> | ValidationResult;
  transform?: (data: unknown) => Promise<T> | T;
}

/**
 * Union type for all validator options
 */
export type ValidatorOptions<T> =
  | ClassValidatorOptions<T>
  | ZodValidatorOptions<T>
  | CustomValidatorOptions<T>;

/**
 * Type guard for ClassValidatorOptions
 */
export function isClassValidatorOptions<T>(
  options: ValidatorOptions<T>
): options is ClassValidatorOptions<T> {
  return 'classType' in options;
}

/**
 * Type guard for ZodValidatorOptions
 */
export function isZodValidatorOptions<T>(
  options: ValidatorOptions<T>
): options is ZodValidatorOptions<T> {
  return 'schema' in options;
}

/**
 * Type guard for CustomValidatorOptions
 */
export function isCustomValidatorOptions<T>(
  options: ValidatorOptions<T>
): options is CustomValidatorOptions<T> {
  return 'validate' in options;
}

/**
 * Maps event types to their validator options
 */
export type EventTypeValidatorOptionsMap = {
  [K in EventType]?: ValidatorOptions<PayloadForEventType<K>>;
};

/**
 * Represents the options for Kafka message versioning
 */
export interface VersioningOptions {
  enabled: boolean;
  strategy: 'header' | 'field' | 'schema';
  headerName?: string;
  fieldName?: string;
  defaultVersion?: string;
  compatibilityMode?: 'strict' | 'relaxed';
  schemaRegistry?: {
    url: string;
    auth?: {
      username: string;
      password: string;
    };
  };
  transformers?: {
    [fromVersion: string]: {
      [toVersion: string]: (data: unknown) => unknown;
    };
  };
}

/**
 * Represents a semantic version
 */
export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Represents a version range
 */
export interface VersionRange {
  min?: SemanticVersion;
  max?: SemanticVersion;
}

/**
 * Represents a version compatibility check result
 */
export interface VersionCompatibilityResult {
  compatible: boolean;
  reason?: string;
  canUpgrade: boolean;
  canDowngrade: boolean;
  upgradeTransformer?: (data: unknown) => unknown;
  downgradeTransformer?: (data: unknown) => unknown;
}

/**
 * Maps event types to their version compatibility requirements
 */
export type EventTypeVersionMap = {
  [K in EventType]?: {
    currentVersion: string;
    compatibleVersions: string[];
    transformers?: {
      [fromVersion: string]: {
        [toVersion: string]: (data: PayloadForEventType<K>) => PayloadForEventType<K>;
      };
    };
  };
};

/**
 * Represents the options for Kafka message idempotency
 */
export interface IdempotencyOptions {
  enabled: boolean;
  headerName?: string;
  ttlMs?: number; // Time-to-live for idempotency tracking
  storage?: 'memory' | 'redis' | 'custom';
  redisOptions?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
}

/**
 * Represents the options for Kafka message rate limiting
 */
export interface RateLimitOptions {
  enabled: boolean;
  tokensPerInterval: number;
  interval: 'second' | 'minute' | 'hour';
  strategy: 'drop' | 'delay' | 'error';
  delayMs?: number; // Only used with 'delay' strategy
}

/**
 * Represents the options for Kafka message monitoring
 */
export interface MonitoringOptions {
  enabled: boolean;
  metricsInterval: number; // Interval in ms to collect metrics
  logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  healthCheck?: {
    enabled: boolean;
    intervalMs: number;
    timeoutMs: number;
  };
}

/**
 * Represents the options for Kafka message security
 */
export interface SecurityOptions {
  ssl: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
  encryptPayload?: boolean;
  encryptionKey?: string;
  signMessages?: boolean;
  signatureKey?: string;
}

/**
 * Represents the options for Kafka message transaction
 */
export interface TransactionOptions {
  enabled: boolean;
  id?: string;
  timeoutMs?: number;
}

/**
 * Represents the options for Kafka message schema evolution
 */
export interface SchemaEvolutionOptions {
  enabled: boolean;
  strategy: 'forward' | 'backward' | 'full' | 'none';
  schemaRegistry?: {
    url: string;
    auth?: {
      username: string;
      password: string;
    };
  };
  autoRegister?: boolean;
  validateCompatibility?: boolean;
}

/**
 * Represents the options for Kafka message error handling
 */
export interface ErrorHandlingOptions {
  retryEnabled: boolean;
  maxRetries: number;
  retryBackoffMs: number;
  dlqEnabled: boolean;
  dlqTopic?: string;
  logErrors: boolean;
  errorHandler?: KafkaErrorHandler;
  continueOnError?: boolean;
}

/**
 * Utility type for extracting the payload type from a Kafka event
 */
export type ExtractKafkaEventPayload<T> = T extends KafkaEvent<infer P> ? P : never;

/**
 * Utility type for creating a type-safe event handler for a specific event type
 */
export type TypedEventHandler<T extends EventType> = (
  event: TypedKafkaEvent<T>
) => Promise<IEventResponse<unknown>> | IEventResponse<unknown>;

/**
 * Utility type for creating a type-safe event validator for a specific event type
 */
export type TypedEventValidator<T extends EventType> = (
  event: TypedKafkaEvent<T>
) => Promise<ValidationResult> | ValidationResult;

/**
 * Utility type for creating a type-safe Kafka message handler for a specific event type
 */
export type TypedKafkaMessageHandler<T extends EventType> = (
  message: KafkaMessage,
  topic: string,
  partition: number
) => Promise<IEventResponse<unknown>> | IEventResponse<unknown>;

/**
 * Utility type for mapping event types to their handlers
 */
export type EventTypeHandlerMap = {
  [K in EventType]?: TypedEventHandler<K>;
};

/**
 * Utility type for mapping event types to their validators
 */
export type EventTypeValidatorMap = {
  [K in EventType]?: TypedEventValidator<K>;
};

/**
 * Utility type for creating a discriminated union of all typed Kafka events
 */
export type AnyTypedKafkaEvent = {
  [K in EventType]: TypedKafkaEvent<K>;
}[EventType];

/**
 * Represents the options for Kafka message processing
 */
export interface ProcessingOptions {
  concurrency: number;
  timeout: number;
  autoCommit: boolean;
  commitInterval: number;
  batchSize: number;
  maxBatchSize: number;
  errorHandling: ErrorHandlingOptions;
}

/**
 * Represents the complete configuration for Kafka operations
 */
export interface KafkaOptions {
  consumer?: KafkaConsumerConfig;
  producer?: KafkaProducerConfig;
  clientId: string;
  brokers: string[];
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
  retry?: {
    maxRetries: number;
    initialRetryTimeInMs: number;
    maxRetryTimeInMs: number;
    retryFactor: number;
  };
  serialization?: SerializationOptions;
  compression?: CompressionOptions;
  batching?: BatchingOptions;
  tracing?: TracingOptions;
  validation?: ValidationOptions;
  versioning?: VersioningOptions;
  idempotency?: IdempotencyOptions;
  rateLimit?: RateLimitOptions;
  monitoring?: MonitoringOptions;
  security?: SecurityOptions;
  transaction?: TransactionOptions;
  schemaEvolution?: SchemaEvolutionOptions;
  processing?: ProcessingOptions;
  deadLetterQueue?: DeadLetterQueueOptions;
  circuitBreaker?: CircuitBreakerOptions;
}