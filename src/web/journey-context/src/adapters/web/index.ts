/**
 * Web-specific adapters for the journey context package
 * 
 * This file exports all web-specific adapters for the journey context package,
 * providing a unified interface for platform-specific functionality.
 */

export { default as AuthAdapter } from './AuthAdapter';
export { default as GamificationAdapter } from './GamificationAdapter';
export { default as JourneyAdapter } from './JourneyAdapter';
export { default as NavigationAdapter, createNavigationAdapter } from './NavigationAdapter';
export { default as NotificationAdapter } from './NotificationAdapter';
export { default as StorageAdapter } from './StorageAdapter';