/**
 * Component Interfaces for the AUSTA SuperApp
 * 
 * This barrel file re-exports all component interface definitions from the AUSTA SuperApp's
 * components module. It provides a single entry point for importing component interfaces,
 * simplifying imports and ensuring consistency across the codebase.
 * 
 * The exports are organized into logical groups to improve developer experience and code organization:
 * - Primitives: Fundamental building blocks of the design system
 * - Core: Common UI components used throughout the application
 * - Journey-specific: Components tailored to specific user journeys (Health, Care, Plan)
 * - Cross-cutting: Components that span multiple journeys (Auth, Notification, Gamification)
 * 
 * @module interfaces/components
 */

/**
 * Primitive Component Interfaces
 * 
 * These interfaces define the props for the most basic building blocks of the UI.
 * They serve as the foundation for all other components in the design system.
 */
export * from './primitives.types';

/**
 * Core Component Interfaces
 * 
 * These interfaces define the props for common UI components used throughout the application.
 * They build upon the primitive components and provide more complex functionality.
 */
export * from './core.types';

/**
 * Journey-Specific Component Interfaces
 * 
 * These interfaces define the props for components that are specific to particular user journeys.
 * They are organized by journey to facilitate journey-centered development.
 */

// Health Journey Components
export * from './health.types';

// Care Journey Components
export * from './care.types';

// Plan Journey Components
export * from './plan.types';

/**
 * Cross-Cutting Component Interfaces
 * 
 * These interfaces define the props for components that span multiple journeys
 * and provide functionality that is used across the entire application.
 */

// Authentication Components
export * from './auth.types';

// Notification Components
export * from './notification.types';

// Gamification Components
export * from './gamification.types';