/**
 * Configuration module index file
 * Exports all configuration-related modules for the notification service
 */

export * from './configuration';
export { default as channelsConfig } from './channels.config';
export { validationSchema } from './validation.schema';
export { default as configuration } from './configuration';