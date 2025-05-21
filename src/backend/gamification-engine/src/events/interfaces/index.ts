/**
 * @file index.ts
 * @description Barrel file that exports all event interfaces from the folder,
 * providing a single entry point for importing event-related interfaces.
 */

// Export event versioning interfaces
export * from './event-versioning.interface';

// Export other event interfaces
export * from './event.interface';
export * from './event-handler.interface';
export * from './event-response.interface';
export * from './event-type.interface';
export * from './journey-events.interface';