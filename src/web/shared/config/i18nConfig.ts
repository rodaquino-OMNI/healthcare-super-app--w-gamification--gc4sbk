/**
 * Internationalization configuration for the AUSTA SuperApp
 * 
 * This configuration file defines the supported locales and default locale for the application.
 * The i18next library is used throughout the application for translation and localization.
 * It ensures consistent language support across both web and mobile platforms.
 * 
 * @package i18next v23.4.4
 * @version 1.0.0
 */

import i18next from 'i18next';
import { ActiveLocale, ACTIVE_LOCALES, DEFAULT_LOCALE, Locale, SupportedLocale } from '@austa/interfaces/common';

/**
 * List of locales currently supported by the application
 * 
 * This array uses the type-safe ActiveLocale type from @austa/interfaces/common
 * to ensure consistency across the platform.
 */
export const supportedLocales: ActiveLocale[] = ACTIVE_LOCALES;

/**
 * Default locale for the application
 * 
 * Brazilian Portuguese is the primary language for the AUSTA SuperApp
 * as specified in the technical requirements.
 */
export const defaultLocale: ActiveLocale = DEFAULT_LOCALE;

/**
 * Initialize i18next with the default configuration
 * 
 * This function configures i18next with the supported locales and default locale.
 * It can be used by both web and mobile applications to ensure consistent
 * internationalization behavior.
 * 
 * @returns Configured i18next instance
 */
export const initializeI18n = () => {
  return i18next.init({
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    supportedLngs: supportedLocales,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // Additional configuration options can be added here
  });
};

/**
 * Type guard to check if a locale is supported
 * 
 * @param locale The locale to check
 * @returns True if the locale is supported, false otherwise
 */
export const isSupportedLocale = (locale: string): locale is ActiveLocale => {
  return supportedLocales.includes(locale as ActiveLocale);
};

/**
 * Get a valid locale from a potentially unsupported locale string
 * 
 * @param locale The locale to validate
 * @returns A supported locale (defaulting to defaultLocale if not supported)
 */
export const getValidLocale = (locale: string): ActiveLocale => {
  return isSupportedLocale(locale) ? locale : defaultLocale;
};