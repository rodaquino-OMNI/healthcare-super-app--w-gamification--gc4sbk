/**
 * @file Component Interfaces Index
 * @description Central export point for all component interfaces in the AUSTA SuperApp.
 * 
 * This barrel file re-exports all component interface definitions from the components module,
 * providing a single entry point for importing component interfaces. This simplifies imports
 * and ensures consistency across the codebase.
 * 
 * The exports are organized into logical groups:
 * - Primitives: Basic building blocks (Box, Text, Stack, Icon, Touchable)
 * - Core: Common UI components (Button, Input, Card, etc.)
 * - Journey-specific: Components for Health, Care, and Plan journeys
 * - Cross-cutting: Components for Auth, Notification, and Gamification
 * 
 * @module interfaces/components
 */

/**
 * UI Primitives
 * 
 * Foundational building blocks that form the basis of the design system.
 * These components provide the atomic elements for building more complex UI.
 */
export * from './primitives.types';

/**
 * Core Components
 * 
 * Common UI components used across the application, including input controls,
 * containers, feedback elements, and navigation components.
 */
export * from './core.types';

/**
 * Journey-Specific Components
 * 
 * Components tailored to the specific needs of each user journey (Health, Care, Plan).
 * These components integrate with journey-specific data models and business logic.
 */

// Health Journey Components
export * from './health.types';

// Care Journey Components
export * from './care.types';

// Plan Journey Components
export * from './plan.types';

/**
 * Cross-Cutting Components
 * 
 * Components that span multiple journeys or provide functionality
 * that is used across the entire application.
 */

// Authentication Components
export * from './auth.types';

// Notification Components
export * from './notification.types';

// Gamification Components
export * from './gamification.types';