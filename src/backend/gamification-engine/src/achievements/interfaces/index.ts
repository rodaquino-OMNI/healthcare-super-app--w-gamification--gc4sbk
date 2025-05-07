/**
 * @module achievements/interfaces
 * 
 * This module exports all interfaces and enums related to achievements in the gamification system.
 * These types provide consistent data structures for achievement management, tracking, and events.
 */

// Core interfaces
export * from './i-achievement.interface';
export * from './i-user-achievement.interface';
export * from './i-achievement-service.interface';

// Event interfaces
export * from './i-achievement-event.interface';

// Enums
export * from './achievement-status.enum';
export * from './achievement-types.enum';