/**
 * Interfaces for event handlers and processors used by the gamification engine.
 * 
 * This file provides contract definitions for components that process events,
 * evaluate rules, and update user profiles, ensuring consistent implementation
 * across the system.
 */

import { IEvent } from './event.interface';
import { JourneyEvent } from './journey-events.interface';
import { IEventResponse } from './event-response.interface';

/**
 * Interface for event handlers
 */
export interface IEventHandler<T extends IEvent = IEvent> {
  /**
   * Handles an event
   * @param event The event to handle
   * @returns A promise that resolves to an event response
   */
  handleEvent(event: T): Promise<IEventResponse>;

  /**
   * Checks if the handler can process the given event
   * @param event The event to check
   * @returns True if the handler can process the event
   */
  canHandle(event: T): boolean;
}

/**
 * Interface for journey-specific event handlers
 */
export interface IJourneyEventHandler<T extends JourneyEvent> extends IEventHandler<T> {
  /**
   * The journey this handler is responsible for
   */
  readonly journey: string;

  /**
   * The event types this handler can process
   */
  readonly supportedEventTypes: string[];
}

/**
 * Interface for the event processor pipeline
 */
export interface IEventProcessor {
  /**
   * Processes an event through the pipeline
   * @param event The event to process
   * @returns A promise that resolves to an event response
   */
  processEvent(event: IEvent): Promise<IEventResponse>;

  /**
   * Registers an event handler in the pipeline
   * @param handler The handler to register
   */
  registerHandler(handler: IEventHandler): void;

  /**
   * Gets all registered handlers
   * @returns An array of registered handlers
   */
  getHandlers(): IEventHandler[];
}

/**
 * Interface for rule evaluation in the event processing pipeline
 */
export interface IRuleEvaluator {
  /**
   * Evaluates rules for an event
   * @param event The event to evaluate rules for
   * @returns A promise that resolves to the rule evaluation results
   */
  evaluateRules(event: IEvent): Promise<IRuleEvaluationResult>;
}

/**
 * Interface for rule evaluation results
 */
export interface IRuleEvaluationResult {
  /**
   * The points awarded by the rules
   */
  points: number;

  /**
   * The achievements triggered by the rules
   */
  achievements: string[];

  /**
   * The quests progressed by the rules
   */
  quests: IQuestProgress[];

  /**
   * Additional metadata from rule evaluation
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for quest progress
 */
export interface IQuestProgress {
  /**
   * The ID of the quest
   */
  questId: string;

  /**
   * The progress percentage (0-100)
   */
  progressPercentage: number;

  /**
   * Whether the quest was completed
   */
  completed: boolean;

  /**
   * The steps completed in the quest
   */
  stepsCompleted: number;

  /**
   * The total steps in the quest
   */
  totalSteps: number;
}