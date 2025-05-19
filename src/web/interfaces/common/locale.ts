/**
 * Locale type definitions for the AUSTA SuperApp
 * 
 * This file defines the supported locales and provides type-safe identifiers
 * for use throughout the application. These types ensure consistent locale
 * handling across both web and mobile platforms.
 * 
 * @package @austa/interfaces
 */

/**
 * Enum of supported locale identifiers
 * 
 * Current supported locales:
 * - PT_BR: Brazilian Portuguese (primary)
 * - EN_US: US English (alternative)
 * 
 * Future planned locales:
 * - ES: Spanish (planned but not yet implemented)
 */
export enum Locale {
  PT_BR = 'pt-BR',
  EN_US = 'en-US',
  ES = 'es', // Planned but not yet implemented
}

/**
 * Type for locale identifiers that are currently active and fully supported
 */
export type ActiveLocale = Locale.PT_BR | Locale.EN_US;

/**
 * Type for all locale identifiers, including planned ones
 */
export type SupportedLocale = ActiveLocale | Locale.ES;

/**
 * Default locale for the application
 * 
 * Brazilian Portuguese is the primary language for the AUSTA SuperApp
 * as specified in the technical requirements.
 */
export const DEFAULT_LOCALE: ActiveLocale = Locale.PT_BR;

/**
 * Array of currently active locales
 */
export const ACTIVE_LOCALES: ActiveLocale[] = [Locale.PT_BR, Locale.EN_US];

/**
 * Array of all supported locales, including planned ones
 */
export const ALL_SUPPORTED_LOCALES: SupportedLocale[] = [...ACTIVE_LOCALES, Locale.ES];